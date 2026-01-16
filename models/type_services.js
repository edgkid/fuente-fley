var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var typeServices = new Schema({
    unique_id: Number,
	service_name: { type: String, default: "" },
	specification_array: { type: [Schema.Types.ObjectId], default: []},
	courier_type: {type: Number, default: 0 } , // 0 - Normal User selects both Pickup and Destination, 1 - Cisterna User selects only Destination , 2 - Escombro Basura  User selects only Pickup 
	state: { type: Number, default: 0 }, // 1 - Active , 0 - Inactive
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});
typeServices.index({title: 1}, {background: true});

typeServices.plugin(autoIncrement.plugin, {model: 'type_services', field: 'unique_id', startAt: 1, incrementBy: 1});

var Type_Services = mongoose.model('type_services', typeServices);
module.exports = Type_Services;