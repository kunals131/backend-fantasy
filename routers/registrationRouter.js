const transactionController = require('../controllers/transactionController');
const registrationController = require('../controllers/registrationController');
const protect = require('../middlewares/protect');
const restrictTo = require('../middlewares/restrictTo');
const express = require('express')

const router = express.Router();

router.route('/:id').post(protect,transactionController.registerTournamentHandler).get(protect,registrationController.getOneRegistration);
router.route('/').get(protect,registrationController.getUserRegistrations);
module.exports = router;
