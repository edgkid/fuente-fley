var mongoose = require('mongoose'),
mongoosePaginate = require('mongoose-paginate'),
Schema = mongoose.Schema;
var mongoosePages = require('mongoose-pages');
var autoIncrement = require('mongoose-auto-increment');


var helperSchema = new Schema({
    unique_id: Number,
    name: {type: String, default: ""},
    cedula: {type: String, default: ""},
    phone: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},
    helper_type_id: {type: Schema.Types.ObjectId},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

},{
    usePushEach: true,
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

helperSchema.plugin(mongoosePaginate);
helperSchema.plugin(autoIncrement.plugin, {model: 'helper', field: 'unique_id', startAt: 1, incrementBy: 1});
mongoosePages.skip(helperSchema);

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Helper', helperSchema);

