var mongoose = require('mongoose'), Schema = mongoose.Schema;

var StateByCountrySchema = new Schema({
    unique_id: Number,
    type: { type: String, default: "" },
    country_name: { type: String, default: "" },
    country_id: { type: Schema.Types.ObjectId },
    state_name: { type: String, default: "" },
    features: {type: Array, default: []},
    state_number: { type: Number },
});

var StateByCountry = mongoose.model('StateByCountry', StateByCountrySchema);

module.exports = StateByCountry;