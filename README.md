# Hospital Appointment Management System

This repository contains the architecture, Entity Relationship (ER) design, actor workflows, and implementation for the **Hospital Appointment Management System** (Pearl Thoughts internship assignment).

---

## 📌 Project Overview
The system provides end-to-end appointment scheduling, doctor availability management, and role-based operational workflows for patients, healthcare providers, and hospital administrative staff.

### Core Capabilities
- **Authentication & Authorization:** Secure registration and JWT-based Role-Based Access Control (RBAC).
- **Profile Management:** Specialized profiles for Patients and verified Doctors.
- **Doctor Availability:** Granular time slot configuration preventing scheduling conflicts.
- **Smart Booking Engine:** Prevents double-booking with concurrency handling and database partial unique indices while preserving full cancellation history.
- **Administrative & Receptionist Support:** Walk-in booking assistance and user account management.

---

## 🛠️ Technology Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT + bcrypt

---

## 📚 System Documentation
Detailed engineering design documents are organized in the [`docs/`](file:///Users/mullaguridevivaraprasad/projects/hospital-appointment-management/docs/) folder:

1. **[Entity Relationship (ER) Diagram & Database Design](file:///Users/mullaguridevivaraprasad/projects/hospital-appointment-management/docs/er-diagram.md)**
   - Complete Mermaid ER diagram.
   - Comprehensive data dictionary (5 core entities: `USER`, `PATIENT`, `DOCTOR`, `AVAILABILITY`, `APPOINTMENT`).
   - Cardinality and relationship mapping.
   - Database-level double-booking prevention strategies (PostgreSQL partial unique index + Prisma transactions).
   - Complete Prisma schema definition.

2. **[Actor Relationships & Use Cases](file:///Users/mullaguridevivaraprasad/projects/hospital-appointment-management/docs/actor-relationships.md)**
   - System actor definitions (`Patient`, `Doctor`, `Receptionist`, `Admin`).
   - Interactive Mermaid flowchart showing user interaction boundaries.
   - Role-Based Access Control (RBAC) permission matrix.
   - Sequence diagrams for booking and doctor consultation workflows.

3. **[Loom Presentation Script & Outline](file:///Users/mullaguridevivaraprasad/projects/hospital-appointment-management/docs/loom-outline.md)**
   - Timed 4–5 minute presentation script.
   - Slide-by-slide screen guidance and talking points for mentor review.
   - Technical highlights checklist.

---

## 📂 Repository Structure
```
hospital-appointment-management/
├── README.md
└── docs/
    ├── er-diagram.md
    ├── actor-relationships.md
    └── loom-outline.md
```

