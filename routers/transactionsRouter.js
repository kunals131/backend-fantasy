const express = require('express');
const transactionsController = require('../controllers/transactionController');
const protect = require('../middlewares/protect');
const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();

router
  .route('/')
  .get(protect,transactionsController.getUsersTransactionsHandler);
  

module.exports = router;
