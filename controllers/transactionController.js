const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Tournament = require('./../models/Tournament');
const convertUsdToSol = require('../utils/convertUsdToSol');
const Registration = require('../models/Registration');
const Transaction =  require('./../models/Transaction');
const User = require('../models/User');



exports.registerTournamentHandler = catchAsync(async (req, res, next) => {
    const user = req.user;
    const {id} = req.params;
    const {team, referenceId} = req.body;

    if (!team || !referenceId) {
        return next(
            new AppError(`Team and reference details are missing`, 404)
        )
    }
    const tournamentFound = await Tournament.findById(id);
    if (!tournamentFound) {
        return next(
            new AppError(`Tournament with id ${id} not found`, 404)
        );
    }
    const IfRegistrationExists = await Registration.findOne({createdBy : user._id,tournamentId : id }).exec();

    if (IfRegistrationExists) {
        return next(new AppError(`You are already registered, cannot register multiple times`));
    }
    const userBalance = user.balance;
    const tournamentCostInSol = parseFloat(await convertUsdToSol(tournamentFound.entry_fee));

    if (userBalance<tournamentCostInSol) {
        return next(
            new AppError(`Insufficient Funds, Please add funds to your Daily Fantasy Wallet`, 400)
        )
    }
    const newTransaction = new Transaction({
        createdBy : user._id,
        mode : 'WALLET',
        amountInSol : tournamentCostInSol,
        type : 'FROMWALLET',
        referenceId : referenceId,
        status  : 'completed',
        for : tournamentFound._id,
        amountInUsd : tournamentFound.entry_fee
    });

    const generatedTransaction =await newTransaction.save();

    const newRegistration = new Registration({
        createdBy : user._id,
        team : team,
        transactionId : generatedTransaction._id,
        tournamentId : tournamentFound._id
    });

    const generatedRegistration = await newRegistration.save();

    const userDocument = await User.findByIdAndUpdate(user._id, {balance : user.balance-tournamentCostInSol}, {new : true});
    

    res.status(200).json({
        transaction : generatedTransaction,
        registration : generatedRegistration,
        updatedBalance : userDocument.balance,
        status : 'success'
    });
 
});

exports.getUsersTransactionsHandler = catchAsync(async (req, res, next) => {
    const user = req.user;
    const allTransactions = await Transaction.find({createdBy : user._id}).populate('for');
    res.status(200).json({transactions : allTransactions, status : 'success'});
})