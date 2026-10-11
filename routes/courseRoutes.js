const express = require('express');
const courseController = require('../controllers/courseController');
const discussionController = require('../controllers/discussionController');
const announcementController = require('../controllers/announcementController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { uploadMaterial } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/categories', courseController.getCategories);
router.get('/', courseController.getCourses);
router.get('/teacher/my-courses', authenticateToken, authorizeRoles('teacher'), courseController.getMyCourses);
router.get('/:courseId/discussions', authenticateToken, discussionController.getDiscussions);
router.post('/:courseId/discussions', authenticateToken, discussionController.createDiscussion);
router.get('/:courseId/discussions/:threadId', authenticateToken, discussionController.getDiscussion);
router.post('/:courseId/discussions/:threadId/replies', authenticateToken, discussionController.createReply);
router.post('/:courseId/announcements', authenticateToken, authorizeRoles('teacher', 'admin'), announcementController.createAnnouncement);
router.get('/:id', courseController.getCourseById);
router.post('/', authenticateToken, authorizeRoles('teacher'), uploadMaterial.single('cover_image'), courseController.createCourse);
router.put('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), uploadMaterial.single('cover_image'), courseController.updateCourse);
router.delete('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), courseController.deleteCourse);

module.exports = router;
