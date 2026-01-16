var utils = require('./utils');
var Citytype = require('mongoose').model('city_type');
var City = require('mongoose').model('City');
var Country = require('mongoose').model('Country');
var User = require('mongoose').model('User');
var Provider = require('mongoose').model('Provider');
var geolib = require('geolib');
var console = require('./console');
var utils = require('./utils');
var RedZoneArea = require('mongoose').model('RedZoneArea');
var CityZone = require('mongoose').model('CityZone');
var Corporate = require('mongoose').model('Corporate');

// list
exports.list = async function (req, res) {
    const country = await Country.findOne({
        countryname: req.body.country
    })
    
    req.body.countryDetails = country

    utils.check_request_params(req.body, [
        {name: 'country', type: 'string'}], function (response) {
        if (response.success) {
            
            const allowedCountries = [
                "USA", 
                "United States of America", 
                "United States", 
                "Colombia", 
                "Argentina", 
                "India",
                "Peru",
                "Panama",
            ];
            

            if (allowedCountries.includes(req.body.country)) {
                if(req.body.countryDetails != null) {
                    req.body.country = country.countryname
                    req.body.country_code = country.countrycode
                    req.body.latitude = country.coordinates.latitude
                    req.body.longitude =  country.coordinates.longitude
                } else {
                    res.json({
                        message: "Country not allowed",
                        success: false,
                        error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                    }); 
                }
            } 

            var currentCityLatLong = [req.body.latitude, req.body.longitude];
            var user_id = req.body.user_id;
            var provider_id = req.body.provider_id;
            var corporate_id = req.body.corporate_id;
            var country_code = req.body.country_code;
            let user_type = 0;
            var id;
            var table;


            if (provider_id !== undefined && user_id == undefined) {
                id = req.body.provider_id;
                table = Provider;
            } 
            
            if(user_id !== undefined && provider_id === undefined ) {
                id = req.body.user_id;
                table = User;
            }

            if(corporate_id !== undefined && provider_id === undefined 
                && user_id == undefined) {
                id = req.body.corporate_id;
                table = Corporate;
            }
           
            if(!country_code){
                country_code = null;
            }

            table.findOne({ _id: id }).then(async (detail) => {
                if (detail) {
                    if (req.body.token !== null && detail.token !== req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                        return;
                    }
                }
                
                if(detail.user_type_id && detail.corporate_ids.length > 0){
                    let corporate_details = await Corporate.findOne({_id: detail.user_type_id}).select({is_own_service_type:1}).lean()
                    if(corporate_details.is_own_service_type == 1){
                        user_type = constant_json.CORPORATE_UNIQUE_NUMBER
                    }
                }

                   const convertSequenceInt = {
                        "$addFields": {
                            "type_details.sequenceInt": { "$toInt": "$type_details.sequence" }
                        }
                    }
                    var sort = {"$sort": {}};
                    sort["$sort"]['type_details.sequenceInt'] = parseInt(1);
                    const exclude_gandola_condition = {
                        $match: {
                            model_type: { $nin: [MODEL_TRUCK_TYPE.CHUTO, MODEL_TRUCK_TYPE.TRAILER, MODEL_TRUCK_TYPE.CHASIS] }
                        }
                    }

                    if (!country) {
    
                           City.find({ cityLatLong : { $near: [Number(req.body.latitude), Number(req.body.longitude)], $maxDistance: 1 }  , isBusiness: constant_json.YES}).then((cityList) => {

                            var size = cityList.length;
                            var count = 0;
                            if (size == 0) {
                               res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY});
                            } else {
                                var finalCityId = null;
                                var finalDistance = 1000000;
                                var final_city_details = {};
                                cityList.forEach(function (city_detail) {
                                    count++;
                                    var cityLatLong = city_detail.cityLatLong;
                                    var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(currentCityLatLong, cityLatLong);
                                    var cityRadius = city_detail.cityRadius;

                                    if (!city_detail.is_use_city_boundary) {
                                        if (distanceFromSubAdminCity < cityRadius) {
                                            if (distanceFromSubAdminCity < finalDistance) {
                                                finalDistance = distanceFromSubAdminCity;
                                                finalCityId = city_detail._id;
                                                final_city_details = city_detail;
                                                
                                            }
                                        }
                                    } else {
                                        var city_zone = geolib.isPointInside(
                                            {
                                                latitude: Number(req.body.latitude),
                                                longitude: Number(req.body.longitude)
                                            },
                                            city_detail.city_locations);
                                        if (city_zone) {
                                            if (distanceFromSubAdminCity < finalDistance) {
                                                finalDistance = distanceFromSubAdminCity;
                                                finalCityId = city_detail._id;
                                                final_city_details = city_detail;
                                                 
                                            }
                                        }
                                    }
                                    if (count == size) {
                                        if (finalCityId != null) {
                                            var city_id = finalCityId;

                                            RedZoneArea.find({cityid: city_id}).then((red_zone_area_list)=>{
                                                var inside_red_zone = false;
                                                red_zone_area_list.forEach(function(red_zone_area_data, index){
                                                    var inside_zone = geolib.isPointInside(
                                                        {
                                                            latitude: Number(req.body.latitude),
                                                            longitude: Number(req.body.longitude)
                                                        }, red_zone_area_data.kmlzone);
                                                    if (inside_zone) {
                                                        inside_red_zone = true;
                                                    }
                                                })
                                                if(!inside_red_zone){
                                                    CityZone.find({cityid: city_id}).then((zone_list)=>{
                                                        var zone_id = null;
                                                        zone_list.forEach(function(zone_data, index){
                                                            var inside_zone = geolib.isPointInside(
                                                                {
                                                                    latitude: Number(req.body.latitude),
                                                                    longitude: Number(req.body.longitude)
                                                                }, zone_data.kmlzone);
                                                            if (inside_zone) {
                                                                zone_id = zone_data._id;
                                                            }
                                                        });

                                                        var city_type_to_type_query = {
                                                            $lookup:
                                                                {
                                                                    from: "types",
                                                                    localField: "typeid",
                                                                    foreignField: "_id",
                                                                    as: "type_details"
                                                                }
                                                        };
                                                        var array_to_json = {$unwind: "$type_details"};

                                                        var type_model_list_query = {
                                                            $lookup:
                                                            {
                                                                from: "type_models",
                                                                let: { models: '$type_details.type_model_list' },
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
                                                                    },
                                                                    {
                                                                        $lookup:
                                                                        {
                                                                            from: "type_services",
                                                                            let: { services: '$type_service_list' },
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
                                                                                },
                                                                                {
                                                                                    $lookup:{
                                                                                        from: "service_specifications",
                                                                                        let: { specifiactions: '$specification_array' },
                                                                                        pipeline: [
                                                                                            { $match: 
                                                                                                { $expr: 
                                                                                                    { $and: 
                                                                                                        [
                                                                                                            { $in: [  "$_id", "$$specifiactions" ] },
                                                                                                            { $eq: [ "$state", 1 ] }
                                                                                                        ] 
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        ],
                                                                                        as: "specification_details"
                                                                                    }
                                                                                }
                                                                            ],
                                                                            as: "type_service_details"
                                                                        }
                                                                    }
                                                                ],
                                                                as: "type_model_details"
                                                            }
                                                        }


                                                        var type_capacity_list_query = {
                                                            $lookup:
                                                            {
                                                                from: "type_capacities",
                                                                let: { capacities: '$type_details.type_capacity_list' },
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
                                                                    },
                                                                    {$sort:{"value":1}}
                                                                ],
                                                                as: "type_capacity_details"
                                                            }
                                                        }
                                                        const label_capacity_query = {
                                                            $lookup:
                                                            {
                                                                from: "type_capacities",
                                                                let: { capacities: '$type_details.label_capacity_id' },
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
                                                                    },
                                                                    {$sort:{"value":1}}
                                                                ],
                                                                as: "label_capacity_details"
                                                            }
                                                        }

                                                        const label_measurement_query = {
                                                            $lookup: {
                                                            from: "type_capacities",
                                                            let: { measurement: "$type_details.label_measurement_id" },
                                                            pipeline: [
                                                                {
                                                                $match: {
                                                                    $expr: {
                                                                    $and: [
                                                                        { $in: ["$_id", "$$measurement"] },
                                                                        { $eq: ["$state", 1] }
                                                                    ]
                                                                    }
                                                                }
                                                                },
                                                                { $sort: { value: 1 } }
                                                            ],
                                                            as: "label_measurement_details"
                                                            }
                                                        };
                                                        
                                                        const label_pallet_query = {
                                                            $lookup: {
                                                            from: "type_capacities",
                                                            let: { pallet: "$type_details.label_pallet_id" },
                                                            pipeline: [
                                                                {
                                                                $match: {
                                                                    $expr: {
                                                                    $and: [
                                                                        { $in: ["$_id", "$$pallet"] },
                                                                        { $eq: ["$state", 1] }
                                                                    ]
                                                                    }
                                                                }
                                                                },
                                                                { $sort: { value: 1 } }
                                                            ],
                                                            as: "label_pallet_details"
                                                            }
                                                        };
  

                                                        var countryid_condition = {$match: {'countryid': {$eq: final_city_details.countryid}}};
                                                        var cityid_condition = {$match: {'cityid': {$eq: city_id}}};
                                                        var buiesness_condotion = {$match: {'is_business': {$eq: 1}}};
                                                        let user_type_pricing_condition = {$match: {'user_type': {$eq: 0}}}
                                                        if(user_type == constant_json.CORPORATE_UNIQUE_NUMBER){
                                                            user_type_pricing_condition = {$match: {'user_type_id': {$eq: detail.user_type_id}}};
                                                        }
                                                        
                                                        var is_ride_share_condition = { $match: { 'is_ride_share': { $ne: 1 } } };
                                                        var rrr = { "$redact": { "$cond": [{ '$eq': ["$type_details.is_business", 1] }, "$$KEEP", "$$PRUNE"] } }

                                                        var lookup = {
                                                            $lookup:
                                                            {
                                                                from: "city_types",
                                                                localField: "car_rental_ids",
                                                                foreignField: "_id",
                                                                as: "car_rental_list"
                                                            }
                                                        };
                                                        
                                                       



                                                        Citytype.aggregate([countryid_condition, cityid_condition, buiesness_condotion, is_ride_share_condition, exclude_gandola_condition, city_type_to_type_query, 
                                                            user_type_pricing_condition, array_to_json, type_model_list_query, type_capacity_list_query, label_capacity_query, label_measurement_query, label_pallet_query, rrr, lookup, convertSequenceInt, sort]).then(async (citytypes) => {
                                                            var PAYMENT_TYPES = utils.PAYMENT_TYPES();
                                                            if(zone_id){
                                                                citytypes.forEach(function(citytype_data){
                                                                    if(citytype_data.rich_area_surge){
                                                                        var zone_index = citytype_data.rich_area_surge.findIndex((x) => (x.id).toString() == zone_id.toString());
                                                                        if(zone_index !== -1 && citytype_data.rich_area_surge[zone_index].surge_multiplier>0){
                                                                            citytype_data.rich_area_surge_multiplier = citytype_data.rich_area_surge[zone_index].surge_multiplier;
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                            citytypes.forEach(function(citytype_data){
                                                                if(citytype_data.is_car_rental_business){
                                                                    var car_rental_list = citytype_data.car_rental_list;
                                                                    citytype_data.car_rental_list = [];
                                                                    car_rental_list.forEach(function(car_rental_data){
                                                                        if(car_rental_data.is_business){
                                                                            citytype_data.car_rental_list.push(car_rental_data);
                                                                        }
                                                                    })
                                                                } else {
                                                                    citytype_data.car_rental_list = [];
                                                                }
                                                            });
                                                            let pooltypes = []
                                                            if (setting_detail.is_allow_ride_share) {
                                                                var is_ride_share_condition = { $match: { 'is_ride_share': { $eq: 1 } } };
                                                                var rrr = { "$redact": { "$cond": [{ '$eq': ["$type_details.is_business", 1] }, "$$KEEP", "$$PRUNE"] } }

                                                                pooltypes = await Citytype.aggregate([countryid_condition, cityid_condition, buiesness_condotion, is_ride_share_condition, exclude_gandola_condition, city_type_to_type_query, array_to_json, rrr, sort])
                                                            }
                                                            if (citytypes.length != 0 || pooltypes.length != 0) {

                                                                 var corporate_id = null;
                                                                if(detail.corporate_ids && detail.corporate_ids.length>0){
                                                                    corporate_id = detail.corporate_ids[0].corporate_id;
                                                                }

                                                                Corporate.findOne({_id: corporate_id}).then((corporate_detail)=>{
                                                                    var is_corporate_request = false;
                                                                    if(corporate_detail && detail.corporate_ids[0].status == constant_json.CORPORATE_REQUEST_ACCEPTED && corporate_detail.is_approved){
                                                                        is_corporate_request = true;
                                                                    }

                                                                    res.json({
                                                                        success: true,
                                                                        message: success_messages.MESSAGE_CODE_GET_CITYTYPE_LIST_SUCCESSFULLY,
                                                                        currency: currency,
                                                                        currencycode: currencycode,
                                                                        city_detail: final_city_details,
                                                                        payment_gateway: PAYMENT_TYPES,
                                                                        citytypes: citytypes,
                                                                        pooltypes: pooltypes,
                                                                        server_time: server_time,
                                                                        is_corporate_request: is_corporate_request
                                                                    });
                                                                });

                                                            } else if (count == size) {
                                                                res.json({
                                                                    success: false,
                                                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                                });
                                                            }
                                                        });
                                                    });
                                                } else {
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                    }); 
                                                }
                                            });


                                        } else {
                                            res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY});
                                        }
                                    }

                                });
                            }
                        });

                        
                        
                    } else {

                        if(country.isBusiness== constant_json.YES){

                            var country_id = country._id;
                            var currency = country.currencysign;
                            var currencycode = country.currencycode;
                            var server_time = new Date();
                            
                            City.find({countryid: country_id, isBusiness: constant_json.YES}).then((cityList) => {

                                var size = cityList.length;
                                var count = 0;
                                if (size == 0) {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                    });
                                } else {
                                    var finalCityId = null;
                                    var finalDistance = 1000000;
                                    var final_city_details = {};
                                    cityList.forEach(function (city_detail) {
                                        count++;
                                        var cityLatLong = city_detail.cityLatLong;
                                        var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(currentCityLatLong, cityLatLong);
                                        var cityRadius = city_detail.cityRadius;

                                        if (!city_detail.is_use_city_boundary) {
                                            if (distanceFromSubAdminCity < cityRadius) {
                                                if (distanceFromSubAdminCity < finalDistance) {
                                                    finalDistance = distanceFromSubAdminCity;
                                                    finalCityId = city_detail._id;
                                                    final_city_details = city_detail;
                                                }
                                            }
                                        } else {
                                            var city_zone = geolib.isPointInside(
                                                {
                                                    latitude: Number(req.body.latitude),
                                                    longitude: Number(req.body.longitude)
                                                },
                                                city_detail.city_locations);
                                            if (city_zone) {
                                                if (distanceFromSubAdminCity < finalDistance) {
                                                    finalDistance = distanceFromSubAdminCity;
                                                    finalCityId = city_detail._id;
                                                    final_city_details = city_detail;
                                                }
                                            }
                                        }
                                        if (count == size) {
                                            if (finalCityId != null) {
                                                var city_id = finalCityId;

                                                RedZoneArea.find({cityid: city_id}).then((red_zone_area_list)=>{
                                                    var inside_red_zone = false;
                                                    red_zone_area_list.forEach(function(red_zone_area_data, index){
                                                        var inside_zone = geolib.isPointInside(
                                                            {
                                                                latitude: Number(req.body.latitude),
                                                                longitude: Number(req.body.longitude)
                                                            }, red_zone_area_data.kmlzone);
                                                        if (inside_zone) {
                                                            inside_red_zone = true;
                                                        }
                                                    })
                                                    if(!inside_red_zone){
                                                        CityZone.find({cityid: city_id}).then((zone_list)=>{
                                                            var zone_id = null;
                                                            zone_list.forEach(function(zone_data, index){
                                                                var inside_zone = geolib.isPointInside(
                                                                    {
                                                                        latitude: Number(req.body.latitude),
                                                                        longitude: Number(req.body.longitude)
                                                                    }, zone_data.kmlzone);
                                                                if (inside_zone) {
                                                                    zone_id = zone_data._id;
                                                                }
                                                            });

                                                            var city_type_to_type_query = {
                                                                $lookup:
                                                                    {
                                                                        from: "types",
                                                                        localField: "typeid",
                                                                        foreignField: "_id",
                                                                        as: "type_details"
                                                                    }
                                                            };
                                                            var array_to_json = {$unwind: "$type_details"};

                                                            var countryid_condition = {$match: {'countryid': {$eq: country_id}}};
                                                            var cityid_condition = {$match: {'cityid': {$eq: city_id}}};
                                                            var buiesness_condotion = { $match: { 'is_business': { $eq: 1 } } };
                                                            var is_ride_share_condition = { $match: { 'is_ride_share': { $ne: 1 } } };
                                                            var rrr = { "$redact": { "$cond": [{ '$eq': ["$type_details.is_business", 1] }, "$$KEEP", "$$PRUNE"] } }
                                                            let user_type_pricing_condition = {$match: {'user_type': {$eq: 0}}}
                                                            if(user_type == constant_json.CORPORATE_UNIQUE_NUMBER){
                                                                user_type_pricing_condition = {$match: {'user_type_id': {$eq: detail.user_type_id}}};
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
                                                            var type_model_list_query = {
                                                                $lookup:
                                                                {
                                                                    from: "type_models",
                                                                    let: { models: '$type_details.type_model_list' },
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
                                                                        },
                                                                        {
                                                                            $lookup:
                                                                            {
                                                                                from: "type_services",
                                                                                let: { services: '$type_service_list' },
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
                                                                                    },
                                                                                    {
                                                                                        $lookup:{
                                                                                            from: "service_specifications",
                                                                                            let: { specifiactions: '$specification_array' },
                                                                                            pipeline: [
                                                                                                { $match: 
                                                                                                    { $expr: 
                                                                                                        { $and: 
                                                                                                            [
                                                                                                                { $in: [  "$_id", "$$specifiactions" ] },
                                                                                                                { $eq: [ "$state", 1 ] }
                                                                                                            ] 
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            ],
                                                                                            as: "specification_details"
                                                                                        }
                                                                                    }
                                                                                ],
                                                                                as: "type_service_details"
                                                                            }
                                                                        }
                                                                    ],
                                                                    as: "type_model_details"
                                                                }
                                                            }



                                                            var type_capacity_list_query = {
                                                                $lookup:
                                                                {
                                                                    from: "type_capacities",
                                                                    let: { capacities: '$type_details.type_capacity_list' },
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
                                                                        },
                                                                        {$sort:{"value":1}}
                                                                    ],
                                                                    as: "type_capacity_details"
                                                                }
                                                            }

                                                            const label_capacity_query = {
                                                                $lookup:
                                                                {
                                                                    from: "type_capacities",
                                                                    let: { capacities: '$type_details.label_capacity_id' },
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
                                                                        },
                                                                        {$sort:{"value":1}}
                                                                    ],
                                                                    as: "label_capacity_details"
                                                                }
                                                            }
                                                                
                                                            const label_measurement_query = {
                                                                $lookup: 
                                                                {
                                                                    from: "type_capacities",
                                                                    let: { measurements: '$type_details.label_measurement_id' },
                                                                    pipeline: [
                                                                        {
                                                                        $match: {
                                                                            $expr: {
                                                                            $and: [
                                                                                { $in: ["$_id", "$$measurements"] },
                                                                                { $eq: ["$state", 1] }
                                                                            ]
                                                                            }
                                                                        }
                                                                        },
                                                                        { $sort: { value: 1 } }
                                                                    ],
                                                                    as: "label_measurement_details"
                                                                }
                                                            };
                                                            
                                                            const label_pallet_query = {
                                                                $lookup: {
                                                                from: "type_capacities",
                                                                let: { pallet: '$type_details.label_pallet_id' },
                                                                pipeline: [
                                                                    {
                                                                    $match: {
                                                                        $expr: {
                                                                        $and: [
                                                                            { $in: ["$_id", "$$pallet"] },
                                                                            { $eq: ["$state", 1] }
                                                                        ]
                                                                        }
                                                                    }
                                                                    },
                                                                    { $sort: { value: 1 } }
                                                                ],
                                                                as: "label_pallet_details"
                                                                }
                                                            };
    
                                                            

                                                            Citytype.aggregate([countryid_condition, cityid_condition, user_type_pricing_condition, buiesness_condotion, is_ride_share_condition, exclude_gandola_condition, city_type_to_type_query, array_to_json, type_model_list_query, type_capacity_list_query, label_capacity_query, label_measurement_query, label_pallet_query,  rrr, lookup, convertSequenceInt, sort]).then(async (citytypes) => {
                                                                var PAYMENT_TYPES = utils.PAYMENT_TYPES();
                                                                
                                                                if(zone_id){
                                                                    citytypes.forEach(function(citytype_data){
                                                                        if(citytype_data.rich_area_surge){
                                                                            var zone_index = citytype_data.rich_area_surge.findIndex((x) => (x.id).toString() == zone_id.toString());
                                                                            if(zone_index !== -1 && citytype_data.rich_area_surge[zone_index].surge_multiplier>0){
                                                                                citytype_data.rich_area_surge_multiplier = citytype_data.rich_area_surge[zone_index].surge_multiplier;
                                                                            }
                                                                        }
                                                                    })
                                                                }
                                                                citytypes.forEach(function(citytype_data){
                                                                    if(citytype_data.is_car_rental_business){
                                                                        var car_rental_list = citytype_data.car_rental_list;
                                                                        citytype_data.car_rental_list = [];
                                                                        car_rental_list.forEach(function(car_rental_data){
                                                                            if(car_rental_data.is_business){
                                                                                citytype_data.car_rental_list.push(car_rental_data);
                                                                            }
                                                                        })
                                                                    } else {
                                                                        citytype_data.car_rental_list = [];
                                                                    }
                                                                });
                                                                let pooltypes = []
                                                                if (setting_detail.is_allow_ride_share) {
                                                                    var is_ride_share_condition = { $match: { 'is_ride_share': { $eq: 1 } } };
                                                                    var rrr = { "$redact": { "$cond": [{ '$eq': ["$type_details.is_business", 1] }, "$$KEEP", "$$PRUNE"] } }
                                                                    var type_model_list_query = {
                                                                        $lookup:
                                                                        {
                                                                            from: "type_models",
                                                                            let: { models: '$type_details.type_model_list' },
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
                                                                                },
                                                                                {
                                                                                    $lookup:
                                                                                    {
                                                                                        from: "type_services",
                                                                                        let: { services: '$type_service_list' },
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
                                                                                            },
                                                                                            {
                                                                                                $lookup:{
                                                                                                    from: "service_specifications",
                                                                                                    let: { specifiactions: '$specification_array' },
                                                                                                    pipeline: [
                                                                                                        { $match: 
                                                                                                            { $expr: 
                                                                                                                { $and: 
                                                                                                                    [
                                                                                                                        { $in: [  "$_id", "$$specifiactions" ] },
                                                                                                                        { $eq: [ "$state", 1 ] }
                                                                                                                    ] 
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    ],
                                                                                                    as: "specification_details"
                                                                                                }
                                                                                            }
                                                                                        ],
                                                                                        as: "type_service_details"
                                                                                    }
                                                                                }
                                                                            ],
                                                                            as: "type_model_details"
                                                                        }
                                                                    }
                            
     
                                                                    var type_capacity_list_query = {
                                                                        $lookup:
                                                                        {
                                                                            from: "type_capacities",
                                                                            let: { capacities: '$type_details.type_capacity_list' },
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
                                                                                },
                                                                                {$sort:{"value":1}}
                                                                            ],
                                                                            as: "type_capacity_details"
                                                                        }
                                                                    }
                                                                    
                                                                    const label_capacity_query = {
                                                                        $lookup:
                                                                        {
                                                                            from: "type_capacities",
                                                                            let: { capacities: '$type_details.label_capacity_id' },
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
                                                                                },
                                                                                {$sort:{"value":1}}
                                                                            ],
                                                                            as: "label_capacity_details"
                                                                        }
                                                                    }
                                                                                
                                                                    const label_measurement_query = {
                                                                        $lookup: {
                                                                        from: "type_capacities",
                                                                        let: { measurement: "$type_details.label_measurement_id" },
                                                                        pipeline: [
                                                                            {
                                                                            $match: {
                                                                                $expr: {
                                                                                $and: [
                                                                                    { $in: ["$_id", "$$measurement"] },
                                                                                    { $eq: ["$state", 1] }
                                                                                ]
                                                                                }
                                                                            }
                                                                            },
                                                                            { $sort: { value: 1 } }
                                                                        ],
                                                                        as: "label_measurement_details"
                                                                        }
                                                                    };
                                                                    
                                                                    const label_pallet_query = {
                                                                        $lookup: {
                                                                        from: "type_capacities",
                                                                        let: { pallet: "$type_details.label_pallet_id" },
                                                                        pipeline: [
                                                                            {
                                                                            $match: {
                                                                                $expr: {
                                                                                $and: [
                                                                                    { $in: ["$_id", "$$pallet"] },
                                                                                    { $eq: ["$state", 1] }
                                                                                ]
                                                                                }
                                                                            }
                                                                            },
                                                                            { $sort: { value: 1 } }
                                                                        ],
                                                                        as: "label_pallet_details"
                                                                        }
                                                                    };
            
                                                                    pooltypes = await Citytype.aggregate([countryid_condition, cityid_condition, buiesness_condotion, is_ride_share_condition, exclude_gandola_condition, city_type_to_type_query, array_to_json,type_model_list_query, type_capacity_list_query, label_capacity_query, label_measurement_query, label_pallet_query, rrr, sort])
                                                                }
                                                                if (citytypes.length != 0 || pooltypes.length != 0) {

                                                                     var corporate_id = null;
                                                                    if(detail.corporate_ids && detail.corporate_ids.length>0){
                                                                        corporate_id = detail.corporate_ids[0].corporate_id;
                                                                    }

                                                                    Corporate.findOne({_id: corporate_id}).then((corporate_detail)=>{
                                                                        var is_corporate_request = false;
                                                                        if(corporate_detail && detail.corporate_ids[0].status == constant_json.CORPORATE_REQUEST_ACCEPTED && corporate_detail.is_approved){
                                                                            is_corporate_request = true;
                                                                        }

                                                                        res.json({
                                                                            success: true,
                                                                            message: success_messages.MESSAGE_CODE_GET_CITYTYPE_LIST_SUCCESSFULLY,
                                                                            currency: currency,
                                                                            currencycode: currencycode,
                                                                            city_detail: final_city_details,
                                                                            payment_gateway: PAYMENT_TYPES,
                                                                            citytypes: citytypes,
                                                                            pooltypes: pooltypes,
                                                                            server_time: server_time,
                                                                            is_corporate_request: is_corporate_request
                                                                        });
                                                                    });

                                                                } else if (count == size) {
                                                                    res.json({
                                                                        success: false,
                                                                        error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                                    });
                                                                }
                                                            });
                                                        });
                                                    } else {
                                                        res.json({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                        }); 
                                                    }
                                                });


                                            } else {
                                                res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                });
                                            }
                                        }

                                    });
                                }
                            });
                        } else {

                            res.json({
                                success: false,
                                error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY
                            });
                        }    

                    }
                    
                
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


exports.disptcher_city_type_list = async function (req, res) {
    // console.log(req.body)
    utils.check_request_params(req.body, [
        {name: 'subAdminCountry', type: 'string'}], async function (response) {
        if (response.success) {
            let corporate_details = await Corporate.findOne({_id: req.body.id}).select({is_own_service_type:1,corporate_type_id:1}).lean()
            let user_type = 0
            let user_type_id = corporate_details._id
            if(corporate_details.is_own_service_type && corporate_details.is_own_service_type == 1){
                user_type = constant_json.CORPORATE_UNIQUE_NUMBER
            }
            if(corporate_details.corporate_type_id){
                const main_corporate = await Corporate.findOne({_id: corporate_details.corporate_type_id}).select({_id:1}).lean() 
                if(main_corporate){
                    user_type_id = main_corporate._id
                }
            }

            var currentCityLatLong = [req.body.latitude, req.body.longitude];
            var subAdminCountry = req.body.subAdminCountry;
            Country.findOne({$and: [{$or: [{countryname: subAdminCountry},  { alpha2: {$exists: true, $eq: req.body.country_code}}]}, {isBusiness: constant_json.YES}]}).then((country) => {
        

                var server_time = new Date();
                if (!country) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY});
                } else {
                    var currency = country.currencysign;
                    City.find({countryname: subAdminCountry, isBusiness: constant_json.YES}).then((city_details) => {

                        var count = 0;
                        var size = city_details.length;
                        var finalDistance = 1000000;
                        var finalCityId = null;
                        var final_city_details = {};
                        if ( size == 0) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY});
                        } else {
                            city_details.forEach(function (city_detail) {
                                count++;
                                var cityLatLong = city_detail.cityLatLong;
                                var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(currentCityLatLong, cityLatLong);
                                var cityRadius = city_detail.cityRadius;

                                if (!city_detail.is_use_city_boundary) {
                                    if (distanceFromSubAdminCity < cityRadius) {
                                        if (distanceFromSubAdminCity < finalDistance) {
                                            finalDistance = distanceFromSubAdminCity;
                                            finalCityId = city_detail._id;
                                            final_city_details = city_detail;
                                        }
                                    }
                                } else {
                                    var city_zone = geolib.isPointInside(
                                        {latitude: req.body.latitude, longitude: req.body.longitude},
                                        city_detail.city_locations);
                                    if (city_zone) {
                                        if (distanceFromSubAdminCity < finalDistance) {
                                            finalDistance = distanceFromSubAdminCity;
                                            finalCityId = city_detail._id;
                                            final_city_details = city_detail;
                                        }
                                    }
                                }


                                if (count == size) {

                                    if (finalCityId != null) {
                                        var city_id = finalCityId;
                                        RedZoneArea.find({cityid: city_id}).then((red_zone_area_list)=>{
                                            var inside_red_zone = false;
                                            red_zone_area_list.forEach(function(red_zone_area_data, index){
                                                var inside_zone = geolib.isPointInside(
                                                    {
                                                        latitude: Number(req.body.latitude),
                                                        longitude: Number(req.body.longitude)
                                                    }, red_zone_area_data.kmlzone);
                                                if (inside_zone) {
                                                    inside_red_zone = true;
                                                }
                                            })
                                            if(!inside_red_zone){
                                                CityZone.find({cityid: city_id}).then((zone_list)=>{
                                                    var zone_id = null;
                                                    zone_list.forEach(function(zone_data, index){
                                                        var inside_zone = geolib.isPointInside(
                                                            {
                                                                latitude: Number(req.body.latitude),
                                                                longitude: Number(req.body.longitude)
                                                            }, zone_data.kmlzone);
                                                            // console.log(inside_zone)
                                                        if (inside_zone) {
                                                            zone_id = zone_data._id;
                                                        }
                                                    });

                                        var city_type_to_type_query = {
                                            $lookup:
                                                {
                                                    from: "types",
                                                    localField: "typeid",
                                                    foreignField: "_id",
                                                    as: "type_details"
                                                }
                                        };
                                        var array_to_json = {$unwind: "$type_details"};

                                        var countryid_condition = {$match: {'countryid': {$eq: country._id}}};
                                        var cityid_condition = {$match: {'cityid': {$eq: city_id}}};    
                                        var buiesness_condition = {$match: {'is_business': {$eq: 1}}};
                                        let user_type_pricing_condition = {$match: {'user_type': {$eq: 0}}}
                                        if(user_type == constant_json.CORPORATE_UNIQUE_NUMBER){
                                            user_type_pricing_condition = {$match: {'user_type_id': {$eq: user_type_id}}};
                                        }    
                                        // console.log(user_type_pricing_condition)
                                        var rrr = {"$redact": {"$cond": [{'$eq': ["$type_details.is_business", 1]}, "$$KEEP", "$$PRUNE"]}}

                                        var lookup = {
                                            $lookup:
                                            {
                                                from: "city_types",
                                                localField: "car_rental_ids",
                                                foreignField: "_id",
                                                as: "car_rental_list"
                                            }
                                        };

                                        var type_model_list_query = {
                                            $lookup:
                                            {
                                                from: "type_models",
                                                let: { models: '$type_details.type_model_list' },
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
                                                    },
                                                    {
                                                        $lookup:
                                                        {
                                                            from: "type_services",
                                                            let: { services: '$type_service_list' },
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
                                                                },
                                                                {
                                                                    $lookup:{
                                                                        from: "service_specifications",
                                                                        let: { specifiactions: '$specification_array' },
                                                                        pipeline: [
                                                                            { $match: 
                                                                                { $expr: 
                                                                                    { $and: 
                                                                                        [
                                                                                            { $in: [  "$_id", "$$specifiactions" ] },
                                                                                            { $eq: [ "$state", 1 ] }
                                                                                        ] 
                                                                                    }
                                                                                }
                                                                            }
                                                                        ],
                                                                        as: "specification_details"
                                                                    }
                                                                }
                                                            ],
                                                            as: "type_service_details"
                                                        }
                                                    }
                                                ],
                                                as: "type_model_details"
                                            }
                                        }



                                        var type_capacity_list_query = {
                                            $lookup:
                                            {
                                                from: "type_capacities",
                                                let: { capacities: '$type_details.type_capacity_list' },
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
                                                    },
                                                    {$sort:{"value":1}}
                                                ],
                                                as: "type_capacity_details"
                                            }
                                        }
                                        const exclude_gandola_condition = {
                                            $match: {
                                                model_type: { $nin: [MODEL_TRUCK_TYPE.CHUTO, MODEL_TRUCK_TYPE.TRAILER, MODEL_TRUCK_TYPE.CHASIS] }
                                            }
                                        }
                                        Citytype.aggregate([countryid_condition, cityid_condition, buiesness_condition, user_type_pricing_condition, exclude_gandola_condition, city_type_to_type_query, array_to_json, type_model_list_query, type_capacity_list_query, rrr, lookup]).then((citytypes) => {

                                            var PAYMENT_TYPES = utils.PAYMENT_TYPES();
                                            citytypes.forEach(function(citytype_data){
                                                if(citytype_data.is_car_rental_business){
                                                    var car_rental_list = citytype_data.car_rental_list;
                                                    citytype_data.car_rental_list = [];
                                                    car_rental_list.forEach(function(car_rental_data){
                                                        if(car_rental_data.is_business){
                                                            citytype_data.car_rental_list.push(car_rental_data);
                                                        }
                                                    })
                                                } else {
                                                    citytype_data.car_rental_list = [];
                                                }
                                            });

                                            if(zone_id){
                                                citytypes.forEach(function(citytype_data){
                                                    if(citytype_data.rich_area_surge){
                                                        var zone_index = citytype_data.rich_area_surge.findIndex((x) => (x.id).toString() == zone_id.toString());
                                                        if(zone_index !== -1 && citytype_data.rich_area_surge[zone_index].surge_multiplier>0){
                                                            citytype_data.rich_area_surge_multiplier = citytype_data.rich_area_surge[zone_index].surge_multiplier;
                                                        }
                                                    }
                                                })
                                            }

                                            if (citytypes.length != 0) {
                                                res.json({
                                                    success: true,
                                                    message: success_messages.MESSAGE_CODE_GET_CITYTYPE_LIST_SUCCESSFULLY,
                                                    currency: currency,
                                                    city_detail: final_city_details,
                                                    payment_gateway: PAYMENT_TYPES,
                                                    citytypes: citytypes,
                                                    server_time: server_time
                                                });
                                            } else if (count == size) {
                                                res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                });
                                            }
                                        });

                                            });
                                        } else {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                            }); 
                                        }
                                    });

                                    } else {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                        });
                                    }
                                }
                            });
                        }
                    });

                }

            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.user_city_type_list = function (req, res) {
    utils.check_request_params(req.body, [
        {name: 'country', type: 'string'}], function (response) {
        if (response.success) {
            var currentCityLatLong = [req.body.latitude, req.body.longitude];
            var user_id = req.body.user_id;
            var provider_id = req.body.provider_id;
            var country = req.body.country;
            if (provider_id !== undefined) {
                id = req.body.provider_id;
                table = Provider;
            } else {
                id = req.body.user_id;
                table = User;
            }

            table.findOne({_id: id}).then((detail) => {
                if (detail) {
                    if (req.body.token !== null && detail.token !== req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});

                    }
                }
                Country.findOne({$and: [{$or: [{countryname: country}, {alpha2: req.body.country_code}]}, {isBusiness: constant_json.YES}]}).then((country) => {
            
                    if (!country) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY});
                    } else {

                        var country_id = country._id;
                        var currency = country.currencysign;
                        var currencycode = country.currencycode;
                        var server_time = new Date();
                        City.find({countryid: country_id, isBusiness: constant_json.YES}).then((cityList) => {

                            var size = cityList.length;
                            var count = 0;
                            if (size == 0) {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                });
                            } else {
                                var finalCityId = null;
                                var finalDistance = 1000000;
                                var final_city_details = {};
                                cityList.forEach(function (city_detail) {
                                    count++;
                                    var cityLatLong = city_detail.cityLatLong;
                                    var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(currentCityLatLong, cityLatLong);
                                    var cityRadius = city_detail.cityRadius;

                                    if (!city_detail.is_use_city_boundary) {
                                        if (distanceFromSubAdminCity < cityRadius) {
                                            if (distanceFromSubAdminCity < finalDistance) {
                                                finalDistance = distanceFromSubAdminCity;
                                                finalCityId = city_detail._id;
                                                final_city_details = city_detail;
                                            }
                                        }
                                    } else {
                                        var city_zone = geolib.isPointInside(
                                            {
                                                latitude: Number(req.body.latitude),
                                                longitude: Number(req.body.longitude)
                                            },
                                            city_detail.city_locations);
                                        if (city_zone) {
                                            if (distanceFromSubAdminCity < finalDistance) {
                                                finalDistance = distanceFromSubAdminCity;
                                                finalCityId = city_detail._id;
                                                final_city_details = city_detail;
                                            }
                                        }
                                    }
                                    if (count == size) {
                                        if (finalCityId != null) {
                                            var city_id = finalCityId;

                                            RedZoneArea.find({cityid: city_id}).then((red_zone_area_list)=>{
                                                var inside_red_zone = false;
                                                red_zone_area_list.forEach(function(red_zone_area_data, index){
                                                    var inside_zone = geolib.isPointInside(
                                                        {
                                                            latitude: Number(req.body.latitude),
                                                            longitude: Number(req.body.longitude)
                                                        }, red_zone_area_data.kmlzone);
                                                    if (inside_zone) {
                                                        inside_red_zone = true;
                                                    }
                                                })
                                                if(!inside_red_zone){
                                                    CityZone.find({cityid: city_id}).then((zone_list)=>{
                                                        var zone_id = null;
                                                        zone_list.forEach(function(zone_data, index){
                                                            var inside_zone = geolib.isPointInside(
                                                                {
                                                                    latitude: Number(req.body.latitude),
                                                                    longitude: Number(req.body.longitude)
                                                                }, zone_data.kmlzone);
                                                            if (inside_zone) {
                                                                zone_id = zone_data._id;
                                                            }
                                                        });

                                                        var city_type_to_type_query = {
                                                            $lookup:
                                                                {
                                                                    from: "types",
                                                                    localField: "typeid",
                                                                    foreignField: "_id",
                                                                    as: "type_details"
                                                                }
                                                        };
                                                        var array_to_json = {$unwind: "$type_details"};

                                                        var countryid_condition = {$match: {'countryid': {$eq: country_id}}};
                                                        var cityid_condition = {$match: {'cityid': {$eq: city_id}}};
                                                        var buiesness_condotion = {$match: {'is_business': {$eq: 1}}};

                                                        var rrr = {"$redact": {"$cond": [{'$eq': ["$type_details.is_business", 1]}, "$$KEEP", "$$PRUNE"]}}

                                                        var lookup = {
                                                            $lookup:
                                                            {
                                                                from: "city_types",
                                                                localField: "car_rental_ids",
                                                                foreignField: "_id",
                                                                as: "car_rental_list"
                                                            }
                                                        };

                                                        Citytype.aggregate([countryid_condition, cityid_condition, buiesness_condotion, city_type_to_type_query, array_to_json, rrr, lookup]).then((citytypes) => {
                                                            
                                                            var PAYMENT_TYPES = utils.PAYMENT_TYPES();
                                                            if(zone_id){
                                                                citytypes.forEach(function(citytype_data){
                                                                    if(citytype_data.rich_area_surge){
                                                                        var zone_index = citytype_data.rich_area_surge.findIndex((x) => (x.id).toString() == zone_id.toString());
                                                                        if(zone_index !== -1 && citytype_data.rich_area_surge[zone_index].surge_multiplier>0){
                                                                            citytype_data.rich_area_surge_multiplier = citytype_data.rich_area_surge[zone_index].surge_multiplier;
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                            if (citytypes.length != 0) {

                                                                 var corporate_id = null;
                                                                if(detail.corporate_ids && detail.corporate_ids.length>0){
                                                                    corporate_id = detail.corporate_ids[0].corporate_id;
                                                                }

                                                                Corporate.findOne({_id: corporate_id}).then((corporate_detail)=>{
                                                                    var is_corporate_request = false;
                                                                    if(corporate_detail && detail.corporate_ids[0].status == constant_json.CORPORATE_REQUEST_ACCEPTED && corporate_detail.is_approved){
                                                                        is_corporate_request = true;
                                                                    }

                                                                    res.json({
                                                                        success: true,
                                                                        message: success_messages.MESSAGE_CODE_GET_CITYTYPE_LIST_SUCCESSFULLY,
                                                                        currency: currency,
                                                                        currencycode: currencycode,
                                                                        city_detail: final_city_details,
                                                                        payment_gateway: PAYMENT_TYPES,
                                                                        citytypes: citytypes,
                                                                        server_time: server_time,
                                                                        is_corporate_request: is_corporate_request
                                                                    });
                                                                });

                                                            } else if (count == size) {
                                                                res.json({
                                                                    success: false,
                                                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                                });
                                                            }
                                                        });
                                                    });
                                                } else {
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                    }); 
                                                }
                                            });


                                        } else {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                            });
                                        }
                                    }

                                });
                            }
                        });

                    }
                });
                    
                
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.new_web_typelist = async function (req, res) {
    let countryName = req.body?.countryName ?? 'Venezuela';
    let cityName = req.body?.cityName ?? 'Caracas';
    const country = await Country.findOne({countryname: countryName}).lean()
    const convertSequenceInt = {
        "$addFields": {
            "type_details.sequenceInt": { "$toInt": "$type_details.sequence" }
        }
    }

    let sort = {"$sort": {}};
    sort["$sort"]['type_details.sequence'] = parseInt(1);
            
    if(country.isBusiness== constant_json.NO){
        res.json({
            success: false,
            error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
        });
        return;
    }
    let country_id = country._id;
    let currency = "$";
    let server_time = new Date();

    let city = await City.findOne({ cityname : cityName, countryid: country_id, isBusiness: constant_json.YES}).select({_id:1}).lean()
    if (!city) {
        res.json({
            success: false,
            error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
        });
        return;
    } 
    let city_id = city._id;

    let city_type_to_type_query = {
        $lookup:
            {
                from: "types",
                localField: "typeid",
                foreignField: "_id",
                as: "type_details"
            }
    };
    let array_to_json = {$unwind: "$type_details"};

    let countryid_condition = {$match: {'countryid': {$eq: country_id}}};
    let cityid_condition = {$match: {'cityid': {$eq: city_id}}};
    let business_condition = { $match: { 'is_business': { $eq: 1 } } };
    let user_type_pricing_condition = {$match: {'user_type': {$eq: 0}}}
    let is_ride_share_condition = { $match: { 'is_ride_share': { $ne: 1 } } };
    let rrr = { "$redact": { "$cond": [{ '$eq': ["$type_details.is_business", 1] }, "$$KEEP", "$$PRUNE"] } }
    let lookup = {
        $lookup:
        {
            from: "city_types",
            localField: "car_rental_ids",
            foreignField: "_id",
            as: "car_rental_list"
        }
    };
    let type_model_list_query = {
        $lookup:
        {
            from: "type_models",
            let: { models: '$type_details.type_model_list' },
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
                },
                {
                    $lookup:
                    {
                        from: "type_services",
                        let: { services: '$type_service_list' },
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
                }
            ],
            as: "type_model_details"
        }
    }

    let type_capacity_list_query = {
        $lookup:
        {
            from: "type_capacities",
            let: { capacities: '$type_details.type_capacity_list' },
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
                },
                {$sort:{"value":1}}
            ],
            as: "type_capacity_details"
        }
    }
    const exclude_gandola_condition = {
        $match: {
            model_type: { $nin: [MODEL_TRUCK_TYPE.CHUTO, MODEL_TRUCK_TYPE.TRAILER, MODEL_TRUCK_TYPE.CHASIS] }
        }
    }

    let citytypes = await Citytype.aggregate([countryid_condition, cityid_condition, business_condition, user_type_pricing_condition,
            is_ride_share_condition, exclude_gandola_condition, city_type_to_type_query, array_to_json, type_model_list_query, type_capacity_list_query,  rrr, lookup, convertSequenceInt, sort])

    if (citytypes.length == 0 ) {
        res.json({
            success: false,
            error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
        });
        return;
    }

    res.json({
        success: true,
        message: success_messages.MESSAGE_CODE_GET_CITYTYPE_LIST_SUCCESSFULLY,
        citytypes: citytypes,
        server_time: server_time,
        currency: currency
    });

};
