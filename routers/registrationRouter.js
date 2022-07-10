const transactionController = require("../controllers/transactionController");
const registrationController = require("../controllers/registrationController");
const protect = require("../middlewares/protect");
const restrictTo = require("../middlewares/restrictTo");
const express = require("express");

const router = express.Router();

router
  .route("/withdraw")
  .get(
    protect,
    restrictTo("admin"),
    registrationController.fetchAllWithdrawRequests
  );
router.route("/").get(protect, registrationController.getUserRegistrations);

router.route("/score/:id").get(protect, registrationController.getPlayerRank);
router
  .route("/score/:id/end")
  .get(protect, registrationController.contestEndStats);

router
  .route("/:id")
  .post(protect, transactionController.registerTournamentHandler)
  .get(protect, registrationController.getOneRegistration);

  router.route('/withdraw/complete-requests').post(protect,restrictTo('admin'), registrationController.updatePendingsToCompleted);
  


router
  .route("/withdraw/:id")
  .post(protect, registrationController.createWithdrawRequest)
  .put(
    protect,
    restrictTo("admin"),
    registrationController.updateWithdrawState
  );

module.exports = router;

// router.route('/withdraw-request').get(protect,)
