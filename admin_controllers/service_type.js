var myUtils = require('../controllers/utils');
var Type = require('mongoose').model('Type');
var City_type = require('mongoose').model('city_type');
let Type_Models = require('mongoose').model('type_model');
let Type_Services = require('mongoose').model('type_services');
let Type_Capacity = require('mongoose').model('type_capacity');
let Corporate = require('mongoose').model('Corporate');

exports.service_types = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        let search = {};
        let search_value = req.body.search_value;
        let value = search_value;
        if (value) {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            if (value != "") {
                search = { typename: { $regex: new RegExp(value, 'i') } };
            }
        }
        let select = {
            _id: 1,
            service_type: 1,
            typename: 1,
            is_business: 1,
            type_image_url: 1,
            description: 1,
            is_default_selected: 1,
        }
        Type.count(search).then((type_count) => {
            if (type_count == 0) {
                res.render('service_type', { service_data: [], search_value });
            } else {
                Type.find(search).select(select).then((service) => {
                    var TRIP_TYPES = [
                        { id: constant_json.TRIP_TYPE_VISITOR, name: config_json.TRIP_TYPE_VISITOR_STRING },
                        { id: constant_json.TRIP_TYPE_NORMAL, name: config_json.TRIP_TYPE_NORMAL_STRING }
                    ]
                    var service_data = [];
                    var types = TRIP_TYPES;
                    var size = types.length;
                    var id;
                    service.forEach(function (service_detail) {
                        id = service_detail.service_type;
                        for (var i = 0; i < size; i++) {
                            if (types[i].id == id) {
                                var temp = {
                                    name: types[i].name, _id: service_detail._id,
                                    typename: service_detail.typename,
                                    is_business: service_detail.is_business,
                                    type_image_url: service_detail.type_image_url,
                                    description: service_detail.description,
                                    is_default_selected: service_detail.is_default_selected
                                };
                                service_data.push(temp);
                                break;
                            }
                        }
                    });
                    res.render('service_type', { service_data, search_value });
                    delete message;
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
}

exports.add_service_form = async function (req, res) {
    if (typeof req.session.userid != "undefined") {
        // console.log("-------123--------");
        let models = await Type_Models.find({ state: 1 }).lean(); 
        let services = await Type_Services.find({ state: 1 }).lean(); 
        let capacity = await Type_Capacity.find({ state: 1 }).lean(); 
        
        var TRIP_TYPES = [
                            {id:  constant_json.TRIP_TYPE_VISITOR, name:req.__('TRIP_TYPE_VISITOR_STRING')},
                            {id: constant_json.TRIP_TYPE_NORMAL, name:req.__('TRIP_TYPE_NORMAL_STRING')}
                        ]
        res.render('add_type_form', {type_array:  TRIP_TYPES, type_models: models, type_services: services, type_capacity: capacity});
    } else {
        res.redirect('/admin');
    }
}

exports.edit_service_form = async function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        Type.find({'_id': id}).then(async (service) => { 
            let models = await Type_Models.find({ state: 1 }).lean(); 
            let services = await Type_Services.find({ state: 1 }).lean(); 
            let capacity = await Type_Capacity.find({ state: 1 }).lean(); 
            var TRIP_TYPES = [
                            {id:  constant_json.TRIP_TYPE_VISITOR, name:req.__('TRIP_TYPE_VISITOR_STRING')},
                            {id: constant_json.TRIP_TYPE_NORMAL, name:req.__('TRIP_TYPE_NORMAL_STRING')}
                        ]
                res.render('add_type_form', {service_data: service, type_array: TRIP_TYPES, type_models: models, type_services: services, type_capacity: capacity});
            
        });
    } else {
        res.redirect('/admin');
    }
};

exports.add_service_detail = function (req, res) {
    req.body.is_use_model = req.body.is_use_model || 0;
    req.body.is_use_capacity = req.body.is_use_capacity || 0;
    req.body.is_use_services = req.body.is_use_services || 0;
    req.body.is_use_specification = req.body.is_use_specification || 0;
    
    var sequence = ""
    req.body.sequence = (req.body.sequence).trim();
    if(req.body.sequence != ""){
        sequence = req.body.sequence.replace(/^0+/, '');
    }

    var add_type = new Type({
        typename: (req.body.typename).trim(),
        typename2: (req.body.typename2).trim(),
        description: req.body.description,
        is_business: req.body.is_business,
        sequence: sequence,
        type_model_list: req.body.type_model_list,
        type_service_list: req.body.type_service_list,
        type_capacity_list: req.body.type_capacity_list,
        label_capacity_id: req.body.label_capacity_id,
        label_measurement_id: req.body.label_measurement_id,
        label_pallet_id: req.body.label_pallet_id,
        ride_share_limit: req.body.ride_share_limit,
        priority: req.body.priority,
        type_image_url: '',
        map_pin_image_url: '',
        is_use_model: req.body.is_use_model || 0,
        is_use_capacity: req.body.is_use_capacity || 0,
        is_use_services: req.body.is_use_services || 0,
        is_use_specification: req.body.is_use_specification || 0,
        courier_type: req.body.courier_type

    });

    if (typeof req.session.userid != "undefined") {
        if (req.files != null || req.files != 'undefined') {
            var image_name = add_type._id + myUtils.tokenGenerator(4);
            var url = myUtils.getImageFolderPath(req, 4) + image_name + '.png';
            add_type.type_image_url = url;
            myUtils.saveImageFromBrowser(req.files[0].path, image_name + '.png', 4);

            image_name = add_type._id + myUtils.tokenGenerator(5);
            url = myUtils.getImageFolderPath(req, 5) + image_name + '.png';
            add_type.map_pin_image_url = url;
            myUtils.saveImageFromBrowser(req.files[1].path, image_name + '.png', 5);

        }
        add_type.save().then((typpes) => { 
            // console.log(typpes)
                res.redirect('/service_types');
        }, (err) => {
            console.log(err)
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_service_detail = function (req, res) {

    var id = req.body.id;
    if (typeof req.body.is_default_selected == 'undefined') {
        req.body.is_default_selected = 'false';
    } else {
        Type.updateMany({_id: {$ne: id}}, {is_default_selected: false}, {multi: true}, function(){

        });
    }

    if (typeof req.session.userid != "undefined") {

        req.body.is_use_model = req.body.is_use_model || 0;
        req.body.is_use_capacity = req.body.is_use_capacity || 0;
        req.body.is_use_services = req.body.is_use_services || 0;
        req.body.is_use_specification = req.body.is_use_specification || 0;
        req.body.type_service_list = req.body.type_service_list || []
        req.body.type_capacity_list = req.body.type_capacity_list || []
        req.body.type_model_list = req.body.type_model_list || []
        req.body.label_capacity_id = req.body.label_capacity_id || []
        req.body.label_measurement_id = req.body.label_measurement_id || []
        req.body.label_pallet_id = req.body.label_pallet_id || []

        req.body.typename = (req.body.typename).trim();
        req.body.sequence = (req.body.sequence).trim();
        req.body.typename2= (req.body.typename2).trim();

        // console.log(req.body)
        if(req.body.sequence != ""){
            req.body.sequence = req.body.sequence.replace(/^0+/, '');
        }
    
        Type.findByIdAndUpdate(id, req.body).then((type_detail) => { 
            // console.log(type_detail)

            var file_list_size = 0;
            var files_details = req.files;

            if (files_details != null || files_details != 'undefined') {
                file_list_size = files_details.length;

                var file_data;
                var file_id;
                var file_name = "";

                for (i = 0; i < file_list_size; i++) {

                    file_data = files_details[i];
                    file_id = file_data.fieldname;
                    file_name = '';

                    if (file_id == 'file2') {
                        myUtils.deleteImageFromFolder(type_detail.type_image_url, 4);
                        var image_name = type_detail._id + myUtils.tokenGenerator(4);
                        var url = myUtils.getImageFolderPath(req, 4) + image_name + '.png';
                        type_detail.type_image_url = url;
                        myUtils.saveImageFromBrowser(req.files[i].path, image_name + '.png', 4);
                        type_detail.save().then(() => { 
                        }, (err) => {
                            console.log(err)
                        });

                    } else if (file_id == 'file3') {
                        myUtils.deleteImageFromFolder(type_detail.map_pin_image_url, 5);
                        image_name = type_detail._id + myUtils.tokenGenerator(5);
                        url = myUtils.getImageFolderPath(req, 5) + image_name + '.png';
                        type_detail.map_pin_image_url = url;
                        myUtils.saveImageFromBrowser(req.files[i].path, image_name + '.png', 5);
                        type_detail.save().then(() => { 
                        }, (err) => {
                            console.log(err)
                        });
                    } else if (file_id == 'file4') {
                        let mime_type = req.files[i].mimetype.split('/')[1]
                        mime_type = mime_type === 'svg+xml' ? 'svg' : mime_type
    
                        myUtils.deleteImageFromFolder(type_detail.panel_map_pin_image_url, 5);
                        image_name = type_detail._id + myUtils.tokenGenerator(5);
                        url = myUtils.getImageFolderPath(req, 5) + image_name + '.' + mime_type;
                        type_detail.panel_map_pin_image_url = url;
                        myUtils.saveImageFromBrowser(req.files[i].path, image_name +  '.' + mime_type, 5);
                        type_detail.save().then(() => { 
                        }, (err) => {
                            console.log(err)
                        });
                    }
                }
            }
            res.redirect('/service_types');
        });
    } else {
        res.redirect('/admin');
    }
};

exports.check_type_available = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var typename = (req.body.typename).trim();
        var query = {};
        query['typename'] = typename;
        Type.count(query).then((type_list) => { 
            if (type_list != 0) {
                res.json(1);
            } else {
                res.json(0);
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.check_type_sequence_available = async function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var sequence = (req.body.sequence).trim();
        if(sequence != ""){
            sequence = sequence.replace(/^0+/, '');
        }

        var query = {};
        query['sequence'] = sequence;
        Type.count(query).then((type_list) => { 

            if (type_list != 0) {
                res.json(1);
            } else {
                res.json(0);
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.fetch_servicetype_list = async function (req, res) {
    try{

        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        }

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

        var mongoose = require('mongoose');

        var condition = {"$match": {}};
        var is_ride_share_condition = {$match: {}};
        if(req.body.cityid){
            condition["$match"]['cityid'] = {$eq: mongoose.Types.ObjectId(req.body.cityid)};
        }

        if (req.body.is_ride_share == 1) {
            condition["$match"]['is_ride_share'] = { $eq: 1 };
        } else {
            condition["$match"]['is_ride_share'] = { $ne: 1 };
        }

        if (req.body.user_type_id) {
            condition["$match"]['user_type_id'] = { $eq: mongoose.Types.ObjectId(req.body.user_type_id) };
        }else{
            condition["$match"]['user_type'] = { $eq: 0 };
        }
        let city_type = await City_type.aggregate([condition, is_ride_share_condition, lookup, unwind])
        let type_list = await Type.find({}) 
        res.json({'type_list': type_list, 'city_type': city_type, });
    } catch(error) {
        res.json({success:false,error_code:error_message.ERROR_CODE_SOMETHING_WENT_WRONG})
    }
};

exports.fetch_corporate_list = async function (req, res) {
    try{
        if (typeof req.session.userid == 'undefined') {
            res.json({success:false})
            return;
        }
        let corporate_list = await Corporate.find({country_id: req.body.countryid}).select({_id:1, name:1}).lean()
        res.json({success:true, 'corporate_list':corporate_list});
    }catch(e){
        console.error(e);
    }
};


exports.fetch_truck_type_list = async function (req, res) {
    if (typeof req.session.userid == 'undefined' ) {
        res.json({success:false})
        return;
    }
    let truck_services_list = await Type_Services.find({state:1}).lean() 
    let truck_type_list = await Type_Models.find({ state: 1 }).lean();
    truck_type_list.sort((a, b) => {
      return parseInt(a.sequence) - parseInt(b.sequence);
    });
    let truck_capacity_list = await Type_Capacity.find({state:1}).sort({unit:-1,value:1}).lean() 
    res.json({success:true, 'truck_type_list': truck_type_list, 'service_list': truck_services_list, 'capacity_list': truck_capacity_list });
};

exports.type_list = function (req, res) {
    // console.log('type_list')
    Type.find({is_business:1}).then((type_list) => { 
        res.json({'type_list': type_list});
    });
    
};

exports.check_type_priority_available = function (req, res) {
    if (typeof req.session.userid == 'undefined') {
        Type.find({}, {"priority": 1}).then((types) => { 
            res.json(types);
        })
    } else {
        res.redirect('/admin');
    }
};