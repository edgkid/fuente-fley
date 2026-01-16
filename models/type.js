var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var typeSchema = new Schema({
    typename: {type: String, default: ""},
    typename2: {type: String, default: ""},
    description: {type: String, default: ""},
    type_image_url: {type: String, default: ""},
    map_pin_image_url:{type: String, default: ""},
    panel_map_pin_image_url:{type: String, default: ""},
    service_type: { type: Number, default: 0 },
    priority: { type: Number, default: 0 },
    is_business:{
        type: Number,
        default: 1
    },
    is_default_selected: {type: Boolean, default: false},
    ride_share_limit: { type: Number, default: 2 },
	type_model_list: { type: [Schema.Types.ObjectId], default: []},
	type_service_list: { type: [Schema.Types.ObjectId], default: []},
	type_capacity_list: { type: [Schema.Types.ObjectId], default: []},
	label_capacity_id: { type: [Schema.Types.ObjectId], default: []},
	label_measurement_id: { type: [Schema.Types.ObjectId], default: []},
	label_pallet_id: { type: [Schema.Types.ObjectId], default: []},
    is_use_model: {type: Number, default: 1},
    sequence: {type: String, default: ""},
    is_use_capacity: {type: Number, default: 1},
    is_use_services: {type: Number, default: 1},
    is_use_specification: {type: Number, default: 0},
    model_type: {type: Number},

    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
typeSchema.index({typename: 1}, {background: true});

var Type = mongoose.model('Type', typeSchema);
module.exports = Type;

