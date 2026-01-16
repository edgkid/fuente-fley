var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var rsSchema = new Schema({

    trip_id: { type: Schema.Types.ObjectId},
    service_type_id: { type: Schema.Types.ObjectId},
    city_id: { type: Schema.Types.ObjectId},
    service_type_name:{type: String, default: ""},
    min_fare: {type: Number, default: 0},
    provider_profit: {type: Number, default: 0},

    typename: {type: String, default: ''},
    is_car_rental_business: {type: Number, default: 0},
    car_rental_ids: [{type: Schema.Types.ObjectId, default: [] }],
    base_price_distance: {type: Number, default: 0},
    base_price_time: {type: Number, default: 0},
    base_price: {type: Number, default: 0},
    price_per_unit_distance: {type: Number, default: 0},    
    price_for_total_time: {type: Number, default: 0},

    price_for_waiting_time: {type: Number, default: 0},
    waiting_time_start_after_minute: {type: Number, default: 0},
    price_for_waiting_time_multiple_stops: { type: Number, default: 0 },
    waiting_time_start_after_minute_multiple_stops: { type: Number, default: 0 },
    surge_multiplier: {type: Number, default: 0},
    surge_start_hour: {type: Number, default: 0},
    surge_end_hour: {type: Number, default: 0},
    is_surge_hours: {type: Number, default: 0},

    user_miscellaneous_fee:{
        type: Number,
        default: 0
    },
    provider_miscellaneous_fee:{
        type: Number,
        default: 0
    },
    user_tax:{
        type: Number,
        default: 0
    },
    provider_tax:{
        type: Number,
        default: 0
    },

    tax: {type: Number, default: 0},
    max_space: {type: Number, default: 0},
    cancellation_fee: {type: Number, default: 0},

// Truck Type Pricing
    model_pricing_ids: [{type: Schema.Types.ObjectId, default: [] }],
    modelid:{type: Array, default: []},
    serviceid:{type: Array, default: []},
    capacityid:{type: Array, default: []},
    price_per_km_a: {type: Number, default: 0}, // 0-15 KM
    price_per_km_b: {type: Number, default: 0}, // 16-30  KM
    price_per_km_c: {type: Number, default: 0}, // 31-49 KM
    price_per_km_d: {type: Number, default: 0}, // 50-65 KM
    price_per_km_e: {type: Number, default: 0}, // 66-90 KM
    price_per_km_f: {type: Number, default: 0}, // 91-120 KM
    price_per_km_g: {type: Number, default: 0}, // 121-139 KM
    price_per_km_h: {type: Number, default: 0}, // 140-160 KM
    price_per_km_i: {type: Number, default: 0}, // 161-180 KM 
    price_per_km_j: {type: Number, default: 0}, // 181-200 KM 
    price_per_km_k: {type: Number, default: 0}, // 201-220 KM 
    price_per_km_l: {type: Number, default: 0}, // 221-240 KM 
    price_per_km_m: {type: Number, default: 0}, // 241-260 KM 
    price_per_km_n: {type: Number, default: 0}, // 261-280 KM 
    price_per_km_o: {type: Number, default: 0}, // 281-300 KM 
    price_per_km_p: {type: Number, default: 0}, // 301-450 KM 
    price_per_km_q: {type: Number, default: 0}, // 451-750 KM 
    price_per_km_r: {type: Number, default: 0}, // More than 300
    price_per_km_s: {type: Number, default: 0}, // More than 750
    price_per_km_t: {type: Number, default: 0}, // 801-900 KM 
    price_per_km_u: {type: Number, default: 0}, // 901-1000 KM
    price_per_km_v: {type: Number, default: 0}, // 1001-1300 KM
    price_per_km_w: {type: Number, default: 0}, // More than 1300 KM 
    price_per_km_y: {type: Number, default: 0},
    // cost_surge_for_pickup_caracas: {type: Number, default: 0},
    cost_per_stop_inside_city: {type: Number, default: 0},
    cost_per_stop_outside_city: {type: Number, default: 0},
    cost_per_helper: {type: Number, default: 0},
    cost_travel_insurance: {type: Number, default: 0}, // flat fee for every trip
    fixed_fees: {type: Number, default: 0},
    model_type: {type: Number},  // 1 for Gandola 
    user_type_id: { type: Schema.Types.ObjectId}, // ID of corporate that create this pricing
    user_type: {type: Number, default: 0}, // user who create the pricing 0 - Admin, 5 - Corporate 
    corporate_partner_profit_fees: { type: Number }, // Partner profit for corporate pricing
    ti_internal_transit: { type: Number }, // TI (Internal Transit) panama
    ferry_ticket_price: {type: Number},

    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});
rsSchema.index({city_id: 1, service_type_id: 1}, {background: true});

var Trip_Service = mongoose.model('trip_service', rsSchema);

module.exports = Trip_Service;

