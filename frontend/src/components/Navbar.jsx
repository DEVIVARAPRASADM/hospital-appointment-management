import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Calendar, 
  Users, 
  ClipboardList, 
  Activity, 
  ShieldCheck, 
  LogOut, 
  UserCircle 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--slate-200)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
             onClick={() => setActiveTab('patient-discovery')}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
            color: '#fff',
            padding: '0.55rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
          }}>
            <Building2 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em', margin: 0 }}>
              CarePoint
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hospital Operations Platform
            </span>
          </div>
        </div>

        {/* Navigation Tabs based on permissions */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('patient-discovery')}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'patient-discovery' ? 'var(--primary-50)' : 'transparent',
              color: activeTab === 'patient-discovery' ? 'var(--primary-700)' : 'var(--slate-600)',
              border: activeTab === 'patient-discovery' ? '1px solid var(--primary-200)' : '1px solid transparent'
            }}
          >
            <Calendar size={17} />
            Find Doctors & Book
          </button>

          {user && user.role === 'PATIENT' && (
            <button
              onClick={() => setActiveTab('patient-appointments')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'patient-appointments' ? 'var(--primary-50)' : 'transparent',
                color: activeTab === 'patient-appointments' ? 'var(--primary-700)' : 'var(--slate-600)',
                border: activeTab === 'patient-appointments' ? '1px solid var(--primary-200)' : '1px solid transparent'
              }}
            >
              <ClipboardList size={17} />
              My Appointments
            </button>
          )}

          {user && (user.role === 'RECEPTIONIST' || user.role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('reception-workspace')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'reception-workspace' ? 'var(--teal-50)' : 'transparent',
                color: activeTab === 'reception-workspace' ? 'var(--teal-700)' : 'var(--slate-600)',
                border: activeTab === 'reception-workspace' ? '1px solid #99f6e4' : '1px solid transparent'
              }}
            >
              <Users size={17} />
              Reception Desk
            </button>
          )}

          {user && (user.role === 'NURSE' || user.role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('nurse-triage')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'nurse-triage' ? 'var(--emerald-50)' : 'transparent',
                color: activeTab === 'nurse-triage' ? 'var(--emerald-700)' : 'var(--slate-600)',
                border: activeTab === 'nurse-triage' ? '1px solid #a7f3d0' : '1px solid transparent'
              }}
            >
              <Activity size={17} />
              Nurse Triage
            </button>
          )}

          {user && user.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin-panel')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'admin-panel' ? 'var(--slate-100)' : 'transparent',
                color: activeTab === 'admin-panel' ? 'var(--slate-900)' : 'var(--slate-600)',
                border: activeTab === 'admin-panel' ? '1px solid var(--slate-300)' : '1px solid transparent'
              }}
            >
              <ShieldCheck size={17} />
              Admin Operations
            </button>
          )}
        </nav>

        {/* User Identity or Login Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {user.name}
                </div>
                <span className={`badge ${
                  user.role === 'ADMIN' ? 'badge-danger' :
                  user.role === 'DOCTOR' ? 'badge-info' :
                  user.role === 'RECEPTIONIST' ? 'badge-warning' :
                  user.role === 'NURSE' ? 'badge-success' : 'badge-neutral'
                }`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log out"
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  color: 'var(--slate-500)',
                  border: '1px solid var(--slate-200)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('auth-modal')}
              className="btn-primary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem' }}
            >
              <UserCircle size={18} />
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
