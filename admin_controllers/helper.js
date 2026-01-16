let Country = require('mongoose').model('Country');
let console = require('../controllers/console');
let Helper = require('mongoose').model('Helper');

exports.list = async function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        res.redirect('/admin');
        return;
    }

    var page;
    var next;
    var pre;
    var search_item;
    var search_value;
    var sort_order;
    var sort_field;
    var filter_start_date;
    var filter_end_date;

    var query = {};
    var sort = {};
    var array = [];
    var query1 = {};
    var query2 = {};
    var query3 = {};
    var query4 = {};
    var query5 = {};
    var query6 = {};
    if (req.body.page == undefined) {
        sort['unique_id'] = -1;

        search_item = 'first_name';
        search_value = '';
        sort_order = -1;
        sort_field = 'unique_id';
        filter_start_date = '';
        filter_end_date = '';

        var start_date = '';
        var end_state = '';
    } else {

        var field = req.body.sort_item[0];
        var order = req.body.sort_item[1];
        var item = req.body.search_item;
        var value = req.body.search_value;

        sort[field] = order;

        sort_order = req.body.sort_item[1];
        sort_field = req.body.sort_item[0];
        search_item = item
        search_value = value;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;

        var start_date = req.body.start_date;
        var end_state = req.body.end_date;
    }
    if (start_date != '' || end_state != '') {
        if (start_date == '') {
            start_date = new Date(end_state);
            start_date = start_date - 1;
            end_date = new Date(end_state);
            end_date = end_date.setHours(11, 59, 59, 999);
            end_date = new Date(end_date);
            query['created_at'] = {$gte: start_date, $lt: end_date};
        } else if (end_state == '') {
            end_date = new Date(start_date);
            end_date = end_date.setHours(11, 59, 59, 999);
            end_date = new Date(end_date);
            start_date = new Date(start_date);
            start_date = start_date - 1;
            query['created_at'] = {$gte: start_date, $lt: end_date};
        } else {
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_state);
            end_date = end_date.setHours(11, 59, 59, 999);
            end_date = new Date(end_date);
            query['created_at'] = {$gte: start_date, $lt: end_date};
        }
    }
    query['helper_type_id'] = {$eq:req.session.partner._id};

    if (item == 'first_name') {
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var full_name = value.split(' ');
        if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

            query1[item] = new RegExp(value, 'i');
            query2['last_name'] = new RegExp(value, 'i');
            query3[''] = '';
            query4[''] = '';
            query5[''] = '';
            query6[''] = '';
        } else {
            query1[item] = new RegExp(value, 'i');
            query2['last_name'] = new RegExp(value, 'i');
            query3[item] = new RegExp(full_name[0], 'i');
            query4['last_name'] = new RegExp(full_name[0], 'i');
            query5[item] = new RegExp(full_name[1], 'i');
            query6['last_name'] = new RegExp(full_name[1], 'i');
        }
    } else {

        if (item != undefined) {
            query[item] = new RegExp(value, 'i');
        }
    }
    let helpercount = await Helper.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}) 
    if (helpercount != 0) {
        if (req.body.page == undefined) {
            page = 1;
            next = 2;
            pre = page - 1;

            var options = {
                sort: {unique_id: -1},
                page: page,
                limit: 10
            };
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;

            if (field == 'name') {
                var options = {
                    sort: {name: order},
                    page: page,
                    limit: 10
                };
            } else if (field == 'unique_id') {
                var options = {
                    sort: {unique_id: order},
                    page: page,
                    limit: 10
                };
            } else {
                var options = {
                    sort: {email: order},
                    page: page,
                    limit: 10
                };
            }

        }

        let helperlist = await Helper.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, options)
        if (helperlist.docs.length <= 0) {
            res.render('partner_helpers_list', {
                detail: [], currentpage: '', pages: '',
                next: '', pre: '',sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date
            });
        
        } else {
            res.render('partner_helpers_list', {
                detail: helperlist.docs, currentpage:helperlist.page, pages: helperlist.pages,
                next: next, pre: pre,sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date
            });
            delete message;
        }
    }else{
        res.render('partner_helpers_list', {
            detail: [], currentpage: '', pages: '',
            next: '', pre: '',sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date
        });
        delete message;
    }
};


exports.add = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }
        let country_detail = await Country.findOne({countryname: req.session.partner.country})
        res.render("partner_helper_detail_edit", {country_phone_code: country_detail.countryphonecode, phone_number_min_length: setting_detail.minimum_phone_number_length, phone_number_length: setting_detail.maximum_phone_number_length});
        delete message;
    } catch (e) {
        console.log(e);   
    }
}

exports.create_helper = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }
        let response = await Helper.findOne({phone: req.body.phone})
        if (response) {
        alert_message_type = "alert-danger";
        message = admin_messages.error_message_mobile_no_already_used;
        res.redirect('/partner_helpers');
        return;
        } 
        req.body.cedula = ''
        if(req.body.cedula0 != '' && req.body.cedula1){
            req.body.cedula = req.body.cedula0+'-'+req.body.cedula1
        }

        let name = req.body.name;
        if (name !== undefined) {
            name = name.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        
        var helper = new Helper({
            name: name,
            country_phone_code: req.body.country_phone_code,
            phone: req.body.phone,
            helper_type_id: req.session.partner._id,
            cedula: req.body.cedula,
        });

        await helper.save()
        message = "Helper Add Successfully"
        res.redirect('/partner_helpers');
        setTimeout(() => {
        delete message;
        }, 1000)
    } catch (e) {
        console.log(e);   
    }
};

exports.edit = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }
        var id = req.body.id;
        let helper = await Helper.findById(id).lean()
        if(helper){
            let str = helper.cedula;
            helper.cedula = []         
            helper.cedula = str.split('-');         
        }

        res.render('partner_helper_detail_edit', {data:helper, country_phone_code: helper.country_phone_code, phone_number_min_length: setting_detail.minimum_phone_number_length, phone_number_length: setting_detail.maximum_phone_number_length});
        delete message;
    } catch (e) {
        console.log(e);   
    }
}

exports.update = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }
        if(req.body.cedula0 != '' && req.body.cedula1){
            req.body.cedula = req.body.cedula0+'-'+req.body.cedula1
        }

        let id = req.body.id;
        let name = req.body.name;
        if (name !== undefined) {
            req.body.name = name.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        await Helper.findByIdAndUpdate(id, req.body)
        res.redirect("/partner_helpers");
    } catch (e) {
        console.log(e);   
    }
}