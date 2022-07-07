const {Schema, model} = require('mongoose');

const transactionSchema = new Schema({
    createdBy : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    mode : {
        type : String,
        required : true
    },
    amountInSol : {
        type : Number,
        required : true
    },
    amountInUsd : {
        type : Number,
        required : true
    },
    type : {
        type : String,
        enum : ['TOWALLET','FROMWALLET', 'DIRECT'],
        required : true
    },
    referenceId : {
        type  :String,
        required : true,
        unique: true
    },
    status : {
        type : String,
        enum : ['pending', 'cancelled', 'completed'],
        required : true,
        default : 'pending'
    },
    for :{
        type :Schema.Types.ObjectId,
        ref : 'Registration'
    },
    updatedBalance : {
        type : Number,
        required : false,
        default : 0
    }
}, {timestamps : true})

const Transaction = model('Transaction', transactionSchema);
module.exports = Transaction;
