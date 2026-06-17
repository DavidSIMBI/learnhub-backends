const db = require('../config/db');

async function getProfile(req, res) {
  try {
    const users = await db.query(
      'SELECT id, full_name, email, phone, role, status, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json(users[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load profile.', error: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { full_name, phone } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    await db.query('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', [full_name, phone || null, req.user.id]);
    return getProfile(req, res);
  } catch (error) {
    return res.status(500).json({ message: 'Could not update profile.', error: error.message });
  }
}

module.exports = {
  getProfile,
  updateProfile
};
