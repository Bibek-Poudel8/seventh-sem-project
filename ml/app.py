from fastapi import FastAPI, HTTPException, UploadFile, File
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
    amount: float
    date: str
    category: str


class TransactionFull(BaseModel):
    id: Optional[str] = ''
    amount: float
    date: str
    category: str
    description: Optional[str] = ''


class PredictRequest(BaseModel):
    transactions: List[TransactionInput]
    months_ahead: Optional[int] = 1


class AnomalyScanRequest(BaseModel):
    transactions: List[TransactionFull]


class AnomalyCheckRequest(BaseModel):
    transaction: TransactionFull
    history: List[TransactionFull]


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
            'history': [t.model_dump() for t in body.history]
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Uses UploadFile/File instead of a Pydantic BaseModel because this route
# receives multipart/form-data (an image file), not JSON — Pydantic models
# can't parse file uploads the way they parse the request bodies above.
@app.post('/ocr')
async def ocr_extract(file: UploadFile = File(...)):
    allowed_types = {'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f'Unsupported file type: {file.content_type}. Use JPEG, PNG, WebP, or PDF.'
        )

    image_bytes = await file.read()

    # 10MB cap — phone camera photos are usually 2-6MB, this leaves headroom
    # while still rejecting accidental huge uploads before they hit OpenCV.
    max_size = 10 * 1024 * 1024
    if len(image_bytes) > max_size:
        raise HTTPException(status_code=400, detail='Image too large. Max size is 10MB.')

    try:
        return handle('ocr', {'image_bytes': image_bytes})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))