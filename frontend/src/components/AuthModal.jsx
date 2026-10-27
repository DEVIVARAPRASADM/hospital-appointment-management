import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ShieldCheck, 
  Stethoscope, 
  Activity, 
  ClipboardCheck, 
  UserCircle 
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  
  // Tabs: 'PATIENT_PORTAL' vs 'STAFF_PORTAL'
  const [portalType, setPortalType] = useState('PATIENT_PORTAL'); // 'PATIENT_PORTAL' | 'STAFF_PORTAL'
  const [isRegister, setIsRegister] = useState(false); // Only applicable to Patient Portal
  
  // Specific Staff Role Selector for Staff Portal
  const [selectedStaffRole, setSelectedStaffRole] = useState('RECEPTIONIST'); // 'RECEPTIONIST' | 'DOCTOR' | 'NURSE' | 'ADMIN'

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (portalType === 'PATIENT_PORTAL' && isRegister) {
        // Real Patient Self-Registration
        await register({ name, email, password, phone, gender });
      } else {
        // Standard Secure Credentials Login
        const loggedUser = await login(email, password);

        // RBAC Portal Match Verification:
        // Ensure staff don't accidentally sign in via Patient tab and vice versa
        if (portalType === 'STAFF_PORTAL' && loggedUser.role === 'PATIENT') {
          setError("Access Denied: This account is a Patient. Please use the 'Patient Portal' tab.");
          return;
        }
        if (portalType === 'PATIENT_PORTAL' && loggedUser.role !== 'PATIENT') {
          // If staff logs in, allow or gracefully advise
        }
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: '1.75rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              CarePoint Healthcare Access
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              Select your access portal to securely authenticate with Role-Based Access Control (RBAC).
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--slate-400)', padding: '0.35rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Portal Type Segmented Control */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--slate-100)',
          borderRadius: '10px',
          padding: '0.3rem',
          marginBottom: '1.25rem'
        }}>
          <button
            type="button"
            onClick={() => { setPortalType('PATIENT_PORTAL'); setIsRegister(false); setError(''); }}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: portalType === 'PATIENT_PORTAL' ? '#ffffff' : 'transparent',
              color: portalType === 'PATIENT_PORTAL' ? 'var(--primary-700)' : 'var(--slate-600)',
              boxShadow: portalType === 'PATIENT_PORTAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <UserCircle size={17} />
            Patient Portal
          </button>

          <button
            type="button"
            onClick={() => { setPortalType('STAFF_PORTAL'); setIsRegister(false); setError(''); }}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: portalType === 'STAFF_PORTAL' ? '#ffffff' : 'transparent',
              color: portalType === 'STAFF_PORTAL' ? 'var(--teal-700)' : 'var(--slate-600)',
              boxShadow: portalType === 'STAFF_PORTAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={17} />
            Staff & Hospital Portal
          </button>
        </div>

        {/* Staff Role Explanation Banner */}
        {portalType === 'STAFF_PORTAL' && (
          <div style={{
            padding: '0.75rem',
            background: 'var(--slate-50)',
            border: '1px solid var(--slate-200)',
            borderRadius: '8px',
            fontSize: '0.82rem',
            color: 'var(--slate-600)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Lock size={15} color="var(--teal-600)" />
            <span>
              Authorized access for Doctors, Triage Nurses, Intake Receptionists, and Administrators.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '0.75rem',
            background: 'var(--rose-50)',
            color: 'var(--rose-600)',
            border: '1px solid #fecdd3',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          {portalType === 'PATIENT_PORTAL' && isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Ramesh Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-control"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder={portalType === 'STAFF_PORTAL' ? 'staff.id@carepoint.com' : 'patient@carepoint.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={portalType === 'STAFF_PORTAL' ? 'btn-primary' : 'btn-primary'}
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: portalType === 'STAFF_PORTAL' ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : undefined
            }}
          >
            {loading ? 'Authenticating credentials...' : 
              (portalType === 'PATIENT_PORTAL' && isRegister) ? 'Create Patient Account' : 
              portalType === 'STAFF_PORTAL' ? 'Sign In to Staff Console' : 'Sign In to Patient Portal'}
          </button>
        </form>

        {/* Toggle between Login and Registration (Patient Only) */}
        {portalType === 'PATIENT_PORTAL' ? (
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--slate-600)' }}>
            {isRegister ? (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  style={{ color: 'var(--primary-600)', fontWeight: 700 }}
                >
                  Sign in here
                </button>
              </span>
            ) : (
              <span>
                New patient?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  style={{ color: 'var(--primary-600)', fontWeight: 700 }}
                >
                  Register as New Patient
                </button>
              </span>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
            Hospital staff accounts are provisioned and managed by the System Administrator.
          </div>
        )}

      </div>
    </div>
  );
}
