var utils = require('./utils');
var myTrips = require('./trip');
var allemails = require('../controllers/emails');
var Trip = require('mongoose').model('Trip');
var Trip_history = require('mongoose').model('Trip_history');
var User = require('mongoose').model('User');
var Provider = require('mongoose').model('Provider');
var Settings = require('mongoose').model('Settings');
var Partner = require('mongoose').model('Partner');
var Provider_Document = require('mongoose').model('Provider_Document');
var moment = require('moment');
var City = require('mongoose').model('City');
var Country = require('mongoose').model('Country');
var Provider_Vehicle_Document = require('mongoose').model('Provider_Vehicle_Document');
var cron = require('./cron');
var myAnalytics = require('./provider_analytics');
var utils = require('./utils');
var { createClient } = require("redis")
var client = createClient({ legacyMode: true })
client.connect().catch(console.error)
var CronJob = require('cron-cluster')(client).CronJob
const Partner_Vehicle_Document = require('mongoose').model('Partner_Vehicle_Document');
const xl = require('excel4node');
const i18n = require("i18n");
const fs = require("fs");
const Corporate = require('mongoose').model('Corporate');

var run_continue_30_sec_cron = new CronJob('*/30 * * * * *', function () {
    var now = new Date();
    var date1 = new Date();
    date1.setSeconds(date1.getSeconds() - 30);
    var scheduled_request_pre_start_minute = setting_detail.scheduled_request_pre_start_minute;
    var scheduled_request_start_time = now.setMinutes(now.getMinutes() + scheduled_request_pre_start_minute);
    scheduled_request_start_time = new Date(scheduled_request_start_time);
    //console.log("scheduled_request_start_time : " + scheduled_request_start_time)
    // Trip.find({
    //     is_schedule_trip: true,
    //     is_trip_cancelled: 0,
    //     is_trip_completed: 0,
    //     is_trip_end: 0,
    //     provider_id: null,
    //     current_providers: [],
    //     server_start_time_for_schedule: {$lte: scheduled_request_start_time},
    //     assigned_provider_id: {$eq:null},
    // }).then((scheduledTrips) => {
    //     scheduledTrips.forEach(function (scheduledTrip) {
    //         // User.findOne({_id: scheduledTrip.user_id, current_trip_id: null}).then((user) => {
    //             User.findOne({_id: scheduledTrip.user_id}).then((user) => {
    //                 //console.log("create_scheduled_trip");
    //             if(user){
    //                 create_scheduled_trip(scheduledTrip);
    //             }
    //         }, (err) => {
    //             console.log(err)
    //         });
    //     });
    // }, (err) => {
    //     console.log(err)
    // });

    let schedule_notify_min = setting_detail.new_scheduled_trip_timing || 100

    let schedule_notify_time = new Date(new Date().getTime() + schedule_notify_min*60000)
    let trip_condtion_or = []
    let scheduled_trip_condition = {$and: [{server_start_time_for_schedule: {$lte: schedule_notify_time}}, { is_schedule_trip: true}]}
    let normal_trip_condition = {$and: [{server_start_time_for_schedule: null}, { is_schedule_trip: false}]}
    trip_condtion_or.push(scheduled_trip_condition)
    trip_condtion_or.push(normal_trip_condition)
    // console.log(schedule_notify_time)
    Trip.find({
        assigned_provider_id: {$ne:null},
        $or:trip_condtion_or,
        is_trip_cancelled: 0,
        is_trip_completed: 0,
        is_trip_end: 0,
        provider_id: null,
        current_providers: []
    }).then((trips) => {
        trips.forEach(function (trip) {
            // console.log(trip.unique_id)
            scheduled_driver_accept_trip(trip)     
        }, (err) => {
            console.log(err)
        });        
    });

    Settings.findOne({}).then((setting_data) => {
        var provider_timeout = setting_data.provider_timeout;
        var total_timeout = provider_timeout + 7;
        var default_Search_radious = setting_data.default_Search_radious;

        Trip.find({is_provider_status: 0, is_provider_accepted: 0, is_trip_cancelled: 0, is_no_provider_found: false, is_schedule_trip:false}).then((trips) => {
            trips.forEach(function (trip) {
                // console.log(trip.unique_id)
                check_provider(trip, total_timeout, default_Search_radious)
            });
        }, (err) => {
            console.log(err)
        });
    });


    Provider.find({is_active: 1, is_trip: {$ne: []}}).then((providers) => {
        providers.forEach(function (provider) {
            check_provider_trip(provider)
        });
    }, (err) => {
        console.log(err)
    });

    Provider.find({is_active: 1, is_trip: []}).then((providers) => {
        providers.forEach(function (provider) {
            check_provider_online(provider);
        });
    }, (err) => {
        console.log(err)
    });

    // review_notification()
});
run_continue_30_sec_cron.start();

async function check_provider_trip(provider) {
    Trip.find({ _id: { $in: provider.is_trip } }).then(trips => {
        trips.forEach(trip => {
            if (trip && (trip.is_trip_completed == 1 || trip.is_trip_cancelled == 1)) {
                provider = utils.remove_is_trip_from_provider(provider, trip._id, trip.initialDestinationLocation)
            }
        })
        provider.save();
    })
}

function check_provider_online(provider){
    City.findOne({_id: provider.cityid}).then((city) => {
        var city_timezone = city.timezone;

        Trip.findOne({is_provider_status: 0, current_providers: provider._id}).then((trip) => {

            var is_offline = 0;
            if (trip) {
                if (trip.is_trip_completed == 1 || trip.is_trip_cancelled == 1) {
                    is_offline = 1;
                } else {
                    is_offline = 0;
                }
            } else {
                is_offline = 1;
            }


            if (is_offline == 1) {
                var moment = require('moment');
                var end_time = new Date();
                var start_time = provider.location_updated_time;
                var time_diff = utils.getTimeDifferenceInMinute(end_time, start_time);

                if (time_diff > setting_detail.provider_offline_min) {
                    provider.is_active = 0;
                    provider.save();
                    // Start push Added by Bharti 2 May //
                    var push_message = "You Are Offline Now, For recieve new Trip you have to Online from App.";
                    var device_token = provider.device_token;
                    var device_type = provider.device_type;
                    utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_LOGOUT_ANOTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                    // End push Added by Bharti 2 May //

                    // Entry in daily analytic //
                    myAnalytics.insert_daily_provider_analytics(city_timezone, provider._id, 0, start_time);
                }
            } else {
                //console.log("tripid:"+trip.unique_id)
            }
        }, (err) => {
            console.log(err)
        });
    }, (err) => {
        console.log(err)

    });
}

function scheduled_driver_accept_trip(trip){

    // trip.is_trip_cancelled = 0;
    // trip.is_schedule_trip_start = false;
    // trip.providers_id_that_rejected_trip = [];
    // trip.save().then((trip_detail) => {
    // User.findOne({ _id: trip.user_id, current_trip_id: null }).select({ _id: 1 }).lean().then((user) => {
    //     if (user) {
    //         Provider.findById({ _id: trip.associate_driver_id }).select({ _id: 1, device_type: 1, device_token: 1, is_available: 1 }).lean().then((provider) => {
    //             if(provider){
    //                 let device_type = provider.device_type;
    //                 let device_token = provider.device_token;

    //                 if(provider.is_available == 1){
    //                     myTrips.assigned_driver_accept_trip(trip,provider._id)
    //                 }else if(trip.associate_driver_notification_sent == 1){
    //                 }else{
    //                     utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_BUSY_DRIVER_NOTIFY_FOR_SCHEDULE_TRIP, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, {}, 2);
    //                     trip.associate_driver_notification_sent = 1;
    //                     trip.save()
    //                 }
    //             }
                    
    //             }, (err) => {
    //                 console.log(err)
    //             }); 
    //         }
    //     }, (err) => {
    //         console.log(err)
    //     });          
    // }, (err) => {
    //     console.log(err)
    // });    
    trip.is_trip_cancelled = 0;
    trip.is_schedule_trip_start = false;
    trip.providers_id_that_rejected_trip = [];
    trip.save().then(() => {
    User.findById({ _id: trip.user_id }).then((user) => {
        if (user) {
            // if(user.current_trip_id == null){
                check_driver_for_assigned_scheduled_trip(trip)
            // }
            // else{
            //     Trip_history.findById({_id: user.current_trip_id}).select({is_trip_end: 1, is_trip_cancelled: 1, payment_status: 1}).then((trip_history) => {
            //         if(trip_history){
            //             if(trip_history.is_trip_end == 1 && (trip_history.payment_status == 1 || trip_history.payment_status == 4)){
            //                 user.current_trip_id = null;
            //                 user.save().then(() => {
            //                     check_driver_for_assigned_scheduled_trip(trip)
            //                 })
            //             }else if(trip_history.is_trip_cancelled == 1){
            //                 user.current_trip_id = null;
            //                 user.save().then(() => {
            //                     check_driver_for_assigned_scheduled_trip(trip)
            //                 })
            //             }
            //         }
            //     })
            // }
 
            }
        }, (err) => {
            console.log(err)
        });          
    }, (err) => {
        console.log(err)
    }); 
}

function check_driver_for_assigned_scheduled_trip(trip){
    // console.log("check driver")
    Provider.findById({ _id: trip.assigned_provider_id }).select({ _id: 1, device_type: 1, device_token: 1, is_available: 1 }).lean().then(async (provider) => {
        if(provider){
            let device_type = provider.device_type;
            let device_token = provider.device_token;

            if(provider.is_available == 1){
                myTrips.assigned_driver_accept_trip(trip,provider._id)
            }else if(trip.assigned_driver_notification_sent == 1){
            }else{
                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_BUSY_DRIVER_NOTIFY_FOR_SCHEDULE_TRIP, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                trip.assigned_driver_notification_sent = 1;
                await trip.save()
                const provider_id = "'get_new_request_"+provider._id+"'";
                socket_object.emit(provider_id, {trip_id: trip._id});
            }
        }
            
        }, (err) => {
            console.log(err)
        });
}

function check_provider(trip, total_timeout, default_Search_radious){
    // console.log('check_provider')
    var city_id = trip.city_id;
    City.findOne({_id: city_id}).then((city_detail) => {
        if (city_detail) {
            var city_timezone = city_detail.timezone;
            var is_check_provider_wallet_amount_for_received_cash_request = city_detail.is_check_provider_wallet_amount_for_received_cash_request;
            var provider_min_wallet_amount_set_for_received_cash_request = city_detail.provider_min_wallet_amount_set_for_received_cash_request;

            var start_time = trip.find_nearest_provider_time;
            var end_time = new Date();
            var time_diff = utils.getTimeDifferenceInSecond(end_time, start_time);

            if (time_diff > total_timeout) {

                var notAnsweredProviderID = null;
                var providers_id_that_rejected_trip = trip.providers_id_that_rejected_trip;
                if (trip.current_providers.length>0) {
                    Provider.find({ _id: { $in: trip.current_providers } }).then(async provider_list => {
                        for (const provider of provider_list) {
                            let is_trip_condition = { _id: provider._id, is_trip: trip._id };
                            let is_trip_update = { is_available: 1, is_trip: [] };

                            if (provider.is_trip.length > 1) {
                                is_trip_update = { is_available: 0, $pull: { is_trip: trip._id } };
                            }

                            if (!provider.is_near_trip) { provider.is_near_trip = [] }
                            if (provider.is_near_trip.length != 0) {
                                is_trip_condition = { _id: provider._id, is_near_trip: trip._id };
                                is_trip_update = { is_near_available: 1, is_near_trip: [] };
                            }

                            await Provider.updateOne(is_trip_condition, is_trip_update);
                        }
                    })
                    Provider.find({_id: {$in: trip.current_providers}}).then((provider_list)=>{
                        provider_list.forEach(function(provider){
                            utils.remove_from_zone_queue_new(provider);
                        })
                    })
                }
                if (Number(trip.no_of_time_send_request) < Number(setting_detail.number_of_try_for_scheduled_request) || setting_detail.find_nearest_driver_type == Number(constant_json.NEAREST_PROVIDER_TYPE_SINGLE)) {
                    
                    if(setting_detail.find_nearest_driver_type == Number(constant_json.NEAREST_PROVIDER_TYPE_SINGLE)){
                        trip.providers_id_that_rejected_trip.push(trip.current_providers[0]);
                    }
                    console.log('nearest_provider  ')
                    myTrips.nearest_provider(trip, null, [], function (nearest_provider_response) {

                        if(nearest_provider_response.success){

                        } else {
                            // User.findOne({_id: trip.user_id}).then((user) => {
                            //     user.current_trip_id = null;
                            //     user.save();
                                // var device_token = user.device_token;
                                // var device_type = user.device_type;

                                ////// PUSH_NOTIFICATION ///////////
                                // utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_NO_PROVIDER_FOUND, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                            // }, (err) => {
                            //     console.log(err)
                            // });
                        }
                    });
                } else {
                    // console.log('cancel')
                    utils.update_request_status_socket(trip._id);
                    // trip.is_trip_cancelled = 1;
                    trip.current_provider = null;
                    trip.current_providers = [];
                    trip.is_no_provider_found = true;
                    // trip.is_schedule_trip = false;
                    // var complete_date_in_city_timezone = utils.get_date_now_at_city(new Date(), trip.timezone);
                    // var complete_date_tag = moment(moment(complete_date_in_city_timezone).startOf('day')).format(constant_json.DATE_FORMAT_MMM_D_YYYY);
                    // trip.complete_date_in_city_timezone = complete_date_in_city_timezone;
                    // trip.complete_date_tag = complete_date_tag;
                    // trip.provider_trip_end_time = new Date();
                    trip.save(function(){
                        // Trip.findOneAndRemove({_id: trip._id}).then((deleted_trip) => {
                        //     if(deleted_trip){
                        //         var trip_history_data = new Trip_history(JSON.parse(JSON.stringify(deleted_trip)));
                        //         trip_history_data.save(function(){
                                    
                        //         });
                        //     }
                        // });
                    });
                    // User.findOne({_id: trip.user_id}).then((user) => {
                    //     if (user) {
                    //         user.current_trip_id = null;
                    //         user.save();

                    //         var device_token = user.device_token;
                    //         var device_type = user.device_type;

                    //         ////// PUSH_NOTIFICATION ///////////
                    //         utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_NO_PROVIDER_FOUND, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                    //     }
                    // });
                }
            }
        }
    }, (err) => {
        console.log(err)
    });
}

function create_scheduled_trip(trip) {

    trip.no_of_time_send_request = trip.no_of_time_send_request + 1;
    // console.log("trip.no_of_time_send_request: "+trip.no_of_time_send_request)
    if (Number(trip.no_of_time_send_request) <= Number(setting_detail.number_of_try_for_scheduled_request)) {
        trip.is_trip_cancelled = 0;
        trip.providers_id_that_rejected_trip = [];
        trip.save();
        myTrips.nearest_provider(trip, null, [], function(nearest_provider_response) {
            if (nearest_provider_response.success) {
                // User.findOne({_id: trip.user_id}).then((user) => {
                //     if (user) {
                //         user.current_trip_id = trip._id;
                //         user.save();
                //     }
                // }, (err) => {
                    
                // });
            } else {
                trip.is_trip_cancelled = 0;
                trip.save().then(() => { }).catch(e => { });
            }
        });
    } else {
        utils.update_request_status_socket(trip._id);
        trip.is_trip_cancelled = 1;
        trip.current_provider = null;
        trip.current_providers = [];
        trip.is_schedule_trip = false;
        var complete_date_in_city_timezone = utils.get_date_now_at_city(new Date(), trip.timezone);
        var complete_date_tag = moment(moment(complete_date_in_city_timezone).startOf('day')).format(constant_json.DATE_FORMAT_MMM_D_YYYY);
        trip.complete_date_in_city_timezone = complete_date_in_city_timezone;
        trip.complete_date_tag = complete_date_tag;
        trip.provider_trip_end_time = new Date();
        trip.save(function(){
            Trip.findOneAndRemove({_id: trip._id}).then((deleted_trip) => {
                if (deleted_trip) {
                    var trip_history_data = new Trip_history(JSON.parse(JSON.stringify(deleted_trip)));
                    trip_history_data.save(function () {

                    });
                }
            });
        });
        // User.findOne({_id: trip.user_id}).then((user) => {
        //     if (user) {
        //         user.current_trip_id = null;
        //         user.save();
        //     }
        // });
    }

}

// run_continue_30_min_cron
// var run_continue_30_min_cron = schedule.scheduleJob('* */30 * * * *', function () {
var run_continue_30_min_cron = new CronJob('0 */30 * * * *', function () {

    City.find({}).then((city_details) => {
        if (city_details) {
            city_details.forEach(function (city_detail) {
                var city_timezone = city_detail.timezone;
                if (city_timezone != "" && city_timezone != undefined) {
                    var city_date_now = new Date();
                    var city_date_next = city_detail.daily_cron_date;
                    if (!city_date_next) {
                        city_date_next = new Date();
                        city_date_next = city_date_next.setMinutes(city_date_now.getMinutes() - 2);
                        city_date_next = utils.get_date_now_at_city(city_date_next, city_timezone);
                    } else {
                        city_date_next = city_date_next.setMinutes(city_date_next.getMinutes());
                        city_date_next = utils.get_date_now_at_city(city_date_next, city_timezone);
                    }
                    city_date_now = city_date_now.setMinutes(city_date_now.getMinutes());
                    city_date_now = utils.get_date_now_at_city(city_date_now, city_timezone);
                    var city_date_now_tag = moment.utc(city_date_now).format("DDMMYYYY");

                    var city_date_next_tag = moment.utc(city_date_next).format("DDMMYYYY");


                    if (city_date_now_tag != city_date_next_tag) {
                        city_detail.daily_cron_date = new Date();
                        city_detail.save();
                        var today = moment(city_date_now).startOf('day');
                        city_date_now = new Date();
                        city_date_now = city_date_now.setMinutes(city_date_now.getMinutes() - 1);
                        city_date_now = new Date(city_date_now);
                        check_partner_document_status(city_detail._id, city_timezone);
                        check_provider_document_expired(city_detail._id, city_timezone);
                        cron.getOnlineProviderAnalytics(city_detail._id, city_timezone, city_date_now);
                        provider_auto_transfer(city_detail);
                    }
                }

            });
        }
    }, (err) => {
        console.log(err)

    });
    
    const currentTimeInCaracas = moment().tz("America/Caracas").format("HH:mm");
    const userExcelGenerateTime = "07:00";
    if(currentTimeInCaracas == userExcelGenerateTime){
        email_excel_daily_register_users();
    }
    Country.find({}).then((country_list) => {
        country_list.forEach(function (country_detail) {
            var city_timezone = country_detail.countrytimezone;

            if (city_timezone != "" && city_timezone != undefined) {
                var city_date_now = new Date();
                var city_date_next = country_detail.daily_cron_date;
                if (!city_date_next) {
                    city_date_next = new Date();
                    city_date_next = city_date_next.setMinutes(city_date_next.getMinutes() - 2);
                    city_date_next = utils.get_date_now_at_city(city_date_next, city_timezone);
                } else {
                    city_date_next = city_date_next.setMinutes(city_date_next.getMinutes());
                    city_date_next = utils.get_date_now_at_city(city_date_next, city_timezone);
                }

                city_date_now = city_date_now.setMinutes(city_date_now.getMinutes());
                city_date_now = utils.get_date_now_at_city(city_date_now, city_timezone);
                var city_date_now_tag = moment.utc(city_date_now).format("DDMMYYYY");

                var city_date_next_tag = moment.utc(city_date_next).format("DDMMYYYY");

                if (city_date_now_tag != city_date_next_tag) {
                    country_detail.daily_cron_date = new Date();
                    country_detail.save();
                    partner_auto_transfer(country_detail)
                }
            }
        })
    }, (err) => {
        console.log(err)
    })
});
run_continue_30_min_cron.start();

function provider_auto_transfer(city_detail) {
    var today = new Date(Date.now());
    Country.findOne({_id: city_detail.countryid}).then((country_detail) => {
        if (country_detail.is_auto_transfer) {
            var auto_transfer_day = country_detail.auto_transfer_day;
            var final_day = new Date(today.setDate(today.getDate() - auto_transfer_day));
            Provider.find({
                provider_type: Number(constant_json.PROVIDER_TYPE_NORMAL),
                cityid: city_detail._id,
                last_transferred_date: {$lte: final_day},
                account_id: {$exist: true},
                account_id: {$ne: ''},
                bank_id: {$exist: true},
                bank_id: {$ne: ''}
            }).then((provider_list) => {
                provider_list.forEach(function (provider_detail) {
                    var payment_gateway_type = setting_detail.payment_gateway_type;
                    if(country_detail && country_detail.payment_gateways && country_detail.payment_gateways.length>0){
                        payment_gateway_type = country_detail.payment_gateways[0];
                    }
                    transfer_payment_to_provider(provider_detail, country_detail.currencycode, country_detail._id, payment_gateway_type);
                });
            }, (err) => {
                console.log(err)
            });
        }
    }, (err) => {
        console.log(err)
    });
}


function transfer_payment_to_provider(provider_detail, currencycode, country_id, payment_gateway_type) {

    // if(!payment_gateway_type || payment_gateway_type == PAYMENT_GATEWAY.stripe){
    Trip_history.aggregate([{$match: {'confirmed_provider': {$eq: provider_detail._id}}},
        {$match: {'is_trip_completed': {$eq: 1}}},
        {$match: {'is_provider_earning_set_in_wallet': {$eq: false}}},
        {$match: {'is_transfered': {$eq: false}}},
        {$group: {_id: null, total: {$sum: '$pay_to_provider'}}}
    ]).then((trip) => {
        if (trip.length > 0) {
            var amount = trip[0].total.toFixed(2);
            utils.stripe_auto_transfer(amount, provider_detail, currencycode, payment_gateway_type, function (response_data) {
                if (response_data.success) {
                    utils.add_transfered_history(Number(constant_json.PROVIDER_UNIQUE_NUMBER), provider_detail._id, country_id,
                        amount, currencycode, 1, response_data.transfer_id, Number(constant_json.ADMIN_UNIQUE_NUMBER), null);
                        Trip_history.updateMany({
                        is_trip_completed: 1,
                        is_provider_earning_set_in_wallet: false,
                        is_transfered: false,
                        confirmed_provider: provider_detail._id
                    }, {is_transfered: true}, {multi: true}, function (err, trip_data) {
                    });
                    provider_detail.last_transferred_date = new Date();
                    provider_detail.save();
                } else {
                    utils.add_transfered_history(Number(constant_json.PROVIDER_UNIQUE_NUMBER), provider_detail._id, country_id,
                        amount, currencycode, 0, '', Number(constant_json.ADMIN_UNIQUE_NUMBER), response_data.error);
                }

            })
        }
    }, (err) => {
        console.log(err)
    });
}

async function check_partner_document_status(city_id, city_timezone) {
    try {
        const check_date = moment().tz(city_timezone);
        const isEven = check_date.date() % 2 === 0;
        const date = new Date().toLocaleString("en-US", { timeZone: city_timezone });
        const partner_list = await Partner.find({ city_id: city_id, is_approved: 1 });

        partner_list.forEach(async (partner_data) => {
            await partner_vehicle_document(partner_data, date, isEven);
        });
    } catch (err) {
        console.error(err);
    }
}

async function partner_vehicle_document(partner_data, date, isEven) {
    partner_data.vehicle_detail.forEach(async (vehicle_data) => {
        await partner_vehicle_document_expired(partner_data, vehicle_data, date, isEven);
    });
}

async function partner_vehicle_document_expired(partner_data, vehicle_data, date, isEven) {
    try {
        const partner_vehicle_document_list = await Partner_Vehicle_Document.find({
            vehicle_id: vehicle_data._id,
            partner_id: partner_data._id,
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
                }
            ],
        });

        partner_vehicle_document_list.forEach(async (partner_vehicle_document_detail) => {
            if (partner_vehicle_document_detail.is_uploaded == 0) {
                if(vehicle_data.state == 1){
                    vehicle_data.state = 0;
                    vehicle_data.is_approved_by_admin = 0;
                    vehicle_data.is_document_uploaded = false;    
                    partner_data.markModified('vehicle_detail');
                }
                if(isEven){
                    allemails.sendPartnerVehicleDocumentNotUploadedEmail(null, partner_data, vehicle_data.plate_no);
                }

            } else if (!vehicle_data.is_documents_expired) {
                vehicle_data.state = 0;
                vehicle_data.is_approved_by_admin = 0;
                vehicle_data.is_documents_expired = true;
                partner_data.markModified('vehicle_detail');
                allemails.sendPartnerVehicleDocumentExpiredEmail(null, partner_data, vehicle_data.plate_no);
                
                partner_vehicle_document_detail.is_document_expired = true;
                await Partner_Vehicle_Document.updateOne({_id: partner_vehicle_document_detail._id}, partner_vehicle_document_detail.getChanges())
            }
            await Partner.updateOne({ _id: partner_data._id }, partner_data.getChanges())

        });
    } catch (err) {
        console.error(err);
    }
}

async function email_excel_daily_register_users(){
    try {
        const current_date = moment().tz("America/Caracas");
        const registrationStartDate = current_date.clone().subtract(1, 'days').startOf('day').add(7, 'hours').toDate();
        const registrationEndDate = current_date.clone().startOf('day').add(7, 'hours').toDate();
        const country = setting_detail.countryname;
        const users = await User.find({
            $and : [
                {country: country},
                {created_at: { $gte : registrationStartDate }},
                {created_at: { $lte : registrationEndDate }},
            ]
        }).select({unique_id: 1, first_name: 1, last_name: 1, email: 1, country_phone_code: 1, phone: 1}).lean()     

        const providers = await Provider.find({
            $and : [
                {country: country},
                {created_at: { $gte : registrationStartDate }},
                {created_at: { $lte : registrationEndDate }},
            ]
        }).select({unique_id: 1, first_name: 1, last_name: 1, email: 1, country_phone_code: 1, phone: 1}).lean()     

        const corporates = await Corporate.find({
            $and : [
                {country: country},
                {created_at: { $gte : registrationStartDate }},
                {created_at: { $lte : registrationEndDate }},
            ]
        }).select({unique_id: 1, company_name: 1, email: 1, country_phone_code: 1, phone: 1}).lean()     

        const partners = await Partner.find({
            $and : [
                {country: country},
                {created_at: { $gte : registrationStartDate }},
                {created_at: { $lte : registrationEndDate }},
            ]
        }).select({unique_id: 1, first_name: 1, last_name: 1, email: 1, country_phone_code: 1, phone: 1}).lean()     
        users.forEach(user => user.type = i18n.__('title_user'));
        providers.forEach(provider => provider.type = i18n.__('title_provider'));
        corporates.forEach(corporate => corporate.type = i18n.__('title_corporate'));
        partners.forEach(partner => partner.type = i18n.__('title_partner'));

        const allUsers = [...corporates, ...users, ...partners, ...providers];

        const dateString = moment(registrationStartDate).format('DD-MM-YYYY');
        const wb = new xl.Workbook();
        let ws = wb.addWorksheet('sheet1');
        let col = 1;
        const date = new Date()
        const time = date.getTime()

        ws.cell(1, col++).string(i18n.__('title_id'));
        ws.cell(1, col++).string(i18n.__('title_name'));
        ws.cell(1, col++).string(i18n.__('title_email'));
        ws.cell(1, col++).string(i18n.__('title_phone'));
        ws.cell(1, col++).string(i18n.__('title_type'));
        allUsers.forEach(function (data, index) {
            col = 1;
            ws.cell(index + 2, col++).number(data.unique_id);
            ws.cell(index + 2, col++).string(data.type == i18n.__('title_corporate') ? data.company_name : data.first_name + ' ' + data.last_name);
            ws.cell(index + 2, col++).string(data.email);
            ws.cell(index + 2, col++).string(data.country_phone_code + ' ' + data.phone);
            ws.cell(index + 2, col++).string(data.type);

            if (index == allUsers.length - 1) {
                const fileName = dateString + "_daily_user_registered_"+ time +".xlsx"           
                wb.write('data/xlsheet/' + fileName, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        const filePath = 'data/xlsheet/' + fileName
                        const is_email_notification = setting_detail.email_notification;
                        allemails.sendUserDailyRegistration(filePath, dateString);
                        setTimeout(function () {
                            fs.unlink(filePath, function () {
                            });
                        }, 10000)
                    }
                });
            }
        })
    } catch (e) {
        console.log(e)
    }
}


function check_provider_document_expired(city_id, city_timezone) {
    var date = new Date().toLocaleString("en-US", {timeZone: city_timezone})
    Provider.find({cityid: city_id, is_approved: 1}).then((provider_list) => {
        provider_list.forEach(function (provider_data) {
            provider_document_expire(provider_data, date)
            provider_vehicle_document_expired(provider_data, date)
        })
    }, (err) => {
        console.log(err)
    });
}

function provider_document_expire(provider_data, date) {
    Provider_Document.find({
        expired_date: {$lt: date},
        provider_id: provider_data._id,
        is_document_expired: false,
        is_uploaded: 1,
        is_expired_date: true
    }).then((provider_document_list) => {
        provider_document_list.forEach(function (provider_document_detail) {
            if (!provider_data.is_documents_expired && provider_document_detail.option == 1) {
                provider_data.is_documents_expired = true;
                provider_data.save().then(() => {
                    utils.remove_from_zone_queue_new(providers);
                });
            }
            allemails.sendProviderDocumentExpiredEmail(null, provider_data);
            provider_document_detail.is_document_expired = true;
            provider_document_detail.save().then(() => {
            });
        })
    })
}

function provider_vehicle_document_expired(provider_data, date) {
    provider_data.vehicle_detail.forEach(function (vehicle_data) {
        provider_vehicle_document(provider_data, vehicle_data, date)
    })
}

function provider_vehicle_document(provider_data, vehicle_data, date) {
    Provider_Vehicle_Document.find({
        expired_date: {$lt: date},
        vehicle_id: vehicle_data._id,
        provider_id: provider_data._id,
        is_document_expired: false,
        is_uploaded: 1,
        is_expired_date: true
    }).then((provider_vehicle_document_list) => {
        provider_vehicle_document_list.forEach(function (provider_vehicle_document_detail) {
            if (!vehicle_data.is_documents_expired && provider_vehicle_document_detail.option == 1) {
                vehicle_data.is_documents_expired = true;
                provider_data.markModified('vehicle_detail');
                provider_data.save().then(() => {
                });
            }
            allemails.sendProviderDocumentExpiredEmail(req, provider_data);
            provider_vehicle_document_detail.is_document_expired = true;
            provider_vehicle_document_detail.save().then(() => {
            });
        })
    }, (err) => {
        console.log(err)
    })
}

function partner_auto_transfer(country_detail) {
    var today = new Date(Date.now());
    if (country_detail.is_auto_transfer) {
        var auto_transfer_day = country_detail.auto_transfer_day;
        var final_day = new Date(today.setDate(today.getDate() - auto_transfer_day));
        Partner.find({
            country_id: country_detail._id,
            last_transferred_date: {$lte: final_day},
            account_id: {$exist: true},
            account_id: {$ne: ''},
            bank_id: {$exist: true},
            bank_id: {$ne: ''}
        }).then((partner_list) => {
            partner_list.forEach(function (partner_detail) {
                var payment_gateway_type = setting_detail.payment_gateway_type;
                    if(country_detail && country_detail.payment_gateways && country_detail.payment_gateways.length>0){
                        payment_gateway_type = country_detail.payment_gateways[0];
                    }
                transfer_payment_to_partner(partner_detail, country_detail.currencycode, country_detail._id, payment_gateway_type);
            });
        }, (err) => {
            console.log(err)
        });
    }
}

function transfer_payment_to_partner(partner_detail, currencycode, country_id, payment_gateway_type) {
    Trip_history.aggregate([{$match: {'provider_type_id': {$eq: partner_detail._id}}},
        {$match: {'is_trip_completed': {$eq: 1}}},
        {$match: {'is_provider_earning_set_in_wallet': {$eq: false}}},
        {$match: {'is_transfered': {$eq: false}}},
        {$group: {_id: null, total: {$sum: '$pay_to_provider'}}}
    ]).then((trip) => {
        if (trip.length > 0) {
            var amount = trip[0].total.toFixed(2)
            utils.stripe_auto_transfer(amount, partner_detail, currencycode, payment_gateway_type, function (response_data) {
                if (response_data.success) {
                    utils.add_transfered_history(Number(constant_json.PARTNER_UNIQUE_NUMBER), partner_detail._id, country_id,
                        amount, currencycode, 1, response_data.transfer_id, Number(constant_json.ADMIN_UNIQUE_NUMBER), null);
                    Trip_history.updateMany({
                        is_trip_completed: 1,
                        is_provider_earning_set_in_wallet: false,
                        is_transfered: false,
                        provider_type_id: partner_detail._id
                    }, {is_transfered: true}, {multi: true}, function (err, trip_data) {
                    });
                    partner_detail.last_transferred_date = new Date();
                    partner_detail.save();
                } else {
                    utils.add_transfered_history(Number(constant_json.PARTNER_UNIQUE_NUMBER), partner_detail._id, country_id,
                        amount, currencycode, 0, '', Number(constant_json.ADMIN_UNIQUE_NUMBER), response_data.error);
                }
            })
        }
    }, (err) => {
        console.log(err)
    });
}

//getOnlineProviderAnalytics
exports.getOnlineProviderAnalytics = function (city_id, city_timezone, city_date_now) {
    Provider.find({is_active: 1, cityid: city_id}).then((providers) => {
        providers.forEach(function (provider) {
            if (provider) {
                myAnalytics.insert_daily_provider_analytics_with_date(city_date_now, city_timezone, provider._id, 0, provider.start_online_time);

                provider.start_online_time = new Date();
                myAnalytics.insert_daily_provider_analytics(city_timezone, provider._id, 0, null);

                provider.save().then(() => {
                });
            }
        });
    }, (err) => {
        console.log(err)
    });
};

async function review_notification() {
    let condition = { 
        is_trip_completed: 1,
        is_user_rated: 0,
        notification_review : null                      
    }
    let trips = await Trip_history.find(condition).select({_id:1, unique_id:1, user_id:1}).lean();
    trips.forEach(async (trip, index) => {
        let user = await User.findOne({_id: trip.user_id}).select({email:1, device_type:1, device_token:1}).lean()
        await Trip_history.updateOne({_id:trip._id}, {notification_review:1})
        utils.sendPushNotification(constant_json.PUSH_CODE_FOR_USER_TO_REVIEW_DRIVER, user.device_type, user.device_token, push_messages.PUSH_CODE_FOR_PROVIDER_APPROVED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
    })
}