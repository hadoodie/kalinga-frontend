import triageService from '../services/triageService.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const result = await triageService.getTriageByHospital(req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await triageService.getTriageByHospitalId(req.params.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

const createCase = async (req, res, next) => {
  try {
    const data = await triageService.createTriageCase(req.body);
    return response.created(res, data);
  } catch (err) { next(err); }
};

const updateCase = async (req, res, next) => {
  try {
    const data = await triageService.updateTriageCase(req.params.id, req.body);
    return response.success(res, data, 'Triage case updated');
  } catch (err) { next(err); }
};

const getPatients = async (req, res, next) => {
  try {
    const result = await triageService.getTriagePatients(req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

const addPatient = async (req, res, next) => {
  try {
    const data = await triageService.createTriageCase(req.body);
    return response.created(res, data, 'Patient added to triage');
  } catch (err) { next(err); }
};

const updatePatient = async (req, res, next) => {
  try {
    const data = await triageService.updateTriageCase(req.params.id, req.body);
    return response.success(res, data, 'Patient triage updated');
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const data = await triageService.getTriageStats();
    return response.success(res, data);
  } catch (err) { next(err); }
};

export default { getAll, getById, createCase, updateCase, getPatients, addPatient, updatePatient, getStats };
