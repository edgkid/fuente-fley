var utils = require('../controllers/utils');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var moment = require('moment');
var Type = require('mongoose').model('Type');
var City_type = require('mongoose').model('city_type');
var City_to_City = require('mongoose').model('City_to_City');
var Airport_to_City = require('mongoose').model('Airport_to_City');
var Trip_Service = require('mongoose').model('trip_service');
var xl = require('excel4node');
var fs = require("fs");
    var CityZone = require('mongoose').model('CityZone');
    var ZoneValue = require('mongoose').model('ZoneValue');
var console = require('../controllers/console');
var mongoose = require('mongoose');
let Type_Models = require('mongoose').model('type_model');
let Type_Services = require('mongoose').model('type_services');
let Type_Capacity = require('mongoose').model('type_capacity');
var Schema = mongoose.Types.ObjectId;
let Corporate = require('mongoose').model('Corporate');

var surge_hours = [{
            "is_surge": false,
            "day": 0,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 1,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 2,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 3,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 4,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 5,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 6,
            "day_time": []
        }];

exports.city_type = async function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var sort_order;
        var sort_field;
        var filter_start_date;
        var filter_end_date;
        var user_type = 0;
        let corporate_list = []
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

        if (req.body.search_item == undefined)
        {
            search_item = 'city_detail.cityname';
            search_value = '';
            sort_order = 1;
            sort_field = 'city_detail.cityname';
            filter_start_date = '';
            filter_end_date = '';

        } else
        {
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
        
        if (req.body.user_type){
            user_type = req.body.user_type
        }

        const admin = req.session.admin

        let citytype_country_query = {$match:{}}
        let corporate_country_query = {is_approved: 1}
        if(!admin.super_admin){
            citytype_country_query['$match']['countryid'] = Schema(admin.country_id)
            corporate_country_query['country_id'] = Schema(admin.country_id)
        }

        let user_type_condition = {$match:{}}
        let user_type_id = ""
        corporate_list = await Corporate.find(corporate_country_query).select({name:1}).lean()
        if (req.body.user_type_id && req.body.user_type == constant_json.CORPORATE_UNIQUE_NUMBER){
            user_type_id = Schema(req.body.user_type_id)
            user_type_condition = {$match:{user_type_id: user_type_id}}
        }

        var number_of_rec = 10;

        var lookup = {
            $lookup:
                    {
                        from: "countries",
                        localField: "countryid",
                        foreignField: "_id",
                        as: "country_detail"
                    }
        };
        var unwind = {$unwind: "$country_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "cities",
                        localField: "cityid",
                        foreignField: "_id",
                        as: "city_detail"
                    }
        };

        var unwind1 = {$unwind: "$city_detail"};

        var lookup2 = {
            $lookup:
                    {
                        from: "types",
                        localField: "typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        var unwind2 = {$unwind: "$type_detail"};

        var corporate_lookup = {
            $lookup:
                    {
                        from: "corporates",
                        localField: "user_type_id",
                        foreignField: "_id",
                        as: "corporate_detail"
                    }
        };

        var corporate_unwind = {        
            $unwind: {
                path: "$corporate_detail",
                preserveNullAndEmptyArrays: true
            }
        };
        

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');


        var search = {"$match": {}};
        if(search_item == 'city_detail.cityname'){
            var query1 = {};
            var query2 = {};
            query1[search_item] = {$regex: new RegExp(value, 'i')};
            query2['city_detail.full_cityname'] = {$regex: new RegExp(value, 'i')};
            search = {"$match": {$or: [query1, query2]}};
        } else {
            search["$match"][search_item] = {$regex: new RegExp(value, 'i')}
        }

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};        
        limit["$limit"] = number_of_rec;
        
        let condition = {$match: {'user_type': {$eq: Number(user_type) }}} // get admin added service types
        City_type.aggregate([condition, citytype_country_query, user_type_condition, lookup, unwind, lookup1, unwind1, lookup2, unwind2, corporate_lookup, corporate_unwind, search, filter, count]).then((array) => {
            if (!array || array.length == 0)
            {
                array = [];
                res.render('city_type', { 
                    detail: array, 
                    'current_page': 1, 
                    'pages': 0,
                    'next': 1, 
                    'pre': 0, 
                    moment: moment, sort_field,
                    sort_order, search_item, 
                    search_value,
                    user_type, user_type_id, filter_start_date, filter_end_date, corporate_list });
                delete message;
            } else
            {
                var pages = Math.ceil(array[0].total / number_of_rec);
                City_type.aggregate([condition, citytype_country_query, user_type_condition, lookup, unwind, lookup1, unwind1, lookup2, unwind2, corporate_lookup, corporate_unwind, search, filter, sort, skip, limit]).then((array) => {
                    res.render('city_type', { detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value,user_type, user_type_id, filter_start_date, filter_end_date, corporate_list });
                    delete message;
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.genetare_city_type_excel = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {

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

        if (req.body.search_item == undefined)
        {
            search_item = 'city_detail.cityname';
            search_value = '';
            sort_order = 1;
            sort_field = 'city_detail.cityname';
            filter_start_date = '';
            filter_end_date = '';

        } else
        {
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

        var number_of_rec = 10;

        var lookup = {
            $lookup:
                    {
                        from: "countries",
                        localField: "countryid",
                        foreignField: "_id",
                        as: "country_detail"
                    }
        };
        var unwind = {$unwind: "$country_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "cities",
                        localField: "cityid",
                        foreignField: "_id",
                        as: "city_detail"
                    }
        };

        var unwind1 = {$unwind: "$city_detail"};

        var lookup2 = {
            $lookup:
                    {
                        from: "types",
                        localField: "typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        var unwind2 = {$unwind: "$type_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = {"$match": {}};
        search["$match"][search_item] = {$regex: new RegExp(value, 'i')};

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);


        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        City_type.aggregate([lookup, unwind, lookup1, unwind1, lookup2, unwind2, search, filter, sort]).then((array) => { 
            var date = new Date()
            var time = date.getTime()
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet('sheet1');
            var col = 1;

            ws.cell(1, col++).string(req.__('title_country'));
            ws.cell(1, col++).string(req.__('title_country_business'));
            ws.cell(1, col++).string(req.__('title_city'));
            ws.cell(1, col++).string(req.__('title_city_business'));
            ws.cell(1, col++).string(req.__('title_type'));
            ws.cell(1, col++).string(req.__('title_type_business'));
            ws.cell(1, col++).string(req.__('title_bussiness'));

            array.forEach(function (data, index) {
                col = 1;
                ws.cell(index + 2, col++).string(data.country_detail.countryname);
                
                if (data.country_detail.isBusiness == 1) {
                    ws.cell(index + 2, col++).string(req.__('title_on'));
                } else {
                    ws.cell(index + 2, col++).string(req.__('title_off'));
                }                
                
                ws.cell(index + 2, col++).string(data.city_detail.cityname);
                
                if (data.city_detail.isBusiness == 1) {
                    ws.cell(index + 2, col++).string(req.__('title_on'));
                } else {
                    ws.cell(index + 2, col++).string(req.__('title_off'));
                }

                ws.cell(index + 2, col++).string(data.type_detail.typename);
                
                if (data.type_detail.is_business == 1) {
                    ws.cell(index + 2, col++).string(req.__('title_on'));
                } else {
                    ws.cell(index + 2, col++).string(req.__('title_off'));
                }
                if (data.is_business == 1) {
                    ws.cell(index + 2, col++).string(req.__('title_on'));
                } else {
                    ws.cell(index + 2, col++).string(req.__('title_off'));
                }


                if (index == array.length - 1) {
                    wb.write('data/xlsheet/' + time + '_city_type.xlsx', function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            var url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_city_type.xlsx";
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_city_type.xlsx', function () {
                                });
                            }, 10000)
                        }
                    });
                }

            })
        });
    } else {
        res.redirect('/admin');
    }
};

exports.add_city_type_form = async function (req, res) {
    if (typeof req.session.userid == "undefined") {
        res.redirect('/admin');
        return;
    }
    const admin = req.session.admin

    let country_query = {isBusiness: constant_json.YES}
    if(!admin.super_admin){
        country_query['_id'] = Schema(admin.country_id)
    }

    let country = await Country.find(country_query)
    let type = await Type.find({})
    res.render('add_city_type_form', {city_type_data_country: country, surge_hours: surge_hours, city_type_data_type: type, corporate_data:null});
};

exports.add_city_type_detail = function (req, res) {

    Country.findOne({_id: req.body.countryid}).then((country_data) => {
        var countryname = (country_data.countryname).trim();
        City.findOne({_id: req.body.cityid}).then((city_data) => {
            var cityname = (city_data.cityname).trim();

            Type.findOne({typename:(req.body.typename).trim()}).then((type_data) => {
                var type_id = type_data._id;
                var service_type = type_data.service_type;
                var type_image = type_data.file;
                let user_type = Number(req.body.user_type)
                var surge_multiplier = 1;

                if (req.body.surge_multiplier) {
                    surge_multiplier = req.body.surge_multiplier;
                }
                    var citytype = new City_type({
                        countryid: req.body.countryid,
                        countryname: countryname,
                        cityname: cityname,
                        cityid: req.body.cityid,
                        typeid: type_id,
                        type_image: type_image,
                        service_type: service_type,
                        is_business: req.body.is_business,
                        // is_ride_share: req.body.is_ride_share,
                        is_car_rental_business: req.body.is_car_rental_business,
                        surge_multiplier: surge_multiplier,
                        surge_start_hour: req.body.surge_start_hour,
                        surge_end_hour: req.body.surge_end_hour,
                        is_surge_hours: req.body.is_surge_hours,
                        is_zone: req.body.is_zone,
                        // zone_multiplier: zone_multiplier,
                        typename: type_data.typename,
                        base_price_distance: req.body.base_price_distance,
                        base_price: req.body.base_price,
                        price_per_unit_distance: req.body.price_per_unit_distance,
                        waiting_time_start_after_minute: req.body.waiting_time_start_after_minute,
                        price_for_waiting_time: req.body.price_for_waiting,
                        waiting_time_start_after_minute_multiple_stops: req.body.waiting_time_start_after_minute_multiple_stops,
                        price_for_waiting_time_multiple_stops: req.body.price_for_waiting_time_multiple_stops,
                        price_for_total_time: req.body.price_for_total_time,
                        tax: req.body.tax,
                        min_fare: req.body.min_fare,
                        provider_profit: req.body.provider_profit,
                        max_space: req.body.max_space,
                        cancellation_fee: req.body.cancellation_fee,
                        user_miscellaneous_fee: req.body.user_miscellaneous_fee,
                        provider_miscellaneous_fee: req.body.provider_miscellaneous_fee,
                        user_tax: req.body.user_tax,
                        provider_tax: req.body.provider_tax,
                        user_type: user_type,
                        cost_travel_insurance: req.body.cost_travel_insurance,
                        free_stops: req.body.free_stops,
                        ferry_ticket_price: req.body.ferry_ticket_price,
                        ferry_flety_cost: req.body.ferry_flety_cost
                    });
                    if(type_data.model_type){
                        citytype.model_type = type_data.model_type
                    }
                    user_type == constant_json.CORPORATE_UNIQUE_NUMBER ? citytype.user_type_id = req.body.user_type_id :null

                    citytype.save().then(() => {
                        var city = citytype.cityid;
                        var trip_service = new Trip_Service({
                            service_type_id: citytype._id,
                            city_id: city,
                            service_type_name: (type_data.typename).trim(),
                            min_fare: citytype.min_fare,
                            provider_profit: citytype.provider_profit,
                            base_price_distance: citytype.base_price_distance,
                            base_price: citytype.base_price,
                            price_per_unit_distance: citytype.price_per_unit_distance,
                            waiting_time_start_after_minute: citytype.waiting_time_start_after_minute,
                            price_for_waiting_time: citytype.price_for_waiting_time,
                            waiting_time_start_after_minute_multiple_stops: citytype.waiting_time_start_after_minute_multiple_stops,
                            price_for_waiting_time_multiple_stops: citytype.price_for_waiting_time_multiple_stops,
                            is_car_rental_business: citytype.is_car_rental_business,
                            price_for_total_time: citytype.price_for_total_time,
                            surge_multiplier: citytype.surge_multiplier,
                            surge_start_hour: citytype.surge_start_hour,
                            surge_end_hour: citytype.surge_end_hour,
                            is_surge_hours: citytype.is_surge_hours,
                            tax: citytype.tax,
                            max_space: citytype.max_space,
                            cancellation_fee: citytype.cancellation_fee,
                            user_miscellaneous_fee: citytype.user_miscellaneous_fee,
                            provider_miscellaneous_fee: citytype.provider_miscellaneous_fee,
                            user_tax: citytype.user_tax,
                            provider_tax: citytype.provider_tax,
                            user_type: citytype.user_type,
                            cost_travel_insurance: citytype.cost_travel_insurance,
                            free_stops: citytype.free_stops
                        });
                        user_type == constant_json.CORPORATE_UNIQUE_NUMBER ? trip_service.user_type_id = req.body.user_type_id :null

                        trip_service.save().then(() => {
                        }, (err) => {
                            console.log(err)
                        });

                        if (req.body.airport_array !== undefined)
                        {
                            req.body.airport_array.forEach(function (airport_data) {

                                if (airport_data.price === null || airport_data.price === undefined)
                                {
                                    airport_data.price = 0;
                                }
                                var AirporttoCity = new Airport_to_City({
                                    city_id: req.body.cityid,
                                    airport_id: airport_data.id,
                                    price: airport_data.price,
                                    service_type_id: citytype._id
                                });
                                AirporttoCity.save().then(() => {
                                }, (err) => {
                                    console.log(err)
                                });
                            })
                        }

                        if (req.body.destcity_array !== undefined)
                        {
                            req.body.destcity_array.forEach(function (destcity_city_data, index) {

                                if (destcity_city_data.price === null || destcity_city_data.price === undefined)
                                {
                                    destcity_city_data.price = 0;
                                }
                                var CitytoCity = new City_to_City({
                                    city_id: req.body.cityid,
                                    destination_city_id: destcity_city_data.id,
                                    price: destcity_city_data.price,
                                    service_type_id: citytype._id
                                });
                                CitytoCity.save().then(() => {
                                }, (err) => {
                                    console.log(err)
                                });

                                if (index == req.body.destcity_array.length - 1)
                                {
                                    message = admin_messages.success_message_city_service_add;
                                    // res.redirect("/city_type");
                                    res.json({success: true, id: citytype._id});
                                }
                            })
                        } else
                        {
                            message = admin_messages.success_message_city_service_add;
                            res.json({success: true, id: citytype._id});
                            // res.redirect("/city_type");
                        }
                    }, (err) => {
                        console.log(err)
                    });
                

            });
        });
    });
}

exports.edit_city_type_form = async function (req, res) {
    var id = req.body.id;
    if (typeof req.session.userid == "undefined") {
        res.redirect('/admin');
        return;
    }         
    var lookup = {
        $lookup:
        {
            from: "city_types",
            localField: "car_rental_ids",
            foreignField: "_id",
            as: "car_rental_list"
        }
    };
    var model_lookup = {
        $lookup:
        {
            from: "city_types",
            localField: "model_pricing_ids",
            foreignField: "_id",
            as: "model_pricing_list"
        }
    };

    var condition = {$match: {_id: {$eq: Schema(id) }}}
    let city_type_list = await City_type.aggregate([condition, lookup, model_lookup])
    var city_type = {};
    if(city_type_list.length>0){
    city_type = city_type_list[0];
    }
    countryid = city_type.countryid;
    cityid = city_type.cityid;
    typeid = city_type.typeid;


    let country = await Country.findById(countryid)
    let city = await City.findById(cityid)
    let type = await Type.findById(typeid)
    let corporate_data = await Corporate.findById(city_type.user_type_id).select({name:1, is_use_fixed_partner_profit:1}).lean() 
    let city_zone = await CityZone.find({'cityid': cityid}) 
    const type_models = await Type_Models.find({'_id': {$in: type.type_model_list} }) 

    var lookup2 = {
        $lookup:
        {
            from: "cityzones",
            localField: "from",
            foreignField: "_id",
            as: "from_detail"
        }
    };
    var unwind2 = {$unwind: "$from_detail"};
    var lookup3 = {
        $lookup:
        {
            from: "cityzones",
            localField: "to",
            foreignField: "_id",
            as: "to_detail"
        }
    };
    const type_model_lookup = {
        $lookup:
        {
            from: "type_models",
            localField: "model_id",
            foreignField: "_id",
            as: "model_details"
        }
    };

    var unwind3 = {$unwind: "$to_detail"};
    var query1 = {$match: {'service_type_id': {$eq: city_type._id}}};
    ZoneValue.aggregate([query1, type_model_lookup, lookup2, unwind2, lookup3, unwind3]).then((zonevalue) => {
        res.render('add_city_type_form', {city_type_data: city_type, surge_hours: surge_hours, city_zone: city_zone,zonevalue: zonevalue,  city_type_data_country: country, city_data: city, type_data: type, corporate_data, type_models});
    }, (err) => {
        utils.error_response(err, res)
    });

}

exports.update_surge_time = function (req, res) {
    var surge_hours = []
    req.body.surge_hours.forEach(function(surge_hour_data){
        var day_time = [];
        if(surge_hour_data.day_time){
            day_time = surge_hour_data.day_time;
        }
        if(surge_hour_data.is_surge == 'false' || surge_hour_data.is_surge == false){
            surge_hour_data.is_surge = false;
        } else {
            surge_hour_data.is_surge = true;
        }
        surge_hours.push({day: surge_hour_data.day, day_time: day_time, is_surge: surge_hour_data.is_surge})
    })
    City_type.findByIdAndUpdate(req.body.id, {surge_hours: surge_hours}).then(() => {
        res.json({success: true});
    });
}

exports.update_city_type_detail = function (req, res) {
    // console.log(req.body)
    var id = req.body.id;
    if (req.body.surge_multiplier == '')
    {
        req.body.surge_multiplier = 1;
    }
    // console.log(req.body)
    if (typeof req.session.userid != "undefined") {

        City_type.findByIdAndUpdate(id, req.body).then(() => {
           
                City_type.findOne({_id: id}).then((citytype) => {
                    var city = citytype.cityid;
                    var typeid = citytype.typeid;

                    Type.findOne({_id: typeid}).then((type_detail) => {
                        var trip_service = new Trip_Service({
                            service_type_id: citytype._id,
                            city_id: city,
                            service_type_name: (type_detail.typename).trim(),
                            min_fare: citytype.min_fare,
                            provider_profit: citytype.provider_profit,
                            base_price_distance: citytype.base_price_distance,
                            base_price: citytype.base_price,
                            price_per_unit_distance: citytype.price_per_unit_distance,
                            waiting_time_start_after_minute: citytype.waiting_time_start_after_minute,
                            price_for_waiting_time: citytype.price_for_waiting_time,
                            waiting_time_start_after_minute_multiple_stops: citytype.waiting_time_start_after_minute_multiple_stops,
                            price_for_waiting_time_multiple_stops: citytype.price_for_waiting_time_multiple_stops,
                            price_for_total_time: citytype.price_for_total_time,
                            surge_multiplier: citytype.surge_multiplier,
                            is_car_rental_business: citytype.is_car_rental_business,
                            surge_start_hour: citytype.surge_start_hour,
                            surge_end_hour: citytype.surge_end_hour,
                            is_surge_hours: citytype.is_surge_hours,
                            tax: citytype.tax,
                            max_space: citytype.max_space,
                            cancellation_fee: citytype.cancellation_fee,
                            is_business: req.body.is_business,
                            user_miscellaneous_fee: citytype.user_miscellaneous_fee,
                            provider_miscellaneous_fee: citytype.provider_miscellaneous_fee,
                            user_tax: citytype.user_tax,
                            provider_tax: citytype.provider_tax,
                            cost_travel_insurance: citytype.cost_travel_insurance,
                            free_stops: citytype.free_stops

                        });
                        trip_service.save().then(() => {
                        });

                        Trip_Service.updateMany({service_type_id: {$in: citytype.car_rental_ids}}, {provider_profit: citytype.provider_profit}, {multi: true}, function(){

                        })
                        City_type.updateMany({_id: {$in: citytype.car_rental_ids}}, {provider_profit: citytype.provider_profit}, {multi: true}, function(){

                        })
                        Trip_Service.updateMany({service_type_id: {$in: citytype.model_pricing_ids}}, {provider_profit: citytype.provider_profit}, {multi: true}, function(){

                        })
                        City_type.updateMany({_id: {$in: citytype.model_pricing_ids}}, {provider_profit: citytype.provider_profit}, {multi: true}, function(){

                        })

                    });

                    if (req.body.airport_array !== undefined)
                    {
                        req.body.airport_array.forEach(function (airport_data) {
                            if (airport_data.price === null || airport_data.price === '')
                            {
                                airport_data.price = 0;
                            }

                            Airport_to_City.findOneAndUpdate({city_id: city, airport_id: airport_data.id, service_type_id: id}, {price: airport_data.price}).then((airporttocity) => {
                                if (airporttocity == null)
                                {
                                    var AirporttoCity = new Airport_to_City({
                                        city_id: city,
                                        airport_id: airport_data.id,
                                        price: airport_data.price,
                                        service_type_id: id
                                    });
                                    AirporttoCity.save().then(() => {
                                    });
                                }
                            });
                        })
                    }

                    if(req.body.rich_area_surge){
                        req.body.rich_area_surge.forEach(function(rich_area_surge_data){

                            var zone_index = citytype.rich_area_surge.findIndex((x)=>(x.id).toString() == (rich_area_surge_data.id).toString());
                            if(zone_index == -1){
                                citytype.rich_area_surge.push({id: Schema(rich_area_surge_data.id), surge_multiplier: Number(rich_area_surge_data.surge_multiplier)})
                            } else {
                                citytype.rich_area_surge[zone_index].surge_multiplier = Number(rich_area_surge_data.surge_multiplier)
                            }
                            // update_city_zone_surge(rich_area_surge_data, id);
                        });
                        citytype.markModified('rich_area_surge');
                        citytype.save();
                    }

                    if (req.body.destcity_array !== undefined)
                    {
                        req.body.destcity_array.forEach(function (destcity_city_data, index) {
                            if (destcity_city_data.price === null || destcity_city_data.price === '')
                            {
                                destcity_city_data.price = 0;
                            }

                            City_to_City.findOneAndUpdate({city_id: city, destination_city_id: destcity_city_data.id, service_type_id: id}, {price: destcity_city_data.price}).then((citytocity) => {


                                if (citytocity == null)
                                {
                                    var CitytoCity = new City_to_City({
                                        city_id: city,
                                        destination_city_id: destcity_city_data.id,
                                        price: destcity_city_data.price,
                                        service_type_id: id
                                    });
                                    CitytoCity.save().then(() => {
                                    });
                                }
                                if (index == req.body.destcity_array.length - 1)
                                {
                                    message = admin_messages.success_message_city_service_update;
                                    res.json({success: true, id: citytype._id});
                                }
                            });
                        })
                    } else
                    {
                        message = admin_messages.success_message_city_service_add;
                        res.json({success: true, id: citytype._id});
                    }


                });
        });
    } else {
        res.redirect('/admin');
    }
};


exports.getcitytype = function (req, res) {


    var lookup = {
        $lookup:
                {
                    from: "types",
                    localField: "typeid",
                    foreignField: "_id",
                    as: "type_detail"
                }
    };
    var unwind = {$unwind: "$type_detail"};

    var cityid_condition = {$match: {'cityname': {$eq: "Caracas"},'is_business' : 1}};
    let user_type_pricing_condition = {$match: {'user_type': {$eq: 0}}}

    City_type.aggregate([cityid_condition, user_type_pricing_condition, lookup, unwind]).then((type_available) => {
        res.json({service_type: type_available});
    });
};




exports.add_carrental_data = function (req, res) {

    var citytype = new City_type({
        typename: req.body.typename,
        base_price_distance: req.body.base_price_distance,
        base_price_time: req.body.base_price_time,
        base_price: req.body.base_price,
        price_per_unit_distance: req.body.price_per_unit_distance,
        price_for_total_time: req.body.price_for_total_time,
        is_business: req.body.is_business,
        provider_profit: req.body.provider_profit
    });

    citytype.save().then(()=>{
        var trip_service = new Trip_Service({
            service_type_id: citytype._id,
            typename: req.body.typename,
            base_price_distance: req.body.base_price_distance,
            base_price_time: req.body.base_price_time,
            base_price: req.body.base_price,
            price_per_unit_distance: req.body.price_per_unit_distance,
            price_for_total_time: req.body.price_for_total_time,
            provider_profit: req.body.provider_profit
        });

        trip_service.save().then(()=>{
            City_type.findOne({_id: req.body.city_type_id}, function(error, city_type_data){
                city_type_data.car_rental_ids.unshift(citytype._id);
                city_type_data.save();
                res.json({success: true, carrental_data: citytype});
            });
        });
        
    }, (error)=>{
        console.log(error)
    })
};

exports.update_carrental_data = function (req, res) {
    City_type.findOneAndUpdate({_id: req.body.id}, req.body, function(error, city_type_data){
        var trip_service = new Trip_Service({
            service_type_id: city_type_data._id,
            typename: req.body.typename,
            base_price_distance: req.body.base_price_distance,
            base_price_time: req.body.base_price_time,
            base_price: req.body.base_price,
            price_per_unit_distance: req.body.price_per_unit_distance,
            price_for_total_time: req.body.price_for_total_time
        });
        trip_service.save().then(()=>{
            res.json({success: true, carrental_data: city_type_data});
        });
    })
}

exports.delete_carrental_data = function (req, res) {
    City_type.findOneAndRemove({_id: req.body.id}, function(error, carrental_type_id){
        City_type.findOne({_id: req.body.city_type_id}, function(error, city_type_data){
            var index = city_type_data.car_rental_ids.indexOf(carrental_type_id._id)
            if(index != -1){
                city_type_data.car_rental_ids.splice(index, 1);
                city_type_data.save();
            }
            res.json({success: true});
        });
    })
}

exports.add_modelpricing_data = async function (req, res) {
    if (typeof req.session.userid == 'undefined') {
        res.redirect('/admin');
        return;
    }

    let city = await City.findOne({cityname:req.body.cityname}).select({_id:1}).lean()

    if(!city){
        return res.json({success:false, message: admin_messages.error_city_not_found})
    }

    let service_type = await City_type
        .findOne({_id: req.body.city_type_id, cityid: city._id})
        .select({_id:1, model_type:1}).lean()

    if(!service_type){
        return res.json({
            success:false, 
            message: admin_messages.error_service_type_not_found
        });
    }
    req.body.modelid = req.body.modelid || []
    req.body.modelid = req.body.modelid.map(s => Schema(s));

    req.body.serviceid = req.body.serviceid || []
    req.body.serviceid = req.body.serviceid.map(s => Schema(s));

    req.body.capacityid = req.body.capacityid || []
    req.body.capacityid = req.body.capacityid.map(s => Schema(s));

    if( 
        req.body.modelid == [] &&
        req.body.serviceid == [] &&
        req.body.capacityid == [] 
    ){
        return res.json({
            success:false, 
            message: admin_messages.error_select_proper_details
        });
    }

    let truck_type_list = await Type_Models.find({_id: {$in:req.body.modelid}}).lean()

    let services = await Type_Services.find({_id: {$in: req.body.serviceid}}).lean()

    let capacity = await Type_Capacity.find({_id: {$in: req.body.capacityid}}).lean()


    let model_list = []
    truck_type_list.forEach((truck) => {
        let truck_type = {
            _id: truck._id,
            model_name: truck.model_name
        }
        model_list.push(truck_type)
    })

    let services_list = []
    services.forEach((service) => {
        let truck_service = {
            _id: service._id,
            service_name: service.service_name
        }
        services_list.push(truck_service)
    })

    let capacity_list = []
    capacity.forEach((capacity) => {
        let truck_capacity = {
            _id: capacity._id,
            capacity_name: capacity.capacity_name,
            unit: capacity.unit
        }
        capacity_list.push(truck_capacity)
    })

    var citytype = new City_type({
        modelid: model_list,
        serviceid: services_list,
        capacityid: capacity_list,
        price_per_km_a: req.body.price_per_km_a,
        price_per_km_b: req.body.price_per_km_b,
        price_per_km_c: req.body.price_per_km_c,
        price_per_km_d: req.body.price_per_km_d,
        price_per_km_e: req.body.price_per_km_e,
        price_per_km_f: req.body.price_per_km_f,
        price_per_km_g: req.body.price_per_km_g,
        price_per_km_h: req.body.price_per_km_h,
        price_per_km_i: req.body.price_per_km_i,
        price_per_km_j: req.body.price_per_km_j,
        price_per_km_k: req.body.price_per_km_k,
        price_per_km_l: req.body.price_per_km_l,
        price_per_km_m: req.body.price_per_km_m,
        price_per_km_n: req.body.price_per_km_n,
        price_per_km_o: req.body.price_per_km_o,
        price_per_km_p: req.body.price_per_km_p,
        price_per_km_q: req.body.price_per_km_q,
        price_per_km_r: req.body.price_per_km_r,
        price_per_km_s: req.body.price_per_km_s,
        price_per_km_t: req.body.price_per_km_t,
        price_per_km_u: req.body.price_per_km_u,
        price_per_km_v: req.body.price_per_km_v,
        price_per_km_w: req.body.price_per_km_w, 
        price_per_km_y: req.body.price_per_km_y,
        min_fare: req.body.min_fare,
        fixed_fees: req.body.fixed_fees,
        cost_per_stop_inside_city: req.body.cost_per_stop_inside_city,
        cost_per_stop_outside_city: req.body.cost_per_stop_outside_city,
        cost_per_helper: req.body.cost_per_helper,
        cost_travel_insurance: req.body.cost_travel_insurance,
        city_id: city._id,
        provider_profit: req.body.provider_profit,
        night_shift: req.body.night_shift,
        boat_ticket: req.body.boat_ticket,
        corporate_partner_profit_fees: req.body.corporate_partner_profit_fees,
        ti_internal_transit: req.body.ti_internal_transit,
    });

    if(service_type.model_type == MODEL_TRUCK_TYPE.GANDOLA){
        citytype.price_per_km_q = req.body.price_per_km_q
        citytype.price_per_km_r = req.body.price_per_km_r
        citytype.price_per_km_s = req.body.price_per_km_s
        citytype.price_per_km_t = req.body.price_per_km_t
        citytype.price_per_km_u = req.body.price_per_km_u
        citytype.price_per_km_v = req.body.price_per_km_v
        citytype.price_per_km_w = req.body.price_per_km_w
        citytype.price_per_km_y = req.body.price_per_km_y
    }

    await citytype.save()
    var trip_service = new Trip_Service({
        service_type_id: citytype._id,
        modelid: model_list,
        serviceid: services_list,
        price_per_km_a: req.body.price_per_km_a,
        price_per_km_b: req.body.price_per_km_b,
        price_per_km_c: req.body.price_per_km_c,
        price_per_km_d: req.body.price_per_km_d,
        price_per_km_e: req.body.price_per_km_e,
        price_per_km_f: req.body.price_per_km_f,
        price_per_km_g: req.body.price_per_km_g,
        price_per_km_h: req.body.price_per_km_h,
        price_per_km_i: req.body.price_per_km_i,
        price_per_km_j: req.body.price_per_km_j,
        price_per_km_k: req.body.price_per_km_k,
        price_per_km_l: req.body.price_per_km_l,
        price_per_km_m: req.body.price_per_km_m,
        price_per_km_n: req.body.price_per_km_n,
        price_per_km_o: req.body.price_per_km_o,
        price_per_km_p: req.body.price_per_km_p,
        price_per_km_q: req.body.price_per_km_q,
        price_per_km_r: req.body.price_per_km_r,
        price_per_km_s: req.body.price_per_km_s,
        price_per_km_t: req.body.price_per_km_t,
        price_per_km_u: req.body.price_per_km_u,
        price_per_km_v: req.body.price_per_km_v,
        price_per_km_w: req.body.price_per_km_w, 
        price_per_km_y: req.body.price_per_km_y, 
        min_fare: req.body.min_fare,
        fixed_fees: req.body.fixed_fees,    
        cost_per_stop_inside_city: req.body.cost_per_stop_inside_city,
        cost_per_stop_outside_city: req.body.cost_per_stop_outside_city,
        cost_per_helper: req.body.cost_per_helper,
        cost_travel_insurance: req.body.cost_travel_insurance,
        provider_profit: req.body.provider_profit,
        corporate_partner_profit_fees: req.body.corporate_partner_profit_fees,
        ti_internal_transit: req.body.ti_internal_transit
        
    });

    if(service_type.model_type == MODEL_TRUCK_TYPE.GANDOLA){
        trip_service.price_per_km_j = req.body.price_per_km_p
        trip_service.price_per_km_k = req.body.price_per_km_q
        trip_service.price_per_km_l = req.body.price_per_km_r
        trip_service.price_per_km_m = req.body.price_per_km_s
        trip_service.price_per_km_n = req.body.price_per_km_t
        trip_service.price_per_km_o = req.body.price_per_km_u
        trip_service.price_per_km_p = req.body.price_per_km_v
        trip_service.price_per_km_q = req.body.price_per_km_w
        trip_service.price_per_km_r = req.body.price_per_km_y
    }

    await trip_service.save()
    
    let city_type_data = await City_type.findOne({_id: req.body.city_type_id})

    city_type_data.model_pricing_ids.unshift(citytype._id);

    city_type_data.save();
    
    res.json({
        success: true, 
        modelpricing_data: citytype
    });
};

exports.update_modelpricing_data = function (req, res) {
    // console.log(req.body)
    City_type.findOneAndUpdate({_id: req.body.id}, req.body, function(error, city_type_data){
        // console.log(city_type_data)
        var trip_service = new Trip_Service({
            price_per_km_a: req.body.price_per_km_a,
            price_per_km_b: req.body.price_per_km_b,
            price_per_km_c: req.body.price_per_km_c,
            price_per_km_d: req.body.price_per_km_d,
            price_per_km_e: req.body.price_per_km_e,
            price_per_km_f: req.body.price_per_km_f,
            price_per_km_g: req.body.price_per_km_g,
            price_per_km_h: req.body.price_per_km_h,
            price_per_km_i: req.body.price_per_km_i,
            price_per_km_j: req.body.price_per_km_j,
            price_per_km_k: req.body.price_per_km_k,
            price_per_km_l: req.body.price_per_km_l,
            price_per_km_m: req.body.price_per_km_m,
            price_per_km_n: req.body.price_per_km_n,
            price_per_km_o: req.body.price_per_km_o,
            price_per_km_p: req.body.price_per_km_p,
            price_per_km_q: req.body.price_per_km_q,
            price_per_km_r: req.body.price_per_km_r,
            price_per_km_s: req.body.price_per_km_s,
            price_per_km_t: req.body.price_per_km_t,
            price_per_km_u: req.body.price_per_km_u,
            price_per_km_v: req.body.price_per_km_v,
            price_per_km_w: req.body.price_per_km_w, 
            price_per_km_y: req.body.price_per_km_y,
            fixed_fees: req.body.fixed_fees,
            min_fare: req.body.min_fare,
            cost_per_stop_inside_city: req.body.cost_per_stop_inside_city,
            cost_per_stop_outside_city: req.body.cost_per_stop_outside_city,
            cost_per_helper: req.body.cost_per_helper,
            cost_travel_insurance: req.body.cost_travel_insurance,
            night_shift: req.body.night_shift,
            boat_ticket: req.body.boat_ticket,
            corporate_partner_profit_fees: req.body.corporate_partner_profit_fees,
            ti_internal_transit: req.body.ti_internal_transit
        });
        trip_service.save().then(()=>{
            res.json({success: true, modelpricing_data: city_type_data});
        });
    })
}

exports.delete_modelpricing_data = function (req, res) {
    // console.log(req.body)
    
    City_type.findOneAndRemove({_id: req.body.id}, function(error, modelpricing_id){
        City_type.findOne({_id: req.body.city_type_id}, function(error, city_type_data){
            var index = city_type_data.model_pricing_ids.indexOf(modelpricing_id._id)
            if(index != -1){
                city_type_data.model_pricing_ids.splice(index, 1);
                city_type_data.save();
            }
            res.json({success: true});
        });
    })
}
