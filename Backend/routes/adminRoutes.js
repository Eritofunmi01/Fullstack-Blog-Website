const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const {authenticate, isAdmin} = require('../middleware/auth'); 


router.use(authenticate, isAdmin);

// Dashboard
router.get('/stats', adminController.getStats);
router.get('/subscriptions', adminController.getSubscriptions);

// Users
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/suspend', adminController.suspendUser);

// Blogs
router.get('/blogs', adminController.listBlogs);
router.patch('/blogs/:id', adminController.updateBlogStatus);
router.delete('/blogs/:id', adminController.deleteBlog);

module.exports = router;
