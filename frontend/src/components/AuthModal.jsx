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
  Users, 
  UserCheck, 
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const ROLE_CONFIGS = {
  PATIENT: {
    label: 'Patient',
    desc: 'Self-service outpatient booking, history & consultations',
    icon: User,
    colorClass: 'theme-patient',
    gradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
    bgBadge: '#f0fdfa',
    borderBadge: '#99f6e4',
    textColor: '#0f766e',
  },
  DOCTOR: {
    label: 'Doctor',
    desc: 'Manage sessions, availability slots & patient consultations',
    icon: Stethoscope,
    colorClass: 'theme-doctor',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    bgBadge: '#eff6ff',
    borderBadge: '#bfdbfe',
    textColor: '#0369a1',
  },
  RECEPTIONIST: {
    label: 'Receptionist',
    desc: 'Patient intake desk, walk-in tokens & live queue management',
    icon: Users,
    colorClass: 'theme-receptionist',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    bgBadge: '#fffbeb',
    borderBadge: '#fde68a',
    textColor: '#b45309',
  },
  NURSE: {
    label: 'Nurse',
    desc: 'Clinical triage station, vitals intake & doctor handoffs',
    icon: Activity,
    colorClass: 'theme-nurse',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    bgBadge: '#ecfdf5',
    borderBadge: '#a7f3d0',
    textColor: '#047857',
  },
  ADMIN: {
    label: 'Administrator',
    desc: 'Hospital analytics, staff accounts & platform governance',
    icon: ShieldCheck,
    colorClass: 'theme-admin',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    bgBadge: '#f5f3ff',
    borderBadge: '#ddd6fe',
    textColor: '#5b21b6',
  },
};

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  
  // Modes: 'LOGIN' or 'SIGNUP'
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'SIGNUP'
  
  // Selected Role dropdown
  const [selectedRole, setSelectedRole] = useState('PATIENT');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');
  
  // Optional Doctor-specific fields during Doctor signup
  const [specialty, setSpecialty] = useState('General Medicine');
  const [qualification, setQualification] = useState('MBBS');
  const [consultationFee, setConsultationFee] = useState(600);

  if (!isOpen) return null;

  const currentRoleConfig = ROLE_CONFIGS[selectedRole] || ROLE_CONFIGS.PATIENT;
  const RoleIcon = currentRoleConfig.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'SIGNUP') {
        // Universal Sign Up for ANY Role selected in dropdown!
        await register({
          name,
          email,
          password,
          role: selectedRole,
          phone,
          gender,
          specialty,
          qualification,
          consultationFee,
        });
      } else {
        // Single unified Login for ANY role with role verification
        await login(email, password, selectedRole);
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
      <div 
        className="modal-content animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '520px', 
          padding: '2rem',
          borderRadius: '24px',
          border: `1.5px solid ${currentRoleConfig.borderBadge}`,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Dynamic Header with Role Theme Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: currentRoleConfig.gradient,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.3s ease'
            }}>
              <RoleIcon size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em', margin: 0 }}>
                {authMode === 'LOGIN' ? 'Sign In to CarePoint' : 'Create CarePoint Account'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: currentRoleConfig.textColor, fontWeight: 700 }}>
                {currentRoleConfig.label} Access Portal
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              color: 'var(--slate-400)', 
              padding: '0.4rem', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Role Dropdown Selector */}
        <div style={{
          background: currentRoleConfig.bgBadge,
          border: `1px solid ${currentRoleConfig.borderBadge}`,
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          transition: 'all 0.3s ease'
        }}>
          <label style={{ 
            fontSize: '0.75rem', 
            fontWeight: 800, 
            color: currentRoleConfig.textColor, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: '0.35rem'
          }}>
            Select Access Role:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RoleIcon size={18} color={currentRoleConfig.textColor} />
            <select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setError(''); }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--slate-900)',
                cursor: 'pointer'
              }}
            >
              <option value="PATIENT">👤 Patient (Public / Booking Portal)</option>
              <option value="DOCTOR">🩺 Doctor (Consultation & Availability)</option>
              <option value="NURSE">💉 Nurse (Clinical Triage & Vitals)</option>
              <option value="RECEPTIONIST">📋 Receptionist (Intake Desk & Queue)</option>
              <option value="ADMIN">🛡️ Administrator (Analytics & System Ops)</option>
            </select>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.3rem' }}>
            {currentRoleConfig.desc}
          </div>
        </div>

        {/* Mode Switcher Tabs: Sign In vs Sign Up */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--slate-100)',
          borderRadius: '10px',
          padding: '0.25rem',
          marginBottom: '1.25rem'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('LOGIN'); setError(''); }}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: authMode === 'LOGIN' ? '#ffffff' : 'transparent',
              color: authMode === 'LOGIN' ? 'var(--slate-900)' : 'var(--slate-500)',
              boxShadow: authMode === 'LOGIN' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('SIGNUP'); setError(''); }}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: authMode === 'SIGNUP' ? '#ffffff' : 'transparent',
              color: authMode === 'SIGNUP' ? 'var(--slate-900)' : 'var(--slate-500)',
              boxShadow: authMode === 'SIGNUP' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign Up as {currentRoleConfig.label}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="animate-fade-in" style={{
            padding: '0.75rem 1rem',
            background: 'var(--rose-50)',
            color: 'var(--rose-600)',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {/* Single Universal Form */}
        <form onSubmit={handleSubmit}>
          {authMode === 'SIGNUP' && (
            <div className="animate-fade-in">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Dr. Ramesh / Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {selectedRole === 'PATIENT' && (
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
              )}

              {selectedRole === 'DOCTOR' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Medical Specialty</label>
                    <input
                      type="text"
                      className="form-control"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fee (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder={`${selectedRole.toLowerCase()}@carepoint.com`}
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
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '12px',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              background: currentRoleConfig.gradient,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>{authMode === 'LOGIN' ? `Sign In as ${currentRoleConfig.label}` : `Sign Up as ${currentRoleConfig.label}`}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
          {authMode === 'LOGIN' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('SIGNUP')}
                style={{ color: currentRoleConfig.textColor, fontWeight: 700 }}
              >
                Sign up as {currentRoleConfig.label}
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('LOGIN')}
                style={{ color: currentRoleConfig.textColor, fontWeight: 700 }}
              >
                Sign in here
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
