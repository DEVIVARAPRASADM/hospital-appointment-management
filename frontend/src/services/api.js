const API_BASE = '/api/v1';

function getAuthHeader() {
  const token = localStorage.getItem('carepoint_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data.data;
}

export const api = {
  // Auth
  async login(email, password, role) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    return handleResponse(res);
  },

  async register(patientData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Hospitals & Branches
  async getHospitals() {
    const res = await fetch(`${API_BASE}/hospitals`);
    return handleResponse(res);
  },

  async getBranches(hospitalId) {
    const res = await fetch(`${API_BASE}/hospitals/${hospitalId}/branches`);
    return handleResponse(res);
  },

  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments`);
    return handleResponse(res);
  },

  // Doctors & Availability
  async getDoctors(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/doctors?${query}`);
    return handleResponse(res);
  },

  async getDoctorAvailability(doctorId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/availability?${query}`);
    return handleResponse(res);
  },

  async updateSessionDelay(sessionId, delayData) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/delay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(delayData),
    });
    return handleResponse(res);
  },

  // Appointments
  async bookAppointment(bookingData) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(bookingData),
    });
    return handleResponse(res);
  },

  async getMyAppointments() {
    const res = await fetch(`${API_BASE}/appointments/my`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async cancelAppointment(appointmentId, cancellationReason) {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ cancellationReason }),
    });
    return handleResponse(res);
  },

  // Reception Desk
  async getReceptionDashboard(branchId) {
    const query = branchId ? `?branchId=${branchId}` : '';
    const res = await fetch(`${API_BASE}/reception/dashboard${query}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async searchPatients(q) {
    const res = await fetch(`${API_BASE}/reception/patients/search?q=${encodeURIComponent(q)}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async registerWalkIn(walkInData) {
    const res = await fetch(`${API_BASE}/reception/visits/walk-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(walkInData),
    });
    return handleResponse(res);
  },

  async checkInAppointment(appointmentId) {
    const res = await fetch(`${API_BASE}/reception/visits/${appointmentId}/check-in`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getSessionQueue(sessionId) {
    const res = await fetch(`${API_BASE}/reception/sessions/${sessionId}/queue`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateVisitStatus(visitId, status) {
    const res = await fetch(`${API_BASE}/reception/visits/${visitId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async callNextPatient(sessionId) {
    const res = await fetch(`${API_BASE}/reception/sessions/${sessionId}/call-next`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Nurse Triage
  async getNurseQueue(branchId) {
    const query = branchId ? `?branchId=${branchId}` : '';
    const res = await fetch(`${API_BASE}/nurse/queue${query}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async recordTriage(visitId, triageData) {
    const res = await fetch(`${API_BASE}/nurse/visits/${visitId}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(triageData),
    });
    return handleResponse(res);
  },

  // Admin
  async getAdminDashboard() {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getAllStaff() {
    const res = await fetch(`${API_BASE}/admin/staff`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createStaff(staffData) {
    const res = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(staffData),
    });
    return handleResponse(res);
  },
};
