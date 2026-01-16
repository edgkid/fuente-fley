const Country = require('mongoose').model('Country');
const Type = require('mongoose').model('Type');
const Providers = require('mongoose').model('Provider');
const Trip = require('mongoose').model('Trip');
const Trip_history = require('mongoose').model('Trip_history');
const Provider = require('mongoose').model('Provider');
const Provider_Document = require('mongoose').model('Provider_Document');
const moment = require('moment');
const mongoose = require('mongoose');
const Schema = mongoose.Types.ObjectId;

exports.map = function (req, res) {
    var query = {}
    query['providerLocation'] = { $ne: [0, 0] }

    if (typeof req.session.userid != 'undefined') {
        Type.find({}).then((types) => {
            var url =
                'https://maps.googleapis.com/maps/api/js?key=' +
                setting_detail.web_app_google_key +
                '&libraries=places'
            res.render('maps', { types: types, map_url: url })
        })
    } else {
        res.redirect('/admin')
    }
}

exports.provider_track = async function (req, res) {
    
    if (typeof req.session.userid != 'undefined') {
        let query = {}
        let coordinates = {
            latitude : setting_detail.location[0],
            longitude : setting_detail.location[1]
        }
        const admin = req.session.admin
        if(!admin.super_admin){
            query['_id'] = {$eq: admin.country_id}
            const country = await Country.findOne({
                _id: admin.country_id,
            })
            coordinates.latitude = Number(country.coordinates.latitude),
            coordinates.longitude = Number(country.coordinates.longitude)
        }

        const url =
            'https://maps.googleapis.com/maps/api/js?key=' +
            setting_detail.web_app_google_key +
            '&libraries=places'
        Country.find(query).then((country) => {
            res.render('provider_track', { map_url: url, country: country, coordinates })
        })
    } else {
        res.redirect('/admin')
    }
}

exports.fetch_provider_list_of_refresh = function (req, res) {
    var query = {}
    const admin = req.session.admin
    query['providerLocation'] = { $ne: [0, 0] }
    if(!admin.super_admin){
        query['country_id'] = {$eq: admin.country_id}
    }
    if (req.body.type_id != 'all') {
        query['admintypeid'] = { $eq: req.body.type_id }
    }

    if (typeof req.session.userid != 'undefined') {
        Providers.find(query).then((providers) => {
            if (providers.length > 0) {
                res.json(providers)
            } else {
                res.json('')
            }
        })
    } else {
        res.redirect('/admin')
    }
}

exports.fetch_provider_list = function (req, res) {
    var cityid = req.body.cityid

    var query = {}
    query['providerLocation'] = { $ne: [0, 0] }
    query['cityid'] = cityid
    query['is_active'] = 1

    if (typeof req.session.userid != 'undefined') {
        Providers.count(query).then((providers_count) => {
            if (providers_count != 0) {
                Providers.find(query).then((providers) => {
                    res.json(providers)
                })
            } else {
                res.json('')
            }
        })
    } else {
        res.redirect('/admin')
    }
}

exports.fetch_provider_detail = function (req, res) {
    var providerid = req.body.providerid
    var query = {}
    query['_id'] = providerid

    if (typeof req.session.userid != 'undefined') {
        Providers.count(query).then((providers_count) => {
            if (providers_count != 0) {
                Providers.findById(providerid).then((providers) => {
                    res.json(providers)
                })
            } else {
                res.json(providers)
            }
        })
    } else {
        res.redirect('/admin')
    }
}

exports.get_all_provider_list = async function (req, res) {
    const admin = req.session.admin
    let condition = {admintypeid: req.body.type_id}
    if(!admin.super_admin){
        condition['country_id'] = {$eq: admin.country_id}
    }
    Providers.find({ admintypeid: req.body.type_id }).then((providers) => {
        res.json({ success: true, providers: providers })
    })
}

exports.fetch_trips = async function (req, res) {
    try {
        if (typeof req.session.userid != 'undefined') {
            const current_date = moment().tz("America/Caracas");
            const start_of_day = current_date.startOf('day').toDate();
            const firstDateCurrentMonth = current_date.startOf('month').toDate();
            let latitude = setting_detail.location[0]
            let longitude = setting_detail.location[1]
            const admin = req.session.admin
            let country_condition = {$match:{}}
            const condition =  { $match: { is_provider_accepted: { $gt: 0 } }};
            if(!admin.super_admin){
                const country = await Country.findOne({
                    _id: admin.country_id,
                })
                latitude = Number(country.coordinates.latitude),
                longitude = Number(country.coordinates.longitude)
    
                country_condition['$match']['country_id'] = Schema(admin.country_id)
            }
    
            const map_view_trips = Trip.aggregate([
                condition,
                country_condition,
                {
                    $lookup: {
                        from: 'types',
                        localField: 'type_id',
                        foreignField: '_id',
                        as: 'type_detail',
                    },
                },
                {
                    $project: {
                        assigned_vehicle_details: 1,
                        providerLocation: 1,
                        provider_id: 1,
                        service_type_name: 1,
                        type_image: "$type_detail.panel_map_pin_image_url"
                    }
                }
            ]);

            const total_trips = Trip.aggregate([
                country_condition,
                {
                    $group: {
                        _id: null,
                        scheduled_trips: {$sum: {$cond: [{$and: [{$eq: ["$is_provider_accepted", 0]}]}, 1, 0]}},
                        running_trips: {$sum: {$cond: [ {$gte: [{$gte: ["$is_provider_status", 1]}, {$lt: ["$is_provider_status", 9]}]} , 1, 0]}},
                        completed_trips: {$sum: {$cond: [ {$and: [{$eq: ["$is_provider_status", 9]}, {$gte: ["$provider_trip_end_time", start_of_day]}]} , 1, 0]}},
                    }
                }])
            const total_trips_history  = Trip_history.aggregate([
                country_condition,
                {
                    $group: {
                        _id: null,
                        completed_today: {$sum: {$cond: [ {$and: [{$eq: ["$is_provider_status", 9]}, {$gte: ["$provider_trip_end_time", start_of_day]}]} , 1, 0]}},
                        completed_month: {$sum: {$cond: [ {$and: [{$eq: ["$is_provider_status", 9]}, {$gte: ["$created_at", firstDateCurrentMonth]}]} , 1, 0]}},
                    }
                }])

            const [trips, totalTrips, totalTripHistories] = await Promise.all([
                map_view_trips,
                total_trips,
                total_trips_history
            ])

            const url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places"

            if(req.body.get_new_data){
                res.json({
                    success:true, 
                    trips, 
                    totalTrips, 
                    totalTripHistories,                 
                    latitude,
                    longitude
                })
                return;
            }
            res.render('trips_map_view', {trips, map_url: url, totalTrips, totalTripHistories, latitude, longitude});
        } else {
            if(req.body.get_new_data){
                res.json({success:false})
                return;
            }
            res.redirect('/admin');
        }
    } catch (e) {
        console.log(e)
    }
}

exports.map_get_provider_data = async function (req, res) {
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin')
            return
        }
        const tripData = Trip.findOne({ _id: req.body.trip_id })
            .select({ speed: 1, is_provider_status: 1 })
            .lean()
        const providerData = Provider.findOne({ _id: req.body.provider_id })
            .select({
                first_name: 1,
                last_name: 1,
                country_phone_code: 1,
                phone: 1,
            })
            .lean()
        let cedula_doc = Provider_Document.findOne({
            provider_id: req.body.provider_id,
            name: 'Cédula',
        })
            .select({ unique_code: 1 })
            .lean()
        let [trip, provider, cedula] = await Promise.all([
            tripData,
            providerData,
            cedula_doc,
        ])

        cedula = cedula ? cedula.unique_code : ''

        res.json({ success: true, provider, cedula, trip })
    } catch (e) {
        console.log(e)
        res.json({ success: false, provider: null, cedula: '', trip: null })
    }
}
