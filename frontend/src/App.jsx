import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import PatientDiscovery from './pages/PatientDiscovery';
import PatientAppointments from './pages/PatientAppointments';
import ReceptionWorkspace from './pages/ReceptionWorkspace';
import NurseTriage from './pages/NurseTriage';
import AdminPanel from './pages/AdminPanel';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('patient-discovery');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
        CarePoint Hospital Operations & Outpatient Management Platform • Production Architecture
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
