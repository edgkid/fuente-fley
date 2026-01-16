var mongoose = require('mongoose'),
    mongoosePaginate = require('mongoose-paginate'),
    Schema = mongoose.Schema
var mongoosePages = require('mongoose-pages')
var autoIncrement = require('mongoose-auto-increment')

var corporateSchema = new Schema({
    unique_id: Number,
    company_name: { type: String, default: '' },
    rif: { type: String, default: '' },
    name: { type: String, default: '' },
    password: { type: String, default: '' },
    email: { type: String, default: '' },
    country_phone_code: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },

    country_id: { type: Schema.Types.ObjectId },
    country_name: { type: String, default: '' },
    wallet_currency_code: { type: String, default: '' },
    customer_id: { type: String, default: '' },

    // FOR BANK DETAIL //
    stripe_doc: { type: String, default: '' },
    account_id: { type: String, default: '' },
    bank_id: { type: String, default: '' },
    ////

    token: { type: String, default: '' },
    is_approved: { type: Number, default: 0 },
    wallet: { type: Number, default: 0 },

    refferal_code: { type: String, default: '' },
    last_transferred_date: {
        type: Date,
        default: Date.now,
    },
    is_own_service_type: { type: Number, default: 0 }, // 0 - use admin added service type, 1 - use corporate added service type
    picture: { type: String, default: '' },
    rif_url: { type: String, default: '' }, // Rif document image/pdf
    document_2: { type: String, default: '' }, // Descarga Documento Constitutivo pdf
    alt_phone: { type: String, default: '' },
    uid: { type: String },
    corporate_type_id: { type: Schema.Types.ObjectId }, // ID of the corproate who created this sub corporate
    corporate_type_userid: { type: Schema.Types.ObjectId }, // ID of the user which associates with sub corporate
    url_array: { type: Array, default: [] },
    is_trip_approve: { type: Number, default: 0 }, // 0 - Trip is auto approved, 1 - Trip needs to be approved
    is_subcorporate_admin: { type: Number, default: 0 }, // 0 - Sub Corporate is not admin, 1 - Sub Corporate is Admin
    is_hide_amount: { type: Number },
    mass_notifications: { type: Array, default: [] },
    preliquidation: { type: Number, default: 0 },
    is_use_fixed_partner_profit: { type: Number, default: 0 },
    is_damasco: { type: Number}, // Check if corporate is damasco,
    allow_edit_trip: {type: Number}, 
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    active_api: {
        type: Boolean,
        default: false,
    },
    api_key: {
        type: String,
        default: '',
    },
})
corporateSchema.index({ phone: 1 }, { background: true })
corporateSchema.index({ email: 1 }, { background: true })

corporateSchema.plugin(mongoosePaginate)
corporateSchema.plugin(autoIncrement.plugin, {
    model: 'corporateSchema',
    field: 'unique_id',
    startAt: 1,
    incrementBy: 1,
})
mongoosePages.skip(corporateSchema)

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Corporate', corporateSchema)
