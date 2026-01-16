const mongoose = require('mongoose'),
        mongoosePaginate = require('mongoose-paginate'),
        Schema = mongoose.Schema;
const mongoosePages = require('mongoose-pages');
const autoIncrement = require('mongoose-auto-increment')


const ferryTicketSchema = new Schema({
    unique_id: Number,
    user_id: {type: Schema.Types.ObjectId},
    user_type: {type: Number},
    amount: {type: Number},
    ticket_cost: {type: Number},
    corporate_id: {type: Schema.Types.ObjectId},
    service_type_id: {type: Schema.Types.ObjectId},
    country_id: {type: Schema.Types.ObjectId},
    type_id: {type: Schema.Types.ObjectId},
    status: {type: Number},
    file_url: {type: String},
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

ferryTicketSchema.plugin(mongoosePaginate);
ferryTicketSchema.plugin(autoIncrement.plugin, {
    model: 'ferryTicketSchema',
    field: 'unique_id',
    startAt: 1,
    incrementBy: 1,
})

mongoosePages.skip(ferryTicketSchema);

module.exports = mongoose.model('Ferry_ticket', ferryTicketSchema);

