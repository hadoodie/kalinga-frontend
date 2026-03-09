import profileService from '../services/profileService.js';
import response from '../utils/response.js';

const getProfile = async (req, res, next) => {
  try {
    const data = await profileService.getProfile(req.dbUser.id);
    return response.success(res, data);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await profileService.updateProfile(req.dbUser.id, req.body);
    return response.success(res, data, 'Profile updated');
  } catch (err) { next(err); }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return response.error(res, 'No file uploaded', 400);
    }

    // Build the public URL from Supabase Storage
    const supabaseUrl = process.env.SUPABASE_URL;
    const avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${req.dbUser.id}/${req.file.filename}`;

    const data = await profileService.updateAvatar(req.dbUser.id, avatarUrl);
    return response.success(res, data, 'Avatar uploaded');
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    await profileService.changePassword(req.dbUser.id, current_password, new_password);
    return response.success(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};

export default { getProfile, updateProfile, uploadAvatar, changePassword };
