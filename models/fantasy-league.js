const mongoose = require('mongoose')

const leagueSchema = mongoose.Schema({
    league: {
        type: String,
        required: true
    },
    sport: {
        type: String,
        required: true
    },
    sportId: {
        type: String,
        required: true
    }
})

const League = mongoose.model('League',leagueSchema,'fantasy-league')
module.exports = League