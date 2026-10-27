const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

describe('CarePoint Hospital API Integration Tests', () => {
  let patientToken;
  let receptionistToken;
  let doctorToken;
  let adminToken;
  let doctorRao;
  let availableSlot;
  let createdAppointmentId;
  let activeSession;

  before(async () => {
    // 1. Login Patient
    const resPat = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'patient@carepoint.com', password: 'Password@123' });
    expect(resPat.statusCode).to.equal(200);
    patientToken = resPat.body.data.token;

    // 2. Login Receptionist
    const resRec = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reception@carepoint.com', password: 'Password@123' });
    expect(resRec.statusCode).to.equal(200);
    receptionistToken = resRec.body.data.token;

    // 3. Login Doctor
    const resDoc = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doctor.rao@carepoint.com', password: 'Password@123' });
    expect(resDoc.statusCode).to.equal(200);
    doctorToken = resDoc.body.data.token;

    // 4. Login Admin
    const resAdm = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@carepoint.com', password: 'Password@123' });
    expect(resAdm.statusCode).to.equal(200);
    adminToken = resAdm.body.data.token;

    // Fetch doctor Rao and one open slot
    doctorRao = await prisma.doctor.findFirst({
      where: { specialty: 'Cardiology' },
      include: { user: true },
    });

    activeSession = await prisma.doctorSession.findFirst({
      where: { doctorId: doctorRao.id, status: 'ACTIVE' },
    });

    availableSlot = await prisma.availability.findFirst({
      where: {
        doctorId: doctorRao.id,
        status: 'OPEN',
        startTime: { gt: new Date() },
        appointments: { none: { status: { not: 'CANCELLED' } } },
      },
      orderBy: { startTime: 'asc' },
    });
  });

  // Test 1: Authentication & RBAC
  it('should reject unauthenticated access to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/v1/appointments/my');
    expect(res.statusCode).to.equal(401);
  });

  it('should reject unauthorized role access with 403 (Patient accessing reception dashboard)', async () => {
    const res = await request(app)
      .get('/api/v1/reception/dashboard')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).to.equal(403);
  });

  // Test 2: Hospital Discovery
  it('should retrieve list of active hospitals with branches and locations', async () => {
    const res = await request(app).get('/api/v1/hospitals');
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.hospitals.length).to.be.greaterThan(0);
    expect(res.body.data.hospitals[0].branches.length).to.be.greaterThan(0);
  });

  // Test 3: Doctor Discovery & Availability
  it('should search doctors and return their upcoming availability slots', async () => {
    const res = await request(app).get(`/api/v1/doctors/${doctorRao.id}/availability`);
    expect(res.statusCode).to.equal(200);
    expect(Array.isArray(res.body.data.slots)).to.equal(true);
  });

  // Test 4: Booking & Concurrency Protection (Prevent Double Booking)
  it('should book an appointment slot and prevent concurrent double-booking of the same slot with 409', async () => {
    expect(availableSlot).to.exist;

    // First booking attempt -> Success
    const res1 = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        availabilityId: availableSlot.id,
        reason: 'Severe migraine consultation',
      });
    expect(res1.statusCode).to.equal(201);
    expect(res1.body.data.appointment.bookingReference).to.exist;
    createdAppointmentId = res1.body.data.appointment.id;

    // Second booking attempt on same slot -> Must return 409 Conflict
    const res2 = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        availabilityId: availableSlot.id,
        reason: 'Another patient trying same slot',
      });
    expect(res2.statusCode).to.equal(409);
    expect(res2.body.message).to.include('already been booked');
  });

  // Test 5: Receptionist Operations - Check-in & Token Allocation
  it('should allow receptionist to check in the appointment and allocate a unique token', async () => {
    const res = await request(app)
      .post(`/api/v1/reception/visits/${createdAppointmentId}/check-in`)
      .set('Authorization', `Bearer ${receptionistToken}`);

    expect(res.statusCode).to.equal(201);
    expect(res.body.data.visit.tokenNumber).to.be.greaterThan(0);
    expect(res.body.data.visit.status).to.equal('WAITING');

    // Duplicate check-in must fail with 409
    const dupRes = await request(app)
      .post(`/api/v1/reception/visits/${createdAppointmentId}/check-in`)
      .set('Authorization', `Bearer ${receptionistToken}`);
    expect(dupRes.statusCode).to.equal(409);
  });

  // Test 6: Walk-in Registration
  it('should register walk-in patient directly into the active session queue', async () => {
    const res = await request(app)
      .post('/api/v1/reception/visits/walk-in')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        sessionId: activeSession.id,
        newPatientData: {
          name: 'Walkin Visitor',
          phone: '+91 91234 56789',
          gender: 'MALE',
        },
      });

    expect(res.statusCode).to.equal(201);
    expect(res.body.data.visit.visitType).to.equal('WALK_IN');
    expect(res.body.data.visit.tokenNumber).to.be.greaterThan(0);
  });

  // Test 7: Doctor Delay Notice
  it('should allow updating doctor session delay notice with non-negative minutes', async () => {
    const res = await request(app)
      .patch(`/api/v1/sessions/${activeSession.id}/delay`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        delayMinutes: 20,
        delayReason: 'Traffic congestion on bridge',
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body.data.session.delayMinutes).to.equal(20);
    expect(res.body.data.session.delayReason).to.equal('Traffic congestion on bridge');
  });

  // Test 8: Admin Dashboard Statistics
  it('should return live authoritative metrics on admin dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body.data.hospitals).to.be.at.least(1);
    expect(res.body.data.appointments.total).to.be.at.least(1);
  });
});
