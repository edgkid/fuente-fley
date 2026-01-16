var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adminschema = new Schema({
	username: {type: String, default: ""},
	password: {type: String, default: ""},
	email: {type: String, default: ""},
	token:{type: String, default: ""},
	type: {type: Number, default: 0},
	url_array: {type: Array, default: []},
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
	uid: {type: String},
    country_phone_code: { type: String, default: '' },
	country_id: {type: Schema.Types.ObjectId},
	super_admin: {type: Number},
});
adminschema.index({email: 1}, {background: true});

module.exports = mongoose.model('admin',adminschema);



