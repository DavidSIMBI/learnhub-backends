const db = require('../config/db');

async function getStats(req, res) {
  try {
    const [users] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [courses] = await db.query('SELECT COUNT(*) AS total FROM courses');
    const [enrollments] = await db.query('SELECT COUNT(*) AS total FROM enrollments');
    const [submissions] = await db.query('SELECT COUNT(*) AS total FROM submissions');

    return res.json({
      users: users.total,
      courses: courses.total,
      enrollments: enrollments.total,
      submissions: submissions.total
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load statistics.', error: error.message });
  }
}

async function getUsers(req, res) {
  try {
    const users = await db.query(
      'SELECT id, full_name, email, phone, role, status, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load users.', error: error.message });
  }
}

async function getCourses(req, res) {
  try {
    const courses = await db.query(
      `SELECT c.*, u.full_name AS teacher_name, cat.name AS category_name
       FROM courses c
       JOIN users u ON u.id = c.teacher_id
       LEFT JOIN course_categories cat ON cat.id = c.category_id
       ORDER BY c.created_at DESC`
    );
    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load courses.', error: error.message });
  }
}

async function updateUserStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or inactive.' });
    }

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ message: 'User status updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update user status.', error: error.message });
  }
}

async function updateCourseStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or inactive.' });
    }

    await db.query('UPDATE courses SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ message: 'Course status updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update course status.', error: error.message });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await db.query('SELECT * FROM course_categories ORDER BY name');
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load categories.', error: error.message });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const result = await db.query(
      'INSERT INTO course_categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    return res.status(201).json({ message: 'Category created.', category_id: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: 'Could not create category.', error: error.message });
  }
}

async function updateCategory(req, res) {
  try {
    const { name, description, status } = req.body;
    await db.query(
      'UPDATE course_categories SET name = COALESCE(?, name), description = COALESCE(?, description), status = COALESCE(?, status) WHERE id = ?',
      [name || null, description || null, status || null, req.params.id]
    );
    return res.json({ message: 'Category updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update category.', error: error.message });
  }
}

module.exports = {
  getStats,
  getUsers,
  getCourses,
  updateUserStatus,
  updateCourseStatus,
  getCategories,
  createCategory,
  updateCategory
};
