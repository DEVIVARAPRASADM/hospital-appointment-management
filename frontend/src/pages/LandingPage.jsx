import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Building2, 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  PhoneCall, 
  HeartPulse, 
  Users, 
  Activity, 
  ChevronRight,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage({ onOpenAuth, onExploreDoctors }) {
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLandingData() {
      try {
        setLoading(true);
        const [hospRes, docRes, deptRes] = await Promise.all([
          api.getHospitals().catch(() => ({ hospitals: [] })),
          api.getDoctors().catch(() => ({ doctors: [] })),
          api.getDepartments().catch(() => ({ departments: [] })),
        ]);
        setHospitals(hospRes.hospitals || []);
        setDoctors(docRes.doctors || []);
        setDepartments(deptRes.departments || []);
      } catch (err) {
        console.error('Landing page data error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLandingData();
  }, []);

  return (
    <div style={{ background: '#f8fafc', color: 'var(--slate-800)' }}>
      {/* 1. Emergency Top Notification Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #0c4a6e 0%, #0369a1 100%)',
        color: '#ffffff',
        padding: '0.6rem 1.5rem',
        fontSize: '0.85rem',
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PhoneCall size={15} color="#38bdf8" />
          <span>24/7 Outpatient & Emergency Assistance: <strong>+91 40 2345 6789</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem', color: '#e0f2fe' }}>
          <span>NABH Accredited Multi-Specialty</span>
          <span>•</span>
          <span>Jubilee Hills & Banjara Hills Campuses</span>
        </div>
      </div>

      {/* 2. Hero Presentation Section (Apollo & Fortis Inspiration) */}
      <section style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '4rem 1.5rem 3rem 1.5rem',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '3rem',
        alignItems: 'center'
      }}>
        <div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            border: '1px solid var(--primary-200)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            <HeartPulse size={16} />
            Next-Generation Outpatient Healthcare
          </span>

          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: 900,
            color: 'var(--slate-900)',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1.25rem'
          }}>
            World-Class Care, Seamless Appointments.
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--slate-600)',
            lineHeight: 1.6,
            marginBottom: '2rem',
            maxWidth: '620px'
          }}>
            Welcome to <strong>CarePoint Super Specialty Hospital</strong>. Connect directly with renowned doctors, book verified outpatient slots with zero double-booking, and access clinical queue tokens effortlessly.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={onExploreDoctors}
              className="btn-primary"
              style={{
                padding: '0.9rem 1.75rem',
                fontSize: '1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Calendar size={19} />
              Book Doctor Consultation
            </button>

            <button
              onClick={onOpenAuth}
              className="btn-secondary"
              style={{
                padding: '0.9rem 1.75rem',
                fontSize: '1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Users size={19} />
              Hospital Staff & Patient Login
            </button>
          </div>

          {/* Quick Metrics Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--slate-200)'
          }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-700)' }}>15+</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Super Specialists</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--teal-700)' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Zero Double Booking</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--emerald-700)' }}>24/7</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Outpatient Care</div>
            </div>
          </div>
        </div>

        {/* Hero Card Graphic */}
        <div style={{
          background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0d9488 100%)',
          borderRadius: '32px',
          padding: '2.5rem',
          color: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(2, 132, 199, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: '#ffffff', color: 'var(--primary-700)', padding: '0.5rem', borderRadius: '10px' }}>
                <Stethoscope size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Dr. Rajesh Rao</h4>
                <div style={{ fontSize: '0.82rem', color: '#e0f2fe' }}>Chief Cardiologist • MBBS, MD, DM</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '0.75rem' }}>
              <span>Jubilee Hills Main Campus</span>
              <span style={{ fontWeight: 800, color: '#a7f3d0' }}>Slots Open Today</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: '#ffffff', color: 'var(--teal-700)', padding: '0.5rem', borderRadius: '10px' }}>
                <Activity size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Live Token Allocation</h4>
                <div style={{ fontSize: '0.82rem', color: '#e0f2fe' }}>Medrella Queue Management Engine</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '0.75rem' }}>
              <span>Average Wait Duration</span>
              <span style={{ fontWeight: 800, color: '#fef08a' }}>&lt; 15 mins</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Clinical Specialties (Apollo / Fortis Reference) */}
      <section style={{ maxWidth: '1440px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            Super Specialty Departments
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--slate-500)', marginTop: '0.5rem' }}>
            Comprehensive clinical excellence delivered by board-certified specialists with advanced medical technology.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '2rem', transition: 'transform 0.2s ease', cursor: 'pointer' }} onClick={onExploreDoctors}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--rose-50)', color: 'var(--rose-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <HeartPulse size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>Cardiology</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--slate-500)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Adult and pediatric cardiovascular diagnostics, heart health reviews, and advanced interventions.
            </p>
            <span style={{ color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              View Cardiologists <ArrowRight size={15} />
            </span>
          </div>

          <div className="card" style={{ padding: '2rem', transition: 'transform 0.2s ease', cursor: 'pointer' }} onClick={onExploreDoctors}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Activity size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>Neurology</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--slate-500)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Advanced management for neurological conditions, stroke evaluation, migraines, and cognitive care.
            </p>
            <span style={{ color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              View Neurologists <ArrowRight size={15} />
            </span>
          </div>

          <div className="card" style={{ padding: '2rem', transition: 'transform 0.2s ease', cursor: 'pointer' }} onClick={onExploreDoctors}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--teal-50)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Stethoscope size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>Orthopedics</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--slate-500)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Joint replacement, sports medicine, spine evaluation, and complex trauma orthopedic care.
            </p>
            <span style={{ color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              View Orthopedists <ArrowRight size={15} />
            </span>
          </div>

          <div className="card" style={{ padding: '2rem', transition: 'transform 0.2s ease', cursor: 'pointer' }} onClick={onExploreDoctors}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--emerald-50)', color: 'var(--emerald-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Building2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>General Medicine</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--slate-500)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Preventive executive health checkups, chronic diabetes management, and primary internal medicine.
            </p>
            <span style={{ color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              View Physicians <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </section>

      {/* 4. Verified Specialists Preview */}
      <section style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem 5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Meet Our Specialists
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Book an appointment with verified consultants practicing at our campuses.
            </p>
          </div>
          <button onClick={onExploreDoctors} className="btn-secondary">
            View All Doctors ({doctors.length})
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {doctors.slice(0, 3).map((doc) => (
            <div key={doc.id} className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)' }}>{doc.user.name}</h4>
                    <div style={{ fontSize: '0.9rem', color: 'var(--primary-700)', fontWeight: 700, marginTop: '0.2rem' }}>
                      {doc.specialty}
                    </div>
                  </div>
                  <span className="badge badge-success">Verified</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1rem' }}>
                  {doc.qualification}
                </p>
                <div style={{ background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Consultation: </span>
                  <strong style={{ color: 'var(--slate-900)', fontSize: '1.05rem' }}>₹{doc.consultationFee}</strong>
                </div>
              </div>

              <button onClick={onExploreDoctors} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Calendar size={16} />
                Book Consultation
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
