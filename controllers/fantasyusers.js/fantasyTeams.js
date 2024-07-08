let fantasyTeams = require('../../models/fantasy-teams')
let Team = require('../../models/fantasy-dream-teams')
let LiveMatch = require('../../models/fantasy-live-match-data')
let DreamTeam = require('../../models/fantasy-dream-teams')
let Contest = require('../../models/fantasy-join-contests')
const moment = require('moment')
const fantasyJoinContest = require('../../models/fantasy-join-contests')

exports.createFantasyTeam = async (req,res)=>{
    const team = new fantasyTeams({
        name: req.body.teamName,
        players: req.body.players,
    });

    try {
        await team.save();
        res
          .status(200)
          .send({ message: "Team created Successfully", TeamCreated: team });
      } catch (err) {
        console.log("Error creating Team", err);
        res.status(500).send({ message: "Error Creating Team", error: err });
        return;
    }
    
}

exports.getFantasyTeams = async(req,res)=>{

    try{
        let teams = await fantasyTeams.find();
        res.status(200).send(teams)
    }
    catch(err)
    {
        res.status(500).send(err.message)
    }
}

exports.getFantasyTeamDetails = async(req,res)=>{

    let teamId = req.params.teamId
    try{
        let teams = await fantasyTeams.findById(teamId)
        res.status(200).send(teams)
    }
    catch(err)
    {
        res.status(500).send(err.message)
    }
}


exports.getMatchPlayingTeam = async(req,res)=>{
    try
    {
        let matchId = req.params.matchId
        let match = await LiveMatch.findOne({'matchId':matchId})
        if(match==null)
            return res.status(500).send("No such match exits")

        if(match.matchCompleted === true)
            return res.status(200).send("match completed")

        const battingTeam = match.teams.find(team=>team.teamId === match.currentBatting);
        const bowlingTeam = match.teams.find(team=>team.teamId === match.currentBowling);
        let battingPlayers = battingTeam.players.map((player)=>{
            return {
                playerId: player.playerId,
                name: player.name
            }
        })
        let bowlingPlayers = bowlingTeam.players.map((player)=>{
            return {
                playerId: player.playerId,
                name: player.name
            }
        })
        const players = {
            battingPlayers,
            bowlingPlayers
        }
        return res.status(200).send(players)
    }
    catch(err)
    {
        return res.status(400).send("playing not working")
    }
}

exports.createDreamTeam = async (req, res) => {
    try {
        let matchId = req.params.matchId;
        let dreamTeam = req.body.dreamTeam;
        console.log(dreamTeam);
        let result = await Team.create({
            ...dreamTeam,
            matchId
        });
        return res.status(200).send(result);
    } catch (err) {
        return res.status(500).send(err.message);
    }
};

exports.getDreamTeamById = async(req,res)=>{
    try{
        const teamId = req.params.teamId
        let team = fantasyJoinContest.findById(teamId)
        console.log(team)
        return res.status(200).send(team)
    } catch (err) {
        return res.status(500).send(err.message);
    }
}

exports.getDreamTeamsOfUser = async(req,res)=>{
    try{
        const userId = req.params.userId
        const matchId = req.params.matchId
        console.log(userId,matchId)
        let team = await DreamTeam.find({'userId':userId,'matchId':matchId})
        console.log(team)
        return res.status(200).send(team)
    } catch (err) {
        return res.status(500).send(err.message);
    }
}