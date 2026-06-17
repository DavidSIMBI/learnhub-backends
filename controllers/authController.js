const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

async function register(req, res) {
  try {
    const { full_name, email, phone, password, role } = req.body;
    const selectedRole = role || 'student';

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    if (!['student', 'teacher'].includes(selectedRole)) {
      return res.status(400).json({ message: 'Only student or teacher accounts can self-register.' });
    }

    const existingUsers = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, phone || null, hashedPassword, selectedRole]
    );

    const users = await db.query(
      'SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const token = createToken(users[0]);
    return res.status(201).json({ message: 'Account created successfully.', token, user: users[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'This account is not active.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    delete user.password;
    const token = createToken(user);
    return res.json({ message: 'Login successful.', token, user });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
}

async function me(req, res) {
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

module.exports = {
  register,
  login,
  me
};
