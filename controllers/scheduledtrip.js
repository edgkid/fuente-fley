var utils = require('./utils');
var Trip = require('mongoose').model('Trip');
var User = require('mongoose').model('User');
var utils = require('./utils');
var Trip_history = require('mongoose').model('Trip_history');
/////////////GET FUTURE TRIP///////////
exports.getfuturetrip = async function (req, res) {
    User.findOne({_id: req.body.user_id}, async function (err, user) {
        if (user)
        {
            if (req.body.token != null && user.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else
            {
                // var query1 = { user_id: req.body.user_id, is_schedule_trip: true, is_trip_cancelled: 0, is_trip_completed: 0, provider_id: null, current_provider: null};
                // var query2 = { _id: user.current_trip_id};

                // var trip_search_query = {$or: [query1, query2]};
                var trip_search_query = { user_id: req.body.user_id, is_trip_cancelled: 0, is_trip_completed: 0};
                
                let running_trips = await Trip.find(trip_search_query).select({helpers_list:0}).lean()

                var trip_history_search_query = { user_id: req.body.user_id, is_trip_cancelled: 0, is_user_invoice_show: 0};
                
                let completed_trips = await Trip_history.find(trip_history_search_query).select({helpers_list:0}).lean()

                let total_trips = running_trips.concat(completed_trips)
                total_trips.sort((a, b) => b.unique_id - a.unique_id);

                // Trip.find(trip_search_query, function (err, scheduledtrip) {

                    if (total_trips.length === 0) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NO_SCHEDULED_TRIP_FOUND});

                    } else {
                        res.json({success: true, message: success_messages.MESSAGE_CODE_GET_YOUR_FUTURE_TRIP_SUCCESSFULLY, scheduledtrip: total_trips});
                    }
                // });
            }
        } else
        {
            res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});

        }
    });
};


//////////// cancelScheduledtrip////////////

exports.cancelScheduledtrip = function (req, res) {

    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            ScheduledTrip.findOneAndUpdate({_id: req.body.scheduledtrip_id}, req.body, {new: true}, function (err, scheduledtrip) {

                if (scheduledtrip) {
                    if (scheduledtrip.is_schedule_trip_cancelled == 0 && scheduledtrip.is_trip_created == 0) {
                        scheduledtrip.is_schedule_trip_cancelled = 1;
                        scheduledtrip.save();
                        res.json({
                            success: true,
                            message: success_messages.MESSAGE_CODE_YOUR_FUTURE_TRIP_CANCELLED_SUCCESSFULLY,
                            is_schedule_trip_cancelled: scheduledtrip.is_schedule_trip_cancelled
                        });
                    } else {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_MIS_MATCH_SCHEDULETRIP_ID
                        });
                    }
                } else {
                    res.json({
                        success: false,
                        error_code: error_message.ERROR_CODE_MIS_MATCH_SCHEDULETRIP_ID
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


