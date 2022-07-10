const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Tournament = require('./../models/Tournament');
const convertUsdToSol = require('../utils/convertUsdToSol');
const Registration = require('../models/Registration');
const TransactionModel =  require('./../models/Transaction');
const User = require('../models/User');
const {shopAddress} = require('../utils/walletAddresses');
const { clusterApiUrl, Connection,Transaction,PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js")
const { WalletAdapterNetwork } =  require("@solana/wallet-adapter-base");
const BigNumber = require('bignumber.js');
const WithdrawRequest  = require('../models/WithdrawRequest');


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
    if (tournamentFound.status==='in_progress') {
        return next(new AppError(`Tournament has already started!`, 400)); 
    }
    if (tournamentFound.status==='closed') {
        return next(new AppError(`Tournament has ended!`, 400));
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
    const newTransaction = new TransactionModel({
        createdBy : user._id,
        mode : 'WALLET',
        amountInSol : tournamentCostInSol,
        type : 'FROMWALLET',
        referenceId : referenceId,
        status  : 'completed',
        for : tournamentFound._id,
        amountInUsd : tournamentFound.entry_fee,
        updatedBalance : user.balance-tournamentCostInSol
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
    const allTransactions = await TransactionModel.find({createdBy : user._id});
    console.log(allTransactions);
    res.status(200).json({transactions : allTransactions, status : 'success'});
})

exports.getAccountInformationHandler = catchAsync(async(req,res,next)=>{
    res.status(200).json({
        label: "Daily Fantasy",
        icon: "https://freesvg.org/img/Game-Controller-Outline-White.png",
      })

})



exports.addSolToWalletHandler = catchAsync(async(req,res,next)=>{

        // We pass the selected items in the query, calculate the expected cost
        const {reference} = req.query;
        const fetchedAmount = req?.query?.amount;
        if (!fetchedAmount || fetchedAmount===0) {
            return next(new AppError('Amount is invalid', 400));
        }
        const amount = new BigNumber(parseFloat(fetchedAmount));
        
        // We pass the reference to use in the query
        if (!reference) {
          return next(new AppError('Reference is Invalid', 400));
        }
    
        // We pass the buyer's public key in JSON body
        const { account } = req.body
        if (!account) {
          return next(new AppError('Account provided is invalid', 400));
        }
        const buyerPublicKey = new PublicKey(account)
        const shopPublicKey = shopAddress
    
        const network = WalletAdapterNetwork.Testnet
        const endpoint = clusterApiUrl(network)
        const connection = new Connection(endpoint)
    
        // Get a recent blockhash to include in the transaction
        const { blockhash } = await (connection.getLatestBlockhash('finalized'))
    
        const transaction = new Transaction({
          recentBlockhash: blockhash,
          // The buyer pays the transaction fee
          feePayer: buyerPublicKey,
        })
    
        // Create the instruction to send SOL from the buyer to the shop
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: buyerPublicKey,
          lamports: amount.multipliedBy(LAMPORTS_PER_SOL).toNumber(),
          toPubkey: shopPublicKey,
        })
    
        // Add the reference to the instruction as a key
        // This will mean this transaction is returned when we query for the reference
        transferInstruction.keys.push({
          pubkey: new PublicKey(reference),
          isSigner: false,
          isWritable: false,
        })
    
        // Add the instruction to the transaction
        transaction.add(transferInstruction)
    
        // Serialize the transaction and convert to base64 to return it
        const serializedTransaction = transaction.serialize({
          // We will need the buyer to sign this transaction after it's returned to them
          requireAllSignatures: false
        })
        const base64 = serializedTransaction.toString('base64')
    
        // Insert into database: reference, amount
    
        // Return the serialized transaction

        res.status(200).json({
          transaction: base64,
          message: "Thanks for your order!",
        });

});


exports.createCustomTransactionToWallet = catchAsync(async(req,res,next)=>{
    const user = req.user;
    const {transactionDetails} = req.body;
    if (!transactionDetails) {
        return next(new AppError('Transaction details are missing', 400));
    }
    const {amountInSol} = transactionDetails;
    let userBigNumber = new BigNumber(user.balance);
    let amountBigNumber = new BigNumber(amountInSol);
    amountBigNumber = parseFloat(amountBigNumber.plus(userBigNumber).toString());
    
    const ifTransaction = await TransactionModel.findOne({referenceId : transactionDetails.referenceId});
    
    if (ifTransaction) {
        return res.status(200).json({
            transaction : ifTransaction,
            updatedBalance : ifTransaction.updatedBalance
        });
    }
 


    const updatedUser = await User.findByIdAndUpdate(user._id, {balance : amountBigNumber});

    const newTransaction = new TransactionModel({createdBy : user._id , ...transactionDetails, updatedBalance : amountBigNumber});

    const result = await newTransaction.save();

    res.status(200).json({
        transaction : result,
        updatedBalance : updatedUser.balance
    });

})


exports.distributeMoneyHandler = catchAsync(async(req,res,next)=>{

    const {reference} = req.query;
   
    // We pass the reference to use in the query
    if (!reference) {
      return next(new AppError('Reference is Invalid', 400));
    }

    // We pass the buyer's public key in JSON body
    const { account } = req.body
    if (!account) {
      return next(new AppError('Account provided is invalid', 400));
    }

    const pendingWithdrawls = await WithdrawRequest.find({state : 'pending'}).populate('registration');
    if (pendingWithdrawls.length===0) return next(new AppError('No pending withdraw was found'));

    const buyerPublicKey = new PublicKey(account)


    const network = WalletAdapterNetwork.Testnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)

    // Get a recent blockhash to include in the transaction
    const { blockhash } = await (connection.getLatestBlockhash('finalized'))

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      // The buyer pays the transaction fee
      feePayer: buyerPublicKey,
    })

   
    for(withdraw of pendingWithdrawls) {
    // Create the instruction to send SOL from the buyer to the shop
    const amount = new BigNumber(withdraw.registration.prizeWon);
    const toKey = new PublicKey(withdraw.accountId);

    const transferInstruction = SystemProgram.transfer({
        fromPubkey: buyerPublicKey,
        lamports: amount.multipliedBy(LAMPORTS_PER_SOL).toNumber(),
        toPubkey: toKey,
      })
  
      // Add the reference to the instruction as a key
      // This will mean this transaction is returned when we query for the reference
      transferInstruction.keys.push({
        pubkey: new PublicKey(reference),
        isSigner: false,
        isWritable: false,
      })
  
      // Add the instruction to the transaction
      transaction.add(transferInstruction)
    }

    // Serialize the transaction and convert to base64 to return it
    const serializedTransaction = transaction.serialize({
      // We will need the buyer to sign this transaction after it's returned to them
      requireAllSignatures: false
    })
    const base64 = serializedTransaction.toString('base64');

    // Insert into database: reference, amount

    // Return the serialized transaction

    res.status(200).json({
      transaction: base64,
      message: "Thanks for your order!",
    });
})