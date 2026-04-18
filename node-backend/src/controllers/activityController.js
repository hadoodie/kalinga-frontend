import activityService from '../services/activityService.js';
import response from '../utils/response.js';

const getActivity = async (req, res, next) => {
  try {
    const result = await activityService.getActivity(req.dbUser.id, req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

export default { getActivity };
