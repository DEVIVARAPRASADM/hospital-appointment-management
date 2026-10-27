import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  MapPin, 
  Stethoscope, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  Building
} from 'lucide-react';

export default function PatientDiscovery({ onOpenAuth }) {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [activeDoctor, setActiveDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [visitReason, setVisitReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const hospitalData = await api.getHospitals();
        setHospitals(hospitalData.hospitals);

        if (hospitalData.hospitals.length > 0) {
          const firstHosp = hospitalData.hospitals[0];
          setBranches(firstHosp.branches || []);
        }

        const doctorData = await api.getDoctors();
        setDoctors(doctorData.doctors);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleFilter = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (selectedSpecialty) params.specialty = selectedSpecialty;
      if (searchQuery) params.search = searchQuery;

      const data = await api.getDoctors(params);
      setDoctors(data.doctors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openBooking = async (doctor) => {
    setActiveDoctor(doctor);
    setSelectedSlot(null);
    setBookingSuccess(null);
    setBookingError('');
    setVisitReason('');
    try {
      const data = await api.getDoctorAvailability(doctor.id);
      setAvailableSlots(data.slots || []);
    } catch (err) {
      setBookingError(err.message);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please choose an available appointment slot');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError('');
      const data = await api.bookAppointment({
        availabilityId: selectedSlot.id,
        reason: visitReason,
      });
      setBookingSuccess(data.appointment);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Hero Search Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0d9488 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '3rem 2rem',
        color: '#ffffff',
        marginBottom: '2.5rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ maxWidth: '800px' }}>
          <span style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Trusted Hospital Network
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.75rem 0 0.5rem 0', lineHeight: 1.2 }}>
            Find & Consult Super Specialist Doctors
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#e0f2fe', marginBottom: '2rem' }}>
            Book confirmed hospital outpatient slots with verified doctors. Real-time availability, zero double-booking, and direct queue tokens.
          </p>

          {/* Search Box */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '0.5rem',
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr auto',
            gap: '0.5rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', gap: '0.5rem', color: 'var(--slate-700)' }}>
              <Search size={18} color="var(--slate-400)" />
              <input
                type="text"
                placeholder="Doctor name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', color: 'var(--slate-800)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', gap: '0.5rem', borderLeft: '1px solid var(--slate-200)' }}>
              <Building size={18} color="var(--slate-400)" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: 'var(--slate-700)' }}
              >
                <option value="">All Hospital Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', gap: '0.5rem', borderLeft: '1px solid var(--slate-200)' }}>
              <Stethoscope size={18} color="var(--slate-400)" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: 'var(--slate-700)' }}
              >
                <option value="">All Specialties</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="General Medicine">General Medicine</option>
              </select>
            </div>

            <button
              onClick={handleFilter}
              className="btn-primary"
              style={{ padding: '0.75rem 1.75rem', borderRadius: '10px' }}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Available Specialists ({doctors.length})
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)' }}>
              Showing practicing specialists at CarePoint Super Specialty Hospital
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
            Loading verified doctors...
          </div>
        ) : doctors.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <AlertCircle size={40} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)' }}>No doctors match your search</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Try adjusting your specialty or branch filters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {doctors.map((doc) => (
              <div key={doc.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                        {doc.user.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-700)', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.15rem' }}>
                        <Stethoscope size={16} />
                        {doc.specialty}
                      </div>
                    </div>
                    <span className="badge badge-success">
                      Verified
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '0.75rem' }}>
                    {doc.qualification}
                  </p>

                  <div style={{ background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: '0.2rem' }}>
                      Consultation Fee
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                      ₹{doc.consultationFee}
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Practice Location & Schedule:
                    </div>
                    {doc.sessions && doc.sessions.length > 0 ? (
                      doc.sessions.slice(0, 2).map((s) => (
                        <div key={s.id} style={{ fontSize: '0.85rem', color: 'var(--slate-700)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <MapPin size={15} color="var(--slate-400)" />
                          <span>{s.branch.name} ({new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                        Slots available tomorrow and next week
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openBooking(doc)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
                >
                  <Calendar size={18} />
                  Book Outpatient Appointment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Drawer / Modal */}
      {activeDoctor && (
        <div className="modal-overlay" onClick={() => setActiveDoctor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', padding: '2rem' }}>
            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--emerald-50)',
                  color: 'var(--emerald-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <CheckCircle size={36} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                  Appointment Confirmed!
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                  Your slot has been reserved. Please show this booking reference at the reception desk.
                </p>

                <div style={{
                  background: 'var(--slate-50)',
                  border: '1px dashed var(--slate-300)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  margin: '1.5rem 0',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Booking Reference</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-700)', fontFamily: 'var(--font-mono)' }}>
                      {bookingSuccess.bookingReference}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Doctor</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                      {bookingSuccess.availability.doctor.user.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Hospital Branch</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                      {bookingSuccess.availability.session.branch.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Slot Time</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      {new Date(bookingSuccess.availability.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveDoctor(null)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                      Book Appointment with {activeDoctor.user.name}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                      {activeDoctor.specialty} • ₹{activeDoctor.consultationFee} Consultation
                    </p>
                  </div>
                  <button onClick={() => setActiveDoctor(null)} style={{ color: 'var(--slate-400)', fontSize: '1.2rem' }}>
                    ✕
                  </button>
                </div>

                {bookingError && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'var(--rose-50)',
                    color: 'var(--rose-600)',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={18} />
                    {bookingError}
                  </div>
                )}

                {!user && (
                  <div style={{
                    padding: '0.85rem',
                    background: 'var(--amber-50)',
                    color: 'var(--amber-600)',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Sign in or register to confirm this booking</span>
                    <button onClick={onOpenAuth} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                      Sign In Now
                    </button>
                  </div>
                )}

                {/* Available Slots Grid */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                    Select Discrete Appointment Slot *
                  </label>

                  {availableSlots.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--slate-50)', borderRadius: '8px', color: 'var(--slate-500)', fontSize: '0.9rem' }}>
                      No open slots currently available for this doctor.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.25rem' }}>
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const timeStr = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const dateStr = new Date(slot.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: '0.5rem 0.6rem',
                              borderRadius: '8px',
                              textAlign: 'center',
                              background: isSelected ? 'var(--primary-600)' : '#ffffff',
                              color: isSelected ? '#ffffff' : 'var(--slate-800)',
                              border: isSelected ? '1px solid var(--primary-700)' : '1px solid var(--slate-300)',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div>{dateStr}</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{timeStr}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Consultation (Optional)</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="Brief description of symptoms or routine follow-up..."
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveDoctor(null)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bookingLoading || !selectedSlot}
                    onClick={handleConfirmBooking}
                    className="btn-primary"
                    style={{ flex: 2, justifyContent: 'center' }}
                  >
                    {bookingLoading ? 'Reserving Slot...' : 'Confirm Outpatient Booking'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
