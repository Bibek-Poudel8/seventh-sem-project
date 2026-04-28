from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from router import handle

app = FastAPI(title='Finance ML Service')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_methods=['*'],
    allow_headers=['*'],
)


# ── Request models ─────────────────────────────────────────────────────────
class CategorizeRequest(BaseModel):
    description: str


class BatchRequest(BaseModel):
    descriptions: List[str]


class TransactionInput(BaseModel):
    amount:   float
    date:     str
    category: str


class TransactionFull(BaseModel):
    id:          Optional[str] = ''
    amount:      float
    date:        str
    category:    str
    description: Optional[str] = ''


class PredictRequest(BaseModel):
    transactions: List[TransactionInput]
    months_ahead: Optional[int] = 1


class AnomalyScanRequest(BaseModel):
    transactions: List[TransactionFull]


class AnomalyCheckRequest(BaseModel):
    transaction: TransactionFull
    history:     List[TransactionFull]


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


@app.post('/predict')
def predict(body: PredictRequest):
    try:
        payload = {
            'transactions': [t.model_dump() for t in body.transactions],
            'months_ahead': body.months_ahead
        }
        return handle('predict', payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/anomaly/scan')
def anomaly_scan(body: AnomalyScanRequest):
    try:
        return handle('anomaly/scan', {
            'transactions': [t.model_dump() for t in body.transactions]
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/anomaly/check')
def anomaly_check(body: AnomalyCheckRequest):
    try:
        return handle('anomaly/check', {
            'transaction': body.transaction.model_dump(),
            'history':     [t.model_dump() for t in body.history]
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))