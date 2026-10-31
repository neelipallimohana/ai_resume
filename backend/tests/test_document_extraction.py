import os
import tempfile
import fitz
import docx
from app.services.document_extraction import DocumentExtractionService

def test_pdf_text_extraction():
    # Create a small valid PDF in memory
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Dr. Priya Patel\nSenior Formulation Scientist\nEmail: priya@pharma.com\nPhone: +919876543211\nExperience: 6 years")
    
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tf:
        pdf_path = tf.name
    doc.save(pdf_path)
    doc.close()

    try:
        text, is_scanned = DocumentExtractionService.extract_text(pdf_path)
        assert "Dr. Priya Patel" in text
        assert "Senior Formulation Scientist" in text
        assert "priya@pharma.com" in text
        assert is_scanned is False
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

def test_docx_text_extraction():
    # Create a small valid DOCX
    doc = docx.Document()
    doc.add_heading("Rahul Verma - Resume", 0)
    doc.add_paragraph("Email: rahul@biotech.com | Mobile: +919123456789")
    doc.add_paragraph("Education: B.Tech in Biotechnology (2020)")
    
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tf:
        docx_path = tf.name
    doc.save(docx_path)

    try:
        text, is_scanned = DocumentExtractionService.extract_text(docx_path)
        assert "Rahul Verma" in text
        assert "rahul@biotech.com" in text
        assert "B.Tech in Biotechnology" in text
    finally:
        if os.path.exists(docx_path):
            os.remove(docx_path)
