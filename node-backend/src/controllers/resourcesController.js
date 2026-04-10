import resourcesService from '../services/resourcesService.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const result = await resourcesService.getAll(req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

const getSummary = async (req, res, next) => {
  try {
    const data = await resourcesService.getSummary();
    return response.success(res, data);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await resourcesService.getById(req.params.id);
    if (!data) return response.notFound(res, 'Resource not found');
    return response.success(res, data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await resourcesService.create(req.body);
    return response.created(res, data);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await resourcesService.update(req.params.id, req.body);
    return response.success(res, data, 'Resource updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await resourcesService.remove(req.params.id);
    return response.success(res, null, 'Resource deleted');
  } catch (err) { next(err); }
};

export default { getAll, getSummary, getById, create, update, remove };
