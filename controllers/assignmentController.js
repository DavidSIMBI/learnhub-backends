const db = require('../config/db');
const { findCourse, canManageCourse } = require('./courseController');
const { canAccessCourse } = require('./lessonController');

async function findAssignment(id) {
  const assignments = await db.query('SELECT * FROM assignments WHERE id = ?', [id]);
  return assignments[0];
}

async function createAssignment(req, res) {
  try {
    const { course_id, title, instructions, due_date, total_marks } = req.body;
    if (!course_id || !title || !instructions) {
      return res.status(400).json({ message: 'Course, title, and instructions are required.' });
    }

    const course = await findCourse(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only create assignments for your own courses.' });
    }

    const result = await db.query(
      `INSERT INTO assignments (course_id, teacher_id, title, instructions, due_date, total_marks, attachment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [course_id, req.user.id, title, instructions, due_date || null, total_marks || 100, req.file ? req.file.path : null]
    );

    return res.status(201).json({ message: 'Assignment created.', assignment_id: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: 'Could not create assignment.', error: error.message });
  }
}

async function getAssignmentsByCourse(req, res) {
  try {
    const course = await findCourse(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (!(await canAccessCourse(req.user, course))) {
      return res.status(403).json({ message: 'You cannot view assignments for this course.' });
    }

    const assignments = await db.query(
      'SELECT * FROM assignments WHERE course_id = ? AND status = ? ORDER BY due_date ASC',
      [req.params.courseId, 'active']
    );
    return res.json(assignments);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load assignments.', error: error.message });
  }
}

async function getAssignmentById(req, res) {
  try {
    const assignment = await findAssignment(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const course = await findCourse(assignment.course_id);
    if (!(await canAccessCourse(req.user, course))) {
      return res.status(403).json({ message: 'You cannot view this assignment.' });
    }

    return res.json(assignment);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load assignment.', error: error.message });
  }
}

async function updateAssignment(req, res) {
  try {
    const assignment = await findAssignment(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const course = await findCourse(assignment.course_id);
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only edit assignments for your own courses.' });
    }

    const { title, instructions, due_date, total_marks, status } = req.body;
    await db.query(
      `UPDATE assignments
       SET title = ?, instructions = ?, due_date = ?, total_marks = ?, status = ?, attachment = COALESCE(?, attachment)
       WHERE id = ?`,
      [
        title || assignment.title,
        instructions || assignment.instructions,
        due_date || assignment.due_date,
        total_marks || assignment.total_marks,
        status || assignment.status,
        req.file ? req.file.path : null,
        req.params.id
      ]
    );

    return res.json({ message: 'Assignment updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update assignment.', error: error.message });
  }
}

async function deleteAssignment(req, res) {
  try {
    const assignment = await findAssignment(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const course = await findCourse(assignment.course_id);
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only delete assignments for your own courses.' });
    }

    await db.query('UPDATE assignments SET status = ? WHERE id = ?', ['inactive', req.params.id]);
    return res.json({ message: 'Assignment deactivated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not delete assignment.', error: error.message });
  }
}

module.exports = {
  createAssignment,
  getAssignmentsByCourse,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  findAssignment
};
