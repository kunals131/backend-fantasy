const {Schema, model} = require('mongoose');

const registrationSchema = new Schema({
    createdBy : {
        type : String,
        required : true
    },
    tournamentId : {
        type : Schema.Types.ObjectId,
        required : true,
    },
    team : [{
        type: Object,
        default: {}
    }],
    kills : {
        type :  Number,
        default : 0
    },
    damage : {
        type : Number,
        default : 0,

    },
    wins : {
        type : Number,
        default : 0,
    },
    transactionId : {
        type : String,
        ref : 'Transaction'
    },
    prizeWon : {
        type : Number,
        default : 0
    },
    isPaid : {
        type : Number,
        default : 0
    },
    finalRank : {
        type : Number,
        default : 0
    },
    currentRank : {
        type : Number,
        default : 0
    },

}, {
    timestamps : true
})



const Registration = model('Registration', registrationSchema);
module.exports = Registration;
