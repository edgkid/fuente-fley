var User = require('mongoose').model('User');
var Provider = require('mongoose').model('Provider');
var Partner = require('mongoose').model('Partner');
var Type_Models = require('mongoose').model('type_model');
var Type = require('mongoose').model('Type');
var moment = require("moment");
var utils = require('../controllers/utils');
var allemails = require('../controllers/emails');
var Settings = require('mongoose').model('Settings');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var moment = require('moment-timezone');
var xl = require('excel4node');
var fs = require("fs");
var console = require('../controllers/console');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var Partner_Vehicle_Document = require('mongoose').model('Partner_Vehicle_Document');
var Citytype = require('mongoose').model('city_type');


exports.truck_list = async function (req, res, next) {

    if (typeof req.session.userid != "undefined") {
        var filter_start_date;
        var filter_end_date;
        var page;
        var next;
        var pre;
        var sort_order;
        var sort_field;
        var search_item;
        var search_value           
        
        if (req.body.search_item == undefined) {
            search_item = 'first_name';
            search_value = '';
        } else {
            search_item = req.body.search_item;
            search_value = req.body.search_value;
        }

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        var search = {"$match": {}};
        let city_condition = {$match: {}};

        if (search_item == "partner_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};
            var query7 = {}
            var query8 = {}
            var query9 = {}
            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1['first_name'] = {$regex: new RegExp(value, 'i')};
                query2['last_name'] = {$regex: new RegExp(value, 'i')};
                query3['partner_company_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2, query3]}};
            } else {
                query1['first_name'] = {$regex: new RegExp(value, 'i')};
                query2['last_name'] = {$regex: new RegExp(value, 'i')};
                query3['first_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query4['last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5['first_name'] = {$regex: new RegExp(full_name[1], 'i')};
                query6['last_name'] = {$regex: new RegExp(full_name[1], 'i')};
                query7['partner_company_name'] = {$regex: new RegExp(value, 'i')};
                query8['partner_company_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query9['partner_company_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6, query7, query8, query9 ]}};
            }
        } else if(search_item == "active"){
            search["$match"]["vehicle_detail.is_approved_by_admin"] = {$eq: 1};
        } else if(search_item == "inactive"){
            search["$match"]["vehicle_detail.is_approved_by_admin"] = {$eq: 0};
        } else if(search_item == "plate_no")
        {
            search = {"$match": {}};
            search["$match"]["vehicle_detail.plate_no"] = {$regex: search_value};
        };
        var number_of_rec = 10;
        filter_start_date = '';
        filter_end_date = '';

        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        const models = await Type_Models.find({})
        const types = await Type.find({})
        const cities = await City.find({},{cityname:1})

        var search_type_of_truck = { $match: {} };
        if(req.body.search_truck_type_id){
            search_type_of_truck = { $match: { 'vehicle_detail.admin_type_id' : Schema(req.body.search_truck_type_id)} };
        }
        
        var search_model_of_truck = { $match: {} };
        if(req.body.search_model_type_id){
            search_model_of_truck = { $match: { 'vehicle_detail.selected_model_id' : Schema(req.body.search_model_type_id)} };
        }


        var sort = { "$sort": {} };
        sort["$sort"][sort_field] = parseInt(1);

        var count = { $group: { _id: null, total: { $sum: 1 } } };

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        var vehicle_condition = { $match: { vehicle_detail: {$ne: []} }};
        var proj_vehicles = {
            $project: {
                _id:1,
                vehicle_detail: 1,
                first_name: "$first_name",
                last_name: "$last_name",
                country_phone_code: "$country_phone_code",
                phone: "$phone",
                city_id: "$city_id"
            }
        }

        let unwind_vehicles = {
            $unwind: "$vehicle_detail"
        }

        var model_lookup = {
            $lookup:
                    {
                        from: "type_models",
                        localField: "vehicle_detail.selected_model_id",
                        foreignField: "_id",
                        as: "model_detail"
                    }
        };
        var service = service
        var service_type_lookup = {
            $lookup:
                    {
                        from: "types",
                        localField: "vehicle_detail.admin_type_id",
                        foreignField: "_id",
                        as: "service_type_details"
                    }
        };
        if(req.body.selected_city != undefined && req.body.selected_city != ""){
            city_condition = {$match:{ 'city_id': Schema(req.body.selected_city)}}
        }

        const admin = req.session.admin
        let country_query = {$match:{}}
        if(!admin.super_admin){
            country_query['$match']['country_id'] = Schema(admin.country_id)
        }

        Partner.aggregate([
            country_query,
            vehicle_condition, city_condition, sort,proj_vehicles, unwind_vehicles, 
            search, search_type_of_truck, search_model_of_truck, count
        ])
        .then((array) => { 
            if (!array || array.length == 0){
                res.render('truck_list', {
                    detail: [],
                    provider_id: req.body.provider_id,
                    filter_start_date,
                    filter_end_date,
                    current_page: 1,
                    pages: 0,
                    next: 1,
                    pre: 0,
                    sort_field,
                    sort_order,
                    vehicles_of: req.body.vehicles_of,
                    types: types,
                    models: models,
                    cities,
                    plate_no:req.body.plate_no,
                    selected_city: req.body.selected_city,
                    search_item :search_item,
                    search_value: search_value,
                    search_truck_type_id: req.body.search_truck_type_id,
                    search_model_type_id: req.body.search_model_type_id
            });
            } else {
                Partner.aggregate([
                    country_query,
                    vehicle_condition, city_condition, sort,proj_vehicles, unwind_vehicles, 
                    search, search_type_of_truck, search_model_of_truck, skip, 
                    limit,service_type_lookup, model_lookup  
                ]).then((truck_list) => { 
                    var pages = Math.ceil(array[0].total / number_of_rec);
                    // console.log({truck_list})
                    res.render('truck_list', {
                        detail: truck_list,
                        provider_id: req.body.provider_id,
                        moment: moment,
                        timezone_for_display_date: setting_detail.timezone_for_display_date,
                        filter_start_date,
                        filter_end_date,
                        current_page: page,
                        pages: pages,
                        next: next,
                        pre: pre,
                        sort_field,
                        sort_order,
                        vehicles_of: req.body.vehicles_of,
                        types: types,
                        models: models,
                        cities,
                        plate_no:req.body.plate_no,
                        selected_city: req.body.selected_city,
                        search_item :search_item,
                        search_value: search_value,
                        search_truck_type_id: req.body.search_truck_type_id,
                        search_model_type_id: req.body.search_model_type_id        
                    });
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
}

exports.admin_change_vehicle_status = async function (req, res) {
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        }
        // console.log(req.body)
        const vehicle_id = Schema(req.body.vehicle_id);
        const partner_id = Schema(req.body.vehicle_type_id);
        const state = req.body.state;
        if (state == 1) {
            const change = 0;
            await Partner.updateOne({'_id':partner_id, "vehicle_detail._id": Schema(vehicle_id) }, {"vehicle_detail.$.is_approved_by_admin": change, "vehicle_detail.$.state": change})
            await Provider.updateMany({"vehicle_detail._id": Schema(vehicle_id) }, {"vehicle_detail.$.is_approved_by_admin": change, "vehicle_detail.$.state": change})
            message = admin_messages.success_message_for_vehicle_inactivated;
        } else {
            const partner = await Partner.findOne({_id:partner_id}).lean()
            const city = await City.findOne({_id: partner.city_id}).select({timezone:1}).lean()
            let timezone = "America/Caracas"
            if(city){
                timezone = city.timezone
            }
            const date = new Date().toLocaleString("en-US", { timeZone: timezone });
            const partner_vehicle_document_list = await Partner_Vehicle_Document.find({
                vehicle_id: vehicle_id,
                option: 1,
                $or:[
                    {
                        is_uploaded: 1,
                        is_expired_date: true,
                        is_document_expired: false,
                        expired_date: { $lt: date },
                    },
                    {
                        is_uploaded: 0
                    },
                    {
                        is_document_expired: true
                    }
                ],
            });
            if(partner_vehicle_document_list.length != 0){
                message = admin_messages.error_message_upload_vehicle_documents;
                res.redirect('/truck_list');
                return;
            }
            const change = 1;
            await Partner.updateOne({'_id':partner_id, "vehicle_detail._id": Schema(vehicle_id) }, {"vehicle_detail.$.is_approved_by_admin": change})
            await Provider.updateMany({"vehicle_detail._id": Schema(vehicle_id) }, {"vehicle_detail.$.is_approved_by_admin": change})
            message = admin_messages.success_message_for_vehicle_activated;
        }
        res.redirect('/truck_list');
    } catch (e) {
        console.log(e)
        message = admin_messages.error_message_active_vehicle_failed;
        res.redirect('/truck_list');
    }
};
    
exports.admin_edit_vehicle_detail = function (req, res) {
     var vehicle_accesibility = VEHICLE_ACCESIBILITY;
    console.log(JSON.stringifyvehicle_accesibility, null,2)  

    if (typeof req.session.userid != 'undefined') {
            Partner.findOne({_id: req.body.partner_id}).then((partner) => { 
                var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);
                Partner_Vehicle_Document.find({partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id}).then((partner_vehicle_document) => { 
    
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
                    var type_model_list_query = {
                        $lookup:
                        {
                            from: "type_models",
                            let: { models: '$type_detail.type_model_list' },
                            pipeline: [
                                { $match: 
                                    { $expr: 
                                        { $and: 
                                            [
                                                { $in: [  "$_id", "$$models" ] },
                                                { $eq: [ "$state", 1 ] }
                                            ] 
                                        }
                                    }
                                }
                            ],
                            as: "type_model_details"
                        }
                    };
    
                    var type_service_list_query = {
                        $lookup:
                        {
                            from: "type_services",
                            let: { services: '$type_detail.type_service_list' },
                            pipeline: [
                                { $match: 
                                    { $expr: 
                                        { $and: 
                                            [
                                                { $in: [  "$_id", "$$services" ] },
                                                { $eq: [ "$state", 1 ] }
                                            ] 
                                        }
                                    }
                                }
                            ],
                            as: "type_service_details"
                        }
                    };
    
                    var type_capacity_list_query = {
                        $lookup:
                        {
                            from: "type_capacities",
                            let: { capacities: '$type_detail.type_capacity_list' },
                            pipeline: [
                                { $match: 
                                    { $expr: 
                                        { $and: 
                                            [
                                                { $in: [  "$_id", "$$capacities" ] },
                                                { $eq: [ "$state", 1 ] }
                                            ] 
                                        }
                                    }
                                }
                            ],
                            as: "type_capacity_details"
                        }
                    };

                    var cityid_condition = {$match: {'cityid': {$eq: Schema(partner.city_id)}}};    
                    let user_type_condition = {$match: {'user_type': {$eq: 0}}};
    
                    Citytype.aggregate([cityid_condition, user_type_condition, lookup, unwind, type_model_list_query, type_service_list_query ,type_capacity_list_query]).then((type_available) => { 
                        // console.log(type_available)
    
                        res.render('edit_vehicle_detail', {partner_id: partner._id, vehicle_accesibility: vehicle_accesibility, type_available: type_available, partner_vehicle_document: partner_vehicle_document, vehicle_detail: partner.vehicle_detail[index]})
                        delete message;
                    }, (err) => {
                        utils.error_response(err, res)
                    });
    
                })
            })
    
        } else {
        res.redirect('/admin');
    }
};

exports.admin_update_vehicle_detail = async function (req, res) {
    try {
        
    
    if (typeof req.session.userid == 'undefined') {
        res.redirect('/truck_list');
        return;
    }

        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        let partner = await Partner.findOne({_id: req.body.partner_id})
        var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);

        if(req.body.accessibility && req.body.accessibility.length){
            req.body.accessibility.forEach((accessibility,index)=>{
                req.body.accessibility[index] = accessibility.replace('_',' ')
            })
        }
        req.body.selected_services_id = req.body.selected_services_id || []
        req.body.selected_services_id = req.body.selected_services_id.map(s => Schema(s));
        
        req.body.selected_model_id = req.body.selected_model_id || []
        req.body.selected_model_id = req.body.selected_model_id.map(s => Schema(s));
        
        req.body.selected_capacity_id = req.body.selected_capacity_id || []
        req.body.selected_capacity_id = req.body.selected_capacity_id.map(s => Schema(s));

        partner.vehicle_detail[index].name = req.body.name;
        partner.vehicle_detail[index].plate_no = req.body.plate_no;
        partner.vehicle_detail[index].model = req.body.model;
        partner.vehicle_detail[index].color = req.body.color;
        partner.vehicle_detail[index].passing_year = req.body.passing_year;
        partner.vehicle_detail[index].accessibility = req.body.accessibility;
        partner.vehicle_detail[index].selected_model_id = req.body.selected_model_id;
        partner.vehicle_detail[index].selected_services_id = req.body.selected_services_id;
        partner.vehicle_detail[index].selected_capacity_id = req.body.selected_capacity_id;
        partner.vehicle_detail[index].service_type = Schema(req.body.citytype_id),
        partner.vehicle_detail[index].admin_type_id = Schema(req.body.service_type)
        const hasDevicesTemperature = req.body.hasDevicesTemperature ? true : false;
        partner.vehicle_detail[index].hasDevicesTemperature = hasDevicesTemperature;

 
 
        let provider_vehicle_update = { 
        "vehicle_detail.$.name": partner.vehicle_detail[index].name || "",
        "vehicle_detail.$.plate_no": partner.vehicle_detail[index].plate_no || "",
        "vehicle_detail.$.model": partner.vehicle_detail[index].model || "",
        "vehicle_detail.$.color": partner.vehicle_detail[index].color || "",
        "vehicle_detail.$.passing_year": partner.vehicle_detail[index].passing_year || "",
        "vehicle_detail.$.accessibility": partner.vehicle_detail[index].accessibility || [],
        "vehicle_detail.$.selected_model_id": partner.vehicle_detail[index].selected_model_id || null,
        "vehicle_detail.$.selected_services_id": partner.vehicle_detail[index].selected_services_id || [],
        "vehicle_detail.$.selected_capacity_id": partner.vehicle_detail[index].selected_capacity_id || null,
        "vehicle_detail.$.service_type": partner.vehicle_detail[index].service_type || null,
        "vehicle_detail.$.admin_type_id":partner.vehicle_detail[index].admin_type_id || null,
        "vehicle_detail.$.hasDevicesTemperature": partner.vehicle_detail[index].hasDevicesTemperature || false

    }
        await Partner.findOneAndUpdate({_id: req.body.partner_id}, {vehicle_detail: partner.vehicle_detail}, {new : true})
        await Provider.updateMany({"vehicle_detail._id": Schema(req.body.vehicle_id) }, provider_vehicle_update)

        message = admin_messages.success_update_vehicle_detail;
        res.redirect('/truck_list');
    } catch (e) {
        console.log(e);
    }    
};


exports.generate_trucks_excel = async function (req, res, next) {

    if (typeof req.session.userid != "undefined") {
        let sort_field;
        let search_item;
        let search_value           
        
        if (req.body.search_item == undefined) {
            search_item = 'first_name';
            search_value = '';
        } else {
            search_item = req.body.search_item;
            search_value = req.body.search_value;
        }

        const admin = req.session.admin
        let country_query = {}
        let truck_country_condition = {"$match": {}};
        if(!admin.super_admin){
            country_query['country_id'] = Schema(admin.country_id)
            truck_country_condition["$match"]["country_id"] = {$eq: Schema(admin.country_id)};
        }

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        let search = {"$match": {}};

        if (search_item == "partner_name")
        {
            let query1 = {};
            let query2 = {};
            let query3 = {};
            let query4 = {};
            let query5 = {};
            let query6 = {};
            let query7 = {}
            let query8 = {}
            let query9 = {}
            let full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1['first_name'] = {$regex: new RegExp(value, 'i')};
                query2['last_name'] = {$regex: new RegExp(value, 'i')};
                query3['partner_company_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2, query3]}};
            } else {
                query1['first_name'] = {$regex: new RegExp(value, 'i')};
                query2['last_name'] = {$regex: new RegExp(value, 'i')};
                query3['first_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query4['last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5['first_name'] = {$regex: new RegExp(full_name[1], 'i')};
                query6['last_name'] = {$regex: new RegExp(full_name[1], 'i')};
                query7['partner_company_name'] = {$regex: new RegExp(value, 'i')};
                query8['partner_company_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query9['partner_company_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6, query7, query8, query9 ]}};
            }
        } else if(search_item == "plate_no")
        {
            search = {"$match": {}};
            search["$match"]["vehicle_detail.plate_no"] = {$regex: search_value};
        };

        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        let search_type_of_truck = { $match: {} };
        if(req.body.search_truck_type_id){
            search_type_of_truck = { $match: { 'vehicle_detail.admin_type_id' : Schema(req.body.search_truck_type_id)} };
        }
        
        let search_model_of_truck = { $match: {} };
        if(req.body.search_model_type_id){
            search_model_of_truck = { $match: { 'vehicle_detail.selected_model_id' : Schema(req.body.search_model_type_id)} };
        }

        let sort = { "$sort": {} };
        sort["$sort"][sort_field] = parseInt(1);

        let vehicle_condition = { $match: { vehicle_detail: {$ne: []} }};

        const cities = await City.find(country_query,{cityname:1})

        let proj_vehicles = {
            $project: {
                _id:1,
                vehicle_detail: 1,
                first_name: "$first_name",
                last_name: "$last_name",
                country_phone_code: "$country_phone_code",
                phone: "$phone",
                city_id: "$city_id",
                country_id: "$country_id"
            }
        }

        let unwind_vehicles = {
            $unwind: "$vehicle_detail"
        }

        let model_lookup = {
            $lookup:
                    {
                        from: "type_models",
                        localField: "vehicle_detail.selected_model_id",
                        foreignField: "_id",
                        as: "model_detail"
                    }
        };
        let service_type_lookup = {
            $lookup:
                    {
                        from: "types",
                        localField: "vehicle_detail.admin_type_id",
                        foreignField: "_id",
                        as: "service_type_details"
                    }
        };
        if(req.body.plate_no != undefined && req.body.plate_no != ''){
            plateno_condition = {$match:{ 'vehicle_detail.plate_no': req.body.plate_no}}
        }

        Partner.aggregate([truck_country_condition, vehicle_condition,  sort,proj_vehicles, unwind_vehicles, search, search_type_of_truck, search_model_of_truck, service_type_lookup, model_lookup ]).then((truck_list) => {
            generate_excel(req, res, truck_list, cities)
        });
            
    } else {
        res.redirect('/admin');
    }
}

exports.admin_get_vehicle_docs = async function (req, res) {
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        } 
        let docs = await Partner_Vehicle_Document.find({vehicle_id: req.body.vehicle_id, document_picture: {$ne: ""}})
        if (!docs.length) {
            return res.json({ success: false, docs: []});
        }
        res.json({success:true, docs})
    } catch (e) {
        console.log(e)
        res.json({success:false, docs: []})   
    }    
};

function generate_excel(req, res, array, cities) {


    var date = new Date()
    var time = date.getTime()
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('sheet1');
    var col = 1;

    ws.cell(1, col++).string(req.__('title_num'));
    ws.cell(1, col++).string(req.__('title_truck'));
    ws.cell(1, col++).string(req.__('title_type_of_truck'));
    ws.cell(1, col++).string(req.__('title_years'));
    ws.cell(1, col++).string(req.__('title_plate_no'));
    ws.cell(1, col++).string(req.__('title_partner'));
    ws.cell(1, col++).string(req.__('title_partner_phone'));
    ws.cell(1, col++).string(req.__('title_city'));
    ws.cell(1, col++).string(req.__('title_status'));

    array.forEach(function (data, index) {
        col = 1;
        ws.cell(index + 2, col++).number(index + 1);
        ws.cell(index + 2, col++).string(data.service_type_details[0].typename);
        ws.cell(index + 2, col++).string(data?.model_detail[0]?.model_name ? data?.model_detail[0]?.model_name : "");
        ws.cell(index + 2, col++).string(data.vehicle_detail.passing_year );
        ws.cell(index + 2, col++).string(data.vehicle_detail.plate_no );
        ws.cell(index + 2, col++).string(data.first_name +" "+ data.last_name );
        ws.cell(index + 2, col++).string(data.country_phone_code +""+ data.phone );
        let city_name = data?.city_id
        ? cities.find(city => city._id.toString() === data.city_id.toString())?.cityname || ""
        : "";
        ws.cell(index + 2, col++).string(city_name);
        ws.cell(index + 2, col++).string(data?.vehicle_detail?.is_approved_by_admin == true ? "Active": "Inactive");
        if (index == array.length - 1) {
            wb.write('data/xlsheet/' + time + '_trucks.xlsx', function (err) {
                if (err) {
                    console.error(err);
                } else {
                    var url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_trucks.xlsx";
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_trucks.xlsx', function () {
                        });
                    }, 10000)
                }
            });
        }

    })
}