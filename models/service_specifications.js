var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var serviceSpecifications = new Schema({
    unique_id: Number,
	specification_name: { type: String, default: "" },
	specification_note: { type: String, default: "" },
	state: { type: Number, default: 0 }, // 1 - Active , 0 - Inactive
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});
serviceSpecifications.index({title: 1}, {background: true});

serviceSpecifications.plugin(autoIncrement.plugin, {model: 'service_specifications', field: 'unique_id', startAt: 1, incrementBy: 1});

var Service_Specifications = mongoose.model('service_specifications', serviceSpecifications);
module.exports = Service_Specifications;