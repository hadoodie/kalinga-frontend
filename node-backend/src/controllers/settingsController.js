import settingsService from '../services/settingsService.js';
import response from '../utils/response.js';

const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getSettings(req.dbUser.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const data = await settingsService.updateSettings(req.dbUser.id, req.body);
    return response.success(res, data, 'Settings updated');
  } catch (err) { next(err); }
};

export default { getSettings, updateSettings };
