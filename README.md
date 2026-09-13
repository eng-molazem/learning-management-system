# Horizon Academy

منصة تعليمية متكاملة (LMS) — كورسات مجانية ومدفوعة، مسارات تعليمية، كتب، مشاريع جاهزة،
شهادات موثقة، مجتمع نقاش، ونظام تلعيب (XP / مستويات / سلاسل تعلم). واجهة ثنائية اللغة
(عربي افتراضي RTL / إنجليزي LTR) بتصميم Glass + Nebula.

- `backend/` — Django + Django REST Framework + MongoDB (PyMongo)
- `frontend/` — React + Vite + TypeScript + Tailwind CSS

## المتطلبات (Prerequisites)

- Python 3.11+
- Node.js 20+
- MongoDB running locally (or a connection string to a hosted instance)

## تشغيل الباك إند (Backend)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
copy .env.example .env       # Windows: copy, macOS/Linux: cp
python manage.py seed        # creates admin user, categories, demo courses
python manage.py runserver
```

Backend runs at `http://localhost:8000`. Default seeded accounts:

| Role       | Email                       | Password        |
|------------|------------------------------|------------------|
| Admin      | admin@horizon.academy        | ChangeMe123!     |
| Instructor | instructor@horizon.academy   | Instructor123!   |

**Change these before deploying anywhere real.**

### Stripe (certificate / course / book / project payments)

The `.env` ships with placeholder Stripe keys. With placeholders in place, the payment
flow automatically runs in a built-in **mock mode** — no real Stripe account needed to
exercise the full purchase → certificate → verify flow end to end. Drop in real Stripe
**test-mode** keys (`sk_test_...` / `pk_test_...`) in `backend/.env` and
`frontend/.env` to switch to real Stripe Elements/Checkout automatically.

## تشغيل الفرونت إند (Frontend)

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173` and talks to the backend at the URL in
`VITE_API_URL` (defaults to `http://localhost:8000/api`).

## بنية المشروع (Structure)

See `backend/` and `frontend/` — each app/feature area is self-contained:
auth & users, courses/paths/categories, enrollments & gamification, certificates,
payments (Stripe + payout methods + coupons + cart/wishlist), books, projects,
community, notifications, and the admin panel.

## ملاحظات مهمة (Scope notes)

- **المدفوعات (Payments)**: تتم عبر Stripe في **الوضع التجريبي** فقط. لا يتم لمس بيانات
  البطاقة الحقيقية من الباك إند إطلاقاً — Stripe Elements يتكفل بذلك مباشرة من المتصفح.
  "طرق استقبال الأموال" التي يديرها الأدمن هي سجلات معلوماتية فقط (لأغراض المحاسبة
  الداخلية) وليست بوابة تحويل بنكي فعلية.
- **الفيديوهات المرفوعة**: تُخزَّن كملفات على السيرفر (`backend/media/videos`)، ويُحفظ
  مسارها في MongoDB.
- **البريد الإلكتروني**: الإشعارات (تأكيد الدفع، الموافقة على المعلم، جهوزية الشهادة...)
  تُسجَّل داخل المنصة (جرس الإشعارات) فقط؛ لا يوجد إرسال بريد فعلي حالياً لعدم توفر بيانات
  SMTP.
