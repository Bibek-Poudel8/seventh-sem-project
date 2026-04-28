import numpy as np
from datetime import datetime
from collections import defaultdict
from typing import List, Dict
from sklearn.linear_model import LinearRegression


def _parse_transactions(transactions: List[Dict]) -> Dict[str, Dict[str, float]]:
    """
    Group transaction amounts by category and month.
    Returns { category: { "YYYY-MM": total_amount } }
    """
    grouped = defaultdict(lambda: defaultdict(float))

    for txn in transactions:
        amount   = float(txn['amount'])
        category = txn['category']

        raw_date = txn['date']
        if isinstance(raw_date, str):
            raw_date = raw_date[:10]
            d = datetime.strptime(raw_date, '%Y-%m-%d')
        else:
            d = raw_date

        month_key = d.strftime('%Y-%m')
        grouped[category][month_key] += amount

    return grouped


def _predict_ml(monthly_totals: Dict[str, float]) -> float:
    """
    LinearRegression prediction for 3+ months of data.
    Trains a proper sklearn model on the user's data.
    """
    sorted_months = sorted(monthly_totals.keys())
    amounts       = [monthly_totals[m] for m in sorted_months]
    n             = len(amounts)

    # X = month indices [[0], [1], [2], ...]
    X = np.arange(n).reshape(-1, 1)
    y = np.array(amounts)

    # Train LinearRegression model
    model = LinearRegression()
    model.fit(X, y)

    # Predict next month (index = n)
    prediction = model.predict([[n]])[0]

    return max(0.0, round(float(prediction), 2))


def _predict_math(monthly_totals: Dict[str, float]) -> float:
    """
    Weighted average fallback for < 3 months of data.
    Recent months get higher weight.
    """
    sorted_months = sorted(monthly_totals.keys())
    amounts       = [monthly_totals[m] for m in sorted_months]
    n             = len(amounts)

    if n == 1:
        return round(amounts[0], 2)

    # weights: [1, 2] for 2 months — recent month counts more
    weights    = np.arange(1, n + 1, dtype=float)
    prediction = float(np.average(amounts, weights=weights))

    return max(0.0, round(prediction, 2))


def _get_trend(monthly_totals: Dict[str, float]) -> str:
    """
    Returns 'increasing', 'decreasing', or 'stable'
    based on last two months.
    """
    if len(monthly_totals) < 2:
        return 'stable'

    sorted_months = sorted(monthly_totals.keys())
    last  = monthly_totals[sorted_months[-1]]
    prev  = monthly_totals[sorted_months[-2]]

    if prev == 0:
        return 'stable'

    change_pct = (last - prev) / prev * 100

    if change_pct > 10:
        return 'increasing'
    elif change_pct < -10:
        return 'decreasing'
    else:
        return 'stable'


def forecast(transactions: List[Dict], months_ahead: int = 1) -> Dict:
    """
    Main entry point.

    Hybrid approach:
        < 3 months of data → weighted average (math formula)
        ≥ 3 months of data → LinearRegression (sklearn ML model)

    Input:
        transactions: [{ amount, date, category }]
        months_ahead: how many months ahead to predict (default 1)

    Output: {
        predictions: [
            {
                category:         "Food & Dining",
                predicted_amount: 5200.00,
                avg_monthly:      4800.00,
                trend:            "increasing",
                months_of_data:   4,
                confidence:       "high" | "medium" | "low",
                method:           "ml" | "weighted_average"
            }
        ],
        total_predicted: 12400.00,
        months_of_data:  4,
        message:         "Based on 4 months of transaction history"
    }
    """
    if not transactions:
        return {
            'predictions':     [],
            'total_predicted': 0.0,
            'months_of_data':  0,
            'message':         'No transaction data available for prediction'
        }

    grouped     = _parse_transactions(transactions)
    predictions = []
    total       = 0.0
    all_months  = set()

    for category, monthly_totals in grouped.items():
        all_months.update(monthly_totals.keys())

        months_of_data = len(monthly_totals)
        avg_monthly    = round(float(np.mean(list(monthly_totals.values()))), 2)
        trend          = _get_trend(monthly_totals)

        # ── Core decision: ML or math ──────────────────────────────────────
        if months_of_data >= 3:
            predicted_amount = _predict_ml(monthly_totals)
            method           = 'ml'
            # Confidence based on data available
            if months_of_data >= 6:
                confidence = 'high'
            else:
                confidence = 'medium'
        else:
            predicted_amount = _predict_math(monthly_totals)
            method           = 'weighted_average'
            confidence       = 'low'
        # ───────────────────────────────────────────────────────────────────

        predictions.append({
            'category':         category,
            'predicted_amount': predicted_amount,
            'avg_monthly':      avg_monthly,
            'trend':            trend,
            'months_of_data':   months_of_data,
            'confidence':       confidence,
            'method':           method,
        })

        total += predicted_amount

    # Sort by predicted amount descending
    predictions.sort(key=lambda x: x['predicted_amount'], reverse=True)

    total_months = len(all_months)

    return {
        'predictions':     predictions,
        'total_predicted': round(total, 2),
        'months_of_data':  total_months,
        'message':         f'Based on {total_months} month{"s" if total_months != 1 else ""} of transaction history'
    }