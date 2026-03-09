import systemService from '../services/systemService.js';
import response from '../utils/response.js';

const getStatus = async (req, res, next) => {
  try {
    const data = await systemService.getSystemStatus();
    return response.success(res, data);
  } catch (err) { next(err); }
};

export default { getStatus };
