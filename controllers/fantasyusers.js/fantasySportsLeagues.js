const Sports = require('../../models/fantasy-sports')
const League = require('../../models/fantasy-league')

exports.getFantasySports = async (req,res)=>{
    try{
        let sports = await Sports.find()
        return res.status(200).send(sports)
    }
    catch(err)
    {
        return res.status(500).send("sports not working")
    }
}

exports.getFantasyLeague = async(req,res)=>{
    try{
        let sportId = req.params.sportId
        let leagues = await League.find({sportId:sportId})
        return res.status(200).send(leagues)
    }
    catch(err)
    {
        return res.status(500).send("leagues not working")
    }
}