const mongoose = require("mongoose");
const validator = require("validator");
const { checkTournamentState } = require("../utils/timechecks");
const colors = require("colors");
const tournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide tournament title"],
    trim: true,
  },
  entry_fee: {
    type: Number,
    required: [true, "Please provide entry fee"],
  },
  start_time: {
    type: String,
    required: [true, "Please provide start time"],
  },
  end_time: {
    type: String,
    required: [true, "Please provide end time"],
  },
  streamers: {
    type: Array,
    default: [],
  },
  type : {
    type : String,
    enum : ["apex", "cod"],
    default : "apex"
  },
  prize_amount: {
    type: Number,
    required: [true, "Please provide prize amount"],
  },
  sections: {
    type: Array,
    default: [],
  },
  isDynamic : {
    type : Boolean,
    default : false
  },
  status: {
    type: String,
    enum: ["open", "in_progress", "closed"],
    default: "open",
  },
  active: {
    type: Boolean,
    default: true,
  },
  created_on: {
    type: Date,
    default: Date.now,
  },
  created_by: {
    type: String,
    ref: "User",
  },
});

tournamentSchema.post("find", async function (tournaments) {
  if (tournaments) {
    for (let tournament of tournaments) {

      const latestState = checkTournamentState(tournament.start_time, tournament.end_time);
      tournament.status = latestState;
      // console.log(`${tournament.title} updated to ${latestState}`.bgGreen.white.bold);
      if (latestState === "closed") tournament.active = false;
      // await tournament.save();
    }
  }
});

tournamentSchema.post("findOne", async function (tournament) {

const latestState = checkTournamentState(tournament.start_time, tournament.end_time);
tournament.status = latestState;

if (latestState === "closed") tournament.active = false;

});

const Tournament = mongoose.model("Tournament", tournamentSchema);
module.exports = Tournament;
