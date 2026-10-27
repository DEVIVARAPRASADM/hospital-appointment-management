import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, XCircle, AlertCircle } from 'lucide-react';

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalAppt, setCancelModalAppt] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState('');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.getMyAppointments();
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalAppt) return;
    try {
      await api.cancelAppointment(cancelModalAppt.id, cancellationReason);
      setCancelModalAppt(null);
      setCancellationReason('');
      loadAppointments();
    } catch (err) {
      alert(`Error cancelling appointment: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          My Hospital Appointments
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)' }}>
          View and manage your upcoming outpatient visits and past appointment history.
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'var(--rose-50)', color: 'var(--rose-600)', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
          Loading your appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Calendar size={48} color="var(--slate-300)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-800)' }}>No appointments booked yet</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Browse our specialist doctor directory to schedule your outpatient consultation.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map((appt) => {
            const isCancelled = appt.status === 'CANCELLED';
            const isCompleted = appt.status === 'COMPLETED';
            const slotStart = new Date(appt.availability.startTime);

            return (
              <div key={appt.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-700)', fontFamily: 'var(--font-mono)' }}>
                      {appt.bookingReference}
                    </span>
                    <span className={`badge ${
                      isCancelled ? 'badge-danger' :
                      isCompleted ? 'badge-neutral' : 'badge-success'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                    {appt.availability.doctor.user.name}
                  </h3>
                  <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginBottom: '0.5rem' }}>
                    {appt.availability.doctor.specialty} • {appt.availability.session.branch.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={15} />
                      {slotStart.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={15} />
                      {slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {appt.reason && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Reason: "{appt.reason}"
                    </div>
                  )}

                  {isCancelled && appt.cancellationReason && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--rose-600)', marginTop: '0.4rem' }}>
                      Cancelled: {appt.cancellationReason}
                    </div>
                  )}
                </div>

                {!isCancelled && !isCompleted && (
                  <div>
                    <button
                      onClick={() => setCancelModalAppt(appt)}
                      className="btn-danger"
                    >
                      <XCircle size={16} />
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelModalAppt && (
        <div className="modal-overlay" onClick={() => setCancelModalAppt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              Cancel Appointment {cancelModalAppt.bookingReference}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--slate-500)', marginBottom: '1rem' }}>
              Are you sure you want to cancel this booking? The slot will immediately open up for other patients while your cancellation record is preserved for history.
            </p>

            <form onSubmit={handleCancelSubmit}>
              <div className="form-group">
                <label className="form-label">Reason for Cancellation</label>
                <textarea
                  required
                  rows={3}
                  className="form-control"
                  placeholder="e.g. Personal emergency, rescheduling for next week..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalAppt(null)}
                  className="btn-secondary"
                >
                  Keep Booking
                </button>
                <button type="submit" className="btn-danger">
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
