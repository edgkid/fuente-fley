const Trip = require('mongoose').model('Trip');
const Provider = require('mongoose').model('Provider');
const Trip_Location = require('mongoose').model('trip_location');
const moment = require('moment-timezone');
const xl = require('excel4node');
const fs = require("fs");
const utils = require('../controllers/utils');
const Trip_history = require('mongoose').model('Trip_history');
const Promo_Code = require('mongoose').model('Promo_Code');
const Citytype = require('mongoose').model('city_type');
const Partner = require('mongoose').model('Partner');
const allemails = require('../controllers/emails');
const Provider_Document = require('mongoose').model('Provider_Document');
const Partner_Vehicle_Document = require('mongoose').model('Partner_Vehicle_Document');
const Document = require('mongoose').model('Document');
const TripLocation = require('mongoose').model('trip_location');
const CountryService = require('../services/country.service')
const Country = require('mongoose').model('Country');

exports.list = async function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var page;
        var next;
        var pre;
        var startdate;
        var enddate;
        var user_type_id;
        let selected_country_id = req.body.selected_country_id || null
        if(req.body.user_type_id){
            user_type_id = req.body.user_type_id
        }

        const admin = req.session.admin

        let date_type = "created_at"
        let user_type_query = {user_type_id: Schema(user_type_id)}
        let running_query = { is_provider_accepted: { $gt: 0 } }
        let today_query = { 'created_at': { $gte: startdate, $lt: enddate} }
        let country_query = {$match:{}}
        let non_today_query = {}
        if(!admin.super_admin){
            user_type_query['country_id'] = Schema(admin.country_id)
            running_query['country_id'] = Schema(admin.country_id)
            today_query['country_id'] = Schema(admin.country_id)
            non_today_query['country_id'] = Schema(admin.country_id)
            country_query['$match']['country_id'] = Schema(admin.country_id)
        }else{
            if(selected_country_id){
                country_query['$match']['country_id'] = Schema(selected_country_id)
            }
        }
        const countries = await CountryService.getCountries()

        let provider_type_id;
        if (req.body.page == undefined)
        {
            page = 0;
            next = 1;
            pre = 0;
        } else
        {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        let Table = Trip_history
        const searchParams = getSearchParams(req);
        request= searchParams.request
        let search_item= searchParams.search_item
        let search_value= searchParams.search_value
        let sort_order= searchParams.sort_order
        let sort_field= searchParams.sort_field
        let filter_start_date= searchParams.filter_start_date
        let filter_end_date= searchParams.filter_end_date
        let payment= searchParams.payment
        let status= searchParams.status

        let condition = {};
        let running_condition = { $match: {} };
        let user_type_id_condition = { $match: {} };
        let provider_type_id_condition = { $match: {} };
        let start_date = req.body.start_date;
        let end_date = req.body.end_date;

        if (req.body.user_type_id) {
            user_type_id_condition = { 
                $match: user_type_query
            }
        }
        if (req.body.provider_type_id) {
            provider_type_id = req.body.provider_type_id
            provider_type_id_condition = { $match: { provider_type_id: Schema(provider_type_id) } }
        }
        let number_of_rec = 20;

        if (request == 'running_requests')
        {
            running_condition = { 
                $match: running_query
            };

            Table = Trip;
            number_of_rec = 40;
        }

        if (request == 'today_requests')
        {
            var date = new Date(Date.now());
            date = date.setHours(0, 0, 0, 0);
            startdate = new Date(date);
            enddate = new Date(Date.now());

            start_date = '';
            end_date = '';
            condition = {
                $match: today_query
            };

        } else
        {
            condition = {
                $match: non_today_query
            };
        }

        if (end_date == '' || end_date == undefined) {
            end_date = new Date();
        } else {
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        if (start_date == '' || start_date == undefined) {
            if (request == 'running_requests'){
                start_date = new Date(end_date.getTime() - (90 * 24 * 60 * 60 * 1000));
            }else{
                start_date = new Date(end_date.getTime() - (30 * 24 * 60 * 60 * 1000));
            }
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        } else {
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        }


        const add_pickup_time_field = {
            $addFields: {
                pickup_time: {
                    $cond: {
                        if: { $ne: ["$server_start_time_for_schedule", null] },
                        then: "$server_start_time_for_schedule",
                        else: "$created_at",
                    },
                }
            }
        }
    
        const lookup = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        const unwind = {$unwind: "$user_detail"};

        const lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "current_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };


        const lookup2 = {
            $lookup:
                    {
                        from: "city_types",
                        localField: "service_type_id",
                        foreignField: "_id",
                        as: "city_type_detail"
                    }
        };

        const unwind2 = {$unwind: "$city_type_detail"};

        const lookup3 = {
            $lookup:
                    {
                        from: "types",
                        localField: "city_type_detail.typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        let unwind3 = {
            $unwind: { path: "$type_detail", preserveNullAndEmptyArrays: true }
        };

        const lookup5 = {
            $lookup:
                    {
                        from: "promo_codes",
                        localField: "promo_id",
                        foreignField: "_id",
                        as: "promo_detail"
                    }
        };

        const unwind5 = {
            $unwind: { path: "$promo_detail", preserveNullAndEmptyArrays: true }
        };

        const lookup6 = {
            $lookup:
                    {
                        from: "helpers",
                        localField: "helpers_list",
                        foreignField: "_id",
                        as: "helper_details"
                    }
        };


        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        let search = {$match: {}};
        if (search_item == "user_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1['user_detail.first_name'] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "provider_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "type_detail.typename") {
            var query1 = {};
            query1[search_item] = { $regex: new RegExp(value, 'i') };
            search = { "$match": { $or: [query1] } };
        } else if (search_item == "promo_detail.promocode") {
            var query1 = {};
            query1[search_item] = { $regex: new RegExp(value, 'i') };
            search = { "$match": { $or: [query1] } };
        } else {
            var query1 = {};
            if (value != "") {
                value = Number(value)
                query1[search_item] = { $eq: value };
                search = { "$match": query1 };
            } else {
                search = { $match: {} };
            }
        }

        let payment_condition = {$match: {}};
        if (payment !== 2) {
            payment_condition['$match']['payment_mode'] = {$eq: payment}
        }

        
        const status_condition = getStatusCondition(status);
        let timezone = "America/Caracas"
        if(selected_country_id){
            const country = await Country.findOne({
                _id: selected_country_id
            },{countrytimezone:1}).lean()
            timezone = country?.countrytimezone ? country.countrytimezone : timezone
        }
        
        start_date = utils.get_date_in_city_timezone(start_date, timezone);
        end_date = utils.get_date_in_city_timezone(end_date, timezone);
        date_type = getDateTypeQuery(req.body.date_type)
        let filter = {"$match": {[date_type]: {$gte: start_date, $lt: end_date} } };
        if(value != '' && (req.body.start_date == '' || req.body.start_date == undefined) &&
            (req.body.end_date == '' || req.body.end_date == undefined)){
                filter = {$match: {}}
        }
        if(((req.body.start_date == undefined && req.body.end_date == undefined) || (req.body.start_date == '' && req.body.end_date == '')) && (user_type_id || provider_type_id)){
            filter = {$match: {}}
        }

        let sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        let count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        let skip = {};
        skip["$skip"] = page * number_of_rec;

        let limit = {};
        limit["$limit"] = number_of_rec;
                
        const trip_condition = { $match: { $or: [{ is_schedule_trip: { $eq: false } }, { is_provider_status: 9 }, { is_trip_cancelled: 1 }] } }
        date_type = req.body.date_type
        Table.aggregate([condition, country_query, user_type_id_condition, provider_type_id_condition, trip_condition, payment_condition, status_condition, running_condition, add_pickup_time_field, filter, lookup, unwind, lookup1, lookup2, unwind2, lookup3, unwind3, lookup5, unwind5, lookup6, search, count]).then((array) => { 
            if (!array || array.length == 0)
            {
                array = [];
                res.render('request_list', { detail: array, request: request, user_type_id, provider_type_id, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, status, payment, admin:req.session.admin, countries, selected_country_id, date_type:req.body.date_type });
            } else
            {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Table.aggregate([condition, country_query, user_type_id_condition, provider_type_id_condition, trip_condition, payment_condition, status_condition, running_condition, add_pickup_time_field, filter, lookup, unwind, lookup1, lookup2, unwind2, lookup3, unwind3, lookup5, unwind5, lookup6, search, sort, skip, limit]).then((array) => { 
                    res.render('request_list', { detail: array, timezone_for_display_date: setting_detail.timezone_for_display_date, request: request, user_type_id, provider_type_id, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, status, payment, admin: req.session.admin, countries, selected_country_id, date_type });
                    delete message;
                }, (err) => {
                    utils.error_response(err, res)
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect('/admin');
    }
};

exports.admin_incoming_requests = async function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var page;
        var next;
        var pre;
        var startdate;
        var enddate;
        var user_type_id;
        let selected_country_id = req.body.selected_country_id || null
        if(req.body.user_type_id){
            user_type_id = req.body.user_type_id
        }
        if (req.body.page == undefined)
        {
            page = 0;
            next = 1;
            pre = 0;
        } else
        {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        const admin = req.session.admin

        let non_today_query = {}
        if(!admin.super_admin){
            non_today_query = {country_id : {$eq: Schema(admin.country_id)},}
        }else{
            if(selected_country_id){
                non_today_query['country_id'] = Schema(selected_country_id)
            }
        }
        const countries = await CountryService.getCountries()


        const searchParams = getSearchParams(req);
        request= searchParams.request
        let search_item= searchParams.search_item
        let search_value= searchParams.search_value
        let sort_order= searchParams.sort_order
        let sort_field= searchParams.sort_field
        let filter_start_date= searchParams.filter_start_date
        let filter_end_date= searchParams.filter_end_date
        let payment= searchParams.payment
        let status= searchParams.status


        var condition = {};
        var user_type_id_condition = { $match: {} };
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;
        const trip_approval_condition = { $match: {trip_approved: {$ne:0}} };

        if (req.body.user_type_id) {
            user_type_id_condition = { $match: { user_type_id: Schema(user_type_id) } }
        }


        if (request == 'today_requests')
        {
            var date = new Date(Date.now());
            date = date.setHours(0, 0, 0, 0);
            startdate = new Date(date);
            enddate = new Date(Date.now());

            var start_date = '';
            var end_date = '';
            let today_query = { 'created_at': { $gte: startdate, $lt: enddate} }
            if(!admin.super_admin){
                today_query['country_id'] = Schema(admin.country_id)
            }        
            var condition = {
                $match: today_query
            };

        } else
        {
            var condition = {
                $match: non_today_query
            };
        }

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


        var number_of_rec = 10;

        var lookup = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "assigned_provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };


        var lookup2 = {
            $lookup:
                    {
                        from: "city_types",
                        localField: "service_type_id",
                        foreignField: "_id",
                        as: "city_type_detail"
                    }
        };

        var unwind2 = {$unwind: "$city_type_detail"};

        var lookup3 = {
            $lookup:
                    {
                        from: "types",
                        localField: "city_type_detail.typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        var unwind3 = {$unwind: "$type_detail"};

        var lookup5 = {
            $lookup:
                    {
                        from: "promo_codes",
                        localField: "promo_id",
                        foreignField: "_id",
                        as: "promo_detail"
                    }
        };

        var unwind5 = {
            $unwind: { path: "$promo_detail", preserveNullAndEmptyArrays: true }
        };

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = {$match: {}};
        if (search_item == "user_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1['user_detail.first_name'] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "provider_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "type_detail.typename") {
            var query1 = {};
            query1[search_item] = { $regex: new RegExp(value, 'i') };
            search = { "$match": { $or: [query1] } };
        } else if (search_item == "promo_detail.promocode") {
            var query1 = {};
            query1[search_item] = { $regex: new RegExp(value, 'i') };
            search = { "$match": { $or: [query1] } };
        } else {
            var query1 = {};
            if (value != "") {
                value = Number(value)
                query1[search_item] = { $eq: value };
                search = { "$match": query1 };
            } else {
                search = { $match: {} };
            }
        }

        // var payment_condition = {$match: {}};
        // if (payment !== 2) {
        //     payment_condition['$match']['payment_mode'] = {$eq: payment}
        // }

        var waiting_for_driver_condition = {$match: {}};
        waiting_for_driver_condition['$match']['provider_id'] = {$eq: null}
        waiting_for_driver_condition['$match']['confirmed_provider'] = {$eq: null}
        
        let status_condition = {$match: {}};
        status_condition['$match']['is_trip_cancelled'] = {$eq: 0}
        status_condition['$match']['is_trip_completed'] = {$eq: 0} 

        var filter = {"$match": {'created_at': {$gte: start_date, $lt: end_date} } };

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var trip_booked_condition = { $match: { provider_type_id: { $eq: null } } }
        Trip.aggregate([
            filter, 
            trip_booked_condition, 
            condition, 
            waiting_for_driver_condition,
            user_type_id_condition,
            status_condition, 
            trip_approval_condition, 
            lookup, unwind, lookup1, lookup2, unwind2, 
            lookup3, unwind3, lookup5, unwind5, search, count]).then((array) => { 
            if (!array || array.length == 0)
            {
                array = [];
                res.render('admin_incoming_requests', { detail: array, request: request, user_type_id, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, status, payment, countries, selected_country_id });
            } else
            {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([filter, trip_booked_condition, condition, waiting_for_driver_condition, user_type_id_condition, status_condition, trip_approval_condition, lookup, unwind, lookup1, lookup2, unwind2, lookup3, unwind3, lookup5, unwind5, search, sort, skip, limit]).then((array) => { 

                    res.render('admin_incoming_requests', { detail: array, timezone_for_display_date: setting_detail.timezone_for_display_date, request: request, user_type_id, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, status, payment, countries, selected_country_id });
                    delete message;
                }, (err) => {
                    utils.error_response(err, res)
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect('/admin');
    }
};

exports.history = async function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var page;
        var next;
        var pre;
        var user_type_id;
        if(req.body.user_type_id){
            user_type_id = req.body.user_type_id
        }
        if (req.body.page == undefined)
        {
            page = 0;
            next = 1;
            pre = 0;
        } else
        {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        const admin = req.session.admin
        let partner_lookup_query = {
            $expr: {
                $eq: ["$_id", "$$provider_type_id"]
            }
        }
        let search_query = {}
        let country_query = {$match:{}}
        
        if(!admin.super_admin){
            partner_lookup_query['country_id'] = Schema(admin.country_id) 
            country_query['$match']['country_id'] = Schema(admin.country_id) 
        }        

        const searchParams = getSearchParams(req);
        request= searchParams.request
        let search_item= searchParams.search_item
        let search_value= searchParams.search_value
        let sort_order= searchParams.sort_order
        let sort_field= searchParams.sort_field
        let filter_start_date= searchParams.filter_start_date
        let filter_end_date= searchParams.filter_end_date
        let payment= searchParams.payment
        let status= searchParams.status


        let start_date = req.body.start_date;
        let end_date = req.body.end_date;
        let number_of_rec = 40;



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



        var lookup = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "current_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };


        var lookup2 = {
            $lookup:
                    {
                        from: "city_types",
                        localField: "service_type_id",
                        foreignField: "_id",
                        as: "city_type_detail"
                    }
        };

        var unwind2 = {$unwind: "$city_type_detail"};

        var lookup3 = {
            $lookup:
                    {
                        from: "types",
                        localField: "city_type_detail.typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        var unwind3 = {$unwind: "$type_detail"};


        var lookup6 = {
            $lookup:
                    {
                        from: "helpers",
                        localField: "helpers_list",
                        foreignField: "_id",
                        as: "helper_details"
                    }
        };

        const corporate_lookup = {
            $lookup: {
                from: "corporates",
                let: { user_type_id: "$user_type_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$_id", "$$user_type_id"]
                            }
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            _id: 0                 
                        }
                    }
                ],
                as: "corporate_detail"
            }
        };
        
        const partner_lookup = {
            $lookup: {
                from: "partners",
                let: { provider_type_id: "$provider_type_id" },
                pipeline: [
                    {
                        $match: partner_lookup_query
                    },
                    {
                        $project: {
                            first_name: 1, 
                            last_name: 1, 
                            _id: 0                  
                        }
                    }
                ],
                as: "partner_detail"
            }
        };

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = {
            $match: search_query
        };
        if (search_item == "user_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1['user_detail.first_name'] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "provider_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "type_detail.typename") {
            var query1 = {};
            query1[search_item] = { $regex: new RegExp(value, 'i') };
            search = { "$match": { $or: [query1] } };
        } else if (search_item == "promo_detail.promocode") {
            var query1 = {};
            query1[search_item] = { $regex: new RegExp(value, 'i') };
            search = { "$match": { $or: [query1] } };
        } else {
            var query1 = {};
            if (value != "") {
                value = Number(value)
                query1[search_item] = { $eq: value };
                search = { "$match": query1 };
            } else {
                search = { $match: {} };
            }
        }

        var payment_condition = {$match: {}};
        if (payment !== 2) {
            payment_condition['$match']['payment_mode'] = {$eq: payment}
        }

        const status_condition = getStatusCondition(status);

        var filter = {"$match": {'created_at': {$gte: start_date, $lt: end_date} } };
        if(value != '' && (req.body.start_date == '' || req.body.start_date == undefined) &&
            (req.body.end_date == '' || req.body.end_date == undefined)){
                filter = {$match: {}}
        }
        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        let count_trips = Trip.aggregate([filter, payment_condition, status_condition, country_query, search, count])
        let count_trip_histories = Trip_history.aggregate([filter, payment_condition, status_condition, country_query, search, count])
        let [countTrips, countTripHistories] = await Promise.all([
            count_trips,
            count_trip_histories
        ])
        let totalCount = 0
        countTrips = countTrips[0]?.total || 0
        countTripHistories = countTripHistories[0]?.total || 0
        totalCount = countTrips + countTripHistories
        
        let array = []
        if (totalCount == 0)
        {
            array = [];
            res.render('request_history', { detail: array, request: request,  'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, status, payment, admin:req.session.admin });
        } else
        {                
            const pages = Math.ceil(totalCount / number_of_rec);
            let totalTrips = await Trip.aggregate([filter, payment_condition, status_condition, country_query, search, sort, skip, limit, lookup, unwind, lookup1, lookup2, unwind2, lookup3, unwind3, lookup6  ])
            let totalTripHistories = []
            if(totalTrips.length < number_of_rec){
                const tripsPages = Math.ceil(countTrips / number_of_rec);
                let removeCount = (tripsPages * number_of_rec) - countTrips
                number_of_rec = number_of_rec - totalTrips.length
                let a = page - tripsPages;
                let newPage = Math.max(a, 0);
                if(totalTrips.length != 0){
                    removeCount = 0  
                }
                skip["$skip"] = newPage * number_of_rec + removeCount;
                limit["$limit"] = number_of_rec;
                totalTripHistories = await Trip_history.aggregate([filter, payment_condition, status_condition, country_query, search, sort, skip, limit, lookup, unwind, lookup1, lookup2, unwind2, lookup3, unwind3, lookup6])
            }
            array = totalTrips.concat(totalTripHistories)
            res.render('request_history', { detail: array, timezone_for_display_date: setting_detail.timezone_for_display_date, request: request,  'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, status, payment, admin: req.session.admin });
            delete message;
        }
    } else {
        res.redirect('/admin');
    }
};


exports.genetare_request_excel = async function (req, res) {

    if (typeof req.session.userid != 'undefined') {

        let startdate;
        let enddate;
        let user_type_id;

        const searchParams = getSearchParams(req);
        request= searchParams.request
        let search_item= searchParams.search_item
        let search_value= searchParams.search_value
        let sort_order= searchParams.sort_order
        let sort_field= searchParams.sort_field
        let status= searchParams.status
        let selected_country_id = req.body.selected_country_id || null
        let date_type = "created_at"

        const admin = req.session.admin
        let country_query = {$match:{}}
        if(!admin.super_admin){
            country_query['$match']['country_id'] = Schema(admin.country_id)
        }else{
            if(selected_country_id){
                country_query['$match']['country_id'] = Schema(selected_country_id)
            }
        }

        if(req.body.user_type_id){
            user_type_id = req.body.user_type_id
        }

        if (request == 'today_requests')
        {
            var date = new Date(Date.now());
            date = date.setHours(0, 0, 0, 0);
            startdate = new Date(date);
            enddate = new Date(Date.now());

            var start_date = '';
            var end_date = '';
            var condition = {$match: {'created_at': {$gte: startdate, $lt: enddate}}};

        } else
        {
            var condition = {$match: {}};
        }

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                end_date = new Date(Date.now());
                var start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
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
            end_date = new Date(Date.now());
            var start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
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

        const timeDiff = end_date - start_date;
        const max3Months = 1000 * 60 * 60 * 24 * 93;
        if (timeDiff > max3Months) {
            return res.json({success: false, message: req.__('error_message_export_date_range_exceeded')})
        }



        const add_pickup_time_field = {
            $addFields: {
                pickup_time: {
                    $cond: {
                        if: { $ne: ["$server_start_time_for_schedule", null] },
                        then: "$server_start_time_for_schedule",
                        else: "$created_at",
                    },
                }
            }
        }

        const type_lookup = {
            $lookup:
                    {
                        from: "types",
                        localField: "type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };
        const type_unwind = {$unwind: "$type_detail"};

        const lookup = {
            $lookup:
            {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_detail"
            }
        };
        const unwind = { $unwind: "$user_detail" };

        const lookup1 = {
            $lookup:
            {
                from: "providers",
                localField: "assigned_provider_id",
                foreignField: "_id",
                as: "provider_detail"
            }
        };


        const cedula_lookup = {
            $lookup:
            {
                from: "provider_documents",
                let: { provider_id: '$assigned_provider_id' },
                pipeline: [
                    { $match: 
                        { $expr: 
                            { $and: 
                                [
                                    { $eq: [  "$provider_id", "$$provider_id" ] },
                                    { $eq: [ "$name", "Cédula" ] }
                                ] 
                            }
                        }
                    }
                ],
                as: "provider_cedula"
            }
        };

        const helper_lookup = {
            $lookup: {
                from: "helpers",
                let: { helpers: { $ifNull: ["$helpers_list", []] }, },
                pipeline: [
                    { $match: 
                        { $expr: 
                            { $and: 
                                [
                                    { $in: [  "$_id", "$$helpers" ] }
                                ] 
                            }
                        }
                    },
                    {
                    $project: { name: 1, cedula: 1 }
                    }
                ],
                as: "helper_detail"
            }
        };

        const partner_lookup = {
            $lookup:
                    {
                        from: "partners",
                        localField: "provider_type_id",
                        foreignField: "_id",
                        as: "partner_detail"
                    }
        };

        const corporate_lookup = {
            $lookup: {
                from: "corporates",
                let: { user_type_id: "$user_type_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$_id", "$$user_type_id"]
                            }
                        }
                    },
                    {
                        $project: {
                            company_name: 1,
                            _id: 0                 
                        }
                    }
                ],
                as: "corporate_detail"
            }
        };

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var user_type_id_condition = { $match: {} };
        if (req.body.user_type_id) {
            user_type_id_condition = { $match: { user_type_id: Schema(user_type_id) } }
        }
        if (search_item == "user_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "provider_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "promo_detail.promocode") {
            var query1 = {};
            query1[search_item] = { $regex: new RegExp(value, 'i') };
            search = { "$match": { $or: [query1] } };
        } else {
            var query1 = {};
            if (value != "")
            {
                value = Number(value)
                query1[search_item] = {$eq: value};
                var search = {"$match": query1};
            } else
            {
                var search = {$match: {}};
            }
        }
        let timezone = "America/Caracas"
        if(selected_country_id){
            const country = await Country.findOne({
                _id: selected_country_id
            },{countrytimezone:1}).lean()
            timezone = country?.countrytimezone ? country.countrytimezone : timezone
        }

        start_date = utils.get_date_in_city_timezone(start_date, timezone);
        end_date = utils.get_date_in_city_timezone(end_date, timezone);
        date_type = getDateTypeQuery(req.body.date_type)
        var filter = {"$match": {[date_type]: {$gte: start_date, $lt: end_date} } };
        
        const status_condition = getStatusCondition(status);

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var Table = Trip_history
        var request = req.body.request;
        if (request == 'running_requests')
        {
            Table = Trip;
        }
        const skip = {};
        req.body.page_number = req.body.page_number > 0 ? req.body.page_number - 1 : 0
        skip["$skip"] = req.body.page_number * 20;

        const limit = {};
        limit["$limit"] = 20;
        var trip_condition = { $match: { $or: [{ is_schedule_trip: { $eq: false } }, { is_trip_cancelled: 1 }] } }
        date_type = req.body.date_type

        Table.aggregate([country_query, condition, user_type_id_condition, trip_condition, status_condition, add_pickup_time_field, filter, lookup, unwind, lookup1, search, sort, type_lookup, type_unwind, cedula_lookup, helper_lookup, partner_lookup, corporate_lookup]).then((array) => {
            if(!array.length){
                res.json({success:false})
                return;
            } 

            var date = new Date()
            var time = date.getTime()

            var wb = new xl.Workbook();
            var ws = wb.addWorksheet('sheet1');
            var col = 1;
            let note_count = 0 

            ws.cell(1, col++).string(req.__('title_id'));
            ws.cell(1, col++).string(req.__('title_paid_client'));
            ws.cell(1, col++).string(req.__('title_paid_partner'));
            ws.cell(1, col++).string(req.__('title_user'));
            ws.cell(1, col++).string(req.__('title_company'));
            ws.cell(1, col++).string(req.__('title_provider'));
            ws.cell(1, col++).string(req.__('title_plate_no'));
            ws.cell(1, col++).string(req.__('title_partner'));
            ws.cell(1, col++).string(req.__('title_origin'));
            ws.cell(1, col++).string(req.__('title_destination'));
            ws.cell(1, col++).string(req.__('title_created_date'));
            ws.cell(1, col++).string(req.__('title_truck_model'));
            ws.cell(1, col++).string(req.__('title_type_of_truck'));
            ws.cell(1, col++).string(req.__('title_total_cities'));
            ws.cell(1, col++).string(req.__('title_helpers'));
            ws.cell(1, col++).string(req.__('title_status'));
            ws.cell(1, col++).string(req.__('title_loading_date'));
            ws.cell(1, col++).string(req.__('title_loading_time'));
            ws.cell(1, col++).string(req.__('title_arrived_date'));
            ws.cell(1, col++).string(req.__('title_arrived_time'));
            ws.cell(1, col++).string(req.__('title_completed_date'));
            ws.cell(1, col++).string(req.__('title_total_time_loading'));
            ws.cell(1, col++).string(req.__('unit_km'));
            ws.cell(1, col++).string(req.__('title_total'));
            ws.cell(1, col++).string(req.__('title_flety'));
            ws.cell(1, col++).string(req.__('title_partner'));
            ws.cell(1, col++).string(req.__('title_preliquidation'));

            array.forEach(function (data, index) {
                col = 1;
                ws.cell(index + 2, col++).string(String(data.unique_id));
                ws.cell(index + 2, col++).string(String(data.paid_client == 1 ? req.__('title_yes') : req.__('title_no')));
                ws.cell(index + 2, col++).string(String(data.paid_partner == 1 ? req.__('title_yes') : req.__('title_no')));
                ws.cell(index + 2, col++).string(String(data.user_detail.first_name + ' ' + data.user_detail.last_name));
                ws.cell(index + 2, col++).string(String(data?.corporate_detail[0]?.company_name || ""));
                let provider_cedula = "";
                if (data.provider_cedula.length > 0 && data.provider_cedula[0].unique_code) {
                    provider_cedula = ' (' + String(data.provider_cedula[0].unique_code) + ')';
                }
                if (data.provider_detail.length > 0) {
                    ws.cell(index + 2, col++).string(String(data.provider_detail[0].first_name + ' ' + data.provider_detail[0].last_name + provider_cedula));
                } else {
                    col++;
                }
                
                if (data?.assigned_vehicle_details?.vehicle_plate_no) {
                    ws.cell(index + 2, col++).string(String(data?.assigned_vehicle_details?.vehicle_plate_no));
                } else {
                    col++;
                }

                ws.cell(index + 2, col++).string(String(data?.partner_detail?.length ? data.partner_detail[0].first_name +" "+ data.partner_detail[0].last_name : ""));
                ws.cell(index + 2, col++).string(String(data.source_address));
                ws.cell(index + 2, col++).string(String(data.initial_destination_address ?  data.initial_destination_address : data.destination_address));
                ws.cell(index + 2, col++).string(String(moment(data.created_at).tz(setting_detail.timezone_for_display_date).format('DD MMM YYYY')));
                ws.cell(index + 2, col++).string(String(data.type_detail.typename));
                
                if (data.model_details) {
                    ws.cell(index + 2, col++).string(String(data.model_details.model_name));
                } else {
                    col++;
                }
                
                ws.cell(index + 2, col++).string(String(data.destination_addresses.length));
                const helpersString = data.helper_detail.map(helper => `${helper.name} (${helper.cedula})`).join(', ');
                ws.cell(index + 2, col++).string(String(helpersString));
                        
                if (data.is_trip_cancelled == 1) {
                    if (data.is_trip_cancelled_by_provider == 1) {
                        ws.cell(index + 2, col++).string(req.__('title_total_cancelled_by_provider'));
                    } else if (data.is_trip_cancelled_by_user == 1) {
                        ws.cell(index + 2, col++).string(req.__('title_total_cancelled_by_user'));
                    } else {
                        ws.cell(index + 2, col++).string(req.__('title_total_cancelled'));
                    }
                } else {
                    if (data.is_provider_status == 2) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_coming'));
                    } else if (data.is_provider_status == 4) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_arrived'));
                    } else if (data.is_provider_status == 6) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_trip_started'));
                    } else if (data.is_provider_status == 7) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_arrived_at_destination'));
                    } else if (data.is_provider_status == 9) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_completed'));
                    } else if (data.is_provider_status == 1 || data.is_provider_status == 0) {
                        if (data.is_provider_accepted == 1) {
                            ws.cell(index + 2, col++).string(req.__('title_trip_status_accepted'));
                        } else {
                            ws.cell(index + 2, col++).string(req.__('title_trip_status_waiting'));
                        }
                    }
                }
                if(data.server_start_time_for_schedule){
                    ws.cell(index + 2, col++).string(String(moment(data.server_start_time_for_schedule).tz(setting_detail.timezone_for_display_date ).format("DD MMM 'YY")));
                }else{
                    ws.cell(index + 2, col++).string(String(moment(data.created_at).tz(setting_detail.timezone_for_display_date ).format("DD MMM 'YY")));
                }
                if(data.server_start_time_for_schedule){
                    ws.cell(index + 2, col++).string(String(moment(data.server_start_time_for_schedule).tz(setting_detail.timezone_for_display_date ).format("hh:mm a")));
                }else{
                    ws.cell(index + 2, col++).string(String(moment(data.created_at).tz(setting_detail.timezone_for_display_date ).format("hh:mm a")));
                }
                if(data.provider_arrived_destination_time){
                    ws.cell(index + 2, col++).string(String(moment(data.provider_arrived_destination_time).tz(setting_detail.timezone_for_display_date ).format("DD MMM 'YY")));
                }else {col++;}
                if(data.provider_arrived_destination_time){
                    ws.cell(index + 2, col++).string(String(moment(data.provider_arrived_destination_time).tz(setting_detail.timezone_for_display_date ).format("hh:mm a")));
                }else {col++;}
                ws.cell(index + 2, col++).string(String(moment(data.provider_trip_end_time).tz(setting_detail.timezone_for_display_date).format('DD MMM YYYY HH:mm a')));
                const total_waiting_time = utils.getTimeDifferenceInMinute(data.provider_trip_start_time, data.provider_arrived_time);
                if(total_waiting_time > 0){
                    ws.cell(index + 2, col++).string(String((total_waiting_time/60).toFixed(2)) + ' hr');
                }else {col++;}
                if(data.estimated_distance && data.estimated_distance > 0){
                    ws.cell(index + 2, col++).string(String(data.estimated_distance));
                }else {col++;}
                ws.cell(index + 2, col++).string(String(data.is_trip_cancelled == 1 ? 0 : data.fixed_price - data.promo_payment));
                ws.cell(index + 2, col++).string(String(data.is_trip_cancelled == 1 ? 0 : (data.fixed_price - data.promo_payment - data.provider_service_fees).toFixed(2)));
                ws.cell(index + 2, col++).string(String(data.is_trip_cancelled == 1 ? 0 : data.provider_service_fees.toFixed(2)));
                ws.cell(index + 2, col++).string(String(data.preliquidation == 1 ? req.__('title_yes') : req.__('title_no')));
                data?.corporate_notes?.forEach((note) => {
                    ws.cell(index + 2, col++).string(String(note));
                })
                note_count = data?.corporate_notes?.length > note_count ? data.corporate_notes.length :  note_count

                if (index == array.length - 1) {
                    for(let i = 1; i <= note_count; i ++ ){
                        ws.cell(1, col++).string(req.__('title_note') + " " + String(i));
                    }

                    wb.write('data/xlsheet/' + time + '_trip.xlsx', function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            let url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_trip.xlsx";
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_trip.xlsx', function () {
                                });
                            }, 10000)
                        }
                    });
                }
            })
        }, (err) => {
            utils.error_response(err, res)
        });

    } else {
        res.redirect('/admin');
    }

};


exports.requsest_status_ajax = function (req, res) {

    var array = req.body.trip_id_array;
    var i = 0;
    var tripDetailArray = [];
    Trip.find({_id: {$in: array}}).then((result) => { 
        if(result.length>0)
        {

            result.forEach(function (trip_data) {
    
                var provider_id = '';
                if (trip_data.confirmed_provider != null)
                {
                    provider_id = trip_data.confirmed_provider
                } else if (trip_data.current_provider != null)
                {
                    provider_id = trip_data.current_provider
                }
                if (provider_id != "")
                {
                    Provider.findById(provider_id).then((provider_detail) => { 
                        i++;
    
                        tripDetailArray.push({trip_detail: trip_data, provider: provider_detail.first_name + ' ' + provider_detail.last_name});
                        if (result.length == i)
                        {
                            res.json(tripDetailArray)
                        }
                    })
                } else
                {
                    i++;
    
                    tripDetailArray.push({trip_detail: trip_data, provider: ''});
                    if (result.length == i)
                    {
                        res.json(tripDetailArray)
                    }
                }
            })
        }
        else{
            res.json(tripDetailArray)
        }
    })
}

  exports.trip_map = async function (req, res) {
     if (typeof req.session.userid != 'undefined') {
        try {
        var id = req.body.id;
        var user_name = req.body.u_name;
        var provider_name = req.body.pr_name;
            let query = { tripID: id };
            let trips = await Trip.findById(id);
            const trip_history = await Trip_history.findById(id);
            
            if (!trips) {
                trips = trip_history;
            }
            if (trips?.assigned_vehicle_id) {
                const partner = await Partner.findOne(
                    { "vehicle_detail._id": trips.assigned_vehicle_id },
                    { "vehicle_detail.$": 1 }
                );
                if (partner?.vehicle_detail?.length) {
                    const vehicle = partner.vehicle_detail[0];
                    trips.assigned_vehicle_details.hasDevicesTemperature =
                        vehicle?.hasDevicesTemperature || false;
                } else {
                    console.log("⚠ No se encontró vehículo con ese ID en partners");
                }
            }

            const promocode = await Promo_Code.findById(trips.promo_id);
            const locations = await Trip_Location.findOne(query);
            const url =
                "https://maps.googleapis.com/maps/api/js?key=" +
                setting_detail.web_app_google_key +
                "&libraries=places&callback=initialize";

            if (!locations) {
                res.render("trip_map", {
                    data: trips,
                    timezone_for_display_date: setting_detail.timezone_for_display_date,
                    url: url,
                    user_name: user_name,
                    provider_name: provider_name,
                    moment: moment,
                    promocode: promocode,
                });
            } else {
                res.render("trip_map", {
                    data: trips,
                    timezone_for_display_date: setting_detail.timezone_for_display_date,
                    url: url,
                    trip_path_data: locations,
                    user_name: user_name,
                    provider_name: provider_name,
                    moment: moment,
                    promocode: promocode,
                });
            }
        } catch (error) {
            console.error("❌ Error en trip_map:", error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect("/admin");
    }
};



//  REFUND AMOUNT //
//////////////////////////////
exports.trip_refund_amount = function (req, res) {
    
    if (typeof req.session.userid != 'undefined') {

        Trip.findOne({_id: req.body.id}).then((trip) => { 
        Trip_history.findOne({_id: req.body.id}).then((trip_history) => { 
            if (!trip) {
                trip = trip_history
            }
            var stripe = require("stripe")(setting_detail.stripe_secret_key);
            var charge_id = trip.payment_intent_id;

            stripe.refunds.create({
                payment_intent: charge_id
            }, function (err, refund) {
                if (refund) {
                    trip.refund_amount = refund.amount / 100;
                    trip.is_amount_refund = true;
                    trip.save();
                    message = admin_messages.success_message_refund;
                    res.redirect('/requests');
                } else
                {
                    message = admin_messages.error_message_refund;
                    res.redirect('/requests');
                }
            });
               
        });
        });

    } else {
        res.redirect('/admin');
    }
};

exports.get_partner_for_trip = async function (req, res) {
    
    if (typeof req.session.userid != 'undefined') {
        const admin = req.session.admin
        let admin_country = await Country.findOne({_id: admin.country_id}).select({countryname: 1}).lean() 
        if(!admin_country || admin_country.countryname != "Panama"){
            return res.json({success:true, partner_list:[]})
        }
        // var mongoose = require('mongoose');
        // var Schema = mongoose.Types.ObjectId;

        // let trip = await Trip.findOne({_id: Schema(req.body.trip_id)})
        // if (!trip) {
        //     return res.json({success:false})
        // }
        // let citytype = await Citytype.findById(trip.service_type_id)
        // if (!citytype) {
        //     return res.json({success:false})
        // }

        var partner_query = {};

        partner_query["country_id"] = req.body.country_id;
        partner_query["phone"] = req.body.partner_phone;
        // partner_query["vehicle_detail.admin_type_id"] = citytype.typeid;
        // partner_query["vehicle_detail.state"] = 1;
        // partner_query["is_approved"] = 1;
        // if(trip.service_details){
        //     partner_query["vehicle_detail.selected_services_id"] = {$in: [trip.service_details._id]};
        // }
        // if(trip.capacity_details){
        //     partner_query["vehicle_detail.selected_capacity_id"] = trip.capacity_details._id;
        // }
        // if(trip.model_details){
        //     partner_query["vehicle_detail.selected_model_id"] = trip.model_details._id;
        // }

        // partner_query["vehicle_detail"] = {$elemMatch: {"vehicle_book_dates.trip_date": {$nin: [trip.request_time]}}};

        let partners = await Partner.find(partner_query)
        // console.log(partners)               
        return res.json({success:true, partner_list:partners})

    } else {
        res.redirect('/admin');
    }
};


exports.assign_trip_to_partner = async function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        const admin = req.session.admin
        let admin_country = await Country.findOne({_id: admin.country_id}).select({countryname: 1}).lean() 
        if(!admin_country || admin_country.countryname != "Panama"){
            return res.json({success:true, partner_list:[]})
        }

        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;

        let trip = await Trip.findOne({_id: Schema(req.body.trip_id)})
        if (!trip) {
            return res.json({success:false})
        }
        if(trip.provider_id || trip.confirmed_provider || trip.assigned_provider_id || trip.admin_assigned_partner_id){
            message = admin_messages.error_message_trip_already_accepted
            return res.json({success:false})
        }

        let partner = await Partner.findById(Schema(req.body.partner_id))
        if (!partner) {
            return res.json({success:false})
        }

        await Trip.updateOne({ _id: trip._id }, { admin_assigned_partner_id: partner._id } )
        
        var email_notification = setting_detail.email_notification;
        if (email_notification == true) {
            allemails.sendAdminAssignPartnerRequest(req, partner, partner.first_name + " " + partner.last_name);
        }

        // console.log(partners)               
        return res.json({success:true})

    } else {
        res.redirect('/admin');
    }
};
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
exports.chat_history = function (req, res) {

    if (typeof req.session.userid != 'undefined') {

        var condition = {$match:{_id: Schema(req.body.id)}}
        var lookup = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "current_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };
        var unwind1 = {$unwind: {
                path: "$provider_detail",
                preserveNullAndEmptyArrays: true
            }
        };

        Trip.aggregate([condition, lookup, unwind, lookup1, unwind1], function(error, trip_data){
            if(error || trip_data.length==0){
                Trip_history.aggregate([condition, lookup, unwind, lookup1, unwind1], function(error, trip_data){
                    if(error || trip_data.length==0){
                        res.redirect('/requests');
                    } else {
                        res.render('chat_history', { trip_data: trip_data[0], admin: req.session.admin })
                    }
                })
            } else {
                res.render('chat_history', { trip_data: trip_data[0], admin: req.session.admin })
            }
        })
    } else {
        res.redirect('/admin');
    }

};

exports.unassign_trip_to_partner = async function (req, res) {

    if (typeof req.session.userid == 'undefined') {
        res.redirect('/admin');
        return;
    }
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Types.ObjectId;
    
    let trip_id = ObjectId(req.body.trip_id)
    let trip = await Trip.findOne({_id: trip_id});
    let unassign_reason = req.body.unassign_reason || "";
    let admin_id = req.session.admin._id
    if(trip.admin_assigned_partner_id){
        var partner = await Partner.findOne({_id: trip.admin_assigned_partner_id})
    }
    if(!trip){
        message = admin_messages.error_message_unassigned_failed;
        res.redirect('/admin_incoming_requests');
        return;
    }
    if(unassign_reason == ""){
        message = admin_messages.error_message_enter_unassign_reason;
        res.redirect('/admin_incoming_requests');
        return;
    }
    // let device_detail = {
    //     _id: 1,
    //     device_type: 1,
    //     device_token: 1,
    // }

    // let user = await User.findById(trip.user_id).select(device_detail).lean()
    // let provider = await Provider.findById(trip.assigned_provider_id).select(device_detail).lean()
    let unassign_list = trip.unassign_data
    let unassign_obj = {
        unassign_admin_id: Schema(admin_id),
        unassign_reason: unassign_reason,
        unassign_partner_id: Schema(trip.provider_type_id) || null
    }
    unassign_list.push(unassign_obj)
    if((trip.assigned_provider_id || trip.provider_type_id) && trip.is_provider_accepted == 0){
        const update_trip = {
            assigned_provider_id : null,
            assigned_provider_details : null,
            assigned_vehicle_id : null,
            assigned_vehicle_id_2 : null,
            assigned_vehicle_details : null,
            assigned_vehicle_details_2 : null,
            provider_type_id : null,
            is_provider_confirm_trip : 0,
            assigned_partner_name : "",
            sub_corporate_id: null,
            unassign_data: unassign_list
        }
        if(trip?.drop_trip_status > 0){
            update_trip.drop_trip_status = 0
            update_trip.unload_notification_sent = 0
        }

        utils.remove_dates_driver_vehicle(trip._id,  trip.model_type)
        await Trip.updateOne({_id: trip._id}, { $set:update_trip, $unset:{admin_assigned_partner_id: 1, trip_assigned_by:1} } )
    }else if((trip.assigned_provider_id || trip.provider_type_id) && trip.is_provider_accepted > 0){
        let provider_id = trip.assigned_provider_id
        const update_trip = {
            assigned_provider_id : null,
            assigned_provider_details : null,
            assigned_vehicle_id : null,
            assigned_vehicle_id_2 : null,
            assigned_vehicle_details : null,
            assigned_vehicle_details_2 : null,
            provider_type_id : null,
            is_provider_confirm_trip : 0,
            assigned_partner_name : "",
            provider_first_name : "",
            provider_last_name : "",
            provider_id : null,
            helpers_list : [],
            confirmed_provider : null,
            current_provider : null,
            is_provider_accepted: 0,
            is_provider_status: 0,
            sub_corporate_id: null,
            unassign_data: unassign_list
        }
        if(trip?.drop_trip_status > 0){
            update_trip.drop_trip_status = 0
            update_trip.unload_notification_sent = 0
        }

        utils.remove_dates_driver_vehicle(trip._id,  trip.model_type)
        await Provider.updateOne({_id: provider_id}, { is_trip:[], is_available:1} )
        await Trip.updateOne({_id: trip._id}, { $set:update_trip, $unset:{admin_assigned_partner_id: 1, trip_assigned_by:1} } )
    }else if(trip.admin_assigned_partner_id){
        await Trip.updateOne({_id: trip._id}, { $unset:{admin_assigned_partner_id: 1, trip_assigned_by: 1} } )
    }

    // utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user.device_type, user.device_token, push_messages.PUSH_CODE_FOR_USER_NOTIFY_OF_TRIP_UNASSIGNED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
    // utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, push_messages.PUSH_CODE_FOR_DRIVER_NOTIFY_FOR__TRIP_UNASSIGNED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
    var email_notification = setting_detail.email_notification;
    if (email_notification == true && partner) {
        allemails.sendAdminUnassignPartnerRequest(req, partner, trip.unique_id);
    }
    message = req.__(admin_messages.success_message_unassigned_succesfully);

    res.json({success: true, message});
    return;

};

exports.admin_get_provider_documents = async function (req, res) {
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        } 
        let trip = await Trip.findById(req.body.trip_id).select({
            assigned_provider_id:1, 
            assigned_vehicle_id:1, model_type:1, 
            assigned_vehicle_id_2:1, assigned_vehicle_details:1, 
            assigned_vehicle_details_2:1, provider_type_id:1,
            country_id: 1}).lean();
        if (!trip) {
            trip = await Trip_history.findById(req.body.trip_id).select({
                assigned_provider_id:1, 
                assigned_vehicle_id:1, model_type:1, 
                assigned_vehicle_id_2:1, assigned_vehicle_details:1, 
                assigned_vehicle_details_2:1, provider_type_id:1,
                country_id: 1}).lean();
            }
        if (!trip) {
            res.json({success:false, cedula: ""})   
            return;
        }
        let Table, query, query1
        let doc2 = null
        let select = {unique_code:1, document_picture:1}
        const document = await Document.findOne({document_for: Number(req.body.type), countryid: trip.country_id}).select({_id:1}).lean()
        if (!document) {
            res.json({success:false})   
            return;
        }
        switch (Number(req.body.type)) {
            case DOCUMENT_FOR.PROVIDER_CEDULA:
                Table = Provider_Document
                query = {provider_id: trip.assigned_provider_id, document_id: document._id}
                break; 
            case DOCUMENT_FOR.VEHICLE_PLATE:
                Table = Partner_Vehicle_Document
                const otherDocs = await Document.find({document_for: {$in: 
                    Number(DOCUMENT_FOR.CARGO_INSURANCE,DOCUMENT_FOR.THIRD_PARTY_INSURANCE)}, 
                    countryid: trip.country_id}
                ).select({_id:1}).lean()

                const doc_array = [document._id, ...otherDocs.map(d => d._id)];
                query = {vehicle_id: trip.assigned_vehicle_id, document_id: {$in: doc_array}}
                if(trip.model_type == MODEL_TRUCK_TYPE.GANDOLA && trip.assigned_vehicle_id_2){
                    query1 = {vehicle_id: trip.assigned_vehicle_id_2, document_id: {$in: doc_array}}
                }
                break;
            case DOCUMENT_FOR.VEHICLE_FRONT_IMAGE:
                Table = Partner_Vehicle_Document
                query = {vehicle_id: trip.assigned_vehicle_id, document_id: document._id}
                const document2 = await Document.findOne({document_for: Number(DOCUMENT_FOR.VEHICLE_LATERAL_IMAGE),
                    countryid: trip.country_id
                }).select({_id:1}).lean()

                query1 = {vehicle_id: trip.assigned_vehicle_id, document_id: document2._id}
                break;
        }        
        let doc = await Table.find(query).select(select).lean()
        const partner = await Partner.findOne({_id: trip.provider_type_id}).select({ 
            first_name:1,
            last_name:1,
            email:1,
            phone:1,
            partner_company_name:1}).lean()
        if(query1){
            doc2 = await Table.find(query1).select(select).lean()
        }        
        if(!doc && !doc2){
            res.json({success:false, partner})
            return;
        }
        res.json({success:true, doc, doc2, trip, partner})
    } catch (e) {
        console.log(e)
        res.json({success:false, cedula: ""})   
    }    
}

exports.other_user_track_trip = async function (req, res) {
    try {
        const id = req.query.id;
        const query = {};
        query['tripID'] = id;
        const trip = await Trip.findOne({_id: id, is_provider_accepted: 1, is_trip_completed:0, is_trip_end:0}).lean()

        if (!trip) {
            res.redirect('https://flety.io');
        }
        let locations = await Trip_Location.findOne(query)
        const url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places&callback=initialize"
        if (!locations) {
            res.render('track_trip', { 'data': trip, 'url': url, });
        } else {
            res.render('track_trip', { 'data': trip, 'url': url, 'trip_path_data': locations });
        }
    } catch (e) {
        console.log(e);
        res.redirect('https://flety.io');
    }
};

exports.change_trip_paid_status_corporate_partner = async function (req, res) { 
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        } 
        if(req.session.admin.type == 1 && req.session.admin.url_array.indexOf('trip_paid_status_checkbox') == -1){
            res.json({success:false})
            return;
        }
        const is_paid = req.body.is_paid == 1 ? 0 : 1
        const paid_type = req.body.paid_type
        const update_paid_status = { [paid_type]: is_paid}
        let updateCount = await Trip.updateOne({ _id: req.body.trip_id }, update_paid_status)
        if (updateCount.modifiedCount == 0){
            await Trip_history.updateOne({ _id: req.body.trip_id }, update_paid_status)
        }
        res.json({success:true})
        return;
    } catch (e) {
        console.log(e)
        res.json({success:false})
    }    
}

exports.delete_pod = async function (req, res) { // Admin can delte proof of delivery 
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        }
        let Table = Trip
        const trip_id = req.body.trip_id
        const image = req.body.image
        let trip = await Table.findOne({_id: trip_id}).select("pod_image_url").lean() 
        if(!trip){
            Table = Trip_history
            trip = await Table.findOne({_id: trip_id}).select("pod_image_url").lean() 
        }
        if(!trip){
            res.json({success:false})
            return
        }

        let index = trip.pod_image_url.indexOf(image)

        if(index == -1 ){
            res.json({success:false})
            return
        }
        utils.deleteImageFromFolder(image, 12);
        let updateCount = await Table.updateOne(
            {_id: trip_id},
            { $pull: { pod_image_url: image } }
        )
        if(updateCount.modifiedCount != 0){
            res.json({success:true})
            return;
        }
    } catch (e) {
        console.log(e)
        res.json({success:false})
    }    
}

exports.reset_trip_status = async function (req, res) { // Admin can reset trip status to provider accepted 
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        }
        const trip_id = req.body.trip_id
        let trip = await Trip.findOne({_id: trip_id}).select({
            is_provider_status: 1, 
            provider_id: 1, 
            accepted_time: 1
        }).lean() 
        if(!trip){
            res.json({success:false})
            return
        }

        if(trip.is_provider_status < 2 || trip.is_provider_status == 9){
            res.json({success:false})
            return
        }

        const provider = await Provider.findOne({_id: trip.provider_id}).select("providerLocation").lean()

        await Trip.updateOne({_id: trip._id},{
            is_provider_status : 1,
            actual_destination_addresses : [],
            actual_destination_stops : [],
            provider_arrived_time : trip.accepted_time,
            provider_trip_start_time : trip.accepted_time,
            provider_trip_end_time : trip.accepted_time,
            providerLocation : provider.providerLocation,
            provider_arrived_destination_time: "",
            speed: 0
        })

        await TripLocation.updateOne({tripID: trip._id},{
            providerStartLocation: [0, 0],
            startTripLocation: [0, 0],
            endTripLocation: [0, 0],
            providerStartToStartTripLocations: [],
            startTripToEndTripLocations: [],
            googlePathStartLocationToPickUpLocation: "",
            googlePickUpLocationToDestinationLocation: "",
            providerStartTime: "", 
            startTripTime: "", 
            endTripTime: "", 
        })
        
        utils.update_request_status_socket(trip._id);

        res.json({ success: true })

    } catch (e) {
        console.log(e)
        res.json({success:false})
    }    
}

exports.admin_change_preqliuidation = async function (req, res) { 
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        } 
        if(req.session.admin.type == 1 && req.session.admin.url_array.indexOf('trip_preliquidation') == -1){
            res.json({success:false})
            return;
        }
        const is_preliquidation = req.body.preliquidation_status == 1 ? 0 : 1
        const update_preliquidation = { preliquidation : is_preliquidation}
        let updateCount = await Trip.updateOne({ _id: req.body.trip_id }, update_preliquidation)
        if(updateCount.modifiedCount == 0){
            await Trip_history.updateOne({ _id: req.body.trip_id }, update_preliquidation)
        }
        res.json({success:true})
        return;
    } catch (e) {
        console.log(e)
        res.json({success:false})
    }    
}

exports.admin_add_note = async function (req, res) {
    try {
        const tripId = req.body.tripId
        const note = req.body.note
        const condition = {_id: tripId, "corporate_notes.4": {$exists: false}}
        const select = {_id:1, corporate_notes:1}
        let Table = Trip
        let trip = await Table.findOne(condition, select).lean()
        if(!trip){
            Table = Trip_history
            trip = await Table.findOne(condition, select).lean()
        }
        if(!trip || !note){
            res.json({success: false})
            return;
        }

        let updateCount = await Table.updateOne(condition, {$push: { corporate_notes: note } })
        if (updateCount.modifiedCount == 0) {
            res.json({success: false})
            return;    
        }
        res.json({success: true})
        return;
    } catch (e) {
        console.log(e) 
        res.json({success: false})       
    }
}

exports.admin_delete_note = async function (req, res) {
    try {
        const tripId = Schema(req.body.tripId)
        const noteIndex = req.body.noteIndex
        const condition = {_id: tripId}
        const select = {_id:1, corporate_notes:1}
        
        let Table = Trip
        let trip = await Table.findOne(condition, select).lean()
        if(!trip){
            Table = Trip_history
            trip = await Table.findOne(condition, select).lean()
        }
        if(!trip || !noteIndex){
            res.json({success: false})
            return;
        }
        const unsetIndex = {
            $unset: { [`corporate_notes.${noteIndex}`]: "" }
          };
      
        await Table.updateOne({ _id: tripId }, unsetIndex);
        const updateCount = await Table.updateOne(
            { _id: tripId },
            { $pull: { corporate_notes: null } }  
        );

        if (updateCount.modifiedCount == 0) {
            res.json({success: false})
            return;    
        }
        res.json({success: true})
        return;
    } catch (e) {
        console.log(e) 
        res.json({success: false})       
    }
}

function getSearchParams(req) {
    let searchParams = {
        request: '',
        search_item: 'unique_id',
        search_value: '',
        sort_order: -1,
        sort_field: 'unique_id',
        filter_start_date: '',
        filter_end_date: '',
        payment: 2,
        status: 3
    };

    if (req.body.search_item !== undefined) {
        searchParams.request = req.body.request;
        
        searchParams.search_value = req.body.search_value.replace(/^\s+|\s+$/g, '');
        searchParams.search_value = searchParams.search_value.replace(/ +(?= )/g, '');

        searchParams.sort_order = req.body.sort_item[1];
        searchParams.sort_field = req.body.sort_item[0];
        searchParams.search_item = req.body.search_item;
        searchParams.filter_start_date = req.body.start_date;
        searchParams.filter_end_date = req.body.end_date;
        searchParams.payment = Number(req.body.payment);
        searchParams.status = Number(req.body.status);
    } else {
        searchParams.request = req.path.split('/')[1];
    }

    return searchParams;
}

function getStatusCondition (status){
    const statusConditions = {
        1: { 'is_provider_status': { $eq: 9 } },
        2: { 'is_trip_cancelled': { $eq: 1 } },
        0: { 
            'is_trip_cancelled': { $eq: 0 },
            'is_provider_status': { $lt: 9 }
        },
        4: { 'paid_client': { $ne: 1 } },
        5: { 'paid_partner': { $ne: 1 } },
        6: { 'paid_client': { $eq: 1 } },
        7: { 'paid_partner': { $eq: 1 } }
    };

    return { "$match": statusConditions[status] || {} };
}

function getDateTypeQuery (type){
    const dateType = {
        'undefined': 'created_at',
        '': 'created_at',
        0:  'created_at',
        1:  'pickup_time',
        2:  'complete_date_in_city_timezone',
    }
    return dateType[type];
}

exports.admin_complete_trip = async function (req, res) {
    try {
        if (!req.session.admin.super_admin && req.session.admin.email != "jparra@flety.io") {
            res.json("You are not Authorised")
            return
        }
        const tripId = req.body.tripId
        let trip = await Trip.findOne({unique_id: tripId, country_id: req.session.admin.country_id})
        if(!trip){
            res.json("Trip Not Found or already completed")
            return;
        }
        if(trip.provider_id){
            await Provider.updateOne({_id: trip.provider_id},{is_trip:[], is_available:1})
        }
        if(trip.assigned_provider_id){
            trip.provider_id = trip.assigned_provider_id
            trip.confirmed_provider = trip.assigned_provider_id
            trip.current_provider = trip.assigned_provider_id
        }
    
    
        trip.payment_status = 1
        trip.is_provider_status = 9
        trip.is_paid = 1
        trip.total = trip.fixed_price
        trip.is_trip_end = 1
        trip.is_trip_completed = 1
        trip.cash_payment = trip.fixed_price
        trip.is_pending_payments = 0
        trip.remaining_payment = 0
        
        await Trip.updateOne({ _id: trip._id }, trip.getChanges() )
        let updateCount = await Trip.updateOne({'_id':trip._id}, trip.getChanges())
        if (updateCount.modifiedCount != 0) {
            let deleted_trip = await Trip.findOneAndRemove({ _id: trip._id })
            if (deleted_trip) {
                const trip_history_data = new Trip_history(JSON.parse(JSON.stringify(deleted_trip)));
                await trip_history_data.save()
            }
        }
        utils.remove_dates_driver_vehicle(trip._id,  trip.model_type)
    
    
        res.json("Trip Successfully Completed")
        return;
    } catch (e) {
        console.log(e) 
        res.json({success: false})       
    }
}