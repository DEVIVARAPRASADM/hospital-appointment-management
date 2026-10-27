# CarePoint Hospital System — Production Architecture & Resilience Specification

This document defines the production engineering principles, core workflows, concurrency guards, failure modes, and recovery mechanisms for the CarePoint Hospital Appointment & Operations Management System.

---

## 1. Core System Architecture & The 5 Essential Portals

The platform is designed around 1 Public Entrance and 5 strictly isolated Role Portals.

```
                              ┌─────────────────────────────────────────┐
                              │           PUBLIC LANDING PAGE           │
                              │  - Hero Banner & Quick Actions          │
                              │  - Specialties, Facilities & Doctors   │
                              │  - Direct "Sign In / Sign Up" Entry     │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │         UNIFIED AUTHENTICATION          │
                              │  - Single Form (Email, Password)        │
                              │  - Role Dropdown:                       │
                              │    [Patient | Doctor | Receptionist |   │
                              │     Nurse | Administrator]              │
                              │  - Toggle: Sign In / Universal Sign Up  │
                              └────────────────────┬────────────────────┘
                                                   │
                     ┌─────────────────────────────┼─────────────────────────────┐
                     │                             │                             │
                     ▼                             ▼                             ▼
        ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
        │     PATIENT PORTAL      │   │      DOCTOR PORTAL      │   │    RECEPTIONIST DESK    │
        │ - Doctor Discovery      │   │ - Today's Live Sessions │   │ - Medrella Session Cards│
        │ - Slot Selection Grid   │   │ - Patient Consultation  │   │ - 1-Click Check-in      │
        │ - Booking Confirmation  │   │   Queue (Call/Consult)  │   │ - Walk-In Tokens        │
        │ - My Bookings & Cancel  │   │ - Delay Notice Updates  │   │ - Live Delay Broadcast  │
        └────────────┬────────────┘   └────────────┬────────────┘   └────────────┬────────────┘
                     │                             │                             │
                     │               ┌─────────────┴─────────────┐               │
                     │               │                           │               │
                     ▼               ▼                           ▼               ▼
        ┌─────────────────────────┐                             ┌─────────────────────────┐
        │      NURSE TRIAGE       │                             │    ADMIN OPERATIONS     │
        │ - Arriving Patient Queue│                             │ - Authoritative Metrics │
        │ - Vitals Intake (BP,    │                             │ - Staff Accounts Roster │
        │   Temp, Pulse, SpO2)    │                             │ - Immutable Audit Trail │
        │ - Doctor Handoff State  │                             │ - Branch Scoping        │
        └────────────┬────────────┘                             └────────────┬────────────┘
                     │                                                       │
                     └─────────────────────────────┬─────────────────────────┘
                                                   │
                                         [ Click "Sign Out" ]
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │   Session Cleared -> Immediate Revert   │
                              │          to PUBLIC LANDING PAGE         │
                              └─────────────────────────────────────────┘
```

---

## 2. Comprehensive Feature Breakdown & Edge-Case Resilience

### 2.1 Public Landing Page (Apollo / Fortis Reference)
- **Features:**
  - Emergency hotline notice and hospital contact details.
  - Clinical departments showcase: Cardiology, Neurology, Orthopedics, General Medicine.
  - Doctor directory preview with specialties, qualifications, and consultation fees.
  - Prominent Call to Action: **"Book Consultation"** and **"Hospital Staff & Patient Portal"**.
- **Failure Modes & Defenses:**
  - *Network latency or backend restart:* Graceful skeleton loading cards and empty states. No undefined property access crashes.

---

### 2.2 Unified Authentication & Dynamic Role Selection
- **Features:**
  - Single clean modal/screen with tabs: **Sign In** and **Sign Up**.
  - Animated Role Dropdown:
    - `PATIENT` (Teal Theme)
    - `DOCTOR` (Ocean Blue Theme)
    - `RECEPTIONIST` (Amber Gold Theme)
    - `NURSE` (Emerald Green Theme)
    - `ADMIN` (Royal Purple Theme)
  - Universal Sign-Up: Any role can be created directly from the form.
  - Automatic Workspace Routing: Once authenticated, the user is redirected into their authorized workspace.
  - **Clean Sign Out:** Clicking "Sign Out" from any portal clears local JWT, purges state, and returns to the Landing Page.
- **Failure Modes & Defenses:**
  - *Role Mismatch:* If a doctor attempts to sign in while selecting "Patient" in the dropdown, the backend responds with a clear error: `"This account is registered as DOCTOR. Please select Doctor in the dropdown."`
  - *Duplicate email:* Handled with HTTP 409 and user-friendly inline error without clearing other input fields.

---

### 2.3 Patient Booking Journey (Practo Reference)
- **Features:**
  - Doctor search by name, specialty, and hospital branch.
  - Discrete availability slot selector (grouped cleanly by date and time).
  - Booking review showing branch location, consultation fee, and doctor credentials.
  - Unique booking reference generation (`BK-XXXXXX`).
  - My Appointments list with status badges (`CONFIRMED`, `COMPLETED`, `CANCELLED`).
  - Appointment cancellation modal with required cancellation reason.
- **Failure Modes & Defenses:**
  - *Concurrent Double Booking:* Two users attempting to book the exact same availability slot simultaneously.
    - **Defense:** Atomic database transaction + PostgreSQL Partial Unique Index (`WHERE status NOT IN ('CANCELLED')`). The second request receives HTTP 409 Conflict with `"This slot has already been booked by another patient"`, keeping the database 100% consistent.
  - *Booking Past Slots:* Backend strictly rejects slots where `startTime < now()`.
  - *Booking Cancelled Sessions:* Backend verifies session status is `SCHEDULED` or `ACTIVE`.

---

### 2.4 Receptionist Intake Desk (Medrella Reference)
- **Features:**
  - Session Summary Cards at the top showing real-time counts:
    - Booked appointments
    - Arrived patients
    - Walk-in tokens
    - Waiting count
    - In-consultation count
    - Completed consultations
  - Fast Patient Search by Patient ID (`CP-YYYY-NNNN`), Phone, Name, or Booking Reference (`BK-XXXXXX`).
  - 1-Click Check-In for scheduled appointments.
  - Walk-in patient registration (allocating immediate sequential token without fake appointments).
  - Doctor Delay Notice Broadcast (setting minutes and reason, displayed across all screens).
  - Print-friendly queue token slip with hospital branch, token number, doctor name, and arrival time.
  - Keyboard shortcuts (`/` focus search, `W` walk-in, `P` print token).
- **Failure Modes & Defenses:**
  - *Double Check-in:* Clicking check-in twice rapidly.
    - **Defense:** Idempotent check-in transaction. If an active visit already exists for the appointment, return HTTP 409: `"Patient has already been checked in (Token #X)"`.
  - *Concurrent Token Allocation:* Two staff members checking in patients simultaneously for the same doctor.
    - **Defense:** Atomic database sequence increment scoped to the doctor session. Guaranteed no duplicate tokens.

---

### 2.5 Nurse Clinical Triage Station
- **Features:**
  - Live queue of arriving/waiting patients.
  - Clinical vitals recording:
    - Blood Pressure (`mmHg`)
    - Temperature (`°F`)
    - Pulse Rate (`bpm`)
    - Oxygen Saturation (`SpO2 %`)
    - Nursing assessment notes
  - Immediate handoff indicator updating the queue badge from "Pending Vitals" to "Vitals Recorded".
- **Failure Modes & Defenses:**
  - *Out of Range Vitals:* Clinically dangerous or nonsensical values (e.g. Temp 200°F or Pulse 500 bpm) are rejected at validation boundary.
  - *Unauthorized access:* Restricted to `NURSE`, `DOCTOR`, or `ADMIN`.

---

### 2.6 Doctor Consultation Workflow
- **Features:**
  - View today's scheduled sessions and branch assignment.
  - Ordered patient queue with token numbers, arrival timestamps, and recorded triage vitals.
  - Consultation progression:
    - `Call Next Patient` (changes status to `CALLED`)
    - `Start Consultation` (changes status to `IN_CONSULTATION`)
    - `Complete Consultation` (changes status to `COMPLETED`)
    - `Mark No-Show` (patient did not turn up)
  - Update session delay notice when delayed in surgery or emergency.
- **Failure Modes & Defenses:**
  - *Illegal State Transitions:* Starting consultation for a patient who hasn't been called, or completing an appointment before starting.
    - **Defense:** Backend finite state machine rejects invalid transitions with HTTP 400.
  - *Simultaneous Consultations:* Cannot call a new patient while another is currently `IN_CONSULTATION`.

---

### 2.7 Hospital Administrator Operations
- **Features:**
  - Authoritative operational counters derived from SQL aggregation.
  - Staff management & roster table.
  - Onboard new Doctors, Nurses, Receptionists, and Administrators.
  - Immutable Audit Log Trail tracking critical actions (cancellations, check-ins, walk-ins, triage records, staff role assignments).
- **Failure Modes & Defenses:**
  - *Soft Deactivation vs Hard Deletes:* Deactivating a branch or doctor does not cascade delete historical appointments, visits, or financial records.

---

## 3. Strict Quality & Reliability Checklist Before Implementation

- [x] Clear Public Landing Page as entry point.
- [x] Unified Auth Modal with Role Dropdown, animations, and color themes.
- [x] Dedicated Doctor portal view alongside Patient, Reception, Nurse, and Admin portals.
- [x] Signing out from any portal unconditionally reverts to the Public Landing Page.
- [x] Defensive null/undefined checks on all UI renders (zero blank screen crashes).
- [x] PostgreSQL partial unique index active for 100% double-booking prevention.
- [x] No fake mock responses or hardcoded operational numbers.
