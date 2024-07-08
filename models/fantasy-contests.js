const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the collection
const FantasyContests = new Schema({
    name: { type: String, required: true },
    entryPrize: { type: Number, required: true },
    poolMoney: { type: Number, required: true },
    count: { type: Number, default: 0 } // Default count is set to 0
});

// Create a model for the schema
const Contest = mongoose.model('Contest', FantasyContests,"fantasy-contests");

module.exports = Contest;
