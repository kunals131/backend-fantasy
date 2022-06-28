const express = require('express');
const tournamentController = require('../controllers/tournamentController');
const protect = require('../middlewares/protect');
const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();

router
  .route('/')
  .get(tournamentController.getAllTournaments)
  .post(protect, restrictTo('admin'), tournamentController.createTournament);

router
  .route('/:id')
  .get(tournamentController.getTournamentDetails)
  .put(protect, tournamentController.updateTournament)
  .delete(protect, restrictTo('admin'), tournamentController.deleteTournament);

module.exports = router;
