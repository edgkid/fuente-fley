let utils = require('../controllers/utils');
let moment = require('moment');
var xl = require('excel4node');
var fs = require("fs");
var console = require('../controllers/console');
let Type_services = require('mongoose').model('type_services');
let Service_Specifications = require('mongoose').model('service_specifications');

exports.type_service_list = async function (req, res) {
    if (typeof req.session.userid == 'undefined') {
        res.redirect('/admin');
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
    let array = [];
    let value;
    let start_date;
    let end_date;

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
        search_item = '';
        search_value = '';
        sort_order = -1;
        sort_field = 'unique_id';
        filter_start_date = '';
        filter_end_date = '';
    } else {
        sort_order = req.body.sort_item[1];
        sort_field = req.body.sort_item[0];
        search_item = req.body.search_item
        search_value = req.body.search_value;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;
    }
    let filter = { "$match": {} };

    if (req.body.start_date == '' || req.body.end_date == '') {
        if (req.body.start_date == '' && req.body.end_date == '') {
            start_date = new Date(0);
            filter["$match"]['created_at'] = { $gte: start_date };
        } else if (req.body.start_date == '') {
            start_date = new Date(0);
            end_date = req.body.end_date;
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
            filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
        } else {
            start_date = req.body.start_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(Date.now());
            filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
        }
    } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
        start_date = new Date(0);
        filter["$match"]['created_at'] = { $gte: start_date };
    } else {
        start_date = req.body.start_date;
        end_date = req.body.end_date;
        start_date = new Date(start_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = new Date(end_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);
        filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
    }

    let number_of_rec = 10;

    value = search_value;
    value = value.replace(/^\s+|\s+$/g, '');
    value = value.replace(/ +(?= )/g, '');

    let search = { "$match": {} };

    if (value.length != 0) {
        if (search_item == "unique_id") {
            search["$match"][search_item] = { $eq: Number(value) };
        } else {
            search["$match"][search_item] = { $regex: new RegExp(value, 'i') };
        }
    }

    let sort = { "$sort": {} };
    sort["$sort"][sort_field] = parseInt(sort_order);

    let count = { $group: { _id: null, total: { $sum: 1 } } };

    let skip = {};
    skip["$skip"] = page * number_of_rec;

    let limit = {};
    limit["$limit"] = number_of_rec;


    array = await Type_services.aggregate([search, filter, count]);
    if (!array || array.length == 0) {
        array = [];
        res.render('type_services', {
            detail: array,
            current_page: 1,
            pages: 0,
            next: 1,
            pre: 0,
            moment: moment,
            sort_field,
            sort_order,
            search_item,
            search_value,
            filter_start_date,
            filter_end_date
        });
        delete message;
        return;
    }

    let pages = Math.ceil(array[0].total / number_of_rec);
    array = await Type_services.aggregate([search, filter, sort, skip, limit])
    res.render('type_services', {
        detail: array,
        timezone_for_display_date: setting_detail.timezone_for_display_date,
        current_page: page,
        pages: pages,
        next: next,
        pre: pre,
        moment: moment,
        sort_field,
        sort_order,
        search_item,
        search_value,
        filter_start_date,
        filter_end_date
    });
    delete message;
    return;
};

exports.generate_type_service_excel = async function (req, res) {
    if (typeof req.session.userid == 'undefined') {
        res.redirect('/admin');
        return;
    }
    let search_item;
    let search_value;
    let sort_order;
    let sort_field;
    let array = [];
    let value;
    let start_date;
    let end_date;

    if (req.body.search_item == undefined) {
        search_item = '';
        search_value = '';
        sort_order = -1;
        sort_field = 'unique_id';
        filter_start_date = '';
        filter_end_date = '';
    } else {
        sort_order = req.body.sort_item[1];
        sort_field = req.body.sort_item[0];
        search_item = req.body.search_item
        search_value = req.body.search_value;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;
    }
    let filter = { "$match": {} };

    if (req.body.start_date == '' || req.body.end_date == '') {
        if (req.body.start_date == '' && req.body.end_date == '') {
            start_date = new Date(0);
            filter["$match"]['created_at'] = { $gte: start_date };
        } else if (req.body.start_date == '') {
            start_date = new Date(0);
            end_date = req.body.end_date;
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
            filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
        } else {
            start_date = req.body.start_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(Date.now());
            filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
        }
    } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
        start_date = new Date(0);
        filter["$match"]['created_at'] = { $gte: start_date };
    } else {
        start_date = req.body.start_date;
        end_date = req.body.end_date;
        start_date = new Date(start_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = new Date(end_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);
        filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
    }

    value = search_value;
    value = value.replace(/^\s+|\s+$/g, '');
    value = value.replace(/ +(?= )/g, '');

    let search = { "$match": {} };

    if (value.length != 0) {
        if (search_item == "unique_id") {
            search["$match"][search_item] = { $eq: Number(value) };
        } else {
            search["$match"][search_item] = { $regex: new RegExp(value, 'i') };
        }
    }

    let sort = { "$sort": {} };
    sort["$sort"][sort_field] = parseInt(sort_order);

    array = await Type_services.aggregate([search, filter, sort])
    let date = new Date()
    let time = date.getTime()
    let wb = new xl.Workbook();
    let ws = wb.addWorksheet('sheet1');
    let col = 1;
    let exp_date;

    ws.cell(1, col++).string(req.__('title_id'));
    ws.cell(1, col++).string(req.__('title_token_name'));
    ws.cell(1, col++).string(req.__('title_token_value'));
    ws.cell(1, col++).string(req.__('title_state'));
    ws.cell(1, col++).string(req.__('title_is_expired'));

    array.forEach(function (data, index) {
        col = 1;
        ws.cell(index + 2, col++).number(data.unique_id);
        ws.cell(index + 2, col++).string(data.token_name);
        ws.cell(index + 2, col++).string(data.token_value);
        if (data.state == 1) {
            ws.cell(index + 2, col++).string(req.__('title_active'));
        } else {
            ws.cell(index + 2, col++).string(req.__('title_inactive'));
        }

        exp_date = new Date(data.code_expiry);
        if (exp_date.getTime() < date.getTime()) {
            ws.cell(index + 2, col++).string("EXPIRED");
        } else {
            ws.cell(index + 2, col++).string(moment(data.code_expiry).tz(setting_detail.timezone_for_display_date).format("DD MMM YY"));
        }

        if (index == array.length - 1) {
            wb.write('data/xlsheet/' + time + '_guest_token.xlsx', function (err, stats) {
                if (err) {
                    console.error(err);
                } else {
                    let url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_guest_token.xlsx";
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_guest_token.xlsx', function (err, file) {
                        });
                    }, 10000)
                    return;
                }
            });
        }
    })
};


exports.edit = async function (req, res) {
    if (typeof req.session.userid == 'undefined') {
        res.redirect('/admin');
        return;
    }
    let id = req.body.id;
    let type_service = await Type_services.findById(id);
    let specifiactions = await Service_Specifications.find({ state: 1 }); 

    res.render('type_service_detail_edit', { data: type_service, moment: moment, timezone_for_display_date: setting_detail.timezone_for_display_date, specification_list:specifiactions });
    return;
};

exports.update = async function (req, res) {
    if (typeof req.session.userid == 'undefined') {
        res.redirect('/admin');
        return;
    }
    if(!req.body.specification_array){
        req.body.specification_array = []
    }

    let id = req.body.id;
    await Type_services.findByIdAndUpdate(id, req.body)
    res.redirect('/type_services');
    return;
};

exports.act = async function (req, res) {
    if (typeof req.session.userid == 'undefined') {
        res.redirect('/admin');
        return;
    }
    let id = req.body.id;
    let state = req.body.state;
    let change;
    if (state == 1) {
        change = 0;
    } else {
        change = 1;
    }
    await Type_services.findByIdAndUpdate(id, { state: change });
    res.redirect('/type_services');
    return;
};


exports.add_type_service_form = async function (req, res) {
    if (typeof req.session.userid == "undefined") {
        res.redirect('/admin');
        return;
    }
    let specifiactions = await Service_Specifications.find({ state: 1 }); 

    res.render('type_service_detail_edit',{specification_list:specifiactions});
    return;
};

exports.add_type_service = async function (req, res) {
    if (typeof req.session.userid == "undefined") {
        res.redirect('/admin');
        return;
    }
    var type_service = new Type_services({
        service_name: req.body.service_name,
        courier_type: req.body.courier_type,
        state: 1
    });

    await type_service.save()
    res.redirect("/type_services");
    return;
};