# CarePoint — Hospital Appointment & Operations Management System

A production-ready outpatient hospital operations platform engineered with **React + Vite**, **Node.js + Express**, **PostgreSQL**, and **Prisma ORM**.

---

## 1. Product Architecture & Capabilities

CarePoint streamlines the complete outpatient healthcare journey:
- **Centralized Authentication & RBAC:** Enforces strict role boundaries (`PATIENT`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `ADMIN`) via signed JWTs, bcrypt password hashing, and database-level checks.
- **Hospital, Branch & Department Scoping:** Multi-branch modeling with geographic coordinates, preventing unauthorized cross-branch or cross-patient access.
- **Doctor Discovery & Scheduling:** Granular doctor sessions and discrete availability slots.
- **Atomic Double-Booking Prevention:** Guaranteed by Prisma database transactions combined with a custom **PostgreSQL Partial Unique Index** (`WHERE status NOT IN ('CANCELLED')`). Preserves full cancellation audit trails while preventing any two active bookings from occupying the same slot.
- **Reception Desk Operations (Medrella-inspired Workspace):**
  - Instant patient search across Patient ID (`CP-YYYY-NNNN`), Phone, Name, or Booking Reference (`BK-XXXXXX`).
  - Outpatient appointment check-in and sequential token allocation.
  - Direct walk-in patient registration without fabricated appointments.
  - Doctor delay notices and waiting-time broadcasts.
  - Print-ready queue token slips.
  - Keyboard shortcuts (`/` for patient search, `W` for walk-in, `P` for token print).
- **Nurse Clinical Triage Station:** Measurement and validation of baseline vitals (blood pressure, temperature, pulse rate, oxygen saturation) before doctor consultation.
- **Doctor Consultation Workflow:** Real-time queue traversal (`WAITING` → `CALLED` → `IN_CONSULTATION` → `COMPLETED` / `NO_SHOW`).
- **Administrative Operations & Audit Logs:** Live operational metrics derived directly from database records and immutable audit event logging.

---

## 2. Technology Stack

- **Frontend:** React 19, Vite, Vanilla CSS (Design Tokens, responsive grid, glassmorphic modals), Lucide Icons. Pure JavaScript/JSX only.
- **Backend:** Node.js, Express.js (REST API v1), Prisma 5 ORM, PostgreSQL 16, JWT, bcryptjs. Pure JavaScript only.
- **Testing:** Mocha & Chai integration test suite.

---

## 3. Demo User Accounts

All demo accounts are seeded with the password: **`Password@123`**

| Role | Email | Responsibilities |
|---|---|---|
| **Admin** | `admin@carepoint.com` | Hospital analytics, staff onboarding, audit logs |
| **Receptionist** | `reception@carepoint.com` | Patient search, check-in, walk-in tokens, delay notices |
| **Nurse** | `nurse@carepoint.com` | Triage queue, clinical vitals intake ($BP, Temp, SpO_2, Pulse$) |
| **Doctor** | `doctor.rao@carepoint.com` | Schedule management, queue consultation |
| **Patient** | `patient@carepoint.com` | Doctor discovery, slot reservation, appointment history |

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL 16 (running on port 5432)

### 1. Backend Setup
```bash
cd backend
npm install

# Configure your environment
cp .env.example .env
# Ensure DATABASE_URL in .env points to your PostgreSQL instance:
# DATABASE_URL="postgresql://username:password@localhost:5432/hospital_management"

# Run migrations and seed data
npx prisma migrate dev
npm run prisma:seed

# Start backend server (port 5000)
npm run dev
```

### 2. Frontend Setup
```bash
cd ../frontend
npm install

# Start Vite dev server (port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Running Automated Tests

Run the backend integration test suite:
```bash
cd backend
npm test
```
**Test Results:**
- 9 passing tests verifying Authentication, RBAC, Hospital Discovery, Slot Availability, Concurrency-safe Double-Booking Prevention (409 Conflict), Check-in, Walk-ins, Delay broadcast, and Admin Analytics.

---

## 6. Project Structure

```
hospital-appointment-management/
├── README.md
├── docs/
│   ├── er-diagram.md
│   ├── actor-relationships.md
│   └── api-documentation.md
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
│       └── api.test.js
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    └── vite.config.js
```
