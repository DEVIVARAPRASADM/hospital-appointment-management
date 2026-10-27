import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  UserPlus, 
  Clock, 
  AlertTriangle, 
  Printer, 
  CheckCircle, 
  RefreshCw,
  Phone,
  Calendar,
  ChevronRight,
  Stethoscope
} from 'lucide-react';

export default function ReceptionWorkspace() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionQueue, setSessionQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Search Patients State
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Walk-in Registration Modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInGender, setWalkInGender] = useState('MALE');
  const [walkInSessionId, setWalkInSessionId] = useState('');

  // Delay Notice Modal
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('');

  // Printable Token State
  const [printTokenVisit, setPrintTokenVisit] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getReceptionDashboard();
      setSessions(data.sessions || []);

      if (data.sessions?.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data.sessions[0].id);
        setWalkInSessionId(data.sessions[0].id);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load reception dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async (sessionId) => {
    if (!sessionId) return;
    try {
      const data = await api.getSessionQueue(sessionId);
      setSessionQueue(data.queue || []);
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadQueue(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Keyboard Shortcuts: / for search, W for walk-in, P for print
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('patient-search-input')?.focus();
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setShowWalkInModal(true);
      } else if (e.key.toLowerCase() === 'p' && sessionQueue.length > 0) {
        e.preventDefault();
        setPrintTokenVisit(sessionQueue[0]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionQueue]);

  const handlePatientSearch = async (e) => {
    const query = e.target.value;
    setPatientSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const data = await api.searchPatients(query);
      setSearchResults(data.patients || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      const data = await api.checkInAppointment(appointmentId);
      setPrintTokenVisit(data.visit);
      loadDashboard();
      if (selectedSessionId) loadQueue(selectedSessionId);
      setSearchResults([]);
      setPatientSearchQuery('');
    } catch (err) {
      alert(`Check-in failed: ${err.message}`);
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.registerWalkIn({
        sessionId: walkInSessionId,
        newPatientData: {
          name: walkInName,
          phone: walkInPhone,
          gender: walkInGender,
        },
      });
      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      setPrintTokenVisit(data.visit);
      loadDashboard();
      if (selectedSessionId) loadQueue(selectedSessionId);
    } catch (err) {
      alert(`Walk-in registration error: ${err.message}`);
    }
  };

  const handleStatusChange = async (visitId, nextStatus) => {
    try {
      await api.updateVisitStatus(visitId, nextStatus);
      if (selectedSessionId) loadQueue(selectedSessionId);
      loadDashboard();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCallNext = async () => {
    if (!selectedSessionId) return;
    try {
      await api.callNextPatient(selectedSessionId);
      loadQueue(selectedSessionId);
      loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateDelay = async (e) => {
    e.preventDefault();
    if (!selectedSessionId) return;
    try {
      await api.updateSessionDelay(selectedSessionId, { delayMinutes, delayReason });
      setShowDelayModal(false);
      loadDashboard();
    } catch (err) {
      alert(`Failed to update delay: ${err.message}`);
    }
  };

  const activeSessionObj = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Reception Desk Header & Operational Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Outpatient Reception Desk
            </h2>
            <span className="badge badge-info">Desk 1 - Jubilee Campus</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Live queue management, token allocation, patient check-in, and delay broadcast.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => { loadDashboard(); if (selectedSessionId) loadQueue(selectedSessionId); }}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.9rem' }}
            title="Refresh Queue"
          >
            <RefreshCw size={15} />
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </button>

          <button
            onClick={() => setShowWalkInModal(true)}
            className="btn-success"
            style={{ fontSize: '0.88rem' }}
          >
            <UserPlus size={16} />
            Register Walk-In Patient (W)
          </button>
        </div>
      </div>

      {/* Patient Search & Instant Check-in Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={20} color="var(--slate-400)" />
          <input
            id="patient-search-input"
            type="text"
            className="form-control"
            placeholder="Search patient by Name, Phone, Patient ID (CP-...), or Booking Reference (BK-...) [Press / to focus]"
            value={patientSearchQuery}
            onChange={handlePatientSearch}
            style={{ border: 'none', background: 'transparent', fontSize: '0.95rem' }}
          />
          {searching && <span style={{ fontSize: '0.82rem', color: 'var(--slate-400)' }}>Searching...</span>}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--slate-200)',
            zIndex: 40,
            maxHeight: '350px',
            overflowY: 'auto',
            marginTop: '0.5rem',
            padding: '0.5rem'
          }}>
            <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
              Matching Patients ({searchResults.length}):
            </div>
            {searchResults.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--slate-100)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '8px',
                  transition: 'background 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{p.user.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                    ID: {p.patientIdentifier} • Phone: {p.phone || 'N/A'} • {p.user.email}
                  </div>
                </div>

                <div>
                  {p.appointments && p.appointments.length > 0 && p.appointments[0].status === 'CONFIRMED' ? (
                    <button
                      onClick={() => handleCheckIn(p.appointments[0].id)}
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                    >
                      Check-In ({p.appointments[0].bookingReference})
                    </button>
                  ) : (
                    <span className="badge badge-neutral">No Active Appointment Today</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Doctor Sessions Summary Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-800)', marginBottom: '0.75rem' }}>
          Today's Outpatient Sessions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {sessions.map((s) => {
            const isSelected = selectedSessionId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => { setSelectedSessionId(s.id); setWalkInSessionId(s.id); }}
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
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                      {s.doctorName}
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                      {s.specialty}
                    </div>
                  </div>
                  <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                    {s.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', margin: '0.5rem 0' }}>
                  {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {s.delayMinutes > 0 && (
                  <div style={{
                    padding: '0.4rem 0.6rem',
                    background: 'var(--amber-50)',
                    color: 'var(--amber-600)',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginBottom: '0.75rem'
                  }}>
                    <AlertTriangle size={14} />
                    Running {s.delayMinutes} mins late: {s.delayReason || 'Doctor delayed'}
                  </div>
                )}

                {/* Live Counts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--slate-200)' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--slate-900)' }}>{s.metrics.arrivedPatients}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Arrived</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--amber-600)' }}>{s.metrics.waitingPatients}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Waiting</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-600)' }}>{s.metrics.inConsultation}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>In Consult</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--emerald-600)' }}>{s.metrics.completedVisits}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Done</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Session Active Queue Board */}
      {activeSessionObj && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                Active Queue for {activeSessionObj.doctorName} ({sessionQueue.length} Patients)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                Tokens ordered by queue sequence. Manage attendance and consultation flow.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowDelayModal(true)}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                <Clock size={16} />
                Update Delay Notice
              </button>
              <button
                onClick={handleCallNext}
                className="btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <ChevronRight size={16} />
                Call Next Patient (C)
              </button>
            </div>
          </div>

          {sessionQueue.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--slate-500)', background: 'var(--slate-50)', borderRadius: '8px' }}>
              No patients checked in or waiting for this session yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-500)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Token #</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Patient Name</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Checked-In At</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Triage Vitals</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Current Status</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionQueue.map((visit) => {
                    const latestTriage = visit.triageRecords?.[0];
                    return (
                      <tr key={visit.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 800, color: 'var(--primary-700)', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>
                          #{visit.tokenNumber}
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{visit.patient.user.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>{visit.patient.patientIdentifier}</div>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <span className={`badge ${visit.visitType === 'WALK_IN' ? 'badge-warning' : 'badge-info'}`}>
                            {visit.visitType}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--slate-600)' }}>
                          {new Date(visit.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          {latestTriage ? (
                            <span style={{ fontSize: '0.82rem', color: 'var(--slate-700)' }}>
                              BP: {latestTriage.bloodPressure || 'N/A'} • Temp: {latestTriage.temperature ? `${latestTriage.temperature}°F` : 'N/A'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>Awaiting Triage</span>
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
                            <button
                              onClick={() => setPrintTokenVisit(visit)}
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                              title="Print Token Receipt"
                            >
                              <Printer size={14} />
                            </button>

                            {visit.status === 'WAITING' && (
                              <button
                                onClick={() => handleStatusChange(visit.id, 'CALLED')}
                                className="btn-primary"
                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                              >
                                Call
                              </button>
                            )}

                            {visit.status === 'CALLED' && (
                              <button
                                onClick={() => handleStatusChange(visit.id, 'IN_CONSULTATION')}
                                className="btn-success"
                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                              >
                                Start Consult
                              </button>
                            )}

                            {visit.status === 'IN_CONSULTATION' && (
                              <button
                                onClick={() => handleStatusChange(visit.id, 'COMPLETED')}
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                              >
                                Complete
                              </button>
                            )}

                            {['WAITING', 'CALLED'].includes(visit.status) && (
                              <button
                                onClick={() => handleStatusChange(visit.id, 'NO_SHOW')}
                                className="btn-danger"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                              >
                                No-Show
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
      )}

      {/* Walk-In Patient Registration Modal */}
      {showWalkInModal && (
        <div className="modal-overlay" onClick={() => setShowWalkInModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              Register Walk-In Patient
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1.25rem' }}>
              Allocate an immediate queue token for a patient presenting at the hospital without a prior appointment.
            </p>

            <form onSubmit={handleWalkInSubmit}>
              <div className="form-group">
                <label className="form-label">Doctor Session *</label>
                <select
                  required
                  className="form-control"
                  value={walkInSessionId}
                  onChange={(e) => setWalkInSessionId(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.doctorName} ({s.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Suresh Kumar"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-control"
                    value={walkInGender}
                    onChange={(e) => setWalkInGender(e.target.value)}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate Queue Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delay Broadcast Modal */}
      {showDelayModal && (
        <div className="modal-overlay" onClick={() => setShowDelayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              Broadcast Doctor Delay Notice
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1.25rem' }}>
              Update waiting patients with doctor delay information to set transparent expectations.
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
                <label className="form-label">Delay Explanation (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Attending urgent emergency case in OT"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowDelayModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Delay Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Token Slip */}
      {printTokenVisit && (
        <div className="modal-overlay" onClick={() => setPrintTokenVisit(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ borderBottom: '2px dashed var(--slate-300)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>CarePoint Hospital</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Jubilee Hills Main Campus • Outpatient Intake</div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Queue Token
            </div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary-700)', fontFamily: 'var(--font-mono)', lineHeight: 1.1, margin: '0.5rem 0' }}>
              #{printTokenVisit.tokenNumber}
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '8px', textAlign: 'left', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--slate-500)' }}>Patient:</span>
                <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{printTokenVisit.patient?.user?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--slate-500)' }}>Doctor:</span>
                <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{printTokenVisit.session?.doctor?.user?.name || activeSessionObj?.doctorName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-500)' }}>Check-In Time:</span>
                <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{new Date(printTokenVisit.checkedInAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginBottom: '1.25rem' }}>
              Please be seated in the waiting lobby. Your token will be called on the display board.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => window.print()}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Printer size={16} />
                Print Token
              </button>
              <button
                onClick={() => setPrintTokenVisit(null)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
