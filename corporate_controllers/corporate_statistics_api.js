const mongoose = require('mongoose');
const Schema = mongoose.Types.ObjectId;
const Trip = require('mongoose').model('Trip');
const Trip_history = require('mongoose').model('Trip_history');
const moment = require("moment");

exports.corporate_statistics_api = async function (req, res) {
    try {    
        if (typeof req.session.corporate == 'undefined') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        const main_corporate_id = req.session.corporate.corporate_type_id ? 
            req.session.corporate.corporate_type_id : req.session.corporate._id;
        
        const current_date = moment().tz("America/Caracas");
        const start_of_day = current_date.startOf('day').toDate();
        const firstDateCurrentMonth = current_date.startOf('month').toDate();
        const firstDateOfPreviousMonth = current_date.clone().subtract(1, 'months').startOf('month').toDate();
        const lastDateOfPreviousMonth = current_date.clone().subtract(1, 'months').endOf('month').toDate();
        const start_of_year = current_date.startOf('year').toDate();

        const total_trips = Trip.aggregate([
            {
                $match: {
                    user_type_id: {$eq: Schema(main_corporate_id)}
                }
            },
            {
                $group: {
                    _id: null,
                    running_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, 1, 0]}},
                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    total: { $sum: 1 },
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_total: { $sum: { $subtract: ["$fixed_price", "$promo_payment"] } },
                    distance_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$estimated_distance", 0]}},
                    distance_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$estimated_distance", 0]}},
                    distance_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$estimated_distance", 0]}},
                    distance_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$estimated_distance", 0]}},
                    distance_total: { $sum: "$estimated_distance" }
                }
            }
        ]);

        const total_trip_histories = Trip_history.aggregate([
            {
                $match: {
                    user_type_id: {$eq: Schema(main_corporate_id)},
                    is_provider_status: {$eq: 9}
                }
            },
            {
                $group: {
                    _id: null,
                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    total: { $sum: 1 },
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_total: { $sum: { $subtract: ["$fixed_price", "$promo_payment"] } },
                    distance_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$estimated_distance", 0]}},
                    distance_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$estimated_distance", 0]}},
                    distance_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$estimated_distance", 0]}},
                    distance_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$estimated_distance", 0]}},
                    distance_total: { $sum: "$estimated_distance" }
                }
            }
        ]);
            
        const [totalTrips, totalTripHistories] = await Promise.all([
            total_trips,
            total_trip_histories
        ]);

        const trips = totalTrips[0] || {};
        const completed_trips = totalTripHistories[0] || {};
        
        const statistics = {
            running_trips: trips.running_trips || 0,
            trips: {
                today: (trips.today || 0) + (completed_trips.today || 0),
                current_month: (trips.current_month || 0) + (completed_trips.current_month || 0),
                previous_month: (trips.previous_month || 0) + (completed_trips.previous_month || 0),
                current_year: (trips.current_year || 0) + (completed_trips.current_year || 0),
                total: (trips.total || 0) + (completed_trips.total || 0)
            },
            amounts: {
                today: (trips.amount_today || 0) + (completed_trips.amount_today || 0),
                current_month: (trips.amount_current_month || 0) + (completed_trips.amount_current_month || 0),
                previous_month: (trips.amount_previous_month || 0) + (completed_trips.amount_previous_month || 0),
                current_year: (trips.amount_current_year || 0) + (completed_trips.amount_current_year || 0),
                total: (trips.amount_total || 0) + (completed_trips.amount_total || 0)
            },
            distances: {
                today: (trips.distance_today || 0) + (completed_trips.distance_today || 0),
                current_month: (trips.distance_current_month || 0) + (completed_trips.distance_current_month || 0),
                previous_month: (trips.distance_previous_month || 0) + (completed_trips.distance_previous_month || 0),
                current_year: (trips.distance_current_year || 0) + (completed_trips.distance_current_year || 0),
                total: (trips.distance_total || 0) + (completed_trips.distance_total || 0)
            }
        };

        res.json({
            success: true,
            data: statistics
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving statistics'
        });
    }
};