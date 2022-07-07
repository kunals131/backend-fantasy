const Registration = require('../models/Registration');
const Transaction =  require('./../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getUserRegistrations = catchAsync(async (req, res, next) => {
    const user = req.user;
    const allRegistrations = await Registration.find({createdBy : user._id});
    res.status(200).json({registrations : allRegistrations, status : 'success'});
})

exports.getOneRegistration = catchAsync(async(req,res,next)=>{
    const user = req.user;
    const {id} = req.params;
    const foundRegistration = await Registration.findOne({tournamentId : id, createdBy : user._id}).populate('tournamentId');
    if (!foundRegistration) return new next(new AppError(`Registration with ${id} was not found!`, 404));

    return res.json(foundRegistration);
})