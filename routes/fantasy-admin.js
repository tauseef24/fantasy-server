const express = require('express');
const router = express.Router();
const { getFantasyLiveMatchData, setFantasyMatchTeamCreate, updateFantasyLiveMatchData, getCurrentFieldingPlayers, getMatchScoreCard, getMatchSummary, getMatchPlayers, getLeaderBoard, swapBatsman, selectNextPlayer, initiateFantasyMatch, getNextPlayer, getMatchData} = require('../controllers/livematch/fantasyLiveMatchData');
const { createFantasyMatch } = require('../controllers/fantasyusers.js/fantasyMatches');
const verifyToken = require("../middlewares/authJWT.js");

// Define route handlers
module.exports = function(io) {
    router.get('/fantasy-match-details/:matchId', getFantasyLiveMatchData);
    router.post('/fantasy-match-details/:matchId', setFantasyMatchTeamCreate);
    router.put('/fantasy-match-details/:matchId', (req, res) => {
        updateFantasyLiveMatchData(io, req, res); 
    });
    router.post('/match-create',createFantasyMatch)
    router.get('/match-fieldingPlayers/:matchId',getCurrentFieldingPlayers)
    router.get('/matchScoreCard/:matchId',getMatchScoreCard)
    router.get('/matchPlayers/:matchId',getMatchPlayers)   //it will give match players role wise
    router.get('/matchSummary/:matchId',getMatchSummary)
    router.get('/matchLeaderboard/:matchId/:contestId/:userId',getLeaderBoard)
    router.put('/fantasy-match/swapbatsman/:matchId', (req, res) => {swapBatsman(io,req,res) });
    router.put('/nextPlayer/:matchId', (req, res) => {
        selectNextPlayer(io, req, res); 
    });
    router.put('/initiate/fantasy-live/:matchId', (req, res) => {
        initiateFantasyMatch(io, req, res); 
    });
    router.put('/nextBatnBowl/:matchId',getNextPlayer)
    router.get('/matchData/:matchId', getMatchData);
    return router;
};
