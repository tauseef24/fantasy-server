const mongoose = require('mongoose');
const { Schema } = mongoose;

const playerSchema = new Schema({
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    url:{type:String}
}, { _id: false });

const matchSchema = new Schema({
    userId: { type: String, required: true },
    matchId: { type: String, required: true },
    team: [playerSchema]
});

const DreamTeam = mongoose.model('DreamTeam', matchSchema,"fantasy-dream-teams");

module.exports = DreamTeam;
