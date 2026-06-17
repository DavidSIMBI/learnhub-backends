const path = require('path');
const db = require('../config/db');
const { findCourse, canManageCourse } = require('./courseController');

async function studentIsEnrolled(studentId, courseId) {
  const rows = await db.query(
    'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = ?',
    [studentId, courseId, 'active']
  );
  return rows.length > 0;
}

async function canAccessCourse(user, course) {
  if (user.role === 'admin' || canManageCourse(user, course)) {
    return true;
  }

  if (user.role === 'student') {
    return studentIsEnrolled(user.id, course.id);
  }

  return false;
}

async function insertMaterials(lessonId, files = []) {
  for (const file of files) {
    await db.query(
      'INSERT INTO lesson_materials (lesson_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?)',
      [lessonId, file.originalname, file.path, path.extname(file.originalname).replace('.', '')]
    );
  }
}

async function createLesson(req, res) {
  try {
    const { course_id, title, content, lesson_order } = req.body;
    if (!course_id || !title) {
      return res.status(400).json({ message: 'Course and lesson title are required.' });
    }

    const course = await findCourse(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only add lessons to your own courses.' });
    }

    const result = await db.query(
      'INSERT INTO lessons (course_id, title, content, lesson_order) VALUES (?, ?, ?, ?)',
      [course_id, title, content || '', lesson_order || 1]
    );
    await insertMaterials(result.insertId, req.files);

    return res.status(201).json({ message: 'Lesson created.', lesson_id: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: 'Could not create lesson.', error: error.message });
  }
}

async function getLessonsByCourse(req, res) {
  try {
    const course = await findCourse(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (!(await canAccessCourse(req.user, course))) {
      return res.status(403).json({ message: 'Enroll in this course to view lessons.' });
    }

    const lessons = await db.query(
      'SELECT * FROM lessons WHERE course_id = ? AND status = ? ORDER BY lesson_order ASC',
      [req.params.courseId, 'active']
    );

    for (const lesson of lessons) {
      lesson.materials = await db.query('SELECT * FROM lesson_materials WHERE lesson_id = ?', [lesson.id]);
    }

    return res.json(lessons);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load lessons.', error: error.message });
  }
}

async function getLessonById(req, res) {
  try {
    const lessons = await db.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    if (lessons.length === 0) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    const course = await findCourse(lessons[0].course_id);
    if (!(await canAccessCourse(req.user, course))) {
      return res.status(403).json({ message: 'You cannot view this lesson.' });
    }

    lessons[0].materials = await db.query('SELECT * FROM lesson_materials WHERE lesson_id = ?', [req.params.id]);
    return res.json(lessons[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load lesson.', error: error.message });
  }
}

async function updateLesson(req, res) {
  try {
    const lessons = await db.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    if (lessons.length === 0) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    const course = await findCourse(lessons[0].course_id);
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only edit lessons for your own courses.' });
    }

    const { title, content, lesson_order, status } = req.body;
    await db.query(
      'UPDATE lessons SET title = ?, content = ?, lesson_order = ?, status = ? WHERE id = ?',
      [title || lessons[0].title, content || lessons[0].content, lesson_order || lessons[0].lesson_order, status || lessons[0].status, req.params.id]
    );
    await insertMaterials(req.params.id, req.files);

    return res.json({ message: 'Lesson updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update lesson.', error: error.message });
  }
}

async function deleteLesson(req, res) {
  try {
    const lessons = await db.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    if (lessons.length === 0) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    const course = await findCourse(lessons[0].course_id);
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only delete lessons for your own courses.' });
    }

    await db.query('UPDATE lessons SET status = ? WHERE id = ?', ['inactive', req.params.id]);
    return res.json({ message: 'Lesson deactivated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not delete lesson.', error: error.message });
  }
}

module.exports = {
  createLesson,
  getLessonsByCourse,
  getLessonById,
  updateLesson,
  deleteLesson,
  studentIsEnrolled,
  canAccessCourse
};
