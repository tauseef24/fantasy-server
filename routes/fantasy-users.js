const express = require('express')
const { getFantasySports, getFantasyLeague } = require('../controllers/fantasyusers.js/fantasySportsLeagues')
const { getFantasyMatches, getFantasyMatch, getFantasyMatches_SportId, getFantasyMatches_LeagueId, getFantasyTeams_LeagueId } = require('../controllers/fantasyusers.js/fantasyMatches')
const { getFantasyTeams, getFantasyTeamDetails, createDreamTeam, getMatchPlayingTeam, getDreamTeamById, getDreamTeamsOfUser } = require('../controllers/fantasyusers.js/fantasyTeams')
const { matchLiveScore, getMatchContests, joinContest, getFantasyPoints, getUserContestTeams } = require('../controllers/livematch/fantasyLiveMatchData')
const { updateWallet, getUserWallet } = require('../controllers/users/fantasyUsers')
const verifyToken = require("../middlewares/authJWT.js");

const router = express.Router()

router.get('/fantasy-sports',getFantasySports)
router.get('/fantasy-league/:sportId',getFantasyLeague)
router.get("/fantasy-matches",getFantasyMatches)
router.get("/fantasy-matches/sport/:sportId",getFantasyMatches_SportId)
router.get("/fantasy-matches/league/:leagueId",getFantasyMatches_LeagueId)
router.get("/fantasy-match/:matchId",getFantasyMatch)  // get match players
router.get("/fantasy-teams",getFantasyTeams)
router.get('/fantasy-teamDetails/:teamId',getFantasyTeamDetails)
router.get('/fantasy-teams/league/:leagueId',getFantasyTeams_LeagueId)
router.get('/matchlive-score/:matchId',matchLiveScore)   //live score
router.post('/fantasy-create-team/:matchId',createDreamTeam)
router.get("/fantasy-playing-team/:matchId",getMatchPlayingTeam) //it will give 11 11 players from each team
router.get("/dream-team/:teamId",getDreamTeamById)
router.get("/dream-team-byUser/:userId/:matchId",getDreamTeamsOfUser)
router.get('/match-contests/:matchId',getMatchContests)
router.post('/fantasy-match/join-contest/:matchId',joinContest)
router.get('/fantasy-match/team-points/:teamId',getFantasyPoints)
router.get('/contest-team/:matchId/:userId/:contestId',getUserContestTeams)
router.post('/wallet-update', updateWallet)
router.get('/user-wallet/:userId',getUserWallet)
module.exports = router