var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var zonevalueSchema = new Schema({
    cityid: { type: Schema.Types.ObjectId },
    service_type_id: { type: Schema.Types.ObjectId },
    from: { type: Schema.Types.ObjectId },
    to: { type: Schema.Types.ObjectId },
    amount: {type: Number, default: 0}, 
    partner_profit_fees: {type: Number, default: 0},
    model_id: [{type: Schema.Types.ObjectId, default: [] }],
    cost_per_helper: {type: Number},
    night_shift: { type: Number, default: 0 }, 
    boat_ticket: { type: Number, default: 0 }, 
    cost_per_stop_inside_city: { type: Number, default: 0 }, 
    cost_per_stop_outside_city: { type: Number, default: 0 },
    partner_profit_type: {type: Number}, // 0 - Percentage , 1 - Net Price
    ti_zone: {type: Number},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
zonevalueSchema.index({from: 1, to: 1}, {background: true});

var ZoneValue = mongoose.model('ZoneValue', zonevalueSchema);
module.exports = ZoneValue;

