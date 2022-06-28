const User = require('../models/User');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({
    role: {$ne: "admin"},
    deleted: false
  });

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
      users,
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    gender: req.body.gender,
    medicalHistory: req.body.medicalHistory,
  });

  if (!newUser)
    return next(
      new AppError(`
      Can't create user due to invalid details, 400
      `)
    );

  res.status(200).json({
    status: 'success',
    user: newUser,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email', 'activated', 'verified');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
      user: updatedUser,
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findOne({_id: req.user.id, deleted: false, activated: true, verified: true});
  if (!user)
    return next(
      new AppError(`Invalid user details`, 401)
    );
  res.json(req.user)
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.find({_id: req.params.id, deleted: false});

  if (!user)
    return next(
      new AppError(`No User found against id ${req.params.id}`, 404)
    );

  res.status(200).json({
    status: 'success',
    user,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findOne({_id: req.params.id, deleted: false});
  if (!user)
    return next(
      new AppError(`No User found against id ${req.params.id}`, 404)
    );
  //delete the user
  await User.deleteOne({_id: req.params.id});
  res.status(200).json({
    status: 'success',
  });
});
