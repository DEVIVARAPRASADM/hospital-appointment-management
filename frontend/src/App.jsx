import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import LandingPage from './pages/LandingPage';
import DoctorPortal from './pages/DoctorPortal';
import PatientDiscovery from './pages/PatientDiscovery';
import PatientAppointments from './pages/PatientAppointments';
import ReceptionWorkspace from './pages/ReceptionWorkspace';
import NurseTriage from './pages/NurseTriage';
import AdminPanel from './pages/AdminPanel';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Auto-switch to relevant operational workspace on staff or patient login
  React.useEffect(() => {
    if (user) {
      if (user.role === 'DOCTOR') {
        setActiveTab('doctor-portal');
      } else if (user.role === 'RECEPTIONIST') {
        setActiveTab('reception-workspace');
      } else if (user.role === 'NURSE') {
        setActiveTab('nurse-triage');
      } else if (user.role === 'ADMIN') {
        setActiveTab('admin-panel');
      } else if (user.role === 'PATIENT') {
        setActiveTab('patient-discovery');
      }
    } else {
      // Revert to landing page when user logs out
      setActiveTab('landing');
    }
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'auth-modal') {
            setIsAuthModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'landing' && (
          <LandingPage 
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onExploreDoctors={() => setActiveTab('patient-discovery')}
          />
        )}
        {activeTab === 'doctor-portal' && <DoctorPortal />}
        {activeTab === 'patient-discovery' && (
          <PatientDiscovery onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}
        {activeTab === 'patient-appointments' && <PatientAppointments />}
        {activeTab === 'reception-workspace' && <ReceptionWorkspace />}
        {activeTab === 'nurse-triage' && <NurseTriage />}
        {activeTab === 'admin-panel' && <AdminPanel />}
      </main>

      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid var(--slate-200)',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--slate-500)',
        marginTop: '3rem'
      }}>
        CarePoint Hospital Operations & Outpatient Management Platform • Role-Based Access Control (RBAC) Architecture
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
