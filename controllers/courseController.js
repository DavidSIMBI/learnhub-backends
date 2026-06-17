const db = require('../config/db');

async function findCourse(id) {
  const courses = await db.query('SELECT * FROM courses WHERE id = ?', [id]);
  return courses[0];
}

function canManageCourse(user, course) {
  return user.role === 'admin' || (user.role === 'teacher' && course.teacher_id === user.id);
}

async function getCourses(req, res) {
  try {
    const { search = '', category = '', level = '' } = req.query;
    const params = [];
    let sql = `
      SELECT c.*, u.full_name AS teacher_name, cat.name AS category_name,
        COUNT(e.id) AS enrolled_students
      FROM courses c
      JOIN users u ON u.id = c.teacher_id
      LEFT JOIN course_categories cat ON cat.id = c.category_id
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
      WHERE c.status = 'active'
    `;

    if (search) {
      sql += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      sql += ' AND c.category_id = ?';
      params.push(category);
    }

    if (level) {
      sql += ' AND c.level = ?';
      params.push(level);
    }

    sql += ' GROUP BY c.id ORDER BY c.created_at DESC';
    const courses = await db.query(sql, params);
    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load courses.', error: error.message });
  }
}

async function getCourseById(req, res) {
  try {
    const courses = await db.query(
      `SELECT c.*, u.full_name AS teacher_name, cat.name AS category_name
       FROM courses c
       JOIN users u ON u.id = c.teacher_id
       LEFT JOIN course_categories cat ON cat.id = c.category_id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    return res.json(courses[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load course.', error: error.message });
  }
}

async function createCourse(req, res) {
  try {
    const { category_id, title, description, level, duration } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const result = await db.query(
      `INSERT INTO courses (teacher_id, category_id, title, description, level, duration, cover_image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, category_id || null, title, description, level || 'Beginner', duration || null, req.file ? req.file.path : null]
    );

    const course = await findCourse(result.insertId);
    return res.status(201).json({ message: 'Course created.', course });
  } catch (error) {
    return res.status(500).json({ message: 'Could not create course.', error: error.message });
  }
}

async function updateCourse(req, res) {
  try {
    const course = await findCourse(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only edit your own courses.' });
    }

    const { category_id, title, description, level, duration, status } = req.body;
    await db.query(
      `UPDATE courses
       SET category_id = ?, title = ?, description = ?, level = ?, duration = ?, status = ?, cover_image = COALESCE(?, cover_image)
       WHERE id = ?`,
      [
        category_id || null,
        title || course.title,
        description || course.description,
        level || course.level,
        duration || course.duration,
        status || course.status,
        req.file ? req.file.path : null,
        req.params.id
      ]
    );

    return res.json({ message: 'Course updated.', course: await findCourse(req.params.id) });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update course.', error: error.message });
  }
}

async function deleteCourse(req, res) {
  try {
    const course = await findCourse(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only delete your own courses.' });
    }

    await db.query('UPDATE courses SET status = ? WHERE id = ?', ['inactive', req.params.id]);
    return res.json({ message: 'Course deactivated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not delete course.', error: error.message });
  }
}

async function getMyCourses(req, res) {
  try {
    const courses = await db.query(
      `SELECT c.*, cat.name AS category_name, COUNT(e.id) AS enrolled_students
       FROM courses c
       LEFT JOIN course_categories cat ON cat.id = c.category_id
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
       WHERE c.teacher_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load teacher courses.', error: error.message });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await db.query(
      'SELECT * FROM course_categories WHERE status = ? ORDER BY name',
      ['active']
    );
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load categories.', error: error.message });
  }
}

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  getCategories,
  canManageCourse,
  findCourse
};
