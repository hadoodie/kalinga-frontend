import crypto from 'crypto';
import response from '../utils/response.js';
import { getIo } from '../realtime/io.js';

const ingestPcrPayload = async (req, res, next) => {
  try {
    const edgeKey = req.headers['x-edge-key'];
    if (!process.env.EDGE_DEVICE_API_KEY || edgeKey !== process.env.EDGE_DEVICE_API_KEY) {
      return response.unauthorized(res, 'Unauthorized edge device.');
    }

    const { case_no, patient_uuid, reading } = req.body || {};

    if (!reading || typeof reading !== 'object') {
      return response.error(res, 'reading payload is required', 400);
    }

    const payload = {
      eventId: crypto.randomUUID(),
      caseNo: case_no || null,
      patientUuid: patient_uuid || null,
      reading: {
        time: reading.time || new Date().toISOString().slice(11, 16),
        temperature: reading.temperature ?? null,
        spo2: reading.spo2 ?? reading.oxygen_saturation ?? null,
        pulse: reading.pulse ?? reading.heart_rate ?? null,
        rr: reading.rr ?? reading.respiratory_rate ?? null,
        bp: reading.bp ?? reading.blood_pressure ?? null,
      },
      sensor: reading.sensor || 'GY-906 MLX90614',
      ingestedAt: new Date().toISOString(),
      source: 'edge',
    };

    const io = getIo();
    if (io) {
      io.emit('pcr:edge-vitals', payload);
      if (payload.caseNo) {
        io.to(`pcr:case:${payload.caseNo}`).emit('pcr:edge-vitals', payload);
      }
      if (payload.patientUuid) {
        io.to(`pcr:patient:${payload.patientUuid}`).emit('pcr:edge-vitals', payload);
      }
    }

    return response.success(res, payload, 'PCR payload ingested from edge device.', 202);
  } catch (error) {
    next(error);
  }
};

export default { ingestPcrPayload };
