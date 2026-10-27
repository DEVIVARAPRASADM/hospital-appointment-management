# CarePoint Hospital Management System — API Documentation

Base URL: `/api/v1`

---

## 1. Authentication (`/api/v1/auth`)

### 1.1 `POST /auth/register`
Self-service patient registration.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Ramesh Gupta",
    "email": "ramesh.gupta@carepoint.com",
    "password": "Password@123",
    "phone": "+91 98450 12345",
    "gender": "MALE"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "data": {
      "token": "<JWT_TOKEN>",
      "user": {
        "id": "uuid",
        "name": "Ramesh Gupta",
        "email": "ramesh.gupta@carepoint.com",
        "role": "PATIENT",
        "patient": {
          "id": "uuid",
          "patientIdentifier": "CP-2026-0002"
        }
      }
    }
  }
  ```

### 1.2 `POST /auth/login`
Authenticate any system actor.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "reception@carepoint.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK):** Returns user profile, active branch assignments, and Bearer token.

### 1.3 `GET /auth/me`
Retrieve currently authenticated user profile.
- **Access:** Authenticated (`Bearer <token>`)

---

## 2. Hospitals, Branches & Departments

- `GET /hospitals` — List all active hospitals and multi-branch networks.
- `GET /hospitals/:id/branches` — List branches for a hospital with physical location coordinates.
- `GET /departments` — List clinical departments.
- `POST /hospitals` — Admin: create hospital.
- `POST /hospitals/:id/branches` — Admin: create branch with location.

---

## 3. Doctors & Availability

### 3.1 `GET /doctors`
Query doctors with optional filtering:
- Query parameters: `?specialty=Cardiology&branchId=<uuid>&search=Rao`

### 3.2 `GET /doctors/:id/availability`
Query open appointment slots for a doctor:
- Query parameters: `?date=YYYY-MM-DD&branchId=<uuid>`

### 3.3 `PATCH /sessions/:id/delay`
Broadcast delay notice for a session:
- **Access:** Doctor, Receptionist, Admin
- **Request Body:**
  ```json
  {
    "delayMinutes": 20,
    "delayReason": "Emergency patient in ICU"
  }
  ```

---

## 4. Outpatient Appointments

### 4.1 `POST /appointments`
Book an appointment slot.
- **Access:** Authenticated (Patient or Receptionist)
- **Concurrency Protection:** Handled via transaction + PostgreSQL partial unique index. Conflicting bookings return **409 Conflict**.
- **Request Body:**
  ```json
  {
    "availabilityId": "<uuid>",
    "reason": "Chest pain review"
  }
  ```
- **Response (201 Created):** Contains unique `bookingReference` (e.g. `BK-CRD101`).

### 4.2 `GET /appointments/my`
List bookings for the authenticated patient.

### 4.3 `PATCH /appointments/:id/cancel`
Cancel booking while retaining historical record for auditing.
- **Request Body:**
  ```json
  {
    "cancellationReason": "Patient travel clash"
  }
  ```

---

## 5. Reception Desk Operations (`/api/v1/reception`)
*Requires `RECEPTIONIST` or `ADMIN` role.*

- `GET /reception/dashboard` — Live session cards, queue metrics, and delay notices.
- `GET /reception/patients/search?q=<query>` — Instant search across name, phone, patient identifier, or booking reference.
- `POST /reception/visits/walk-in` — Register walk-in patient directly into session queue and allocate token.
- `POST /reception/visits/:appointmentId/check-in` — Check in scheduled appointment and allocate sequential token.
- `GET /reception/sessions/:sessionId/queue` — Ordered list of patients in queue.
- `POST /reception/sessions/:sessionId/call-next` — Transition next waiting patient to `CALLED`.
- `PATCH /reception/visits/:id/status` — State machine transition (`WAITING`, `CALLED`, `IN_CONSULTATION`, `COMPLETED`, `NO_SHOW`, `CANCELLED`).

---

## 6. Nurse Clinical Triage (`/api/v1/nurse`)
*Requires `NURSE`, `DOCTOR`, or `ADMIN` role.*

- `GET /nurse/queue` — Visits awaiting or undergoing vitals intake.
- `POST /nurse/visits/:id/triage` — Record clinical vitals:
  ```json
  {
    "bloodPressure": "120/80 mmHg",
    "temperature": 98.6,
    "pulseRate": 72,
    "oxygenSaturation": 99.0,
    "notes": "Patient stable"
  }
  ```

---

## 7. Admin Operations (`/api/v1/admin`)
*Requires `ADMIN` role.*

- `GET /admin/dashboard` — Live operational statistics (hospitals, doctors, patients, appointments, visits, audit logs).
- `GET /admin/staff` — Staff roster and role assignments.
- `POST /admin/staff` — Onboard new Doctor, Nurse, Receptionist, or Administrator.
