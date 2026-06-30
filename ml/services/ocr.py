"""
OCR service for bill/receipt image processing.

Pipeline: image bytes -> preprocess (grayscale, denoise, threshold) ->
Tesseract OCR -> regex field extraction (amount, merchant, date) ->
hands merchant text off to categorizer.predict() for category + confidence.

Follows the same dict-in / dict-out convention as categorizer.py and
anomaly.py so router.py can dispatch to it identically.
"""

import io
import re
from datetime import datetime

import cv2
import numpy as np
import pytesseract
from PIL import Image

from services import categorizer

# ── Tuning constants ────────────────────────────────────────────────────────

# If Tesseract reports lower than this average word confidence, we still
# return the result but flag it so the frontend can warn the user to
# double check the pre-filled fields.
LOW_OCR_CONFIDENCE_THRESHOLD = 50.0

# Currency symbols / prefixes we look for when extracting amount.
# Extend this list if you expect bills in other currencies.
CURRENCY_PATTERN = r'(?:Rs\.?|NPR|₹|\$|USD)\s*'

# Common date formats seen on receipts, tried in order. %d-%b-%Y handles
# the common "30-Jun-2026" style (day, hyphen, abbreviated month, hyphen,
# year) that earlier was missing and silently fell through to None.
DATE_FORMATS = [
    '%d-%b-%Y', '%d-%B-%Y',
    '%d/%m/%Y', '%d-%m-%Y', '%d/%m/%y', '%d-%m-%y',
    '%m/%d/%Y', '%m-%d-%Y',
    '%Y-%m-%d', '%Y/%m/%d',
    '%d %b %Y', '%d %B %Y',
    '%b %d, %Y', '%B %d, %Y',
]


# ── Image preprocessing ─────────────────────────────────────────────────────

def _preprocess(image_bytes: bytes) -> np.ndarray:
    """
    Convert raw image bytes into a cleaned-up OpenCV array that Tesseract
    reads more reliably. Phone photos of receipts are usually low-contrast,
    slightly skewed, and have background noise (table texture, shadows) —
    this step matters more for accuracy than which OCR engine you pick.
    """
    pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # Resize up if the image is small — Tesseract does noticeably better
    # above ~1500px on the long edge for receipt-style text.
    h, w = img.shape[:2]
    long_edge = max(h, w)
    if long_edge < 1500:
        scale = 1500 / long_edge
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise before thresholding — receipt photos often have grain/noise
    # from low phone-camera light that confuses character edges.
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # Adaptive threshold handles uneven lighting across a receipt better
    # than a single global threshold value would.
    thresh = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=15,
    )

    return thresh


def _run_tesseract(processed_img: np.ndarray) -> dict:
    """
    Runs Tesseract and returns both the raw text and a mean confidence
    score, using image_to_data instead of image_to_string so we get
    per-word confidence values to compute that average.
    """
    data = pytesseract.image_to_data(
        processed_img,
        output_type=pytesseract.Output.DICT,
        config='--psm 6',  # assume a uniform block of text — fits receipts
    )

    confidences = []
    for i, word in enumerate(data['text']):
        word = word.strip()
        conf = int(data['conf'][i]) if data['conf'][i] not in ('-1', '', None) else -1
        if word and conf >= 0:
            confidences.append(conf)

    raw_text = pytesseract.image_to_string(processed_img, config='--psm 6')
    avg_confidence = float(sum(confidences) / len(confidences)) if confidences else 0.0

    return {'raw_text': raw_text, 'avg_confidence': avg_confidence}


# ── Field extraction ─────────────────────────────────────────────────────

def _extract_amount(raw_text: str):
    """
    Finds the most likely transaction total. Receipts almost always list
    several dollar figures (subtotal, discount, tax, line items, total,
    amount paid, change) — we try patterns from most specific/reliable to
    least, and stop at the first one that matches anywhere in the text.

    Critically, "subtotal" must be excluded from matching a bare "total"
    pattern: `\\btotal\\b` still matches the "total" inside "Subtotal"
    unless we explicitly require the word boundary to NOT be preceded by
    "sub". (?<!sub) is a negative lookbehind that handles this.
    """
    # Tier 1: the strongest, least ambiguous labels — checked first
    # across the whole text (not line by line) so we don't accidentally
    # stop at a weaker match on an earlier line.
    strong_patterns = [
        r'grand\s*total\s*[:\-]?\s*' + CURRENCY_PATTERN + r'?([\d,]+\.\d{2})',
        r'(?<!sub)\btotal\s*[:\-]?\s*' + CURRENCY_PATTERN + r'?([\d,]+\.\d{2})',
        r'amount\s*due\s*[:\-]?\s*' + CURRENCY_PATTERN + r'?([\d,]+\.\d{2})',
    ]

    for pattern in strong_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1).replace(',', ''))
            except ValueError:
                continue

    # Tier 2: weaker generic "amount" label, line by line (more prone to
    # false positives like "Amount Paid", so only used if tier 1 finds
    # nothing).
    weak_pattern = re.compile(
        r'\bamount\b\s*[:\-]?\s*' + CURRENCY_PATTERN + r'?([\d,]+\.\d{2})',
        re.IGNORECASE,
    )
    for line in raw_text.split('\n'):
        match = weak_pattern.search(line)
        if match:
            try:
                return float(match.group(1).replace(',', ''))
            except ValueError:
                continue

    # Tier 3: no labeled total found at all — fall back to the largest
    # currency-tagged number anywhere in the text. This is a last resort
    # and can be wrong (e.g. could pick "Amount Paid" over "Total" if
    # paid > total due to rounding), but a number is still more useful
    # to the user than nothing.
    all_amounts = re.findall(CURRENCY_PATTERN + r'([\d,]+\.\d{2})', raw_text)
    if all_amounts:
        parsed = [float(a.replace(',', '')) for a in all_amounts]
        return max(parsed)

    return None


def _extract_date(raw_text: str):
    """
    Looks for a date-shaped substring and normalizes it to ISO format
    (YYYY-MM-DD) so it matches the `date` input field's `defaultValue`
    format in TransactionForm. Returns None if nothing parses.
    """
    date_pattern = re.compile(
        r'\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}|\d{4}[/\-]\d{1,2}[/\-]\d{1,2}|'
        r'\d{1,2}-[A-Za-z]{3,9}-\d{4}|'
        r'\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b'
    )
    match = date_pattern.search(raw_text)
    if not match:
        return None

    candidate = match.group(1)
    for fmt in DATE_FORMATS:
        try:
            parsed = datetime.strptime(candidate, fmt)
            return parsed.strftime('%Y-%m-%d')
        except ValueError:
            continue

    return None


def _extract_merchant(raw_text: str) -> str:
    """
    Merchant name extraction tries strongest signal first, weakest last.

    Many receipts put the merchant name in a closing line like "Thank you
    for shopping with Green Mart!" rather than (or in addition to) the
    header — the header often starts with a street address instead. We
    check for that explicit phrasing first since it's unambiguous, then
    fall back to scanning the first few lines for a plausible-looking
    store name, explicitly skipping lines that look like a street address.
    """
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]

    # Tier 1: explicit closing-line signal phrases. These are the most
    # reliable signal when present — "shopping with X" or "welcome to X"
    # essentially never refers to anything other than the store name.
    signal_pattern = re.compile(
        r'(?:thank\s*you\s*for\s*shopping\s*(?:with|at)|'
        r'welcome\s*to|visit\s*us\s*at)\s*([A-Za-z0-9&\'\-\s]+?)[!.\n]',
        re.IGNORECASE,
    )
    for line in lines:
        match = signal_pattern.search(line + '!')  # ensure a terminator exists
        if match:
            candidate = match.group(1).strip()
            if len(candidate) >= 2:
                return candidate.title()

    # Tier 2: scan the first few lines for a plausible store name, skipping
    # lines that look like dates, pure numbers, phone/web contact info, or
    # street addresses (digits followed by a street-type word, or any line
    # containing a comma immediately after a number — typical of
    # "123 Market Street, City").
    skip_pattern = re.compile(
        r'^\d+$|^\d{1,2}[/\-]\d{1,2}|receipt|invoice|tel:|phone:|www\.|^\W+$|'
        r'^\d+\s+[\w\s]+(?:street|st\.|road|rd\.|avenue|ave\.|lane|marg)\b',
        re.IGNORECASE,
    )

    for line in lines[:5]:
        if not skip_pattern.search(line) and len(line) >= 3:
            return line.title()

    return 'Unknown Merchant'


def _extract_items(raw_text: str) -> list:
    """
    Extracts product/item names from receipt line items, to use as a
    richer categorization signal than the merchant name alone. Item rows
    on most receipts share a recognizable shape: item name, then a
    quantity, a rate, and a line total — e.g.
        "Coffee (250g) 1 650.00 650.00"
    We match on that trailing qty+rate+amount numeric pattern rather than
    trying to recognize item names directly, since item names vary too
    much (any language, any product) to pattern-match reliably, but the
    numeric columns at the end of the line are structurally consistent.
    """
    lines = raw_text.split('\n')

    # Matches: <anything> <qty> <rate> <amount>, where qty is a small
    # integer and rate/amount are decimal numbers with 2 decimal places.
    item_row_pattern = re.compile(
        r'^(.+?)\s+\d+\s+[\d,]+\.\d{2}\s+[\d,]+\.\d{2}\s*$'
    )

    # Summary/header rows can occasionally have a similar numeric shape
    # by coincidence — explicitly excluded as a safety net.
    exclude_pattern = re.compile(
        r'subtotal|^total|grand\s*total|discount|tax|vat|amount\s*paid|'
        r'change|payment|item\s+qty\s+rate',
        re.IGNORECASE,
    )

    item_names = []
    for line in lines:
        line = line.strip()
        if not line or exclude_pattern.search(line):
            continue
        match = item_row_pattern.match(line)
        if match:
            item_name = match.group(1).strip()
            # Strip a trailing parenthetical like "(250g)" or "(1L)" so
            # the categorizer sees the product noun, not packaging size.
            item_name = re.sub(r'\s*\([^)]*\)\s*$', '', item_name).strip()
            if item_name:
                item_names.append(item_name)

    return item_names


# ── Public entry point (called by router.py) ───────────────────────────────

def extract(image_bytes: bytes) -> dict:
    """
    Full OCR pipeline: preprocess -> Tesseract -> field extraction ->
    categorization. Field names (description, amount, date) are chosen
    to match TransactionForm's actual form field names directly, so the
    frontend can drop the response straight into form state.

    Categorization input: if item lines were found (a detailed receipt
    with qty/rate/amount columns), we categorize using the joined item
    list — e.g. "Coffee, Milk, Rice, Eggs" — since product names are a
    much stronger signal for categorizer.predict() than a store name
    like "Green Mart" that the keyword rules and TF-IDF model have
    likely never seen. If no item lines were detected (a simple receipt,
    or one Tesseract read too poorly to find the qty/rate/amount
    pattern), we fall back to categorizing on the merchant name alone,
    same as before. Either way, `description` shown to the user is
    always the merchant name — only the categorizer's input changes.
    """
    processed = _preprocess(image_bytes)
    ocr_result = _run_tesseract(processed)
    raw_text = ocr_result['raw_text']

    amount = _extract_amount(raw_text)
    date = _extract_date(raw_text)
    merchant = _extract_merchant(raw_text)
    items = _extract_items(raw_text)

    categorization_input = ', '.join(items) if items else merchant
    category_result = categorizer.predict(categorization_input)

    return {
        'description': merchant,
        'amount': amount,
        'date': date,
        'category': category_result['category'],
        'confidence': category_result['confidence'],
        'method': category_result['method'],
        'ocr_confidence': ocr_result['avg_confidence'],
        'ocr_low_confidence': ocr_result['avg_confidence'] < LOW_OCR_CONFIDENCE_THRESHOLD,
        'items': items,
        'raw_text': raw_text,
    }