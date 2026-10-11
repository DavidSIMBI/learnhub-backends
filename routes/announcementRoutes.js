const express = require('express');
const announcementController = require('../controllers/announcementController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/my-courses', authenticateToken, authorizeRoles('student'), announcementController.getStudentAnnouncements);
router.get('/teacher', authenticateToken, authorizeRoles('teacher', 'admin'), announcementController.getTeacherAnnouncements);
router.put('/:announcementId', authenticateToken, authorizeRoles('teacher', 'admin'), announcementController.updateAnnouncement);
router.delete('/:announcementId', authenticateToken, authorizeRoles('teacher', 'admin'), announcementController.deleteAnnouncement);

module.exports = router;
