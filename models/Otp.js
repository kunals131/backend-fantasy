const mongoose = require('mongoose');
const validator = require('validator');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Please provide your phone'],
    unique: true,
    trim: true,
  },
  otp: {
    type: String,
    required: [true, 'Please provide otp.'],
    trim: true,
  },
  expiry: {
    type: Date,
    required: [true, 'Please provide expiry time'],
  },
  temp_user: {
    type: Object,
    default: {}
  },
  created_on: {
    type: Date,
    default: Date.now
  },
});

otpSchema.methods.generateOTP = async function () {
  var digits = '0123456789';
	let OTP = '';
	for (let i = 0; i < 4; i++) {
		OTP += digits[Math.floor(Math.random() * 10)];
	}
	return OTP;
};
const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
