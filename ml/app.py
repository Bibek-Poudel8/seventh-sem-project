from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from router import handle

app = FastAPI(title='Finance ML Service')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],  # add your prod URL here later
    allow_methods=['*'],
    allow_headers=['*'],
)


# ── Request models (FastAPI validates these automatically) ─────────────────
class CategorizeRequest(BaseModel):
    description: str

class BatchRequest(BaseModel):
    descriptions: list[str]

class AnomalyRequest(BaseModel):
    transactions: list[dict]

class PredictRequest(BaseModel):
    transactions: list[dict]
    months_ahead: int = 1


# ── Routes ─────────────────────────────────────────────────────────────────
@app.get('/health')
def health():
    return {'status': 'ok'}


@app.post('/categorize')
def categorize(body: CategorizeRequest):
    try:
        return handle('categorize', {'description': body.description})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/categorize/batch')
def categorize_batch(body: BatchRequest):
    try:
        return handle('categorize/batch', {'descriptions': body.descriptions})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/anomaly')
def anomaly(body: AnomalyRequest):
    try:
        return handle('anomaly', {'transactions': body.transactions})
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/predict')
def predict(body: PredictRequest):
    try:
        return handle('predict', {
            'transactions': body.transactions,
            'months_ahead': body.months_ahead
        })
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))