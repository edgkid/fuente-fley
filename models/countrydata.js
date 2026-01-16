var mongoose = require('mongoose'),
    Schema = mongoose.Schema

var countryDataSchema = new Schema({
    alpha2: { type: String, default: '' },
    alpha3: { type: String, default: '' },
    code: { type: String, default: '' },
    currency_code: { type: String, default: '' },
    decimals: { type: Number, default: 2 },
    name: { type: String, default: '' },
    sign: { type: String, default: '' },
    timezones: { type: Array },
    timezones_detail: {
        key: {
            rawOffsetInMinutes: Number,
            abbreviation: String,
            rawFormat: String,
        },
    },
    active: { type: Boolean },
})

var CountryData = mongoose.model('CountryData', countryDataSchema)
module.exports = CountryData
