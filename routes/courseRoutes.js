const express = require('express');
const courseController = require('../controllers/courseController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { uploadMaterial } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/categories', courseController.getCategories);
router.get('/', courseController.getCourses);
router.get('/teacher/my-courses', authenticateToken, authorizeRoles('teacher'), courseController.getMyCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', authenticateToken, authorizeRoles('teacher'), uploadMaterial.single('cover_image'), courseController.createCourse);
router.put('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), uploadMaterial.single('cover_image'), courseController.updateCourse);
router.delete('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), courseController.deleteCourse);

module.exports = router;
