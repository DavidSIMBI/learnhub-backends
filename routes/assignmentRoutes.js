const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { uploadMaterial } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('teacher', 'admin'), uploadMaterial.single('attachment'), assignmentController.createAssignment);
router.get('/course/:courseId', authenticateToken, assignmentController.getAssignmentsByCourse);
router.get('/:id', authenticateToken, assignmentController.getAssignmentById);
router.put('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), uploadMaterial.single('attachment'), assignmentController.updateAssignment);
router.delete('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), assignmentController.deleteAssignment);

module.exports = router;
