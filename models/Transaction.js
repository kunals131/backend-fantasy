const {Schema, model} = require('mongoose');

const transactionSchema = new Schema({
    created_by : {
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
        required : true
    },
    status : {
        type : String,
        enum : ['pending', 'cancelled', 'completed'],
        required : true,
        default : 'pending'
    },
    for :{
        type :Object,
        default : {}
    }
})

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
