var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var typeCapacity = new Schema({
    unique_id: Number,
	capacity_name: { type: String, default:""},
	value: {type: Number, default: 0},
	state: { type: Number, default: 0 }, // 1 - Active , 0 - Inactive
	unit: { type: Number, default: 0 }, // 0 - Kilos, 1 - Litres, 2 - m3/Length    
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});
typeCapacity.index({title: 1}, {background: true});

typeCapacity.plugin(autoIncrement.plugin, {model: 'type_capacity', field: 'unique_id', startAt: 1, incrementBy: 1});

var Type_Capacity = mongoose.model('type_capacity', typeCapacity);
module.exports = Type_Capacity;


