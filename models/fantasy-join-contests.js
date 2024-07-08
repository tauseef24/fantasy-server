const mongoose = require('mongoose');
const { Schema } = mongoose;

const playerSchema = new Schema({
    playerId: {type:String,reqired:true},
    playerName: {type:String,reqired:true},
    url:String,
    playerPoints: {type:Number,default:0}
}, { _id: false });

const matchSchema = new Schema({
    userId: {type:String,reqired:true},
    userName: {type:String,reqired:true},
    matchId: {type:String,reqired:true},
    contestId: {type:String,reqired:true},
    points:  {type:Number,default:0},
    prize:{type:Number, default:0},
    percentile: {type:Number, default:0},
    team: [playerSchema]
});

const fantasyJoinContest = mongoose.model('JoinContest', matchSchema,"fantasy-join-contests");

module.exports = fantasyJoinContest
