const mongoose = require('mongoose');
const Schema = mongoose.Types.ObjectId;
const Partner = require('mongoose').model('Partner');
const Inbox_Notifications = require('mongoose').model('Inbox_Notification');
const Corporate = require('mongoose').model('Corporate');
const Country = require('mongoose').model('Country');
const utils = require('../controllers/utils');



exports.inbox_notifications = async function(req, res) {
    if (typeof req.session.userid == "undefined") {
        res.redirect('/admin');
        return;
    }
    let permission = utils.check_admin_permission(req.session.admin, 'inbox_notifications')
    if(!permission){
        res.redirect('/admin');
        return
    }
    let page = 0;
    let next = 1;
    let pre = 0;
    if (req.body.page)
    {
        page = req.body.page;
        next = parseInt(req.body.page) + 1;
        pre = req.body.page - 1;
    }
    const searchParams = getSearchParams(req);
    let search_item= searchParams.search_item
    let search_value= searchParams.search_value
    let sort_order= searchParams.sort_order
    let sort_field= searchParams.sort_field
    let filter_start_date= searchParams.filter_start_date
    let filter_end_date= searchParams.filter_end_date
    let user_type = searchParams.type
    let start_date = req.body.start_date;
    let end_date = req.body.end_date;

    if (end_date == '' || end_date == undefined) {
        end_date = new Date();
    } else {
        end_date = new Date(end_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);
    }

    if (start_date == '' || start_date == undefined) {
        start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
    } else {
        start_date = new Date(start_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
    }
    let number_of_rec = 10
    let filter = {"$match": {'created_at': {$gte: start_date, $lt: end_date} } };
    let sort = {"$sort": {}};
    sort["$sort"][sort_field] = parseInt(sort_order);

    let skip = {};
    skip["$skip"] = page * number_of_rec;

    let limit = {};
    limit["$limit"] = number_of_rec;
    value = search_value;
    value = value.replace(/^\s+|\s+$/g, '');
    value = value.replace(/ +(?= )/g, '');

    let search = handleSearch(search_item, value, req.body.type);
       
    let array = await Inbox_Notifications.aggregate([filter, search, sort, skip, limit])

    res.render('inbox_notifications', { detail: array, 'current_page': 1,  type: user_type, 'pages': 0, 'next': 1, 'pre': 0,  sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date });
    
}

exports.add_notification_form = async function (req, res) {
    if (typeof req.session.userid == "undefined") {
        res.redirect('/admin');
        return;
    }
    let countries = await Country.find({isBusiness: 1}) 

    res.render('inbox_notification_edit', {country: countries});
};

exports.add_inbox_notification = async function (req, res) {
    try {
        if (typeof req.session.userid == "undefined") {
            res.redirect('/admin');
            return;
        }
        let permission = utils.check_admin_permission(req.session.admin, 'inbox_notifications')
        if(!permission){
            res.redirect('/admin');
            return
        }
    
        const message = req.body.message
        const title = req.body.title
        const type = Number(req.body.type)
        const country_id = Schema(req.body.country_id)
        let Table;
    
        let notification = new Inbox_Notifications({
            title,
            message,
            type,
            country_id
        });
    
        notification = await notification.save()
        const tableMapping = {
            [constant_json.CORPORATE_UNIQUE_NUMBER]: Corporate,
            [constant_json.PARTNER_UNIQUE_NUMBER]: Partner
        };
        const notify = {
            _id: notification._id,
            title,
            message: notification.message,
            is_read: 0,
            created_at: notification.created_at
        }
    
        Table = tableMapping[type];

        await Table.updateMany({country_id: country_id},{$push: { mass_notifications: notify } })
        res.redirect("/inbox_notifications");
    } catch (e) {
        console.log(e)
        res.redirect("/inbox_notifications");
    }
};

exports.get_notifications = async function (req, res) {
    try {

        if(req.session.partner == 'undefined' && req.body.type == constant_json.PARTNER_UNIQUE_NUMBER){
            res.redirect('/partner_login');
            return;
        }
        if(req.session.corporate == 'undefined' && req.body.type == constant_json.CORPORATE_UNIQUE_NUMBER){
            res.redirect('/corporate_login');
            return;
        }
        
        const type = req.body.type;
        let Table, user_id;
        
        switch (type) {
            case constant_json.PARTNER_UNIQUE_NUMBER:
                Table = Partner;
                user_id = req.session.partner._id
                break;
            case constant_json.CORPORATE_UNIQUE_NUMBER:
                Table = Corporate;
                user_id = req.session?.corporate?._id
                break;
            default:
                Table = Corporate;
                user_id = req.session?.corporate?._id
                break;
        }

        const user = await Table.findOne({_id: user_id, "mass_notifications.0" : {$exists: true}}, {mass_notifications:1}) 
        if(!user){
            res.json({success:false})
            return;
        }
        const notifications = user.mass_notifications.reverse();
        res.json({success: true, notifications, type})
        
    } catch (e) {
        console.log(e)       
        res.json({success:false})
    }
}

exports.delete = async function (req, res) {
    try {
        if(req.session.userid == 'undefined'){
            res.redirect('/partner_login');
            return;
        }
        
        let type = req.body.type
        const id = req.body.id
        const result = await Inbox_Notifications.deleteOne({_id: id});
        if(!result.deletedCount){
            res.redirect('/inbox_notifications');
            return;
        }
        let Table;
        const tableMapping = {
            [constant_json.CORPORATE_UNIQUE_NUMBER]: Corporate,
            [constant_json.PARTNER_UNIQUE_NUMBER]: Partner
        };
        Table = tableMapping[type];
        await Table.updateMany({"mass_notifications._id":  Schema(id)}, {$pull: { "mass_notifications": {_id: Schema(id)} } })
        res.redirect('/inbox_notifications');
    } catch (e) {
        console.log(e)
        res.redirect('/inbox_notifications');
    }
}

exports.read = async function (req, res) {
    try {
        if(req.session.partner == 'undefined' && req.body.type == constant_json.PARTNER_UNIQUE_NUMBER){
            res.redirect('/partner_login');
            return;
        }
        if(req.session.corporate == 'undefined' && req.body.type == constant_json.CORPORATE_UNIQUE_NUMBER){
            res.redirect('/corporate_login');
            return;
        }
        let type = req.body.type
        const id = req.body.id
        let Table, user_id;
        switch (type) {
            case constant_json.PARTNER_UNIQUE_NUMBER:
                Table = Partner;
                user_id = req.session.partner._id
                break;
            case constant_json.CORPORATE_UNIQUE_NUMBER:
                Table = Corporate;
                user_id = req.session?.corporate?._id
                break;
            default:
                Table = Corporate;
                user_id = req.session?.corporate?._id
                break;
        }
        
        await Table.updateOne({_id: Schema(user_id),"mass_notifications._id":Schema(id)}, { "mass_notifications.$.is_read": 1 })
        res.json({success: true})
    } catch (e) {
        console.log(e)
        res.json({success: false})
    }
}

function getSearchParams(req) {
    let searchParams = {
        search_item: 'unique_id',
        search_value: '',
        sort_order: -1,
        sort_field: 'unique_id',
        filter_start_date: '',
        filter_end_date: '',
    };

    if (req.body.search_item !== undefined) {       
        searchParams.search_value = req.body.search_value.replace(/^\s+|\s+$/g, '');
        searchParams.search_value = searchParams.search_value.replace(/ +(?= )/g, '');

        searchParams.sort_order = req.body.sort_item[1];
        searchParams.sort_field = req.body.sort_item[0];
        searchParams.search_item = req.body.search_item;
        searchParams.filter_start_date = req.body.start_date;
        searchParams.filter_end_date = req.body.end_date;
    }

    return searchParams;
}

function getSearchHandlers(value) {
    return {
        "message": () => ({ "$match": { "message": { $eq: value } } }),
    };
}

function handleSearch(search_item, value) {
    try {

        const searchHandlers = getSearchHandlers( value);

        if (searchHandlers[search_item]) {
            return searchHandlers[search_item](value);
        }

        if (value !== "") {
            let query = {};
            value = Number(value);
            query[search_item] = { $eq: value };
            return { "$match": query };
        }

        return { "$match": {} };

    } catch (e) {
        console.log('Error in handleSearch:', e);
        return { "$match": {} };
    }
};
