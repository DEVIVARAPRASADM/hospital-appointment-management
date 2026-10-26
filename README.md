# Hospital Appointment Management System

Database design and ER diagram for the Pearl Thoughts internship assignment.

---

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + Prisma
- **Auth:** JWT

---

## Key Entities
- **USER:** Credentials, contact details, and role (`PATIENT`, `DOCTOR`, `RECEPTIONIST`, `ADMIN`).
- **PATIENT:** Patient profile linked 1:1 to User (DOB, blood group, medical history).
- **DOCTOR:** Doctor profile linked 1:1 to User (specialty, license, consultation fee).
- **AVAILABILITY:** Time slots published by doctors.
- **APPOINTMENT:** Booking connecting a patient with a doctor's availability slot.

---

## Documentation
- **[ER Diagram & Database Design](docs/er-diagram.md):** Complete Mermaid ER diagram, data dictionary, primary/foreign keys, and entity relationships.
