import searchService from '../services/searchService.js';
import response from '../utils/response.js';

const globalSearch = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return response.success(res, { hospitals: [], incidents: [], responders: [], reports: [] });
    }
    const data = await searchService.globalSearch(q, req.dbUser?.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

export default { globalSearch };
