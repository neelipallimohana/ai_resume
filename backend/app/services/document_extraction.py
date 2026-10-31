import os
import docx

class DocumentExtractionService:
    @staticmethod
    def extract_text_from_pdf(file_path):
        """
        Extracts readable text from PDF using PyMuPDF (fitz), with pypdf fallback.
        Checks for scanned pages.
        """
        text_content = []
        is_scanned = False
        
        # Primary: PyMuPDF
        try:
            import fitz
            doc = fitz.open(file_path)
            total_pages = len(doc)
            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                if page_text and page_text.strip():
                    text_content.append(page_text.strip())
            doc.close()
        except Exception as e:
            # Fallback: pypdf
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                for page in reader.pages:
                    ptxt = page.extract_text()
                    if ptxt and ptxt.strip():
                        text_content.append(ptxt.strip())
            except Exception as e2:
                raise RuntimeError(f"Failed to read PDF file: {str(e2)}")

        combined = "\n\n".join(text_content).strip()
        
        # If very little or no text was extracted, it is a scanned or image PDF
        if len(combined) < 50:
            is_scanned = True
            ocr_texts = []

            # 1. Primary OCR: RapidOCR (local ONNX, fast, no external binary needed)
            try:
                from rapidocr_onnxruntime import RapidOCR
                import fitz
                ocr_engine = RapidOCR()
                doc = fitz.open(file_path)
                for page in doc:
                    pix = page.get_pixmap(dpi=200)
                    img_bytes = pix.tobytes("png")
                    result, _ = ocr_engine(img_bytes)
                    if result:
                        page_lines = [item[1].strip() for item in result if item and len(item) > 1 and item[1].strip()]
                        if page_lines:
                            ocr_texts.append("\n".join(page_lines))
                doc.close()
            except Exception as ocr_err:
                pass

            # 2. Secondary fallback: pytesseract
            if not ocr_texts:
                try:
                    import pytesseract
                    from PIL import Image
                    import fitz
                    doc = fitz.open(file_path)
                    for page in doc:
                        pix = page.get_pixmap()
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        ocr_t = pytesseract.image_to_string(img)
                        if ocr_t.strip():
                            ocr_texts.append(ocr_t.strip())
                    doc.close()
                except Exception:
                    pass

            if ocr_texts:
                combined = "\n\n".join(ocr_texts).strip()

        return combined, is_scanned

    @staticmethod
    def extract_text_from_docx(file_path):
        """
        Extracts text from DOCX using python-docx.
        """
        try:
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            # Also extract from tables if present
            for table in doc.tables:
                for row in table.rows:
                    row_data = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_data:
                        paragraphs.append(" | ".join(row_data))
            return "\n".join(paragraphs).strip(), False
        except Exception as e:
            raise RuntimeError(f"Failed to read DOCX file: {str(e)}")

    @classmethod
    def extract_text(cls, file_path):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        ext = file_path.rsplit(".", 1)[-1].lower()
        if ext == "pdf":
            return cls.extract_text_from_pdf(file_path)
        elif ext == "docx":
            return cls.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: .{ext}")
