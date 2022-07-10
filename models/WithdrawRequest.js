const {Schema, model} = require('mongoose');

const requestSchema = new Schema({
    createdBy : {
        type : String,
        ref : 'User',
        required : true
    },
    registration : {
        type : String,
        ref : 'Registration',
        unique : [true, 'Cannot create multiple withdrawls for one registration'],
        required : true
    },
    state : {
        type : String,
        enum : ['pending', 'cancelled','completed'],
        default : 'pending'
    },
    accountId : {
        type : String,
        required : true
    },
    transaction : {
        type : String,
        ref : 'Transaction'
    }

}, {
    timestamps : true
})


const WithdrawRequest = model('WithdrawRequest', requestSchema);
module.exports = WithdrawRequest;
