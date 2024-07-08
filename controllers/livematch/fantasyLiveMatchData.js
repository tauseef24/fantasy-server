const fantasyLiveMatch = require("../../models/fantasy-live-match-data");
const Player = require("../../models/fantasy-players");
const Match = require("../../models/fantasy-matches");
const TeamData = require("../../models/fantasy-teams");
const FantasyJoinContest = require("../../models/fantasy-join-contests");
const Contest = require("../../models/fantasy-contests");
const User = require("../../models/fantasy-users");
const DreamTeam = require("../../models/fantasy-dream-teams");
const { ObjectId } = require("mongodb");
const fantasyJoinContest = require("../../models/fantasy-join-contests");
const fantasyUsers = require("../../models/fantasy-users");

exports.getFantasyLiveMatchData = async (req, res) => {
  try {
    let matchId = req.params.matchId;
    let matchData = await fantasyLiveMatch.findOne({ matchId: matchId });
    if (matchData == null) return res.status(500).send("No such match exits");
    return res.status(200).send(matchData);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

exports.setFantasyMatchTeamCreate = async (req, res) => {
  try {
    let matchId = req.params.matchId;
    let teams = req.body.teams;
    let toss = req.body.toss;
    let battingFirst = req.body.battingFirst;
    let currentBatting = req.body.currentBatting;
    let currentBowling = req.body.currentBowling;
    let overs = req.body.overs;

    let matchData = await Match.findById(matchId);

    let teamsData = [];

    for (let teamKey in teams) {
      let team = teams[teamKey];
      let playersInfo = [];
      for (let playerId of team.players) {
        let player = await Player.findById(playerId);
        if (player) {
          let playerInfo = {
            playerId,
            name: player.name,
            role: player.role,
            url: player.url,
            striker: false,
            non_striker: false,
            batting_hand: player.batting,
            bowling_hand: player.bowling,
            credit: player.credit,
            batting: {
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              isDismissed: false,
            },
            bowling: {
              wickets: 0,
              balls: 0,
              runs: 0,
              lbws: 0,
              bowled: 0,
              maidens: 0,
            },
            fielding: {
              catches: 0,
              runout: {
                direct: 0,
                indirect: 0,
              },
              stumpings: 0,
            },
          };
          playersInfo.push(playerInfo);
        } else {
          return res.status(404).send(`Player with ID ${playerId} not found.`);
        }
      }
      teamsData.push({
        teamId: team.id,
        players: playersInfo,
      });
    }

    let craeateMatch = new fantasyLiveMatch({
      matchId: matchId,
      teams: teamsData,
      toss: toss,
      battingFrist: battingFirst,
      currentBatting: currentBatting,
      currentBowling: currentBowling,
      overs: overs,
    });

    await craeateMatch.save();
    return res.status(200).send({ craeateMatch });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.matchId) {
      return res.status(400).send({ msg: "Match already got created" });
    } else {
      console.log(err);
      return res.status(500).send(err.message);
    }
  }
};

exports.updateFantasyLiveMatchData = async (io, req, res) => {
  try {
    let matchId = req.params.matchId;
    let ball = req.body.ballByBall;
    let runs = parseInt(ball.runs);
    let batRuns = parseInt(ball.runs);
    let bowlRuns = parseInt(ball.runs);
    let batTeamPoints = 0;
    let bowlTeamPoints = 0;
    let batterPoints = 0;
    let bowlerPoints = 0;
    let needBatsman = false;
    let needBowler = false;
    let inningsBreak = false;

    let match = await fantasyLiveMatch.findOne({ matchId: matchId });
    if (match == null) return res.status(500).send("No such match exits");

    if (match.inningsBreak === true)
      return res.status(200).send({
        nextPlayer: { needBatsman, needBowler },
        summary: match.inningsBreak,
      });

    if (match.matchCompleted === true)
      return res.status(200).send("match completed");

    const battingTeam = match.teams.find(
      (team) => team.teamId === match.currentBatting
    );
    const bowlingTeam = match.teams.find(
      (team) => team.teamId === match.currentBowling
    );

    let extras = parseInt(ball.extras.byes) + parseInt(ball.extras.legByes); // adding the bye runs if they got any byes

    if (ball.extras.wide === true && ball.extras.noBall === true) {
      extras += 2;
      bowlRuns += 2;
    } else if (ball.extras.wide === true || ball.extras.noBall === true) {
      extras += 1;
      bowlRuns += 1;
    }

    let striker = null;
    if (battingTeam.strikerId) {
      striker = battingTeam.players.find(
        (player) => player.playerId === battingTeam.strikerId
      );
      batterPoints = batRuns; // batter points

      if (ball.extras.wide === false || ball.extras.noBall === true)
        striker.batting.balls += 1; // batting balls update

      if (batRuns == 4) {
        striker.batting.fours += 1; // batting fours update
        batterPoints += 1;
        batTeamPoints += 1;
      }

      if (batRuns == 6) {
        striker.batting.sixes += 1; // batting six update
        batterPoints += 2;
        batTeamPoints += 2;
      }

      striker.batting.runs += batRuns; // batting runs update
      striker.fantasyPoints += batterPoints;
    }

    let bowler = null;
    if (bowlingTeam.currentBowlerId) {
      bowler = bowlingTeam.players.find(
        (player) => player.playerId === bowlingTeam.currentBowlerId
      );
      bowler.bowling.runs += bowlRuns; // bowler runs update

      if (ball.extras.wide === false && ball.extras.noBall === false) {
        bowler.bowling.balls += 1; // bowler balls update
        battingTeam.ball += 1; // batting team balls update
      }
    }

    let fielder = null;
    if (ball.wicket.isOut === true) {
      needBatsman = true;
      if (ball.wicket.type === "runout") {
        if (ball.wicket.playersInvolved.length == 1) {
          fielder = bowlingTeam.players.find(ball.wicket.playersInvolved[0]);
          fielder.fielding.runout.direct++;
          fielder.fantasyPoints += 12;
        } else {
          ball.wicket.playersInvolved.forEach((playerId) => {
            fielder = bowlingTeam.players.find(
              (player) => player.playerId === playerId
            );
            fielder.fielding.runout.indirect++; // Or indirect
            fielder.fantasyPoints += 6;
          });
        }
        bowlTeamPoints += 12;
      } else if (ball.wicket.type === "stump") {
        fielder = bowlingTeam.players.find(ball.wicket.fielderId);
        fielder.fielding.stumpings += 1;
        fielder.fantasyPoints += 12;
        bowlTeamPoints += 12;
      } else {
        if (ball.wicket.type === "catch") {
          fielder = bowlingTeam.players.find(
            (player) => player.playerId === ball.wicket.fielderId
          );
          fielder.fielding.catches += 1;
          fielder.fantasyPoints += 8;
          bowlTeamPoints += 8;
        } else {
          bowler.bowling[ball.wicket.type] += 1;
          bowlerPoints += 25;
          // updating the bowler wickets
          bowler.bowling.wickets += 1;
        }
        if (bowler.bowling.wickets == 4) bowlerPoints += 8;

        if (bowler.bowling.wickets == 5) bowlerPoints += 16;

        bowler.fantasyPoints += bowlerPoints;
        bowlingTeam.teamPoints += bowlTeamPoints + bowlerPoints;
      }

      battingTeam.players = battingTeam.players.map((player) => {
        if (player.playerId === ball.wicket.batsmanId)
          player.batting.isDismissed = true;
        return player;
      });
      battingTeam.wickets += 1;
    }

    let batsmanId = striker.playerId;
    let bowlerId = bowler.playerId;
    let fielderIds = ball.wicket.playersInvolved || [];

    await updateContestTeamPoints(
      batsmanId,
      bowlerId,
      fielderIds,
      matchId,
      bowlerPoints,
      batterPoints
    );

    runs += extras;
    batTeamPoints = runs;
    battingTeam.score += runs; // batting teamscore update
    battingTeam.teamPoints += batTeamPoints;
    // update striker

    const changeStrike = () => {
      const temp = battingTeam.strikerId;
      battingTeam.strikerId = battingTeam.nonStrikerId;
      battingTeam.nonStrikerId = temp;
    };

    if ((runs + extras) % 2 === 1) {
      changeStrike();
    }

    // update extra
    battingTeam.extras += extras;

    if (battingTeam.ball === 6) {
      bowler.bowling.overs += 1;
      battingTeam.over += 1;
      battingTeam.ball = 0;
      changeStrike();
      needBowler = true;
    }

    const inningsChange = () => {
      const tem = match.currentBatting;
      match.currentBatting = match.currentBowling;
      match.currentBowling = tem;
    };

    const ifInningsCompleted = ()=>{
      distributeMoneyBetweenUsers(matchId) 
      match.inningsBreak = true;
      match.matchCompleted = true;
      match.isOngoing = false;
      needBatsman = false;
      needBowler = false;
    }

    if (match.innings === 2 && battingTeam.score > bowlingTeam.score) {
      ifInningsCompleted();
    } else if (battingTeam.wickets >= 10 || battingTeam.over >= match.overs) {
      match.innings += 1;
      match.inningsBreak = true;
      if (match.innings > 2) {
        ifInningsCompleted()
      } else{
        match.target = battingTeam.score+1;
        inningsChange();
      }
      needBatsman = false;
      needBowler = false;
    }
    // updations of database
    let updatedTeams = match.teams.map((team) => {
      if (team.teamId === battingTeam.teamId) return battingTeam;
      if (team.teamId === bowlingTeam.teamId) return bowlingTeam;
      return team;
    });

    match.teams = updatedTeams;

    let result = await match.save(); // Save the modified match document to the database

    if (match.matchCompleted === false && match.inningsBreak === false) {
      let scoreData = await getLiveScoreData(matchId);
      io.emit("liveScoreUpdated", scoreData);
    } else {
      let summary = await matchsummary(matchId);
      io.emit("liveScoreUpdated", summary);
    }
 
    return res.status(200).send({
      nextPlayer: { needBatsman, needBowler },
      inningsBreak: match.inningsBreak,
      matchCompleted: match.matchCompleted,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};

exports.getLeaderBoard = async (req, res) => {
  let matchId = req.params.matchId;
  let contestId = req.params.contestId;
  let userId = req.params.userId;
  try {
    const leaderboard = await FantasyJoinContest.find({ matchId, contestId }) // Find documents by matchId and contestId
      .sort({ points: -1 }) // Sort by points in ascending order
      .select("userId points prize percentile userName"); // Select only userId and points fields

    let userRank = leaderboard.findIndex((entry) => entry.userId === userId);
    let userDetails = leaderboard[userRank];
    return res.status(200).json({ leaderboard, userRank, userDetails });
  } catch (err) {
    console.error("Error occurred:", err);
    return res.status(500).send("Internal Server Error");
  }
};

exports.selectNextPlayer = async (io, req, res) => {
  try {
    const matchId = req.params.matchId;
    const match = await fantasyLiveMatch.findOne({ matchId: matchId });

    if (match.isOngoing === false)
      return res.status(500).send("match already over");

    const { role, player } = req.body.selectedPlayers;
    const batter = player.batter;
    const bowler = player.bowler;
    const battingTeam = match.teams.find(
      (team) => team.teamId === match.currentBatting
    );
    const bowlingTeam = match.teams.find(
      (team) => team.teamId === match.currentBowling
    );

    const striker = battingTeam.players.find(
      (player) => player.playerId === battingTeam.strikerId
    );

    if (role === "batter") {
      if (striker.batting.isDismissed === true) battingTeam.strikerId = batter;
      else battingTeam.nonStrikerId = batter;
    } else if (role === "bowler") {
      bowlingTeam.currentBowlerId = bowler;
    } else {
      if (striker.batting.isDismissed === true) battingTeam.strikerId = batter;
      else battingTeam.nonStrikerId = batter;
      bowlingTeam.currentBowlerId = bowler;
    }

    let updatedTeams = match.teams.map((team) => {
      if (team.teamId === battingTeam.teamId) return battingTeam;
      if (team.teamId === bowlingTeam.teamId) return bowlingTeam;
      return team;
    });

    match.teams = updatedTeams;
    await match.save();

    let scoreData = await getLiveScoreData(matchId);
    io.emit("liveScoreUpdated", scoreData);

    return res.status(200).send(match.isOngoing);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

exports.getNextPlayer = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const match = await fantasyLiveMatch.findOne({ matchId: matchId });
    const { needBatsman, needBowler } = req.body;

    if (!match.isOngoing) {
      return res.status(500).send("Match already over");
    }

    const battingTeam = match.teams.find(
      (team) => team.teamId === match.currentBatting
    );
    const bowlingTeam = match.teams.find(
      (team) => team.teamId === match.currentBowling
    );

    let playerIds = {
      battingPlayers: [],
      bowlingPlayers: [],
    };

    if (needBatsman) {
      playerIds.battingPlayers = battingTeam.players
        .filter(
          (player) =>
            !player.batting.isDismissed &&
            player.playerId !== battingTeam.strikerId &&
            player.playerId !== battingTeam.nonStrikerId
        )
        .map((player) => {
          return { playerId: player.playerId, name: player.name };
        });
    }

    if (needBowler) {
      playerIds.bowlingPlayers = bowlingTeam.players
        .filter((player) => player.playerId !== bowlingTeam.currentBowlerId)
        .map((player) => {
          return { playerId: player.playerId, name: player.name };
        });
    }
    // console.log(bowlingTeam.players)
    // console.log(playerIds)
    return res.status(200).send(playerIds);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

exports.initiateFantasyMatch = async (io, req, res) => {
  try {
    const matchId = req.params.matchId;
    const matchInit = req.body.matchInit;

    const match = await fantasyLiveMatch.findOne({ matchId: matchId });

    if (match == null) return res.status(500).send("No such match exits");

    if (match.matchCompleted === true)
      return res.status(200).send("match completed");

    const battingTeam = match.teams.find(
      (team) => team.teamId === match.currentBatting
    );
    const bowlingTeam = match.teams.find(
      (team) => team.teamId === match.currentBowling
    );

    battingTeam.strikerId = matchInit.striker;
    battingTeam.nonStrikerId = matchInit.nonStriker;
    bowlingTeam.currentBowlerId = matchInit.bowler;
    match.isOngoing = true;

    let updatedTeams = match.teams.map((team) => {
      if (team.teamId === battingTeam.teamId) return battingTeam;
      if (team.teamId === bowlingTeam.teamId) return bowlingTeam;
      return team;
    });

    match.inningsBreak = false;
    match.teams = updatedTeams;
    let result = await match.save();
    let scoreData = await getLiveScoreData(matchId);
    io.emit("liveScoreUpdated", scoreData);
    return res.status(200).send(result);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

exports.swapBatsman = async (io, req, res) => {
  try {
    const matchId = req.params.matchId;
    let match = await fantasyLiveMatch.findOne({ matchId: matchId });
    if (match == null) return res.status(500).send("No such match exits");

    if (match.isOngoing === false)
      return res.status(500).send("Match either completed or not yet started");

    const battingTeam = match.teams.find(
      (team) => team.teamId === match.currentBatting
    );

    const tem = battingTeam.strikerId;
    battingTeam.strikerId = battingTeam.nonStrikerId;
    battingTeam.nonStrikerId = tem;

    let updatedTeams = match.teams.map((team) => {
      if (team.teamId === battingTeam.teamId) return battingTeam;
      return team;
    });

    match.teams = updatedTeams;
    let result = await match.save(); // Save the modified match document to the database

    let scoreData = await getLiveScoreData(matchId);
    io.emit("liveScoreUpdated", scoreData);

    return res.status(200).send("hello");
  } catch (err) {
    return res.status(500).send("not working");
  }
};

exports.getCurrentFieldingPlayers = async (req, res) => {
  try {
    let matchId = req.params.matchId;
    let match = await fantasyLiveMatch.findOne({ matchId: matchId });
    let bowlingTeam = match.teams.find(
      (team) => team.teamId === match.currentBowling
    );
    let fieldingPlayers = bowlingTeam.players.map((player) => {
      return {
        playerId: player.playerId,
        name: player.name,
      };
    });
    // console.log(fieldingPlayers)
    return res.status(200).send(fieldingPlayers);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err);
  }
};

exports.matchLiveScore = async (req, res) => {
  try {
    let matchId = req.params.matchId;
    let scoreData = await getLiveScoreData(matchId);
    return res.status(200).send(scoreData);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err);
  }
};

exports.getMatchSummary = async (req, res) => {
  try {
    let matchId = req.params.matchId;
    let summary = await matchsummary(matchId);
    return res.status(200).send(summary);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err);
  }
};

exports.getMatchScoreCard = async (req, res) => {
  try {
    let matchId = req.params.matchId;
    let scoreCard = await matchScoreCard(matchId);
    return res.status(200).send(scoreCard);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

exports.getMatchPlayers = async (req, res) => {
  try {
    let matchId = req.params.matchId;
    const match = await fantasyLiveMatch.findOne({ matchId: matchId });
    const playersByRole = {
      wicketkeeper: [],
      batsman: [],
      bowler: [],
      allrounder: [],
    };

    match.teams.forEach((team) => {
      team.players.forEach((player) => {
        const playerData = {
          playerId: player.playerId,
          playerName: player.name,
          credit: player.credit,
          url: player.url,
        };
        switch (player.role) {
          case "wicketkeeper":
            playersByRole.wicketkeeper.push(playerData);
            break;
          case "batsman":
            playersByRole.batsman.push(playerData);
            break;
          case "bowler":
            playersByRole.bowler.push(playerData);
            break;
          case "allrounder":
            playersByRole.allrounder.push(playerData);
            break;
          default:
            break;
        }
      });
    });

    return res.status(200).send(playersByRole);
  } catch (err) {
    console.error(err);
    return res.status(200).send("Error fetching players datac");
  }
};

exports.joinContest = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    let { userId, contestId } = req.body.joiningDetails;

    let checkForUserJoin = await FantasyJoinContest.findOne({
      matchId,
      userId,
      contestId,
    });

    if (checkForUserJoin)
      return res.status(200).send("yout already joined the contest");

    const user = await User.findById(userId);
    const team = await DreamTeam.findOne({ userId, matchId });
    const details = {
      userId,
      matchId,
      contestId,
      team: team.team,
      userName: user.name,
    };
    const result = await FantasyJoinContest.create(details);
    return res.status(200).send("joined successfully");
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

exports.getUserContestTeams = async (req, res) => {
  try {
    let matchId = req.params.matchId;
    let contestId = req.params.contestId;
    let userId = req.params.userId;

    let teams = await FantasyJoinContest.find({ matchId, contestId, userId });
    return res.status(200).send(teams);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

exports.getFantasyPoints = async (req, res) => {
  try {
    let teamId = req.params.teamId;
    let team = await FantasyJoinContest.findById(teamId);
    return res.status(200).send(team);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

exports.getMatchContests = async (req, res) => {
  try {
    const matchId = req.params.matchId;

    const contests = await Contest.find({});

    const contestsJoined = await FantasyJoinContest.find({ matchId });

    const matchContests = contests.map((contest) => {
      const joinedContests = contestsJoined.filter(
        (entry) => entry.contestId === contest._id.toString()
      );
      const joinedUsersCount = joinedContests.length;
      return {
        contestId: contest._id,
        name: contest.name,
        entryPrize: contest.entryPrize,
        poolMoney: contest.poolMoney,
        count: contest.count,
        joinedUsers: joinedUsersCount,
      };
    });

    return res.status(200).json(matchContests);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

exports.getMatchData = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const match = await fantasyLiveMatch.findOne({ matchId: matchId });
    return res.status(200).send({ completed: match.matchCompleted, isOngoing:match.isOngoing,inningsBreak:match.inningsBreak });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

//functions

// async function matchsummary(matchId) {
//   try {
//     let match = await fantasyLiveMatch.findOne({ matchId: matchId });

//     if (!match) {
//       throw "Match not found";
//     }

//     let matchDetails = await Match.findById(matchId);
//     // Define a function to sort players by their runs (for batsmen) and wickets (for bowlers)
//     const sortByRuns = (a, b) => b.batting.runs - a.batting.runs;
//     const sortByWickets = (a, b) => b.bowling.wickets - a.bowling.wickets;

//     const matchSummary = {
//       matchCompleted: match.matchCompleted,
//       teamA: matchDetails.teamA,
//       teamB: matchDetails.teamB,
//     };

//     // Iterate over each team in the match
//     for (const team of match.teams) {
//       // Sort players by runs for batsmen
//       const topBatsmen = team.players
//         .sort(sortByRuns)
//         .slice(0, 3)
//         .map((player) => ({
//           name: player.name,
//           runs: player.batting.runs,
//           id: player.playerId,
//           balls: player.batting.balls,
//         }));

//       // Sort players by wickets for bowlers
//       const topBowlers = team.players
//         .filter((player) => player.role === "bowler")
//         .sort(sortByWickets)
//         .slice(0, 3)
//         .map((player) => ({
//           name: player.name,
//           wickets: player.bowling.wickets,
//           overs: player.bowling.overs,
//           id: player.playerId,
//         }));

//       // Construct object for this team
//       const teamSummary = {
//         score: team.score,
//         wickets: team.wickets,
//         overs: team.over + team.ball/10,
//         points: team.teamPoints,
//         teamId: team.teamId,
//         topBatsmen: topBatsmen,
//         topBowlers: topBowlers,
//       };

//       matchSummary[team.teamId] = teamSummary;
//     }

//     return {
//       matchSummary,
//       inningsBreak: match.inningsBreak,
//       matchCompleted: match.matchCompleted,
//     };
//   } catch (err) {
//     throw err.message;
//   }
// }

async function matchsummary(matchId) {
  try {
    let match = await fantasyLiveMatch.findOne({ matchId: matchId });

    if (!match) {
      throw new Error("Match not found");
    }

    let matchDetails = await Match.findById(matchId);

    const sortByRuns = (a, b) => b.batting.runs - a.batting.runs;
    const sortByWickets = (a, b) => b.bowling.wickets - a.bowling.wickets;

    const topBatsmen0 = match.teams[0].players
      .sort(sortByRuns)
      .slice(0, 3)
      .map((player) => ({
        name: player.name,
        runs: player.batting.runs,
        id: player.playerId,
        balls: player.batting.balls,
      }));

    const topBowlers0 = match.teams[0].players
      .filter(
        (player) =>
          // player.role === "bowler" ||
          player.bowling.overs > 0 ||player.bowling.balls > 0 
      )
      .sort(sortByWickets)
      .slice(0, 3)
      .map((player) => ({
        name: player.name,
        wickets: player.bowling.wickets,
        overs: player.bowling.overs+"."+player.bowling.balls,
        runs:player.bowling.runs,
        id: player.playerId,
      }));

    const topBatsmen1 = match.teams[1].players
      .sort(sortByRuns)
      .slice(0, 3)
      .map((player) => ({
        name: player.name,
        runs: player.batting.runs,
        id: player.playerId,
        balls: player.batting.balls,
      }));

    const topBowlers1 = match.teams[1].players
      .filter(
        (player) =>
          // player.role === "bowler" ||
          player.bowling.overs > 0 || player.bowling.balls > 0 
      )
      .sort(sortByWickets)
      .slice(0, 3)
      .map((player) => ({
        name: player.name,
        wickets: player.bowling.wickets,
        runs:player.bowling.runs,
        overs: player.bowling.overs+"."+player.bowling.balls,
        id: player.playerId,
      }));

    const matchSummary = {
      matchCompleted: match.matchCompleted,
      teamA: {
        name: matchDetails.teamA.name,
        score: match.teams[0].score,
        wickets: match.teams[0].wickets,
        overs: match.teams[0].over + match.teams[0].ball / 10,
        points: match.teams[0].teamPoints,
        topBatsmen: topBatsmen0,
        topBowlers: topBowlers0,
      },
      teamB: {
        name: matchDetails.teamB.name,
        score: match.teams[1].score,
        wickets: match.teams[1].wickets,
        overs: match.teams[1].over + match.teams[1].ball / 10,
        points: match.teams[1].teamPoints,
        topBatsmen: topBatsmen1,
        topBowlers: topBowlers1,
      },
    };

    return {
      matchSummary,
      inningsBreak: match.inningsBreak,
      matchCompleted: match.matchCompleted,
      isOngoing: match.isOngoing
    };
  } catch (err) {
    throw err.message;
  }
}



// update contest team points
async function updateContestTeamPoints(
  batsmanId,
  bowlerId,
  fielderIds,
  matchId,
  bowlerPoints,
  batterPoints
) {
  try {

    let users = await FantasyJoinContest.find({
      matchId: matchId,
      $or: [
        { "team.playerId": batsmanId },
        { "team.playerId": bowlerId },
        { "team.playerId": { $in: fielderIds } },
      ],
    }).sort({ points: -1 });
    
   
    let index = 0;

    let contest = await Contest.find();
    let prizeObj = {};

    for (let userDetails of users) {
      
      let updatedTeam = userDetails.team.map((player) => {
        if (player.playerId === batsmanId) {
          {
            userDetails.points += batterPoints;
            player.playerPoints += batterPoints;
          }
        } else if (player.playerId === bowlerId) {
          userDetails.points += bowlerPoints;
          player.playerPoints += bowlerPoints;
        } else if (fielderIds.includes(player.playerId)) {
          userDetails.points += bowlerPoints;
          player.playerPoints += 6;
        }
        return player;
      });

      userDetails.team = updatedTeam;
      try {
        let result = await FantasyJoinContest.findByIdAndUpdate(userDetails._id,userDetails)
      } catch (saveError) {
        console.error(
          `Error saving user team for userId: ${userId}`,
          saveError
        );
        // Handle save error
      }
    }
    for (let contestDetails of contest) {
      const leaderboard = await FantasyJoinContest.find({ matchId,contestId:contestDetails._id }).sort({points:-1});
      prizeObj = getDistribution(
        contestDetails.entryPrize * leaderboard.length,
        leaderboard.length,
        3
      );
      let ind = 0;
      for(let user of leaderboard)
      {
        let result = await FantasyJoinContest.findOneAndUpdate(new ObjectId(user._id),{ $set: { prize:prizeObj.prizes[ind++] } })
      } 
      console.log("**********************************")
    }
  } catch (error) {
    throw error.message;
    // Handle the error
  }
}

async function matchScoreCard(matchId) {
  try {
    // Find the match by its ID
    const match = await fantasyLiveMatch.findOne({ matchId: matchId });
    const matchData = await Match.findById(matchId);

    // Check if match exists
    if (!match) {
      throw Error("Match not found");
    }

    // Loop through each team in the match
    const scorecards = match.teams.map((team) => {
      let teamName =
        team.teamId === matchData.teamA.teamId.toString()
          ? matchData.teamA.name
          : matchData.teamB.name;
      // Team information
      const teamInfo = {
        teamName: teamName,
        teamId: team.teamId,
        score: team.score,
        wickets: team.wickets,
        extras: team.extras,
        teamPoints: team.teamPoints,
      };

      // Batsmen details
      const batsmen = team.players.map((player) => {
        let strikeRate =
          player.batting.balls === 0
            ? 0
            : ((player.batting.runs / player.batting.balls) * 100).toFixed(2);
        return {
          playerId: player.playerId,
          name: player.name,
          runs: player.batting.runs,
          fours: player.batting.fours,
          balls: player.batting.balls,
          sixes: player.batting.sixes,
          getOutBy: player.batting.isDismissed ? "Out" : "Not Out",
          strikeRate: strikeRate,
        };
      });

      const overs = team.over + "." + team.ball
      // Bowlers details
      const bowlers = team.players.map((player) => {
        // let economy = (player.bowling.runs / player.bowling.overs).toFixed(2) > 0 ? (player.bowling.runs / player.bowling.overs).toFixed(2) : 0
        let economy =
          player.bowling.overs === 0 && player.bowling.balls === 0
            ? 0
            : (
                player.bowling.runs /
                (player.bowling.overs + (player.bowling.balls % 6) / 6)
              ).toFixed(2);

        return {
          playerId: player.playerId,
          name: player.name,
          wickets: player.bowling.wickets,
          runs: player.bowling.runs,
          balls: player.bowling.balls,
          overs: player.bowling.overs,
          economy: economy,
        };
      });

      return {
        teamInfo: teamInfo,
        batsmen: batsmen,
        bowlers: bowlers,
        overs
      };
    });

    return scorecards;
  } catch (error) {
    throw error.message;
  }
}

async function getLiveScoreData(matchId) {
  try {
    let match = await fantasyLiveMatch.findOne({ matchId: matchId });

    if (!match) throw "no such match exist";

    let matchDetails = await Match.findById(matchId);
    let matchCompleted = match.matchCompleted;
    let inningsBreak = match.inningsBreak;
    let isOngoing = match.isOngoing;

    if (matchCompleted === true || match.inningsBreak === true)
      return await matchsummary(matchId);


    let battingTeam = match.teams.find(
      (team) => team.teamId === match.currentBatting
    );
    let bowlingTeam = match.teams.find(
      (team) => team.teamId === match.currentBowling
    );

    let striker = battingTeam.players.find(
      (player) => player.playerId === battingTeam.strikerId
    );
    let nonstriker = battingTeam.players.find(
      (player) => player.playerId === battingTeam.nonStrikerId
    );
    let bowler = bowlingTeam.players.find(
      (player) => player.playerId === bowlingTeam.currentBowlerId
    );

    let innings = match.innings
    let target = match.target

    let scoreDetails = {
      score: battingTeam.score,
      wickets: battingTeam.wickets,
      overs: battingTeam.over + "." + battingTeam.ball,
      crr: (battingTeam.over === 0 && battingTeam.ball === 0
        ? 0
        : battingTeam.score / (battingTeam.over + battingTeam.ball / 6)
      ).toFixed(2),
      match: matchDetails.teamA.name + " X " + matchDetails.teamB.name,
    };
    return {
      scoreDetails,
      striker: {
        playerId: striker.playerId,
        name: striker.name,
        fantasyPoints: striker.fantasyPoints,
        batting: striker.batting,
        sr:
          striker.batting.balls === 0
            ? 0
            : ((striker.batting.runs / striker.batting.balls) * 100).toFixed(2),
      },
      nonstriker: {
        playerId: nonstriker.playerId,
        name: nonstriker.name,
        fantasyPoints: nonstriker.fantasyPoints,
        batting: nonstriker.batting,
        sr:
          nonstriker.batting.balls === 0
            ? 0
            : (
                (nonstriker.batting.runs / nonstriker.batting.balls) *
                100
              ).toFixed(2),
      },
      bowler: {
        playerId: bowler.playerId,
        name: bowler.name,
        fantasyPoints: bowler.fantasyPoints,
        bowler: bowler.bowling,
        ec:
          bowler.bowling.overs === 0 && bowler.bowling.balls === 0
            ? 0
            : (
                bowler.bowling.runs /
                (bowler.bowling.overs + bowler.bowling.balls / 6)
              ).toFixed(2),
      },
      matchCompleted,
      inningsBreak,
      isOngoing,
      innings,
      target
    };
  } catch (err) {
    throw err;
  }
}


// Initialize a function to calculate the start index for distributing the prize
function calculateStartDistributingFromRank(nRanks) {
  return Math.ceil((nRanks / 3) * 2);
}

function groupwisePrize(groupCount, totalSum) {
  // Initial checks to ensure provided values are valid
  if (groupCount <= 0 || totalSum <= 0) {
    return "Group count and total sum must be positive values.";
  }

  let prizes = [];
  let remainingSum = totalSum;
  let decrement = Math.floor(totalSum / ((groupCount * (groupCount + 1)) / 2));

  for (let i = 0; i < groupCount; i++) {
    let prize = decrement * (groupCount - i);
    prizes.push(prize);
    remainingSum -= prize;
  }

  // If there's a small remainder due to rounding, adjust the last few prizes incrementally
  let index = groupCount - 1;
  while (remainingSum > 0 && index >= 0) {
    prizes[index]++;
    remainingSum--;
    index = (index - 1) % groupCount; // Cycle back to the top prize if needed
  }

  // Return the array of prize values
  return prizes;
}

function determineGroupSize(totalUsers) {
  if (totalUsers <= 10) return 3;
  if (totalUsers <= 25) return 4;
  if (totalUsers <= 50) return 5;
  if (totalUsers <= 100) return 15;
  if (totalUsers <= 500) return 35;
  if (totalUsers <= 1000) return 70;
  return 100;
}

// Update the distributePrizes function to include top 7% calculation
function distributePrizes(totalPrizePool, nRanks) {
  const initialRankValue = Math.round(totalPrizePool / nRanks);

  const prizes = new Array(nRanks).fill(0); // Initialize all prizes with 0

  const t = calculateStartDistributingFromRank(nRanks);
  let groupPrize = [];
  const mGroupSize = determineGroupSize(t);
  const nGroups = Math.round(t / mGroupSize);

  //(Math.round(totalPrizePool/t)/mGroupSize)
  groupPrize = groupwisePrize(nGroups, totalPrizePool / determineGroupSize(t));

  let incrmt = 0;
  for (let rank = 0; rank < t; rank += mGroupSize) {
    
    for (let i = 0; i < mGroupSize && rank + i < nRanks; i++) {
      // Ensure not to overwrite top 7% already assigned prizes
      if (prizes[rank + i] === 0) {
        prizes[rank + i] = groupPrize[incrmt];
        //console.log("prize in gp: "+groupPrize[incrmt])
      }
    }
    incrmt++;
  }
  for (let i = 0; i < nRanks; i++) if (prizes[i] === undefined) prizes[i] = 0;

  let sum = prizes.reduce(function (a, b) {
    return a + b;
  }, 0);

  return prizes;
}

// console.log(distributePrizes(70000, 2));
function smallLeagues(amt, ranks) {
  const prizes = new Array(ranks).fill(0);
  prizes[0] = amt;
  return prizes;
}

function getDistribution(totalAmount, totalRanks, limit) {
  let commission = 0;
  prizes = [];
  if (totalRanks <= limit) {
    commission = Math.round(totalAmount * 0.1);
    totalAmount -= commission;
    prizes = smallLeagues(totalAmount, totalRanks);
  } else {
    commission = Math.round(totalAmount * 0.3);
    totalAmount -= commission;
    const initial = Math.round(commission / 3);
    commission -= initial;
    prizes = distributePrizes(totalAmount, totalRanks);
    prizes[0] += Math.round(initial * 0.5);
    prizes[1] += Math.round(initial * 0.3);
    prizes[2] += Math.round(initial * 0.2);
  }
  const s = prizes.reduce((acc, prize) => acc + prize, 0);
  if (s < totalAmount) commission += totalAmount - s;
  return { prizes, commission };
}

async function distributeMoneyBetweenUsers(matchId){
  
  let contest = await Contest.find();
  let prizeObj = {};

  for (let contestDetails of contest) {
    const leaderboard = await FantasyJoinContest.find({ matchId,contestId:contestDetails._id }).sort({points:-1});
    prizeObj = getDistribution(
      contestDetails.entryPrize * leaderboard.length,
      leaderboard.length,
      3
    );
    let ind = 0;
    for(let user of leaderboard)
    {
      let result = await User.findByIdAndUpdate(user.userId,{ $inc: { wallet:prizeObj.prizes[ind++] } })
      console.log(result)
    } 
    console.log("**********************************")
  }
  
  
}