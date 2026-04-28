import numpy as np
from datetime import datetime
from collections import defaultdict
from typing import List, Dict
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder


def _parse_transactions(transactions: List[Dict]) -> List[Dict]:
    """
    Parse and enrich raw transactions with derived features.
    """
    parsed = []

    for txn in transactions:
        raw_date = txn['date']
        if isinstance(raw_date, str):
            raw_date = raw_date[:19]
            try:
                d = datetime.strptime(raw_date, '%Y-%m-%dT%H:%M:%S')
            except ValueError:
                d = datetime.strptime(raw_date[:10], '%Y-%m-%d')
        else:
            d = raw_date

        parsed.append({
            'id':          txn.get('id', ''),
            'amount':      float(txn['amount']),
            'category':    txn.get('category', 'Uncategorized'),
            'description': txn.get('description', ''),
            'date':        d,
            'hour':        d.hour,
            'day_of_week': d.weekday(),  # 0=Monday, 6=Sunday
            'month':       d.month,
            'day':         d.day,
        })

    return parsed


def _build_features(parsed: List[Dict]) -> tuple:
    """
    Extract feature matrix for IsolationForest training.
    Returns (feature_matrix, category_encoder, category_means)
    """
    # Calculate mean and std per category for relative amount feature
    category_amounts = defaultdict(list)
    for txn in parsed:
        category_amounts[txn['category']].append(txn['amount'])

    category_mean = {
        cat: np.mean(amounts)
        for cat, amounts in category_amounts.items()
    }
    category_std = {
        cat: np.std(amounts) if len(amounts) > 1 else 1.0
        for cat, amounts in category_amounts.items()
    }

    # Encode categories as numbers
    le = LabelEncoder()
    categories = [txn['category'] for txn in parsed]
    le.fit(categories)

    # Build feature matrix
    features = []
    for txn in parsed:
        cat    = txn['category']
        amount = txn['amount']
        mean   = category_mean[cat]
        std    = category_std[cat]

        # Z-score of amount within category
        z_score = (amount - mean) / std if std > 0 else 0.0

        # Amount relative to category mean (ratio)
        amount_ratio = amount / mean if mean > 0 else 1.0

        features.append([
            amount,                      # raw amount
            z_score,                     # how unusual amount is for this category
            amount_ratio,                # ratio vs category average
            txn['hour'],                 # time of day
            txn['day_of_week'],          # day of week
            txn['month'],                # month of year
            le.transform([cat])[0],      # encoded category
        ])

    return np.array(features), le, category_mean, category_std


def _get_anomaly_reason(
    txn: Dict,
    category_mean: Dict,
    category_std: Dict,
    all_transactions: List[Dict]
) -> str:
    """
    Generate human readable reason for why transaction is anomalous.
    """
    amount   = txn['amount']
    category = txn['category']
    mean     = category_mean.get(category, amount)
    std      = category_std.get(category, 0)
    reasons  = []

    # Check amount anomaly
    if std > 0:
        z = (amount - mean) / std
        if z > 2:
            multiplier = round(amount / mean, 1)
            reasons.append(
                f"Amount is {multiplier}x higher than your usual "
                f"{category} spending (avg: {mean:.0f})"
            )
        elif z < -2:
            reasons.append(
                f"Amount is unusually low for {category} "
                f"(avg: {mean:.0f})"
            )

    # Check late night transaction (11pm - 5am)
    if txn['hour'] >= 23 or txn['hour'] <= 5:
        reasons.append(
            f"Unusual transaction time: {txn['date'].strftime('%I:%M %p')}"
        )

    # Check duplicate — same amount + category within same day
    same_day_duplicates = [
        t for t in all_transactions
        if t['amount']   == amount
        and t['category'] == category
        and t['date'].date() == txn['date'].date()
        and t != txn
    ]
    if same_day_duplicates:
        reasons.append(
            f"Possible duplicate: same amount and category "
            f"already recorded today"
        )

    # Check weekend large transaction
    if txn['day_of_week'] >= 5 and amount > mean * 2:
        reasons.append(
            f"Large {category} expense on weekend"
        )

    # Fallback reason
    if not reasons:
        reasons.append(
            f"Unusual spending pattern detected in {category}"
        )

    return '. '.join(reasons)


def detect(transactions: List[Dict]) -> List[Dict]:
    """
    Scan all transactions and flag anomalies using IsolationForest.

    Input:
        transactions: [{
            id, amount, date, category, description
        }]

    Output: [{
        id:             "transaction_id",
        is_anomaly:     true,
        anomaly_score:  0.85,
        anomaly_reason: "Amount is 4x higher than usual food spending"
    }]
    """
    if not transactions:
        return []

    # Need minimum 10 transactions to train IsolationForest meaningfully
    MIN_TRANSACTIONS = 10

    parsed = _parse_transactions(transactions)

    if len(parsed) < MIN_TRANSACTIONS:
        # Not enough data — use simple Z-score only
        return _detect_simple(parsed)

    # Build features
    features, le, category_mean, category_std = _build_features(parsed)

    # Train IsolationForest
    # contamination = expected % of anomalies in data (5% is standard)
    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )
    model.fit(features)

    # Get anomaly scores
    # score_samples returns negative values — more negative = more anomalous
    raw_scores = model.score_samples(features)
    predictions = model.predict(features)  # -1 = anomaly, 1 = normal

    # Normalize scores to 0-1 range (1 = most anomalous)
    min_score = raw_scores.min()
    max_score = raw_scores.max()
    score_range = max_score - min_score if max_score != min_score else 1.0
    normalized_scores = 1 - (raw_scores - min_score) / score_range

    results = []
    for i, txn in enumerate(parsed):
        is_anomaly    = bool(predictions[i] == -1)
        anomaly_score = round(float(normalized_scores[i]), 4)

        reason = ''
        if is_anomaly:
            reason = _get_anomaly_reason(
                txn, category_mean, category_std, parsed
            )

        results.append({
            'id':             txn['id'],
            'is_anomaly':     is_anomaly,
            'anomaly_score':  anomaly_score,
            'anomaly_reason': reason,
        })

    return results


def check(transaction: Dict, history: List[Dict]) -> Dict:
    """
    Check a single NEW transaction against user's history.
    Called when user adds a new transaction.

    Input:
        transaction: { id, amount, date, category, description }
        history:     list of past transactions

    Output: {
        id:             "transaction_id",
        is_anomaly:     true,
        anomaly_score:  0.85,
        anomaly_reason: "Amount is 4x higher than usual food spending"
    }
    """
    if not history:
        return {
            'id':             transaction.get('id', ''),
            'is_anomaly':     False,
            'anomaly_score':  0.0,
            'anomaly_reason': ''
        }

    # Combine history + new transaction for training
    all_transactions = history + [transaction]
    results          = detect(all_transactions)

    # Return result for the new transaction only
    new_id = transaction.get('id', '')
    for result in results:
        if result['id'] == new_id:
            return result

    # Fallback
    return {
        'id':             new_id,
        'is_anomaly':     False,
        'anomaly_score':  0.0,
        'anomaly_reason': ''
    }


def _detect_simple(parsed: List[Dict]) -> List[Dict]:
    """
    Fallback for < 10 transactions.
    Uses Z-score only — no IsolationForest.
    """
    category_amounts = defaultdict(list)
    for txn in parsed:
        category_amounts[txn['category']].append(txn['amount'])

    category_mean = {
        cat: np.mean(amounts)
        for cat, amounts in category_amounts.items()
    }
    category_std = {
        cat: np.std(amounts) if len(amounts) > 1 else 0.0
        for cat, amounts in category_amounts.items()
    }

    results = []
    for txn in parsed:
        cat    = txn['category']
        amount = txn['amount']
        mean   = category_mean[cat]
        std    = category_std[cat]

        if std > 0:
            z_score = abs((amount - mean) / std)
        else:
            z_score = 0.0

        is_anomaly    = bool(z_score > 2.0)
        anomaly_score = round(float(min(z_score / 4.0, 1.0)), 4)
        reason        = ''

        if is_anomaly:
            reason = _get_anomaly_reason(
                txn, category_mean, category_std, parsed
            )

        results.append({
            'id':             txn['id'],
            'is_anomaly':     is_anomaly,
            'anomaly_score':  anomaly_score,
            'anomaly_reason': reason,
        })

    return results