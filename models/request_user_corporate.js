var mongoose = require('mongoose'),
    mongoosePaginate = require('mongoose-paginate'),
    Schema = mongoose.Schema
var mongoosePages = require('mongoose-pages')
var autoIncrement = require('mongoose-auto-increment')

var requestUserCorporateSchema = new Schema({
    unique_id: Number,
    country: { type: String, required: true },
    city: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    countryCode: { type: String, required: true },
    password: { type: String, required: true },
    logo: { type: Buffer },
    document: { type: Buffer },
    status: { type: String, default: 'pending' },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    }
}, { collection: 'request_user_coorporate' })

requestUserCorporateSchema.index({ email: 1 }, { background: true })
requestUserCorporateSchema.index({ phone: 1 }, { background: true })
requestUserCorporateSchema.index({ status: 1 }, { background: true })

requestUserCorporateSchema.plugin(mongoosePaginate)
requestUserCorporateSchema.plugin(autoIncrement.plugin, {
    model: 'requestUserCorporateSchema',
    field: 'unique_id',
    startAt: 1,
    incrementBy: 1,
})
mongoosePages.skip(requestUserCorporateSchema)

module.exports = mongoose.model('RequestUserCorporate', requestUserCorporateSchema)