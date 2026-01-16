var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var typeModel = new Schema({
    unique_id: Number,
	model_name: { type: String, default: "" },
	model_image_url: {type: String, default: ""},
	state: { type: Number, default: 0 }, // 1 - Active , 0 - Inactive
	type_service_list: { type: [Schema.Types.ObjectId], default: []},    
	sequence: {type: String, default: ""},
	created_at: { type: Date, default: Date.now },
	model_type: {type: Number},
	updated_at: { type: Date, default: Date.now }
});
typeModel.index({title: 1}, {background: true});

typeModel.plugin(autoIncrement.plugin, {model: 'type_model', field: 'unique_id', startAt: 1, incrementBy: 1});

var Type_Model = mongoose.model('type_model', typeModel);
module.exports = Type_Model;


