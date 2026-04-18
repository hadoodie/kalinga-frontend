import reportsService from '../services/reportsService.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const result = await reportsService.getAll(req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await reportsService.getById(req.params.id);
    if (!data) return response.notFound(res, 'Report not found');
    return response.success(res, data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await reportsService.create(req.body, req.dbUser.id);
    return response.created(res, data);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await reportsService.update(req.params.id, req.body);
    return response.success(res, data, 'Report updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await reportsService.remove(req.params.id);
    return response.success(res, null, 'Report deleted');
  } catch (err) { next(err); }
};

export default { getAll, getById, create, update, remove };
