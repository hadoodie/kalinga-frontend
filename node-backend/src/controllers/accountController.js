import accountService from '../services/accountService.js';
import response from '../utils/response.js';

const getStatus = async (req, res, next) => {
  try {
    const data = await accountService.getStatus(req.dbUser.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

const verify = async (req, res, next) => {
  try {
    // Admin/DOH Officer can verify any user; otherwise self only
    const targetId = req.body.user_id || req.dbUser.id;
    const data = await accountService.verifyAccount(targetId);
    return response.success(res, data, 'Account verified');
  } catch (err) { next(err); }
};

const deactivate = async (req, res, next) => {
  try {
    const targetId = req.body.user_id || req.dbUser.id;
    const data = await accountService.deactivateAccount(targetId, req.body.reason);
    return response.success(res, data, 'Account deactivated');
  } catch (err) { next(err); }
};

export default { getStatus, verify, deactivate };
