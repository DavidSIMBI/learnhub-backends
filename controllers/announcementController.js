const db = require('../config/db');
const { canManageCourse, findCourse } = require('./courseController');

const TITLE_MAX_LENGTH = 150;
const MESSAGE_MAX_LENGTH = 5000;

function isPositiveIntegerId(value) {
  return typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function getBody(body) {
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
}

function getAnnouncementFields(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!title) return { error: 'Title is required.' };
  if (title.length > TITLE_MAX_LENGTH) {
    return { error: `Title must be no more than ${TITLE_MAX_LENGTH} characters.` };
  }
  if (!message) return { error: 'Message is required.' };
  if (message.length > MESSAGE_MAX_LENGTH) {
    return { error: `Message must be no more than ${MESSAGE_MAX_LENGTH} characters.` };
  }

  return { title, message };
}

async function findAnnouncement(announcementId) {
  const announcements = await db.query(
    `SELECT a.id, a.course_id, a.title, a.message, a.created_at,
      c.teacher_id, c.title AS course_name, u.full_name AS author_name
     FROM announcements a
     JOIN courses c ON c.id = a.course_id
     JOIN users u ON u.id = c.teacher_id
     WHERE a.id = ?`,
    [announcementId]
  );
  return announcements[0];
}

function announcementResponse(announcement) {
  return {
    id: announcement.id,
    course_id: announcement.course_id,
    course_name: announcement.course_name,
    title: announcement.title,
    message: announcement.message,
    author_name: announcement.author_name,
    created_at: announcement.created_at
  };
}

async function getStudentAnnouncements(req, res) {
  try {
    const announcements = await db.query(
      `SELECT a.id, a.course_id, c.title AS course_name, a.title, a.message,
        u.full_name AS author_name, a.created_at
       FROM announcements a
       JOIN courses c ON c.id = a.course_id
       JOIN users u ON u.id = c.teacher_id
       JOIN enrollments e ON e.course_id = c.id
       WHERE e.student_id = ? AND e.status = 'active'
       ORDER BY a.created_at DESC, a.id DESC`,
      [req.user.id]
    );
    return res.json(announcements);
  } catch (error) {
    console.error('Could not load student announcements:', error);
    return res.status(500).json({ message: 'Could not load course announcements.' });
  }
}

async function getTeacherAnnouncements(req, res) {
  try {
    const params = [];
    let sql = `
      SELECT a.id, a.course_id, c.title AS course_name, a.title, a.message,
        u.full_name AS author_name, a.created_at
      FROM announcements a
      JOIN courses c ON c.id = a.course_id
      JOIN users u ON u.id = c.teacher_id
    `;
    if (req.user.role !== 'admin') {
      sql += ' WHERE c.teacher_id = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY a.created_at DESC, a.id DESC';

    return res.json(await db.query(sql, params));
  } catch (error) {
    console.error('Could not load teacher announcements:', error);
    return res.status(500).json({ message: 'Could not load announcements.' });
  }
}

async function createAnnouncement(req, res) {
  try {
    if (!isPositiveIntegerId(req.params.courseId)) {
      return res.status(400).json({ message: 'Course ID must be a positive integer.' });
    }
    const fields = getAnnouncementFields(getBody(req.body));
    if (fields.error) return res.status(400).json({ message: fields.error });

    const course = await findCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only create announcements for courses you manage.' });
    }

    const result = await db.query(
      'INSERT INTO announcements (course_id, title, message) VALUES (?, ?, ?)',
      [req.params.courseId, fields.title, fields.message]
    );
    const created = await findAnnouncement(result.insertId);
    return res.status(201).json(announcementResponse(created));
  } catch (error) {
    console.error('Could not create announcement:', error);
    return res.status(500).json({ message: 'Could not create announcement.' });
  }
}

async function updateAnnouncement(req, res) {
  try {
    if (!isPositiveIntegerId(req.params.announcementId)) {
      return res.status(400).json({ message: 'Announcement ID must be a positive integer.' });
    }
    const fields = getAnnouncementFields(getBody(req.body));
    if (fields.error) return res.status(400).json({ message: fields.error });

    const announcement = await findAnnouncement(req.params.announcementId);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
    if (!canManageCourse(req.user, { teacher_id: announcement.teacher_id })) {
      return res.status(403).json({ message: 'You can only edit announcements for courses you manage.' });
    }

    await db.query(
      'UPDATE announcements SET title = ?, message = ? WHERE id = ?',
      [fields.title, fields.message, req.params.announcementId]
    );
    return res.json(announcementResponse({ ...announcement, ...fields }));
  } catch (error) {
    console.error('Could not update announcement:', error);
    return res.status(500).json({ message: 'Could not update announcement.' });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    if (!isPositiveIntegerId(req.params.announcementId)) {
      return res.status(400).json({ message: 'Announcement ID must be a positive integer.' });
    }
    const announcement = await findAnnouncement(req.params.announcementId);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
    if (!canManageCourse(req.user, { teacher_id: announcement.teacher_id })) {
      return res.status(403).json({ message: 'You can only delete announcements for courses you manage.' });
    }

    await db.query('DELETE FROM announcements WHERE id = ?', [req.params.announcementId]);
    return res.json({ message: 'Announcement deleted.' });
  } catch (error) {
    console.error('Could not delete announcement:', error);
    return res.status(500).json({ message: 'Could not delete announcement.' });
  }
}

module.exports = {
  getStudentAnnouncements,
  getTeacherAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
