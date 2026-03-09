import locationService from '../services/locationService.js';
import response from '../utils/response.js';

const getCurrentLocation = async (req, res, next) => {
  try {
    const data = await locationService.getCurrentLocation(req.dbUser.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

const updateLocation = async (req, res, next) => {
  try {
    const data = await locationService.upsertLocation(req.dbUser.id, req.body);
    return response.success(res, data, 'Location updated');
  } catch (err) { next(err); }
};

const getAreas = async (req, res, next) => {
  try {
    const data = await locationService.getAreas(req.query);
    return response.success(res, data);
  } catch (err) { next(err); }
};

export default { getCurrentLocation, updateLocation, getAreas };
