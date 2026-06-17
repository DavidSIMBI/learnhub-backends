const express = require('express');
const submissionController = require('../controllers/submissionController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { uploadSubmission } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/:assignmentId', authenticateToken, authorizeRoles('student'), uploadSubmission.single('submission'), submissionController.submitAssignment);
router.get('/my-submissions', authenticateToken, authorizeRoles('student'), submissionController.getMySubmissions);
router.get('/assignment/:assignmentId', authenticateToken, authorizeRoles('teacher', 'admin'), submissionController.getSubmissionsForAssignment);
router.put('/:id/grade', authenticateToken, authorizeRoles('teacher', 'admin'), submissionController.gradeSubmission);

module.exports = router;
