import pickle
import re
import os

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'models')

# Load once at import time
with open(os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl'), 'rb') as f:
    tfidf = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'lr_model.pkl'), 'rb') as f:
    lr_model = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'keyword_rules.pkl'), 'rb') as f:
    KEYWORD_RULES = pickle.load(f)

CONFIDENCE_THRESHOLD = 0.40


def _clean(text: str) -> str:
    if not text:
        return ''
    text = str(text).lower()
    text = re.sub(r'\s*-\s*(australia|canada|india|uk|usa|nepal)\s*', ' ', text)
    text = re.sub(r'txn\d+', '', text)
    text = re.sub(r'#\d+', '', text)
    text = re.sub(r'\b\d{5,}\b', '', text)
    text = re.sub(r'\(contactless\)', '', text)
    text = re.sub(r'[^a-z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def predict(description: str) -> dict:
    desc_lower = str(description).lower().strip()

    if len(desc_lower) < 3:
        return {'category': 'Uncategorized', 'confidence': 0.0, 'method': 'too_short'}

    # Keyword rules first
    for category, keywords in KEYWORD_RULES.items():
        if any(kw in desc_lower for kw in keywords):
            return {'category': category, 'confidence': 1.0, 'method': 'rule'}

    # ML fallback
    features   = tfidf.transform([_clean(description)])
    prediction = lr_model.predict(features)[0]
    confidence = float(max(lr_model.predict_proba(features)[0]))

    if confidence < CONFIDENCE_THRESHOLD:
        return {'category': 'Uncategorized', 'confidence': confidence, 'method': 'low_confidence'}

    return {'category': prediction, 'confidence': confidence, 'method': 'ml'}


def predict_batch(descriptions: list) -> list:
    return [predict(d) for d in descriptions]