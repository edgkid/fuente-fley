const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const inboxNotification = new Schema({
    unique_id: Number,
	title: { type: String},
	message: { type: String},
	type: {type: Number},
    country_id: {type: Schema.Types.ObjectId},
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});
inboxNotification.index({title: 1}, {background: true});

inboxNotification.plugin(autoIncrement.plugin, {model: 'Inbox_Notification', field: 'unique_id', startAt: 1, incrementBy: 1});

const Inbox_Notification = mongoose.model('Inbox_Notification', inboxNotification);
module.exports = Inbox_Notification;


