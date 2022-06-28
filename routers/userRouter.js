const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const protect = require('../middlewares/protect');
const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();

// router.use(protect); //  protect all router which are comming after this middleware

router
  .route('/me')
  .get(protect, userController.getMe)
  .patch(userController.getMe, userController.updateUser);

router.patch('/updatePassword', protect, authController.updatePassword);

router
  .route('/')
  .get(protect, restrictTo('admin'), userController.getAllUsers)
  .post(protect, restrictTo('admin'), userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .put(protect, restrictTo('admin'), userController.updateUser)
  .delete(protect, restrictTo('admin'), userController.deleteUser);

module.exports = router;
