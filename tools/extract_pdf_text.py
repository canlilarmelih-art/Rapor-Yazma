import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def extract_with_pdfplumber(file_path):
    import pdfplumber

    parts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
            parts.append(text)
    return "\n".join(parts)


def extract_with_pypdf(file_path):
    from pypdf import PdfReader

    reader = PdfReader(file_path)
    parts = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n".join(parts)


def main():
    file_path = sys.argv[1]
    try:
        text = extract_with_pdfplumber(file_path).strip()
    except Exception:
        text = ""

    if not text:
        try:
            text = extract_with_pypdf(file_path).strip()
        except Exception:
            text = ""

    print(json.dumps({"ok": True, "text": text}, ensure_ascii=False))


if __name__ == "__main__":
    main()
