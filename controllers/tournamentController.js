const Tournament = require('../models/Tournament');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const filterObj = require('../utils/filterObj');

exports.getAllTournaments = catchAsync(async (req, res, next) => {
  const { limit, offset, status } = req.query;
  let _limit = 30, _offset = 0;
  if (!isNaN(limit)) {
    _limit = parseInt(limit)
  }
  if (!isNaN(offset)) {
    _offset = parseInt(offset)
  }
  let cond = {
    active: true
  }
  if (status) {
    cond = { ...cond, status }
  }
  const tournaments = await Tournament
    .find(cond)
    .limit(_limit)
    .skip(_offset)
    .sort({ created_on: -1 });

  res.status(200).json({
    status: 'success',
    tournaments,
  });
});

exports.createTournament = catchAsync(async (req, res, next) => {
  const newTournament = await Tournament.create({
    title: req.body.title,
    entry_fee: req.body.entry_fee,
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    streamers: req.body.streamers,
    prize_amount: req.body.prize_amount,
    sections: req.body.sections,
    created_by: req.user.id,
    isDynamic : req.body.isDynamic
  });

  if (!newTournament)
    return next(
      new AppError(`
      Can't create tournament due to invalid details, 400
      `)
    );

  res.status(200).json({
    status: 'success',
    tournament: newTournament,
  });
});

exports.updateTournament = catchAsync(async (req, res, next) => {

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'status', 'active');

  const updatedTournament = await Tournament.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    tournament: updatedTournament,
  });
});

exports.getTournamentDetails = catchAsync(async (req, res, next) => {
  const tournament = await Tournament.findOne({_id: req.params.id, active: true});

  if (!tournament)
    return next(
      new AppError(`No tournament found against id ${req.params.id}`, 404)
    );

  res.status(200).json({
    status: 'success',
    tournament,
  });
});

exports.deleteTournament = catchAsync(async (req, res, next) => {
  const tournament = await Tournament.findOne({_id: req.params.id, active: true});
  if (!tournament)
    return next(
      new AppError(`No tournament found against id ${req.params.id}`, 404)
    );
  //delete the tournament
  tournament.active = false;
  await tournament.save();
  res.status(200).json({
    status: 'success',
  });
});
