const db = require('../config/db');
const { findCourse, canManageCourse } = require('./courseController');
const { findAssignment } = require('./assignmentController');
const { studentIsEnrolled } = require('./lessonController');

async function submitAssignment(req, res) {
  try {
    const assignment = await findAssignment(req.params.assignmentId);
    if (!assignment || assignment.status !== 'active') {
      return res.status(404).json({ message: 'Active assignment not found.' });
    }

    const enrolled = await studentIsEnrolled(req.user.id, assignment.course_id);
    if (!enrolled) {
      return res.status(403).json({ message: 'Enroll in this course before submitting assignments.' });
    }

    const existing = await db.query(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [req.params.assignmentId, req.user.id]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE submissions
         SET file_path = COALESCE(?, file_path), comments = ?, status = 'submitted', submitted_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [req.file ? req.file.path : null, req.body.comments || null, existing[0].id]
      );
      return res.json({ message: 'Submission updated.', submission_id: existing[0].id });
    }

    const result = await db.query(
      'INSERT INTO submissions (assignment_id, student_id, file_path, comments) VALUES (?, ?, ?, ?)',
      [req.params.assignmentId, req.user.id, req.file ? req.file.path : null, req.body.comments || null]
    );

    return res.status(201).json({ message: 'Assignment submitted.', submission_id: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: 'Could not submit assignment.', error: error.message });
  }
}

async function getMySubmissions(req, res) {
  try {
    const submissions = await db.query(
      `SELECT s.*, a.title AS assignment_title, a.total_marks, c.title AS course_title
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN courses c ON c.id = a.course_id
       WHERE s.student_id = ?
       ORDER BY s.submitted_at DESC`,
      [req.user.id]
    );
    return res.json(submissions);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load submissions.', error: error.message });
  }
}

async function getSubmissionsForAssignment(req, res) {
  try {
    const assignment = await findAssignment(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const course = await findCourse(assignment.course_id);
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only view submissions for your own courses.' });
    }

    const submissions = await db.query(
      `SELECT s.*, u.full_name AS student_name, u.email AS student_email
       FROM submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.assignment_id = ?
       ORDER BY s.submitted_at DESC`,
      [req.params.assignmentId]
    );
    return res.json(submissions);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load assignment submissions.', error: error.message });
  }
}

async function gradeSubmission(req, res) {
  try {
    const { marks_awarded, feedback } = req.body;
    if (marks_awarded === undefined) {
      return res.status(400).json({ message: 'Marks awarded is required.' });
    }

    const submissions = await db.query('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const assignment = await findAssignment(submissions[0].assignment_id);
    const course = await findCourse(assignment.course_id);
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ message: 'You can only grade submissions for your own courses.' });
    }

    await db.query(
      `UPDATE submissions
       SET marks_awarded = ?, feedback = ?, status = 'graded', graded_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [marks_awarded, feedback || null, req.params.id]
    );

    return res.json({ message: 'Submission graded.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not grade submission.', error: error.message });
  }
}

module.exports = {
  submitAssignment,
  getMySubmissions,
  getSubmissionsForAssignment,
  gradeSubmission
};
