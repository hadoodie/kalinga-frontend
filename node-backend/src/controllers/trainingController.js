import trainingService from '../services/trainingService.js';
import response from '../utils/response.js';

const getProgress = async (req, res, next) => {
  try {
    const data = await trainingService.getProgress(req.dbUser.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

const updateProgress = async (req, res, next) => {
  try {
    const data = await trainingService.updateProgress(req.dbUser.id, req.params.courseId, req.body);
    return response.success(res, data, 'Progress updated');
  } catch (err) { next(err); }
};

const getCertifications = async (req, res, next) => {
  try {
    const data = await trainingService.getCertifications(req.dbUser.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

export default { getProgress, updateProgress, getCertifications };
