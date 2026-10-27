import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Activity, Heart, Thermometer, Wind, FileText, CheckCircle, RefreshCw } from 'lucide-react';

export default function NurseTriage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Triage Form fields
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [temperature, setTemperature] = useState('98.6');
  const [pulseRate, setPulseRate] = useState('72');
  const [oxygenSaturation, setOxygenSaturation] = useState('99');
  const [notes, setNotes] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getNurseQueue();
      setQueue(data.queue || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSelectVisit = (visit) => {
    setSelectedVisit(visit);
    setSuccessMsg('');
    setError('');

    // Pre-populate if prior record exists
    if (visit.triageRecords && visit.triageRecords.length > 0) {
      const tr = visit.triageRecords[0];
      setBloodPressure(tr.bloodPressure || '120/80');
      setTemperature(tr.temperature ? String(tr.temperature) : '98.6');
      setPulseRate(tr.pulseRate ? String(tr.pulseRate) : '72');
      setOxygenSaturation(tr.oxygenSaturation ? String(tr.oxygenSaturation) : '99');
      setNotes(tr.notes || '');
    } else {
      setBloodPressure('120/80');
      setTemperature('98.6');
      setPulseRate('72');
      setOxygenSaturation('99');
      setNotes('');
    }
  };

  const handleTriageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVisit) return;

    try {
      setSubmitting(true);
      setError('');
      await api.recordTriage(selectedVisit.id, {
        bloodPressure,
        temperature,
        pulseRate,
        oxygenSaturation,
        notes,
      });

      setSuccessMsg(`Triage recorded successfully for Token #${selectedVisit.tokenNumber}!`);
      loadQueue();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Nurse Clinical Triage Station
            </h2>
            <span className="badge badge-success">Vitals Intake</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Measure baseline vitals and record preliminary nursing observations before doctor consultation.
          </p>
        </div>

        <button onClick={loadQueue} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={15} />
          Refresh Triage Queue
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left: Triage Patient Queue */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '1rem' }}>
            Patients Awaiting Clinical Triage ({queue.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>Loading queue...</div>
          ) : queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>
              No patients waiting for triage right now.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
              {queue.map((v) => {
                const isSelected = selectedVisit?.id === v.id;
                const hasTriage = v.triageRecords && v.triageRecords.length > 0;

                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVisit(v)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--emerald-600)' : '1px solid var(--slate-200)',
                      background: isSelected ? 'var(--emerald-50)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-700)', fontFamily: 'var(--font-mono)' }}>
                          #{v.tokenNumber}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                          {v.patient.user.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                        Doctor: {v.session.doctor.user.name} ({v.session.doctor.specialty})
                      </div>
                    </div>

                    <div>
                      {hasTriage ? (
                        <span className="badge badge-success">Vitals Recorded</span>
                      ) : (
                        <span className="badge badge-warning">Pending Vitals</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Clinical Vitals Form */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
            Record Clinical Vitals
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '1.25rem' }}>
            {selectedVisit ? `Recording for ${selectedVisit.patient.user.name} (Token #${selectedVisit.tokenNumber})` : 'Select a patient from the queue to record vitals'}
          </p>

          {error && (
            <div style={{ padding: '0.75rem', background: 'var(--rose-50)', color: 'var(--rose-600)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '0.75rem', background: 'var(--emerald-50)', color: 'var(--emerald-700)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}

          {selectedVisit ? (
            <form onSubmit={handleTriageSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Activity size={15} color="var(--primary-600)" />
                    Blood Pressure (mmHg)
                  </label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. 120/80"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Thermometer size={15} color="var(--rose-500)" />
                    Body Temp (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="form-control"
                    placeholder="98.6"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Heart size={15} color="var(--rose-600)" />
                    Pulse Rate (bpm)
                  </label>
                  <input
                    type="number"
                    required
                    className="form-control"
                    placeholder="72"
                    value={pulseRate}
                    onChange={(e) => setPulseRate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Wind size={15} color="var(--teal-600)" />
                    Oxygen Saturation (SpO2 %)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="form-control"
                    placeholder="99"
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={15} color="var(--slate-500)" />
                  Nursing Assessment / Triage Notes
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Patient ambulatory, alert, denies acute chest pain..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-success"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}
              >
                {submitting ? 'Saving Observation...' : 'Submit Triage & Hand Off to Doctor'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-400)' }}>
              Click any waiting patient on the left to measure and record vitals.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
