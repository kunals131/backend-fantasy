const transactionController = require('../controllers/transactionController');
const registrationController = require('../controllers/registrationController');
const protect = require('../middlewares/protect');
const restrictTo = require('../middlewares/restrictTo');
const express = require('express')

const router = express.Router();

router.route('/:id').post(protect,transactionController.registerTournamentHandler);
router.get('/').get(protect,registrationController.getUserRegistrations);
module.exports = router;
