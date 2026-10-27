-- Create partial unique index to guarantee that only one active appointment can exist per availability slot
-- Cancelled appointments are preserved in history and excluded from this uniqueness constraint.
CREATE UNIQUE INDEX unique_active_appointment_per_slot
ON "appointments" (availability_id)
WHERE status NOT IN ('CANCELLED');