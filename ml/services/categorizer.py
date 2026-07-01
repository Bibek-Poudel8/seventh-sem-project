import pickle
import re
import os

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'models')

# ── Load once at import time (unchanged — same file names, same load order) ──
with open(os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl'), 'rb') as f:
    tfidf = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'lr_model.pkl'), 'rb') as f:
    lr_model = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'keyword_rules.pkl'), 'rb') as f:
    KEYWORD_RULES = pickle.load(f)

CONFIDENCE_THRESHOLD = 0.10

# ── Precompiled word-boundary patterns ───────────────────────────────────────
# Built once at import time from KEYWORD_RULES (loaded above), so this stays
# in sync automatically if keyword_rules.pkl is ever regenerated/retrained.
#
# Why: a plain substring check (`kw in desc_lower`) lets short keywords match
# inside unrelated words — e.g. 'tfl' (Transport for London) was matching
# inside 'netflix', mis-categorizing "Netflix subscription" as Transportation.
# \b anchors keyword matches to word edges so 'tfl' matches "tfl fare" but not
# "netflix", and 'metro' matches "metro fare" but not "metroplex mall".
_KEYWORD_PATTERNS = {
    category: [re.compile(r'\b' + re.escape(kw) + r'\b') for kw in keywords]
    for category, keywords in KEYWORD_RULES.items()
}


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
    """
    Hybrid predictor: keyword rules (word-boundary matched) → ML model → confidence gate.
    Returns {'category': str, 'confidence': float, 'method': str}
    Same return shape as before — safe to drop in without touching callers.
    """
    desc_lower = str(description).lower().strip()

    if len(desc_lower) < 3:
        return {'category': 'Uncategorized', 'confidence': 0.0, 'method': 'too_short'}

    # Step 1: Keyword rule check — word-boundary match, not raw substring
    for category, patterns in _KEYWORD_PATTERNS.items():
        if any(p.search(desc_lower) for p in patterns):
            return {'category': category, 'confidence': 1.0, 'method': 'rule'}

    # Step 2: ML model fallback
    features   = tfidf.transform([_clean(description)])
    prediction = lr_model.predict(features)[0]
    confidence = float(max(lr_model.predict_proba(features)[0]))

    # Step 3: Confidence gate — if model is unsure, say so
    if confidence < CONFIDENCE_THRESHOLD:
        return {'category': 'Uncategorized', 'confidence': confidence, 'method': 'low_confidence'}
    return {'category': prediction, 'confidence': confidence, 'method': 'ml'}


def predict_batch(descriptions: list) -> list:
    return [predict(d) for d in descriptions]