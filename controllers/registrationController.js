const Registration = require('../models/Registration');
const Transaction =  require('./../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getUserRegistrations = catchAsync(async (req, res, next) => {
    const user = req.user;
    const allRegistrations = await Registration.find({createdBy : user._id});
    res.status(200).json({registrations : allRegistrations, status : 'success'});
})