# Horizon Academy

**🇬🇧 [English](#-english) | 🇸🇦 [العربية](#-العربية)**

---

## 🇬🇧 English

### Overview

Horizon Academy is a full-featured Learning Management System (LMS): free and paid courses, learning paths, books, ready-made projects, verifiable certificates, a discussion community, and a gamification system (XP / levels / learning streaks). The interface is fully bilingual (Arabic by default, RTL / English, LTR) with a "Glass + Nebula" visual design.

### Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Django, Django REST Framework, MongoDB (PyMongo) |
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Payments | Stripe (test mode) |

### Key Features

- Free and paid courses organized into learning paths and categories.
- E-books and ready-made projects available for purchase or free access.
- Verifiable certificates with a public verification flow.
- Gamification: XP, levels, and learning streaks to keep learners engaged.
- A discussion community and in-app notifications.
- Full admin panel for managing users, instructors, content, and payments.
- Fully bilingual UI (Arabic RTL by default / English LTR).

### Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB running locally (or a connection string to a hosted instance)

### Getting Started

#### Backend

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

Backend runs at `http://localhost:8000`. Default seeded accounts (local development only):

| Role | Email | Password |
|---|---|---|
| Admin | admin@horizon.academy | ChangeMe123! |
| Instructor | instructor@horizon.academy | Instructor123! |

**Change these credentials before deploying anywhere real.**

#### Stripe (certificate / course / book / project payments)

The `.env` ships with placeholder Stripe keys. With placeholders in place, the payment flow automatically runs in a built-in **mock mode** — no real Stripe account is needed to exercise the full purchase → certificate → verify flow end to end. Drop in real Stripe **test-mode** keys (`sk_test_...` / `pk_test_...`) into `backend/.env` and `frontend/.env` to switch to real Stripe Elements/Checkout automatically.

#### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173` and talks to the backend at the URL set in `VITE_API_URL` (defaults to `http://localhost:8000/api`).

### Project Structure

```
backend/    Django + Django REST Framework + MongoDB (PyMongo)
frontend/   React + Vite + TypeScript + Tailwind CSS
```

Each feature area is self-contained: authentication & users, courses/paths/categories, enrollments & gamification, certificates, payments (Stripe + payout methods + coupons + cart/wishlist), books, projects, community, notifications, and the admin panel.

### Scope Notes

- **Payments**: processed through Stripe in **test mode** only. The backend never touches real card data — Stripe Elements handles that directly from the browser. The "payout methods" managed by the admin are informational records only (for internal bookkeeping) and not a real bank-transfer gateway.
- **Uploaded videos**: stored as files on the server (`backend/media/videos`), with their path saved in MongoDB.
- **Email**: notifications (payment confirmation, instructor approval, certificate readiness...) are recorded in-app (the notification bell) only; no real email is sent yet since SMTP credentials are not configured.

### Author

**Mohammad Molazem** — [GitHub](https://github.com/eng-molazem) · [LinkedIn](https://www.linkedin.com/in/mohammad-molazem/)

---

## 🇸🇦 العربية

### نظرة عامة

Horizon Academy منصة تعليمية متكاملة (LMS) — كورسات مجانية ومدفوعة، مسارات تعليمية، كتب، مشاريع جاهزة، شهادات موثقة، مجتمع نقاش، ونظام تلعيب (XP / مستويات / سلاسل تعلم). واجهة ثنائية اللغة بالكامل (عربي افتراضي RTL / إنجليزي LTR) بتصميم "Glass + Nebula".

### البنية التقنية

| الطبقة | التقنيات |
|---|---|
| الخلفية (Backend) | Django, Django REST Framework, MongoDB (PyMongo) |
| الواجهة (Frontend) | React, Vite, TypeScript, Tailwind CSS |
| المدفوعات | Stripe (الوضع التجريبي) |

### المزايا الرئيسية

- كورسات مجانية ومدفوعة مُنظّمة ضمن مسارات تعليمية وفئات.
- كتب إلكترونية ومشاريع جاهزة متاحة للشراء أو الوصول المجاني.
- شهادات موثقة مع آلية تحقق عامة.
- نظام تلعيب: نقاط خبرة (XP)، مستويات، وسلاسل تعلم للحفاظ على تفاعل المتعلمين.
- مجتمع نقاش وإشعارات داخل التطبيق.
- لوحة إدارة كاملة لإدارة المستخدمين والمعلمين والمحتوى والمدفوعات.
- واجهة ثنائية اللغة بالكامل (عربي RTL افتراضياً / إنجليزي LTR).

### المتطلبات

- Python 3.11+
- Node.js 20+
- قاعدة بيانات MongoDB تعمل محلياً (أو رابط اتصال بخدمة مستضافة)

### التشغيل محلياً

#### الخلفية (Backend)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
copy .env.example .env       # Windows: copy, macOS/Linux: cp
python manage.py seed        # ينشئ مستخدم أدمن وفئات وكورسات تجريبية
python manage.py runserver
```

يعمل الباك إند على `http://localhost:8000`. الحسابات الافتراضية المُزرَعة (للتطوير المحلي فقط):

| الدور | البريد الإلكتروني | كلمة المرور |
|---|---|---|
| أدمن | admin@horizon.academy | ChangeMe123! |
| معلم | instructor@horizon.academy | Instructor123! |

**غيّر هذه البيانات قبل أي نشر فعلي.**

#### Stripe (مدفوعات الشهادات/الكورسات/الكتب/المشاريع)

يأتي ملف `.env.` بمفاتيح Stripe افتراضية (placeholder). مع هذه المفاتيح، تعمل عملية الدفع تلقائياً في **وضع محاكاة (mock mode)** مدمج — دون الحاجة لحساب Stripe حقيقي لتجربة المسار الكامل (شراء ← شهادة ← تحقق). ضع مفاتيح Stripe **التجريبية الحقيقية** (`sk_test_...` / `pk_test_...`) في `backend/.env` و`frontend/.env` للتبديل تلقائياً إلى Stripe Elements/Checkout الحقيقي.

#### الواجهة (Frontend)

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

تعمل الواجهة على `http://localhost:5173` وتتواصل مع الخلفية عبر الرابط المحدد في `VITE_API_URL` (الافتراضي `http://localhost:8000/api`).

### بنية المشروع

```
backend/    Django + Django REST Framework + MongoDB (PyMongo)
frontend/   React + Vite + TypeScript + Tailwind CSS
```

كل منطقة ميزة مستقلة بذاتها: المصادقة والمستخدمون، الكورسات/المسارات/الفئات، التسجيلات والتلعيب، الشهادات، المدفوعات (Stripe + طرق استقبال الأموال + الكوبونات + السلة/المفضلة)، الكتب، المشاريع، المجتمع، الإشعارات، ولوحة الإدارة.

### ملاحظات مهمة حول نطاق المشروع

- **المدفوعات**: تتم عبر Stripe في **الوضع التجريبي** فقط. لا يتم لمس بيانات البطاقة الحقيقية من الباك إند إطلاقاً — Stripe Elements يتكفل بذلك مباشرة من المتصفح. "طرق استقبال الأموال" التي يديرها الأدمن هي سجلات معلوماتية فقط (لأغراض المحاسبة الداخلية) وليست بوابة تحويل بنكي فعلية.
- **الفيديوهات المرفوعة**: تُخزَّن كملفات على السيرفر (`backend/media/videos`)، ويُحفظ مسارها في MongoDB.
- **البريد الإلكتروني**: الإشعارات (تأكيد الدفع، الموافقة على المعلم، جهوزية الشهادة...) تُسجَّل داخل المنصة (جرس الإشعارات) فقط؛ لا يوجد إرسال بريد فعلي حالياً لعدم توفر بيانات SMTP.

### المطوّر

**محمد ملازم** — [GitHub](https://github.com/eng-molazem) · [LinkedIn](https://www.linkedin.com/in/mohammad-molazem/)
