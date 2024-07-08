const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playerSchema = new Schema({

  name: {
    type: String,
    required: true
  },
  url:{
    type:String, 
    required: true
  },
  role: {
    type: String,
    required: true
  },
  batting: {
    type: String,
    required: true
  },
  bowling: {
    type: String,
    required: true
  },
  credit: {
    type: Number,
    required: true
  }
});

const Player = mongoose.model('Player', playerSchema,"fantasy-players");

module.exports = Player;
