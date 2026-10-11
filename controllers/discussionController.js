const db = require('../config/db');
const { canManageCourse } = require('./courseController');

const TITLE_MAX_LENGTH = 150;
const DISCUSSION_MESSAGE_MAX_LENGTH = 5000;
const REPLY_MESSAGE_MAX_LENGTH = 2000;

function isPositiveIntegerId(value) {
  return typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function getRequestBody(body) {
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
}

function getTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function authorizeCourseAccess(req, res) {
  const courses = await db.query('SELECT * FROM courses WHERE id = ?', [req.params.courseId]);
  const course = courses[0];
  if (!course) {
    res.status(404).json({ message: 'Course not found.' });
    return null;
  }

  if (req.user.role === 'student') {
    const enrollments = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND status IN (?, ?)',
      [req.user.id, req.params.courseId, 'active', 'completed']
    );
    if (enrollments.length === 0) {
      res.status(403).json({ message: 'You must be enrolled in this course to access its discussions.' });
      return null;
    }
  } else if (!canManageCourse(req.user, course)) {
    res.status(403).json({ message: 'You do not have permission to access this course discussion.' });
    return null;
  }

  return course;
}

async function getDiscussions(req, res) {
  try {
    if (!isPositiveIntegerId(req.params.courseId)) {
      return res.status(400).json({ message: 'Course ID must be a positive integer.' });
    }
    if (!await authorizeCourseAccess(req, res)) return;
    const discussions = await db.query(
      `SELECT d.id, d.title, d.message, u.full_name AS author_name, d.created_at
       FROM discussions d
       JOIN users u ON u.id = d.user_id
       WHERE d.course_id = ?
       ORDER BY d.created_at DESC, d.id DESC`,
      [req.params.courseId]
    );
    return res.json(discussions);
  } catch (error) {
    console.error('Could not load course discussions:', error);
    return res.status(500).json({ message: 'Could not load course discussions.' });
  }
}

async function createDiscussion(req, res) {
  try {
    if (!isPositiveIntegerId(req.params.courseId)) {
      return res.status(400).json({ message: 'Course ID must be a positive integer.' });
    }
    const body = getRequestBody(req.body);
    const title = getTrimmedString(body.title);
    const message = getTrimmedString(body.message);
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    if (title.length > TITLE_MAX_LENGTH) {
      return res.status(400).json({ message: `Title must be no more than ${TITLE_MAX_LENGTH} characters.` });
    }
    if (!message) return res.status(400).json({ message: 'Message is required.' });
    if (message.length > DISCUSSION_MESSAGE_MAX_LENGTH) {
      return res.status(400).json({ message: `Message must be no more than ${DISCUSSION_MESSAGE_MAX_LENGTH} characters.` });
    }
    if (!await authorizeCourseAccess(req, res)) return;

    const result = await db.query(
      'INSERT INTO discussions (course_id, user_id, title, message) VALUES (?, ?, ?, ?)',
      [req.params.courseId, req.user.id, title, message]
    );
    const created = await db.query(
      `SELECT d.id, d.title, d.message, u.full_name AS author_name, d.created_at
       FROM discussions d JOIN users u ON u.id = d.user_id WHERE d.id = ?`,
      [result.insertId]
    );
    return res.status(201).json(created[0]);
  } catch (error) {
    console.error('Could not create discussion:', error);
    return res.status(500).json({ message: 'Could not create discussion.' });
  }
}

async function getDiscussion(req, res) {
  try {
    if (!isPositiveIntegerId(req.params.courseId)) {
      return res.status(400).json({ message: 'Course ID must be a positive integer.' });
    }
    if (!isPositiveIntegerId(req.params.threadId)) {
      return res.status(400).json({ message: 'Thread ID must be a positive integer.' });
    }
    if (!await authorizeCourseAccess(req, res)) return;
    const discussions = await db.query(
      `SELECT d.id, d.course_id, c.title AS course_title, d.title, d.message,
        u.full_name AS author_name, d.created_at
       FROM discussions d JOIN users u ON u.id = d.user_id
       JOIN courses c ON c.id = d.course_id
       WHERE d.id = ? AND d.course_id = ?`,
      [req.params.threadId, req.params.courseId]
    );
    if (discussions.length === 0) return res.status(404).json({ message: 'Discussion not found.' });

    const replies = await db.query(
      `SELECT r.id, r.message, u.full_name AS author_name, r.created_at
       FROM discussion_replies r JOIN users u ON u.id = r.user_id
       WHERE r.discussion_id = ? ORDER BY r.created_at ASC, r.id ASC`,
      [req.params.threadId]
    );
    return res.json({ ...discussions[0], replies });
  } catch (error) {
    console.error('Could not load discussion:', error);
    return res.status(500).json({ message: 'Could not load discussion.' });
  }
}

async function createReply(req, res) {
  try {
    if (!isPositiveIntegerId(req.params.courseId)) {
      return res.status(400).json({ message: 'Course ID must be a positive integer.' });
    }
    if (!isPositiveIntegerId(req.params.threadId)) {
      return res.status(400).json({ message: 'Thread ID must be a positive integer.' });
    }
    const body = getRequestBody(req.body);
    const message = getTrimmedString(body.message);
    if (!message) return res.status(400).json({ message: 'Message is required.' });
    if (message.length > REPLY_MESSAGE_MAX_LENGTH) {
      return res.status(400).json({ message: `Message must be no more than ${REPLY_MESSAGE_MAX_LENGTH} characters.` });
    }
    if (!await authorizeCourseAccess(req, res)) return;
    const discussions = await db.query(
      'SELECT id FROM discussions WHERE id = ? AND course_id = ?',
      [req.params.threadId, req.params.courseId]
    );
    if (discussions.length === 0) return res.status(404).json({ message: 'Discussion not found.' });

    const result = await db.query(
      'INSERT INTO discussion_replies (discussion_id, user_id, message) VALUES (?, ?, ?)',
      [req.params.threadId, req.user.id, message]
    );
    const created = await db.query(
      `SELECT r.id, r.message, u.full_name AS author_name, r.created_at
       FROM discussion_replies r JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
      [result.insertId]
    );
    return res.status(201).json(created[0]);
  } catch (error) {
    console.error('Could not create reply:', error);
    return res.status(500).json({ message: 'Could not create reply.' });
  }
}

module.exports = { getDiscussions, createDiscussion, getDiscussion, createReply };
