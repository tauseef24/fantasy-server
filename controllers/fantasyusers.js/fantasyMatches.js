let fantasyMatch = require('../../models/fantasy-matches')
let fantasyTeams = require('../../models/fantasy-teams')
let League = require('../../models/fantasy-league')

exports.getFantasyMatches = async(req,res)=>{

    try{
        let match = await fantasyMatch.find()
        res.status(200).send(match)
    }
    catch(err)
    {
        res.status(500).send("something went wrong")
    }
}

exports.createFantasyMatch = async(req,res)=>{

    try{
        let {date,time,leagueId,team1,team2}= req.body
        let {league,sport,sportId} = await League.findById(leagueId)
        let matchNo = await fantasyMatch.countDocuments({'leagueDetails.leagueId': leagueId})+1;

        let  teamADetails = await fantasyTeams.findById(team1,{name:1})
        let  teamBDetails = await fantasyTeams.findById(team2,{name:1})

        let leagueDetails = {
            league,
            leagueId
        }
        let sportDetails = {
            sport,
            sportId
        }

        let teamA = {
            name: teamADetails.name,
            teamId: teamADetails._id
        }
        let teamB = {
            name: teamBDetails.name,
            teamId: teamBDetails._id
        }
        
        let match = new fantasyMatch({
            leagueDetails,
            sportDetails,
            teamA,
            teamB,
            matchNo,
            date,
            time
        })
        let result  = await match.save()
        console.log(result)
        return res.status(200).send("result")

    }
    catch(err)
    {
        console.log(err.message)
        return res.status(500).send(err.message)
    }
}

exports.getFantasyMatches_SportId = async(req,res)=>{
    try{
        let sportId = req.params.sportId
        let matches = await fantasyMatch.find({'sportDetails.sportId': sportId});
        return res.status(200).send(matches)
    }
    catch(err)
    {
        return res.status(500).send("something with wrong")
    }
}
exports.getFantasyMatches_LeagueId = async(req,res)=>{
    try{
        let leagueId = req.params.leagueId
        let matches = await fantasyMatch.find({'leagueDetails.leagueId': leagueId});
        return res.status(200).send(matches)
    }
    catch(err)
    {
        return res.status(500).send("something with wrong")
    }
}

exports.getFantasyTeams_LeagueId = async(req,res)=>{
    try{
        let leagueId = req.params.leagueId
        let teams = await fantasyTeams.find({ 'leagueId': leagueId }, { '_id': 1, 'name': 1 });
        return res.status(200).send(teams)
    }
    catch(err)
    {
        return res.status(500).send("something with wrong")
    }
}

exports.getFantasyMatch = async (req,res)=>{
    try{
        let matchId = req.params.matchId
        let match = await fantasyMatch.findById(matchId)
        let teamAid= match.teamA.teamId
        let teamBid = match.teamB.teamId

        let teamAdetails = await fantasyTeams.findById(teamAid)
        let teamBdetails = await fantasyTeams.findById(teamBid)
        
        let matchPlayers = {
            teamA : {
                ...match.teamA,
                players: teamAdetails.players
            },
            teamB : {
                ...match.teamB,
                players: teamBdetails.players
            }
        }

        res.status(200).send(matchPlayers)
    }
    catch(err)
    {
        res.status(500).send(err.message)
    }
}