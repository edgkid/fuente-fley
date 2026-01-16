const Ferry_ticket = require('mongoose').model('Ferry_ticket');
const utils = require('../controllers/utils');
const console = require('../controllers/console');
const mongoose = require('mongoose');
const Schema = mongoose.Types.ObjectId;
const Trip = require('mongoose').model('Trip');


exports.ferry_tickets = async function (req, res) {
    if (typeof req.session.admin == 'undefined') {
        res.redirect('/corporate_login');
        return;
    }

    let page;
    let next;
    let pre;
    let search_item;
    let search_value;
    let sort_order;
    let sort_field;
    let filter_start_date;
    let filter_end_date;
    if (req.body.page == undefined) {
        page = 0;
        next = 1;
        pre = 0;
    } else {
        page = req.body.page;
        next = parseInt(req.body.page) + 1;
        pre = req.body.page - 1;
    }

    if (req.body.search_item == undefined) {
        var request = req.path.split('/')[1];
        search_item = 'unique_id';
        search_value = '';
        sort_order = -1;
        sort_field = 'unique_id';
        filter_start_date = '';
        filter_end_date = '';

    } else {
        var request = req.body.request;
        var value = req.body.search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        value = new RegExp(value, 'i');


        sort_order = req.body.sort_item[1];
        sort_field = req.body.sort_item[0];
        search_item = req.body.search_item
        search_value = req.body.search_value;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;

    }

    if (req.body.start_date == '' || req.body.end_date == '') {
        if (req.body.start_date == '' && req.body.end_date == '') {
            var date = new Date(Date.now());
            date = date.setHours(0, 0, 0, 0);
            start_date = new Date(0);
            end_date = new Date(Date.now());
        } else if (req.body.start_date == '') {
            start_date = new Date(0);
            var end_date = req.body.end_date;
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        } else {
            var start_date = req.body.start_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(Date.now());
        }
    } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
        start_date = new Date(0);
        end_date = new Date(Date.now());
    } else {
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;
        start_date = new Date(start_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = new Date(end_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);
    }
    if (request == 'partner_requests') {
        Table = Trip;
    }

    const number_of_rec = 10;
    const type_lookup = {
        $lookup:
                {
                    from: "types",
                    localField: "type_id",
                    foreignField: "_id",
                    as: "type_detail"
                }
    };
    const corporate_lookup = {
        $lookup:
                {
                    from: "corporates",
                    localField: "corporate_id",
                    foreignField: "_id",
                    as: "corporate_detail"
                }
    };

    const user_lookup = {
        $lookup:
                {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_detail"
                }
    };


    value = search_value;
    value = value.replace(/^\s+|\s+$/g, '');
    value = value.replace(/ +(?= )/g, '');
    
    const filter = {"$match": {}};
    filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };

    const sort = {"$sort": {}};
    sort["$sort"][sort_field] = parseInt(sort_order);

    const count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

    const skip = {};
    skip["$skip"] = page * number_of_rec;

    const limit = {};
    limit["$limit"] = number_of_rec;


    Ferry_ticket.aggregate([filter, count]).then((array) => { 

        if (!array || array.length == 0) {
            array = [];
            res.render('admin_ferry_tickets', { detail: array, request: request, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0,  sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date,timezone_for_display_date: setting_detail.timezone_for_display_date });
        } else {
            const pages = Math.ceil(array[0].total / number_of_rec);
            Ferry_ticket.aggregate([filter, sort, skip, limit, type_lookup, corporate_lookup, user_lookup]).then((array) => { 
                res.render('admin_ferry_tickets', { detail: array, request: request, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre,  sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, timezone_for_display_date: setting_detail.timezone_for_display_date });
            });
        }
    }, (err) => {
        utils.error_response(err, res)
    });
};

exports.upload_ferry_ticket = async function (req, res) {
    try {
        if (typeof req.session.admin == 'undefined') {
            res.redirect('/admin_login');
            return;
        } 

        const id = req.body.id
        let ferry_ticket = await Ferry_ticket.findById(id)    
        if(!ferry_ticket){
            return res.json({success: false, error_code: error_message.ERROR_CODE_NO_TRIP_FOUND});
        }

        let file_list_size = 0;
        const files_details = req.files;

        if (files_details == null || files_details == 'undefined') {
            message = admin_messages.error_message_doc_upload_failed;
            res.redirect('admin_ferry_tickets');   
            return;
        }
        file_list_size = files_details.length;

        var file_data;
        var file_id;

        let url = ""

        file_data = files_details[0];
        file_id = file_data.fieldname;

        if (file_id == 'ticketData') { 
            let mime_type = req.files[0].mimetype.split('/')[1]
            let file_name = ferry_ticket._id + utils.tokenGenerator(5);
            url = utils.getImageFolderPath(req, 18) + file_name + '.' + mime_type;
            utils.saveImageFromBrowser(req.files[0].path, file_name + '.' + mime_type, 18);                
        }
        ferry_ticket.file_url = url;
        ferry_ticket.status = 1;
        let updateCount = await Ferry_ticket.updateOne({_id:id}, ferry_ticket.getChanges())
        if(updateCount.modifiedCount == 0){
            message = admin_messages.error_message_doc_upload_failed;
            res.redirect('admin_ferry_tickets');   
            return;
        }
        
        message = admin_messages.success_message_doc_uploaded_successfully;
        res.redirect('admin_ferry_tickets');   
        return;
    } catch (e) {
        console.log(e);
    }
};
