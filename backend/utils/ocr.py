import logging
import os

import pytesseract
from PIL import Image

logger = logging.getLogger("ocr")

IMAGE_EXTENSIONS = {"png", "jpg", "jpeg"}


def extract_text(file_path):
    """Best-effort OCR: returns extracted text, or None if the file isn't an image
    or Tesseract isn't installed on this machine."""
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
    if ext not in IMAGE_EXTENSIONS:
        return None

    try:
        with Image.open(file_path) as img:
            text = pytesseract.image_to_string(img)
        return text.strip() or None
    except pytesseract.TesseractNotFoundError:
        logger.warning("Tesseract OCR binary not found on this machine; skipping text extraction for %s", os.path.basename(file_path))
        return None
    except Exception:
        logger.exception("OCR extraction failed for %s", os.path.basename(file_path))
        return None
