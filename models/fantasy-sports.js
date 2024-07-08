const mongoose = require('mongoose')

const sportSchema = mongoose.Schema({
    sport : {
        type: String,
        required: true
    }
})

const Sport = mongoose.model('Sport',sportSchema,'fantasy-sports')
module.exports = Sport