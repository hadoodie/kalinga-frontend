import hospitalsService from '../services/hospitalsService.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const result = await hospitalsService.getAll(req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await hospitalsService.getById(req.params.id);
    if (!data) return response.notFound(res, 'Hospital not found');
    return response.success(res, data);
  } catch (err) { next(err); }
};

const getPatientDistribution = async (req, res, next) => {
  try {
    const data = await hospitalsService.getPatientDistribution();
    return response.success(res, data);
  } catch (err) { next(err); }
};

const getHospitalPatients = async (req, res, next) => {
  try {
    const result = await hospitalsService.getHospitalPatients(req.params.id, req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

export default { getAll, getById, getPatientDistribution, getHospitalPatients };
