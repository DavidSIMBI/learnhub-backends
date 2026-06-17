const db = require('../config/db');
const { findCourse, canManageCourse } = require('./courseController');

async function enrollInCourse(req, res) {
  try {
    const course = await findCourse(req.params.courseId);
    if (!course || course.status !== 'active') {
      return res.status(404).json({ message: 'Active course not found.' });
    }

    const existing = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, req.params.courseId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'You are already enrolled in this course.' });
    }

    const result = await db.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [req.user.id, req.params.courseId]
    );

    return res.status(201).json({ message: 'Enrollment successful.', enrollment_id: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: 'Could not enroll in course.', error: error.message });
  }
}

async function getMyEnrolledCourses(req, res) {
  try {
    const courses = await db.query(
      `SELECT e.id AS enrollment_id, e.progress_percentage, e.status AS enrollment_status,
        c.*, u.full_name AS teacher_name, cat.name AS category_name
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = c.teacher_id
       LEFT JOIN course_categories cat ON cat.id = c.category_id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );
    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load enrolled courses.', error: error.message });
  }
}

async function getStudentsInCourse(req, res) {
  try {
    const course = await findCourse(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only view students in your own courses.' });
    }

    const students = await db.query(
      `SELECT e.id AS enrollment_id, e.progress_percentage, e.status AS enrollment_status,
        u.id, u.full_name, u.email, u.phone, e.enrolled_at
       FROM enrollments e
       JOIN users u ON u.id = e.student_id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC`,
      [req.params.courseId]
    );

    return res.json(students);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load enrolled students.', error: error.message });
  }
}

async function updateProgress(req, res) {
  try {
    const { progress_percentage } = req.body;
    const progress = Number(progress_percentage);

    if (Number.isNaN(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be a number from 0 to 100.' });
    }

    const enrollments = await db.query('SELECT * FROM enrollments WHERE id = ?', [req.params.id]);
    if (enrollments.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found.' });
    }

    const enrollment = enrollments[0];
    const course = await findCourse(enrollment.course_id);
    const isStudentOwner = req.user.role === 'student' && enrollment.student_id === req.user.id;

    if (!isStudentOwner && !canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You cannot update this progress record.' });
    }

    await db.query('UPDATE enrollments SET progress_percentage = ? WHERE id = ?', [progress, req.params.id]);
    return res.json({ message: 'Progress updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update progress.', error: error.message });
  }
}

module.exports = {
  enrollInCourse,
  getMyEnrolledCourses,
  getStudentsInCourse,
  updateProgress
};
