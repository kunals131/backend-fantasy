const Registration = require('../models/Registration');
const Transaction =  require('./../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const axios = require('axios');
const { setRandomFallback } = require('bcryptjs');
const WithdrawRequest  = require('../models/WithdrawRequest');

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

exports.getPlayerRank = catchAsync(async(req,res,next)=>{
    const user = req.user;
    const {id} = req.params;
    const foundRegistration = await Registration.findOne({tournamentId : id, createdBy : user._id}).populate('tournamentId');

    if (!foundRegistration) return new next(new AppError(`Registration with ${id} was not found!`, 404));
    if (foundRegistration.tournamentId.status==='open') {
        return next(new AppError('Contest has not started yet', 405));
    }
    if (foundRegistration.tournamentId.status==='closed') {
        return res.json({
            status : false
        })
    }

    const scores = {};
    for(streamer of foundRegistration.tournamentId.streamers)  {
        const result = await axios.get(`http://localhost:8080/player/${streamer.id}`);
        scores[result.data.playerId] = result.data;
    }
    const Allregistrations = await Registration.find({tournamentId : id});

    for(reg of Allregistrations) {
        let totalKills = 0;
        let totalWins = 0;
        let totalDamage = 0;
        let totalScore =0;
        for(player of reg.team) {
            totalKills+=scores[player.id].kills;
            totalWins+=scores[player.id].wins;
            totalDamage+=scores[player.id].damage;
          

        }
        totalScore = totalKills*10 + totalWins*100 + totalDamage*0.1;
        reg.kills = totalKills;
        reg.damage = totalDamage;
        reg.wins = totalWins;
        reg.score = totalScore;
        const result = await reg.save();
    }
    

    const sortedRegistrations = await Registration.find({tournamentId : id}).sort({score : -1});
    const rank = sortedRegistrations.map(r=>r.id).indexOf(foundRegistration.id);
    
    return res.json({
        rank : rank+1,
        outOf : sortedRegistrations.length,
        kills : sortedRegistrations[rank].kills,
        damage : sortedRegistrations[rank].damage,
        wins : sortedRegistrations[rank].wins,
        score : sortedRegistrations[rank].score,
        status : foundRegistration.tournamentId.status!=='closed'
    });

})



exports.contestEndStats = catchAsync(async(req,res,next)=>{
    const user = req.user;
    const {id} = req.params;
    const foundRegistration = await Registration.findOne({tournamentId : id, createdBy : user._id}).populate('tournamentId');

    if (!foundRegistration) return new next(new AppError(`Registration with ${id} was not found!`, 404));
    if (foundRegistration.tournamentId.status==='open') {
        return next(new AppError('Contest has not started yet'));
    }
    if (foundRegistration.tournamentId.status==='in_progress') {
        return next(new AppError('Contest is still going on!',405));
    }

    const scores = {};
    for(streamer of foundRegistration.tournamentId.streamers)  {
        const result = await axios.get(`http://localhost:8080/player/${streamer.id}/end`);
        scores[result.data.playerId] = result.data;
    }
    const Allregistrations = await Registration.find({tournamentId : id});

    for(reg of Allregistrations) {
        let totalKills = 0;
        let totalWins = 0;
        let totalDamage = 0;
        let totalScore =0;
        for(player of reg.team) {
            totalKills+=scores[player.id].kills;
            totalWins+=scores[player.id].wins;
            totalDamage+=scores[player.id].damage;
          

        }
        totalScore = totalKills*10 + totalWins*100 + totalDamage*0.1;
        reg.kills = totalKills;
        reg.damage = totalDamage;
        reg.wins = totalWins;
        reg.score = totalScore;
        reg.prize = 0.9;
        const result = await reg.save();
    }    

    const sortedRegistrations = await Registration.find({tournamentId : id}).sort({score : -1});
    const rank = sortedRegistrations.map(r=>r.id).indexOf(foundRegistration.id);

    //prize calculation : 
    //constact prizze for now
    const prizeWon = 0.9;
    foundRegistration.prizeWon = rank<=2?prizeWon:0;
    const updatedFoundreg = await foundRegistration.save();
      
    return res.json({
        rank : rank+1,
        outOf : sortedRegistrations.length,
        kills : sortedRegistrations[rank].kills,
        damage : sortedRegistrations[rank].damage,
        wins : sortedRegistrations[rank].wins,
        score : sortedRegistrations[rank].score,
        prize : rank<=2?prizeWon:0
    });
})

exports.createWithdrawRequest = catchAsync(async(req,res,next)=>{
    const user =req.user;
    const {id} =req.params;
    const {account} = req.body;
    if (!account) {
        return  next(new AppError('Enter valid account public key', 400));
    }
    const foundRegistration = await Registration.findOne({createdBy : user._id, _id : id});
    if (!foundRegistration) return next(new AppError('No registration was found to make the withdrawl', 404));
    if (foundRegistration.isRequested) return next (new AppError("You've already requested the payment", 405));
    const newWithdrawRequest = new WithdrawRequest({
        createdBy : user._id,
        registration : foundRegistration._id,
        accountId : account,
    });
    const savedWithdrawl = await newWithdrawRequest.save();
    foundRegistration.isRequested = true;
    const savedFoundRegistration = await foundRegistration.save();

    res.json({
        withdraw : savedWithdrawl,
        registration : savedFoundRegistration
    });
})

exports.updateWithdrawState = catchAsync(async(req,res,next)=>{
    const {id} = req.params;
    const {state} = req.body;
    const foundWithdrawl = await WithdrawRequest.findById(id);
    if (!foundWithdrawl) return next(new AppError('No Withdrawl was found with the id'));
    foundWithdrawl.state = state;
    const updatedWithdrawl = await foundWithdrawl.save();
    res.json(updatedWithdrawl);
})
exports.updatePendingsToCompleted = catchAsync(async(req,res,next)=>{
    const repsonse = await WithdrawRequest.updateMany({state : 'pending'}, {state : 'completed'});
    res.json(repsonse);
})


exports.fetchAllWithdrawRequests = catchAsync(async(req,res,next)=>{
  
    const allWithdrawls = await WithdrawRequest.find({}).populate('registration').populate('createdBy');
    res.json({withdrawRequests : allWithdrawls})
})