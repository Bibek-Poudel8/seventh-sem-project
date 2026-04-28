from services import categorizer
from services import predictor
from services import anomaly


def handle(endpoint: str, payload: dict):

    if endpoint == 'categorize':
        return categorizer.predict(payload.get('description', ''))

    if endpoint == 'categorize/batch':
        return categorizer.predict_batch(payload.get('descriptions', []))

    if endpoint == 'predict':
        transactions = payload.get('transactions', [])
        months_ahead = payload.get('months_ahead', 1)
        return predictor.forecast(transactions, months_ahead)

    if endpoint == 'anomaly/scan':
        transactions = payload.get('transactions', [])
        return anomaly.detect(transactions)

    if endpoint == 'anomaly/check':
        transaction = payload.get('transaction', {})
        history     = payload.get('history', [])
        return anomaly.check(transaction, history)

    raise ValueError(f'Unknown endpoint: {endpoint}')