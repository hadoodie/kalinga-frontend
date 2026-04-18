import notificationsService from '../services/notificationsService.js';
import response from '../utils/response.js';

const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationsService.getNotifications(req.dbUser.id, req.query);
    return response.paginated(res, result.data, result.pagination);
  } catch (err) { next(err); }
};

const getUnread = async (req, res, next) => {
  try {
    const result = await notificationsService.getUnreadNotifications(req.dbUser.id);
    return response.success(res, result);
  } catch (err) { next(err); }
};

const markAsRead = async (req, res, next) => {
  try {
    const data = await notificationsService.markAsRead(req.params.id, req.dbUser.id);
    return response.success(res, data, 'Notification marked as read');
  } catch (err) { next(err); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationsService.markAllAsRead(req.dbUser.id);
    return response.success(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};

const createNotification = async (req, res, next) => {
  try {
    const data = await notificationsService.createNotification(req.body);
    return response.created(res, data);
  } catch (err) { next(err); }
};

const deleteNotification = async (req, res, next) => {
  try {
    await notificationsService.deleteNotification(req.params.id, req.dbUser.id);
    return response.success(res, null, 'Notification deleted');
  } catch (err) { next(err); }
};

export default { getNotifications, getUnread, markAsRead, markAllAsRead, createNotification, deleteNotification };
