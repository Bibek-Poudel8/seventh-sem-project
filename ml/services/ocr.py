"""
OCR service for bill/receipt image and PDF processing.

Supports: JPEG, PNG, WebP (image files) and PDF (single or multi-page).

Pipeline:
  image file  → _preprocess() → Tesseract
  PDF file    → _pdf_to_images() → _preprocess() per page → Tesseract per page
                → concatenate raw text from all pages
  raw text    → field extraction (merchant, amount, date, items)
              → _build_description() → categorizer.predict()

The description fed to categorizer.predict() is always shaped like a real
user-typed transaction description — e.g. "Health Plus Pharmacy medicine
purchase", "Green Mart grocery shopping" — rather than a raw merchant name
or comma-joined item list. The TF-IDF + logistic regression model was
trained on human-written descriptions, so inputs that resemble training
data get better confidence scores and more reliable keyword-rule matches.

Follows the same dict-in / dict-out convention as categorizer.py and
anomaly.py so router.py can dispatch to it identically.
"""

import io
import re
from datetime import datetime

import cv2
import fitz  # pymupdf — PDF to image conversion, no external binary needed
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


import os
import platform

# Windows: pytesseract can't auto-detect the binary from PATH reliably.
# conda-forge install puts it on PATH on Mac/Linux but not always on Windows.
if platform.system() == "Windows":
    _win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(_win_path):
        pytesseract.pytesseract.tesseract_cmd = _win_path


# ── PDF detection and conversion ────────────────────────────────────────────

def _is_pdf(file_bytes: bytes) -> bool:
    """
    Detect PDF by magic bytes (%PDF- at offset 0) rather than trusting
    the content-type header, which can be wrong when the user uploads
    from a mobile browser or renames the file.
    """
    return file_bytes[:4] == b'%PDF'


def _pdf_to_images(pdf_bytes: bytes) -> list[bytes]:
    """
    Convert each page of a PDF into a PNG image (as raw bytes) using
    pymupdf (fitz). Returns a list of PNG byte strings, one per page.

    Why pymupdf over alternatives:
    - pdf2image requires the poppler binary (OS-level install, like tesseract)
    - pdfplumber/pdfminer extract text but can't handle scanned PDFs
    - pymupdf is pure Python, handles both digital and scanned PDFs, and
      produces high-quality rasterized images at configurable DPI.

    300 DPI is the minimum Tesseract needs for reliable OCR on standard
    receipt text (typically 8-10pt). Going higher adds processing time
    with diminishing accuracy returns for printed receipts.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        # Matrix scales the page to ~300 DPI (default PDF unit = 72 DPI,
        # so scale factor 300/72 ≈ 4.17).
        mat = fitz.Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
        images.append(pix.tobytes("png"))

    doc.close()
    return images


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

    Logo-containing receipts break the naive 'first plausible line' approach
    in two ways: (a) the logo occupies the left column, causing Tesseract to
    merge logo glyphs with the text beside them, or (b) it reads the address
    block before the store name when the logo shifts scan order. In the worst
    case — common with restaurant receipts that have decorative logos — the
    store name is completely absent from Tesseract output, merged entirely
    into garbled glyph characters. The tiered strategy handles this:

    Tier 1: closing phrase with store name ("Thank you for shopping with X")
    Tier 2: ALL-CAPS line scan across first 12 lines (skips taglines)
    Tier 3: dining/restaurant context signal → graceful "Restaurant" fallback
    Tier 4: invoice number prefix as last-resort identifier
    Tier 5: first plausible non-tagline line (original fallback)
    """
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]

    # Tier 1: explicit closing signal phrase containing the store name.
    signal_pattern = re.compile(
        r'(?:thank\s*you\s*for\s*(?:shopping|choosing)\s*(?:with|at|from)?|'
        r'welcome\s*to|visit\s*us\s*(?:at|again)?)\s*([A-Za-z0-9&\'\-\s]+?)[!.\n]',
        re.IGNORECASE,
    )
    for line in lines:
        match = signal_pattern.search(line + '!')
        if match:
            candidate = match.group(1).strip()
            if len(candidate) >= 2:
                return candidate.title()

    # Lines to always skip — dates, numbers, contact info, addresses.
    # Includes restaurant-specific operational fields (waiter, table no,
    # time) and common Nepali address words.
    skip_pattern = re.compile(
        r'^\d+$|^\d{1,2}[/\-]\d{1,2}|receipt|invoice|tel:|phone:|www\.|'
        r'vat|pan\s*no|^\W+$|waiter|cashier|table\s*no|time:|'
        r'^\d+\s+[\w\s]+(?:street|st\.|road|rd\.|avenue|ave\.|lane|'
        r'marg|sadak|chowk|tole)\b',
        re.IGNORECASE,
    )

    # Taglines and slogans — skip these even if they look like clean text.
    # A store name is never a sentence with ! or motivational adjectives.
    # "Good Food, Good Mood!" and "Hope to serve you again!" both match.
    tagline_pattern = re.compile(
        r'!|'
        r'\b(?:good|best|fresh|quality|pure|trusted|delicious|'
        r'healthy|serving|welcome|hope|mood|always|proud|since)\b',
        re.IGNORECASE,
    )

    # Tier 2: ALL-CAPS store name scan — tolerates address appearing before
    # the name, also now skips taglines (e.g. "GOOD FOOD GOOD MOOD" would
    # otherwise be a false ALL-CAPS match).
    all_caps_pattern = re.compile(r'^[A-Z][A-Z\s&\'\-\.]{4,}$')
    for line in lines[:12]:
        if skip_pattern.search(line) or tagline_pattern.search(line):
            continue
        if all_caps_pattern.match(line) and len(line) >= 4:
            return line.title()

    # Tier 3: dining/restaurant context — when the store name is completely
    # lost to logo interference (e.g. this Spice Route receipt), at least
    # return a meaningful generic name that categorizes correctly as
    # Food & Dining rather than falling through to a garbled glyph string.
    dining_signal = re.compile(
        r'dining|dine|waiter|table\s*no|hope\s*to\s*serve|'
        r'thank\s*you\s*for\s*(?:visiting|dining)',
        re.IGNORECASE,
    )
    if dining_signal.search(raw_text):
        return 'Restaurant'

    # Tier 4: invoice number prefix as last-resort identifier.
    # "Invoice No.: SRR-20260630-0551" → prefix "SRR" is likely the
    # store's initials. Not decodable to a real name, but better than
    # "Unknown Merchant" for a user who can see their own receipt.
    invoice_pattern = re.compile(
        r'invoice\s*no\.?\s*[:\-]?\s*([A-Z]{2,5})-\d',
        re.IGNORECASE,
    )
    inv_match = invoice_pattern.search(raw_text)
    if inv_match:
        prefix = inv_match.group(1).upper()
        if len(prefix) >= 2:
            return f'Store ({prefix})'

    # Tier 5: original first-plausible-line fallback, now also skipping
    # taglines to prevent "Good Food, Good Mood!" from being selected.
    for line in lines[:5]:
        if (not skip_pattern.search(line)
                and not tagline_pattern.search(line)
                and len(line) >= 3):
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
    # by coincidence — explicitly excluded as a safety net. Covers both
    # "Item Qty Rate" (grocery) and "Medicine / Product Qty Rate" (pharmacy)
    # column header variants.
    exclude_pattern = re.compile(
        r'subtotal|^total|grand\s*total|discount|tax|vat|amount\s*paid|'
        r'change|payment|item\s+qty|medicine\s*/\s*product|product\s+qty',
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
            # Strip trailing parenthetical packaging like "(250g)", "(10s)",
            # "(Multivitamin)" so the categorizer sees the product noun only.
            item_name = re.sub(r'\s*\([^)]*\)\s*$', '', item_name).strip()
            # Strip trailing dosage/size suffixes common on medical receipts:
            # "Paracetamol 500mg" → "Paracetamol", "Cough Syrup 100ml" →
            # "Cough Syrup", "Pain Relief Gel 30g" → "Pain Relief Gel".
            item_name = re.sub(
                r'\s+\d+\s*(?:mg|ml|g|kg|mcg|iu|tab|caps?)\b', '',
                item_name, flags=re.IGNORECASE,
            ).strip()
            if item_name:
                item_names.append(item_name)

    return item_names


# ── Description builder ───────────────────────────────────────────────────

# Maps item vocabulary to a short natural-language hint word that, when
# appended to the merchant name, produces a description that resembles
# what a user would actually type. The hint is chosen by scanning the
# extracted item names for any keyword match — first match wins, since
# a pharmacy receipt won't contain food items and vice versa.
# These keyword lists deliberately use the same vocabulary that your
# KEYWORD_RULES in categorizer.py are likely trained on, so the hint
# triggers the keyword-rule path (confidence 1.0) rather than the slower
# TF-IDF path wherever possible.
_ITEM_HINT_RULES: list[tuple[list[str], str]] = [
    # Healthcare: drug names, medical product terms
    (
        ["paracetamol", "amoxicillin", "cetirizine", "ibuprofen", "aspirin",
         "antibiotic", "syrup", "tablet", "capsule", "ors", "vitamin",
         "supplement", "gel", "cream", "ointment", "bandage", "medicine",
         "pharmacy", "drug", "injection", "vaccine", "insulin"],
        "medicine purchase",
    ),
    # Food & dining: grocery items AND restaurant/dining items.
    # "restaurant" and "dining" are added so the generic "Restaurant"
    # merchant fallback also triggers this rule via the merchant-name
    # scan in _build_description.
    (
        ["rice", "milk", "bread", "egg", "flour", "oil", "sugar", "salt",
         "tea", "coffee", "biscuit", "butter", "cheese", "vegetable",
         "fruit", "meat", "chicken", "fish", "noodle", "pasta", "cereal",
         "grocery", "groceries", "snack", "spice", "sauce", "juice",
         "momo", "chowmein", "curry", "dal", "roti", "burger", "pizza",
         "sandwich", "soup", "salad", "dessert", "lemonade", "lassi",
         "restaurant", "dining", "cafe", "canteen", "hotel", "eatery"],
        "food dining",
    ),
    # Transportation: fuel and vehicle items
    (
        ["petrol", "diesel", "fuel", "tyre", "tire", "engine", "oil filter",
         "brake", "battery", "parking", "toll", "lubricant"],
        "fuel and transport",
    ),
    # Entertainment
    (
        ["movie", "ticket", "game", "sport", "gym", "fitness", "concert",
         "event", "streaming", "subscription"],
        "entertainment",
    ),
    # Utilities
    (
        ["electricity", "water", "internet", "broadband", "wifi", "gas",
         "recharge", "topup", "bill payment"],
        "utility bill",
    ),
    # Shopping & retail: clothing, electronics, household
    (
        ["shirt", "pant", "shoe", "dress", "jacket", "cloth", "laptop",
         "phone", "charger", "cable", "headphone", "furniture", "appliance",
         "stationery", "pen", "notebook", "bag"],
        "shopping",
    ),
]


def _build_description(merchant: str, items: list[str]) -> str:
    """
    Builds a single natural-language description string to pass to
    categorizer.predict(). The output is shaped like what a user would
    actually type — "Health Plus Pharmacy medicine purchase" — rather
    than a raw merchant name or comma-joined item list.

    Logic:
    1. If items were extracted, scan each item (lowercased) against
       _ITEM_HINT_RULES and append the first matching hint to the
       merchant name.
    2. If no item matches any rule, also check the merchant name itself
       against the same rules — "Health Plus Pharmacy" contains "pharmacy"
       which matches the healthcare rule even with zero items extracted.
    3. If nothing matches at all, return just the merchant name unchanged
       so the categorizer falls back to its normal behaviour for bare names.
    """
    search_targets = [item.lower() for item in items] + [merchant.lower()]

    for keywords, hint in _ITEM_HINT_RULES:
        for target in search_targets:
            if any(kw in target for kw in keywords):
                return f"{merchant} {hint}"

    # No rule matched — return merchant name alone. The categorizer's
    # keyword rules and TF-IDF model may still find a match; we just
    # can't add a hint that would be more accurate than nothing.
    return merchant


# ── Public entry point (called by router.py) ───────────────────────────────

def extract(file_bytes: bytes) -> dict:
    """
    Full OCR pipeline: detect format → preprocess → Tesseract →
    field extraction → categorization.

    For PDFs: each page is converted to a PNG image, preprocessed, and
    run through Tesseract independently. Raw text from all pages is
    concatenated with a page separator so multi-page receipts work
    correctly (e.g. a PDF invoice with items on page 1 and total on page 2).

    For images: same single-page flow as before.

    Either way, field extraction and categorization operate on the same
    plain text string — no branching needed after this point.
    """
    if _is_pdf(file_bytes):
        page_images = _pdf_to_images(file_bytes)

        all_raw_text = []
        all_confidences = []

        for page_bytes in page_images:
            processed = _preprocess(page_bytes)
            ocr_result = _run_tesseract(processed)
            all_raw_text.append(ocr_result['raw_text'])
            if ocr_result['avg_confidence'] > 0:
                all_confidences.append(ocr_result['avg_confidence'])

        # Join pages with a clear separator so field-extraction regexes
        # don't accidentally merge the last word of one page with the
        # first word of the next.
        raw_text = '\n--- PAGE BREAK ---\n'.join(all_raw_text)
        avg_confidence = (
            sum(all_confidences) / len(all_confidences)
            if all_confidences else 0.0
        )
    else:
        processed = _preprocess(file_bytes)
        ocr_result = _run_tesseract(processed)
        raw_text = ocr_result['raw_text']
        avg_confidence = ocr_result['avg_confidence']

    amount = _extract_amount(raw_text)
    date = _extract_date(raw_text)
    merchant = _extract_merchant(raw_text)
    items = _extract_items(raw_text)

    categorization_description = _build_description(merchant, items)
    category_result = categorizer.predict(categorization_description)

    return {
        'description': merchant,
        'categorization_description': categorization_description,
        'amount': amount,
        'date': date,
        'category': category_result['category'],
        'confidence': category_result['confidence'],
        'method': category_result['method'],
        'ocr_confidence': avg_confidence,
        'ocr_low_confidence': avg_confidence < LOW_OCR_CONFIDENCE_THRESHOLD,
        'items': items,
        'raw_text': raw_text,
    }