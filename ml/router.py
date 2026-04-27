from services import categorizer


def handle(endpoint: str, payload: dict):

    if endpoint == 'categorize':
        description = payload.get('description', '')
        return categorizer.predict(description)

    if endpoint == 'categorize/batch':
        descriptions = payload.get('descriptions', [])
        return categorizer.predict_batch(descriptions)

    if endpoint == 'anomaly':
        raise NotImplementedError('Anomaly detector not built yet')

    if endpoint == 'predict':
        raise NotImplementedError('Expense predictor not built yet')

    raise ValueError(f'Unknown endpoint: {endpoint}')