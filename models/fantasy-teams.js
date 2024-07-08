var mongoose = require("mongoose"),
  Schema = mongoose.Schema;
 
 
const playerSchema = new Schema({
        _id: {
          type: String, // Assuming player_id is a String
          required: true,
          alias: 'player_id' // Use player_id as the field name in the document
      },
      url:{
        type:String,
        required: [true,"image not provided"]
      },
      name: {
        type: String,
        required: [true, "Team Name not provided"],
      },
      bowling: {
        type: String,
        required: [true, "Team Name not provided"],
      },
      batting: {
        type: String,
        required: [true, "Team Name not provided"],
      },
      role: {
        type: String,
        required: [true, "Team Name not provided"],
      },
      credit: {
        type: Number,
        required: [true, "Team Name not provided"],
      }
})

let teamsSchema = new Schema({
    name: {
        type: String,
        required: [true, "Team Name not provided"],
    },
    players: [playerSchema]
 
})
 
const TeamData = mongoose.model("Teams", teamsSchema,'fantasy-teams');

module.exports = TeamData;