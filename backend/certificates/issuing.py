import os
from datetime import datetime, timezone

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

from core.mongo import Collections, col
from core.utils import generate_code


def now():
    return datetime.now(timezone.utc)


def grade_label(score) -> str:
    if score is None:
        return "Pass"
    if score >= 90:
        return "Excellent"
    if score >= 80:
        return "Very Good"
    if score >= 70:
        return "Good"
    return "Pass"


def render_pdf(path: str, student_name: str, course_title: str, code: str, grade: str, issued_at: datetime):
    c = canvas.Canvas(path, pagesize=landscape(A4))
    width, height = landscape(A4)

    c.setFillColor(colors.HexColor("#0b0620"))
    c.rect(0, 0, width, height, fill=1, stroke=0)

    c.setStrokeColor(colors.HexColor("#7c3aed"))
    c.setLineWidth(3)
    c.rect(1 * cm, 1 * cm, width - 2 * cm, height - 2 * cm)

    c.setFillColor(colors.HexColor("#a78bfa"))
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(width / 2, height - 4 * cm, "HORIZON ACADEMY")

    c.setFillColor(colors.white)
    c.setFont("Helvetica", 18)
    c.drawCentredString(width / 2, height - 6 * cm, "Certificate of Completion")

    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 9 * cm, student_name)

    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 10.5 * cm, "has successfully completed the course")

    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.HexColor("#22d3ee"))
    c.drawCentredString(width / 2, height - 12 * cm, course_title)

    c.setFillColor(colors.white)
    c.setFont("Helvetica", 12)
    c.drawCentredString(width / 2, height - 14 * cm, f"Grade: {grade}")
    c.drawCentredString(width / 2, height - 15 * cm, f"Issued: {issued_at.strftime('%Y-%m-%d')}")

    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#9ca3af"))
    c.drawCentredString(width / 2, 2 * cm, f"Verification code: {code}")

    c.showPage()
    c.save()


def issue_certificate(user_id, course_id, payment_id=None):
    existing = col(Collections.CERTIFICATES).find_one({"user_id": user_id, "course_id": course_id})
    if existing and existing.get("payment_status") == "paid":
        return existing

    user = col(Collections.USERS).find_one({"_id": user_id})
    course = col(Collections.COURSES).find_one({"_id": course_id})
    enrollment = col(Collections.ENROLLMENTS).find_one({"user_id": user_id, "course_id": course_id})

    code = generate_code(12)
    grade = grade_label(enrollment.get("exam_score") if enrollment else None)
    issued_at = now()

    cert_dir = os.path.join(settings.MEDIA_ROOT, "certificates")
    os.makedirs(cert_dir, exist_ok=True)
    filename = f"{code}.pdf"
    filepath = os.path.join(cert_dir, filename)
    render_pdf(filepath, user["name"], course["title_en"] or course["title_ar"], code, grade, issued_at)

    doc = {
        "user_id": user_id,
        "course_id": course_id,
        "certificate_code": code,
        "grade": grade,
        "issued_at": issued_at,
        "payment_status": "paid",
        "payment_id": payment_id,
        "pdf_path": f"/media/certificates/{filename}",
    }
    if existing:
        col(Collections.CERTIFICATES).update_one({"_id": existing["_id"]}, {"$set": doc})
        doc["_id"] = existing["_id"]
    else:
        result = col(Collections.CERTIFICATES).insert_one(doc)
        doc["_id"] = result.inserted_id

    col(Collections.NOTIFICATIONS).insert_one(
        {
            "user_id": user_id,
            "title": "شهادتك جاهزة",
            "message": "تم إصدار شهادتك بنجاح ويمكنك تحميلها الآن.",
            "type": "certificate_ready",
            "course_id": course_id,
            "is_read": False,
            "created_at": now(),
        }
    )
    return doc
