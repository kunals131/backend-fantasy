const express = require('express');
const transactionsController = require('../controllers/transactionController');
const protect = require('../middlewares/protect');
const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();

router
  .route('/')
  .get(protect,transactionsController.getUsersTransactionsHandler);


router.route('/add-wallet')
.get(transactionsController.getAccountInformationHandler)
.post(transactionsController.addSolToWalletHandler)

router.route('/create')
.post(protect, transactionsController.createCustomTransactionToWallet);

module.exports = router;
