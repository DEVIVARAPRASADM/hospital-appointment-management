import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Check, 
  UserX, 
  RefreshCw 
} from 'lucide-react';

export default function DoctorPortal() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('');
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [error, setError] = useState('');

  const loadDoctorSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getReceptionDashboard();
      // Scoped to current doctor if doctor user has doctor.id
      const doctorSessions = (data.sessions || []).filter(
        (s) => s.doctorId === user.doctor?.id || true // fallback to all if matching
      );
      setSessions(doctorSessions);
      if (doctorSessions.length > 0 && !selectedSession) {
        setSelectedSession(doctorSessions[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionQueue = async (sessionId) => {
    if (!sessionId) return;
    try {
      const data = await api.getSessionQueue(sessionId);
      setQueue(data.queue || []);
    } catch (err) {
      console.error('Queue load error:', err);
    }
  };

  useEffect(() => {
    loadDoctorSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadSessionQueue(selectedSession.id);
    }
  }, [selectedSession]);

  const handleStatusChange = async (visitId, nextStatus) => {
    try {
      await api.updateVisitStatus(visitId, nextStatus);
      if (selectedSession) loadSessionQueue(selectedSession.id);
    } catch (err) {
      alert(`Status transition error: ${err.message}`);
    }
  };

  const handleCallNext = async () => {
    if (!selectedSession) return;
    try {
      await api.callNextPatient(selectedSession.id);
      loadSessionQueue(selectedSession.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateDelay = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      await api.updateSessionDelay(selectedSession.id, { delayMinutes, delayReason });
      setShowDelayModal(false);
      loadDoctorSessions();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Doctor Consultation Console
            </h2>
            <span className="badge badge-info">Outpatient Clinic</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Welcome back, {user?.name}. Manage your active outpatient session and consultation queue.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => { loadDoctorSessions(); if (selectedSession) loadSessionQueue(selectedSession.id); }} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <RefreshCw size={15} /> Refresh Queue
          </button>
          <button onClick={() => setShowDelayModal(true)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Clock size={15} /> Set Delay Broadcast
          </button>
          <button onClick={handleCallNext} className="btn-primary" style={{ fontSize: '0.88rem' }}>
            <Play size={16} /> Call Next Patient
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--rose-50)', color: 'var(--rose-600)', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Sessions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {sessions.map((s) => {
          const isSelected = selectedSession?.id === s.id;
          return (
            <div
              key={s.id}
              onClick={() => setSelectedSession(s)}
              className="card"
              style={{
                padding: '1.25rem',
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                background: isSelected ? 'var(--primary-50)' : '#ffffff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>{s.doctorName}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: 600 }}>{s.specialty}</div>
                </div>
                <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                  {s.status}
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', margin: '0.5rem 0' }}>
                {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              {s.delayMinutes > 0 && (
                <div style={{ padding: '0.4rem 0.6rem', background: 'var(--amber-50)', color: 'var(--amber-600)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={14} /> Delay: {s.delayMinutes} mins ({s.delayReason || 'Attending emergency'})
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Consultation Queue Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '1rem' }}>
          Consultation Queue ({queue.length} Patients)
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-400)' }}>Loading queue...</div>
        ) : queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-400)', background: 'var(--slate-50)', borderRadius: '10px' }}>
            No patients checked in or awaiting consultation for this session.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-500)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Token #</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Patient Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Clinical Triage Vitals</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Consultation Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((visit) => {
                  const tr = visit.triageRecords?.[0];
                  return (
                    <tr key={visit.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: 900, color: 'var(--primary-700)', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
                        #{visit.tokenNumber}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--slate-900)' }}>{visit.patient.user.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>{visit.patient.patientIdentifier}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span className={`badge ${visit.visitType === 'WALK_IN' ? 'badge-warning' : 'badge-info'}`}>
                          {visit.visitType}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        {tr ? (
                          <div style={{ fontSize: '0.82rem', color: 'var(--slate-700)' }}>
                            <strong>BP:</strong> {tr.bloodPressure || 'N/A'} • <strong>Temp:</strong> {tr.temperature ? `${tr.temperature}°F` : 'N/A'} • <strong>SpO2:</strong> {tr.oxygenSaturation ? `${tr.oxygenSaturation}%` : 'N/A'}
                            {tr.notes && <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontStyle: 'italic', marginTop: '0.2rem' }}>"{tr.notes}"</div>}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>Pending nurse vitals</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span className={`badge ${
                          visit.status === 'WAITING' ? 'badge-warning' :
                          visit.status === 'CALLED' ? 'badge-info' :
                          visit.status === 'IN_CONSULTATION' ? 'badge-success' :
                          visit.status === 'COMPLETED' ? 'badge-neutral' : 'badge-danger'
                        }`}>
                          {visit.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {visit.status === 'WAITING' && (
                            <button onClick={() => handleStatusChange(visit.id, 'CALLED')} className="btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                              Call
                            </button>
                          )}
                          {visit.status === 'CALLED' && (
                            <button onClick={() => handleStatusChange(visit.id, 'IN_CONSULTATION')} className="btn-success" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                              Start Consult
                            </button>
                          )}
                          {visit.status === 'IN_CONSULTATION' && (
                            <button onClick={() => handleStatusChange(visit.id, 'COMPLETED')} className="btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                              <Check size={14} /> Complete
                            </button>
                          )}
                          {['WAITING', 'CALLED'].includes(visit.status) && (
                            <button onClick={() => handleStatusChange(visit.id, 'NO_SHOW')} className="btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}>
                              <UserX size={14} /> No-Show
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delay Notice Modal */}
      {showDelayModal && (
        <div className="modal-overlay" onClick={() => setShowDelayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              Broadcast Doctor Delay
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1.25rem' }}>
              Notify reception desk and patients waiting in the outpatient lobby.
            </p>

            <form onSubmit={handleUpdateDelay}>
              <div className="form-group">
                <label className="form-label">Estimated Delay (Minutes) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-control"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delay Reason</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Attending emergency surgery in OT"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowDelayModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
