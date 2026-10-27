import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
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
      if (isRegister) {
        await register({ name, email, password, phone, gender });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setIsRegister(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {isRegister ? 'Patient Registration' : 'CarePoint Sign In'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              {isRegister ? 'Create your patient account to book appointments' : 'Sign in with your credentials to access your portal'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--slate-400)', padding: '0.35rem' }}>
            <X size={20} />
          </button>
        </div>

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

        <form onSubmit={handleSubmit}>
          {isRegister && (
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
              placeholder="user@carepoint.com"
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
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {loading ? 'Please wait...' : isRegister ? 'Complete Registration' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--slate-600)' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
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
                onClick={() => setIsRegister(true)}
                style={{ color: 'var(--primary-600)', fontWeight: 700 }}
              >
                Register as Patient
              </button>
            </span>
          )}
        </div>

        {/* Demo Fast Login Pills */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--slate-100)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Quick Demo Logins (Password: Password@123):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button
              onClick={() => fillDemoCreds('patient@carepoint.com')}
              className="badge badge-neutral"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              👤 Patient
            </button>
            <button
              onClick={() => fillDemoCreds('reception@carepoint.com')}
              className="badge badge-warning"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              📋 Receptionist
            </button>
            <button
              onClick={() => fillDemoCreds('nurse@carepoint.com')}
              className="badge badge-success"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              🩺 Nurse
            </button>
            <button
              onClick={() => fillDemoCreds('doctor.rao@carepoint.com')}
              className="badge badge-info"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              👨‍⚕️ Doctor Rao
            </button>
            <button
              onClick={() => fillDemoCreds('admin@carepoint.com')}
              className="badge badge-danger"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
