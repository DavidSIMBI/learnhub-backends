const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/:courseId', authenticateToken, authorizeRoles('student'), enrollmentController.enrollInCourse);
router.get('/my-courses', authenticateToken, authorizeRoles('student'), enrollmentController.getMyEnrolledCourses);
router.get('/course/:courseId', authenticateToken, authorizeRoles('teacher', 'admin'), enrollmentController.getStudentsInCourse);
router.put('/:id/progress', authenticateToken, enrollmentController.updateProgress);

module.exports = router;
