const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  matchNo: {
    type: Number,
    required: true
  },
  leagueDetails:{
      league:{
        type:String,
        required: true
      },
      leagueId:{
        type:String,
        required:true
      }
  },
  sportDetails:{
    sport:{
      type:String,
      required: true
    },
    sportId:{
      type:String,
      required:true
    }
  },
  date: {
    type: Date,
    required: true
  },
  time:{
    type: String,
    required:true
  },
  teamA: {
    name: {
      type: String,
      required: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  teamB: {
    name: {
      type: String,
      required: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  }
});

const Match = mongoose.model('Match', matchSchema, 'fantasy-matches');

module.exports = Match;
