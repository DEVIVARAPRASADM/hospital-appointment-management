import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  Building, 
  Calendar, 
  Activity, 
  UserPlus, 
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Staff Modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('DOCTOR');
  const [staffSpecialty, setStaffSpecialty] = useState('Cardiology');
  const [consultationFee, setConsultationFee] = useState(700);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, staffData] = await Promise.all([
        api.getAdminDashboard(),
        api.getAllStaff(),
      ]);
      setStats(statsData);
      setStaffList(staffData.staff || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await api.createStaff({
        name: staffName,
        email: staffEmail,
        password: 'Password@123',
        role: staffRole,
        staffDetails: {
          specialty: staffSpecialty,
          consultationFee: parseFloat(consultationFee),
        },
      });
      setShowAddStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      loadAdminData();
    } catch (err) {
      alert(`Failed to add staff: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Hospital Administration & Analytics
            </h2>
            <span className="badge badge-danger">Administrator Scope</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Operational statistics derived from authoritative PostgreSQL database records and staff onboarding.
          </p>
        </div>

        <button
          onClick={() => setShowAddStaffModal(true)}
          className="btn-primary"
          style={{ fontSize: '0.88rem' }}
        >
          <UserPlus size={16} />
          Onboard New Healthcare Staff
        </button>
      </div>

      {loading || !stats ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
          Loading operational analytics...
        </div>
      ) : (
        <>
          {/* Key Metric Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Active Hospitals & Branches
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--slate-900)', margin: '0.4rem 0' }}>
                {stats.hospitals} / {stats.branches}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--emerald-600)', fontWeight: 600 }}>
                All branches operational
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Registered Patients
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-700)', margin: '0.4rem 0' }}>
                {stats.patients}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                Unique patient identifiers
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Outpatient Bookings
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--emerald-600)', margin: '0.4rem 0' }}>
                {stats.appointments.total}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                {stats.appointments.confirmed} confirmed • {stats.appointments.cancelled} cancelled
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Hospital Visits (Tokens)
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--amber-600)', margin: '0.4rem 0' }}>
                {stats.visits.total}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                {stats.visits.walkIns} walk-in tokens allocated
              </div>
            </div>
          </div>

          {/* Staff Accounts Management */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '1rem' }}>
              Staff Accounts & Roster ({staffList.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-500)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Staff Name</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Identifier / Specialty</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {s.name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--slate-600)' }}>
                        {s.email}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className={`badge ${
                          s.role === 'ADMIN' ? 'badge-danger' :
                          s.role === 'DOCTOR' ? 'badge-info' :
                          s.role === 'RECEPTIONIST' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {s.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--slate-700)' }}>
                        {s.doctor?.specialty || s.nurse?.staffIdentifier || s.receptionist?.staffIdentifier || 'System Administration'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className="badge badge-success">{s.accountStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Log Trail */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
              System Audit Log Trail
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1rem' }}>
              Immutable operational action log recording bookings, cancellations, walk-ins, and triage entries.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.recentAuditLogs?.map((log) => (
                <div key={log.id} style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--slate-50)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--slate-900)', marginRight: '0.5rem' }}>
                      {log.action}
                    </span>
                    <span style={{ color: 'var(--slate-600)' }}>
                      on {log.entityType} ({log.entityId || 'N/A'})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Onboard Staff Modal */}
      {showAddStaffModal && (
        <div className="modal-overlay" onClick={() => setShowAddStaffModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              Onboard Hospital Staff
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1.25rem' }}>
              Create a staff credential profile with role-based permissions.
            </p>

            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Dr. Rajesh / Nurse Maya"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="staff@carepoint.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Staff Role *</label>
                <select
                  className="form-control"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                >
                  <option value="DOCTOR">Doctor</option>
                  <option value="NURSE">Nurse</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="ADMIN">Hospital Administrator</option>
                </select>
              </div>

              {staffRole === 'DOCTOR' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Specialty</label>
                    <input
                      type="text"
                      className="form-control"
                      value={staffSpecialty}
                      onChange={(e) => setStaffSpecialty(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
