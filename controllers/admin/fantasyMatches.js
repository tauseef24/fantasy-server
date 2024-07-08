let fantasyMatch = require('../../models/fantasy-matches')

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