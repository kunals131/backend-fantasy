const mongoose = require('mongoose');
const validator = require('validator');

const tournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide tournament title'],
    trim: true,
  },
  entry_fee: {
    type: Number,
    required: [true, 'Please provide entry fee'],
  },
  start_time: {
    type: String,
    required: [true, 'Please provide start time'],
  },
  end_time: {
    type: String,
    required: [true, 'Please provide end time'],
  },
  streamers: {
    type: Array,
    default: []
  },
  prize_amount: {
    type: Number,
    required: [true, 'Please provide prize amount'],
  },
  sections: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'closed'],
    default: 'open',
  },
  active: {
    type: Boolean,
    default: true,
  },
  created_on: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: String,
    ref: "User"
  },
});
const Tournament = mongoose.model('Tournament', tournamentSchema);
module.exports = Tournament;
