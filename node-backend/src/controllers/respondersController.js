import respondersService from '../services/respondersService.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const result = await respondersService.getAll(req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

const getActive = async (req, res, next) => {
  try {
    const result = await respondersService.getActive();
    return response.success(res, result);
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const data = await respondersService.getStats();
    return response.success(res, data);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await respondersService.getById(req.params.id);
    if (!data) return response.notFound(res, 'Responder not found');
    return response.success(res, data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await respondersService.create(req.body);
    return response.created(res, data);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await respondersService.update(req.params.id, req.body);
    return response.success(res, data, 'Responder updated');
  } catch (err) { next(err); }
};

export default { getAll, getActive, getStats, getById, create, update };
