var Settings = require('mongoose').model('Settings');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var User = require('mongoose').model('User');
var Partner = require('mongoose').model('Partner');
var Providers = require('mongoose').model('Provider');
var Country = require('mongoose').model('Country');
var Trip = require('mongoose').model('Trip');
var Trip_history = require('mongoose').model('Trip_history');
const Corporate = require('mongoose').model('Corporate');
const mongoose = require('mongoose');
const Schema = mongoose.Types.ObjectId;
const Ferry_ticket = require('mongoose').model('Ferry_ticket');

const moment = require('moment');
const dayjs = require('dayjs');
const Admin = require('mongoose').model('admin');


var console = require('../controllers/console');

exports.statistics = async function (req, res) {    
    try {    
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        }
        const admin = req.session.admin
        const show_ferry_amount = req.body.ferry_ticket ?? "1"
        const country = await Country.findOne({
            _id: admin.country_id
        })        
        let selected_country = req.body.selected_country || []
        let all_countries = []
        if(admin.super_admin){
            all_countries = await Country.find({
                isBusiness: 1
            })         
        }
        let trip_query = {}
        let trip_history_query = {}
        trip_history_query['is_provider_status'] = 9
        if(!admin.super_admin){
            trip_query['country_id'] = Schema(admin.country_id)
            trip_history_query['country_id'] = Schema(admin.country_id)
        }else{
            let selected_countries = selected_country ? selected_country.map(s => Schema(s)) : [];
            if(selected_countries.length){
                trip_query['country_id'] = {$in: selected_countries}
                trip_history_query['country_id'] = {$in: selected_countries}
            }
        }

        const now = dayjs();
        const current_date = moment().tz(country.countrytimezone);
        const start_of_day = current_date.startOf('day').toDate();
        const firstDateCurrentMonth = current_date.startOf('month').toDate();
        const firstDateOfPreviousMonth = current_date.clone().subtract(1, 'months').startOf('month').toDate();
        const lastDateOfPreviousMonth = current_date.clone().subtract(1, 'months').endOf('month').toDate();
        const start_of_year = moment().tz(country.countrytimezone).startOf('year').toDate()
        const start_of_previous_year = moment().tz(country.countrytimezone).subtract(1, 'year').startOf('year').toDate();
        const end_of_previous_year = moment().tz(country.countrytimezone).subtract(1, 'year').endOf('year').toDate();
        const lastDateCurrentMonth = now.endOf('month').toDate();
    


        const paidTripsHistory = await Trip_history.aggregate([
            {
                $match: {
                    paid_client: 1,
                    created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPaidAmountHistory: {
                        $sum: {
                            $subtract: [
                                { $ifNull: ["$fixed_price", 0] },
                                { $ifNull: ["$promo_payment", 0] }
                            ]
                        }
                    }
                }
            }
        ]);
        const totalPaidAmountHistory = paidTripsHistory.length > 0 ? paidTripsHistory[0].totalPaidAmountHistory : 0;
        const paidTrips = await Trip.aggregate([
            {
                $match: {
                    paid_client: 1,
                    created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPaidAmount: {
                        $sum: {
                            $subtract: [
                                { $ifNull: ["$fixed_price", 0] },
                                { $ifNull: ["$promo_payment", 0] }
                            ]
                        }
                    }
                }
            }
        ]);
        
        const totalPaidAmount = paidTrips.length > 0 ? paidTrips[0].totalPaidAmount : 0;
                const uniqueTripHistoryIds = paidTripsHistory.map(trip => trip.unique_id); 
        const uniquePaidTrips = await Trip.aggregate([
            {
                $match: {
                    paid_client: 1,
                    created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth },
                    unique_id: { $nin: uniqueTripHistoryIds }  
                }
            },
            {
                $group: {
                    _id: null,
                    totalPaidAmount: {
                        $sum: {
                            $subtract: [
                                { $ifNull: ["$fixed_price", 0] },
                                { $ifNull: ["$promo_payment", 0] }
                            ]
                        }
                    }
                }
            }
        ]);
        
        const totalPaidAmountFiltered = uniquePaidTrips.length > 0 ? uniquePaidTrips[0].totalPaidAmount : 0;
        const totalAmount = totalPaidAmountHistory + totalPaidAmountFiltered;
        

        const paidPartner = await Trip.aggregate([
            {
                $match: {
                    paid_partner: 1,
                    created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPaidAmountPartner: { 
                        $sum:  "$provider_service_fees"
                    }
                }
            }
        ]);
        const totalPaidAmountPartner = paidPartner.length > 0 ? paidPartner[0].totalPaidAmountPartner : 0;
        const unPaidPartner = await Trip.aggregate([
            {
                $match: {
                    paid_partner: 0,
                    created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDuePartner: { 
                        $sum:  "$provider_service_fees"
                    }
                }
            }
        ]);
        const totalDuePartner = unPaidPartner.length > 0 ? unPaidPartner[0].totalDuePartner : 0;

const unpaidTripsHistory = await Trip_history.aggregate([
    {
        $match: {
            paid_client: 0, 
            created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth } 
        }
    },
    {
        $group: {
            _id: null, 
            totalAmountDueHistory: { 
                $sum: { 
                    $subtract: ["$fixed_price", "$promo_payment"] 
                }
            }
        }
    }
]);
const totalAmountDueHistory = unpaidTripsHistory.length > 0 ? unpaidTripsHistory[0].totalAmountDueHistory : 0;

const unpaidTrips = await Trip.aggregate([
    {
        $match: {
            paid_client: 0, 
            created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth } 
        }
    },
    {
        $group: {
            _id: null, 
            totalAmountDue: { 
                $sum: { 
                    $subtract: ["$fixed_price", "$promo_payment"] 
                }
            }
        }
    }
]);

const uniqueUnpaidTripHistoryIds = unpaidTripsHistory.map(trip => trip.unique_id);

const unpaidTripsFiltered = await Trip.aggregate([
    {
        $match: {
            paid_client: 0,
            created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth }, 
            unique_id: { $nin: uniqueUnpaidTripHistoryIds }  
        }
    },
    {
        $group: {
            _id: null, 
            totalAmountDue: { 
                $sum: { 
                    $subtract: ["$fixed_price", "$promo_payment"] 
                }
            }
        }
    }
]);

const totalAmountDueFiltered = unpaidTripsFiltered.length > 0 ? unpaidTripsFiltered[0].totalAmountDue : 0;

const totalAmountDueFinal = totalAmountDueFiltered;
        
const PromoAmount = await Trip.aggregate([
    {
        $match: {
            created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth } 
        }
    },
    {
        $group: {
            _id: null, 
            totalPromoAmount: { 
                $sum: "$promo_payment" 
            }
        }
    }
]);

const totalPromoAmount = PromoAmount.length > 0 ? PromoAmount[0].totalPromoAmount : 0;

        const paidTripsClientes = await Trip.aggregate([
            {
                $match: {
                    paid_client: 1, 
                    created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth} 
                }
            },
            {
                $lookup: {
                    from: "users", 
                    localField: "user_id", 
                    foreignField: "_id", 
                    as: "client_info" 
                }
            },
            {
                $unwind: "$client_info" 
            },
            {
                $group: {
                    _id: "$client_info._id", // 
                    totalPaidAmount: { 
                        $sum: { $subtract: ["$fixed_price", "$promo_payment"] } 
                    },
                    clientDetails: { $first: "$client_info" } 
                }
            },
            {
                $sort: { totalPaidAmount: -1 } 
            }
        ]);
        
if (!Array.isArray(paidTripsClientes)) {
    paidTripsClientes = [];
}

const unpaidTripsClientes = await Trip.aggregate([
    {
        $match: {
            paid_client: 0, 
            created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth }
        }
    },
    {
        $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id", 
            as: "client_info"
        }
    },
    {
        $unwind: "$client_info"
    },
    {
        $group: {
            _id: "$client_info._id", 
            totalAmountDue: { 
                $sum: "$fixed_price", 
            },
            clientDetails: { $first: "$client_info" },
            trips: { 
                $push: {
                    tripId: "$unique_id",
                   tripAmountDue: { $subtract: ["$fixed_price", "$promo_payment"] },
                    tripDate: "$created_at",
                    origen: "$source_address",
                    destino: "$destination_address"
                }
            }
        }
    },
    {
        $sort: { totalAmountDue: -1 }
    }
]);
// Mostrar los resultados en consola
// console.log(JSON.stringify(unpaidTripsClientes, null, 2));

const unpaidTripsClientesHistory = await Trip_history.aggregate([
    {
        $match: {
            paid_client: 0, 
            created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth }
        }
    },
    {
        $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id", 
            as: "client_info" 
        }
    },
    {
        $unwind: "$client_info" 
    },
    {
        $group: {
            _id: "$client_info._id", 
            totalAmountDueHistory: { 
                $sum: { $subtract: ["$fixed_price", "$promo_payment"] } 
            },
            clientDetails: { $first: "$client_info" } 
        }
    },
    {
        $sort: { totalAmountDueHistory: -1 } 
    }
]);

const paidPartners = await Trip.aggregate([
    {
        $match: {
            paid_partner: 1,
            created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth } 
        }
    },
    {
        $group: {
            _id: "$provider_type_id", 
            totalPaidAmount: { $sum: "$provider_service_fees" } 
        }
    },
    {
        $lookup: {
            from: "partners", 
            localField: "_id", 
            foreignField: "_id", 
            as: "partner_info" 
        }
    },
    {
        $unwind: "$partner_info" 
    },
    {
        $project: {
            _id: 0, 
            partnerName: "$partner_info.partner_company_name", 
            email: "$partner_info.email",
            phone: "$partner_info.phone",
            totalPaidAmount: 1
        }
    },
    {
        $sort: { totalPaidAmount: -1 } 
    }
]);

const unpaidPartners = await Trip.aggregate([
    {
        $match: {
            paid_partner: 0, 
            created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth }
        }
    },
    {
        $group: {
            _id: "$provider_type_id", 
            totalUnpaidAmount: { $sum: "$provider_service_fees" },
            trips: { 
                $push: {
                    tripId: "$_id",
                    tripAmountDue: "$provider_service_fees",
                    tripDate: "$created_at"
                }
            }
        }
    },
    {
        $lookup: {
            from: "partners", 
            localField: "_id", 
            foreignField: "_id", 
            as: "partner_info"
        }
    },
    {
        $unwind: {
            path: "$partner_info",
            preserveNullAndEmptyArrays: true // Si no hay un partner asignado, aún se incluirá el partner con los viajes
        }
    },
    {
        $project: {
            _id: 0, 
            partnerName: "$partner_info.partner_company_name",
            email: "$partner_info.email",
            phone: "$partner_info.phone", 
            totalUnpaidAmount: 1,
            trips: 1 // Incluye los detalles de los viajes
        }
    },
    {
        $sort: { totalUnpaidAmount: -1 }
    }
]);

const unpaidPartnershistory = await Trip_history.aggregate([
    {
        $match: {
            paid_partner: 0, 
            created_at: { $gte: firstDateCurrentMonth, $lt: lastDateCurrentMonth } 
        }
    },
    {
        $group: {
            _id: "$provider_type_id", 
            totalUnpaidAmount: { $sum: "$provider_service_fees" } 
        }
    },
    {
        $lookup: {
            from: "partners", 
            localField: "_id", 
            foreignField: "_id", 
            as: "partner_info" 
        }
    },
    {
        $unwind: {
            path: "$partner_info",
            preserveNullAndEmptyArrays: true 
        }
    },
    {
        $project: {
            _id: 0, 
            //partnerName: { $ifNull: ["$partner_info.partner_company_name", "Nombre no disponible"] },
            partnerName: "$partner_info.partner_company_name",
            totalUnpaidAmount: 1 
        }
    },
    {
        $sort: { totalUnpaidAmount: -1 } 
    }
]);  

        const array = [];
        const total_trips = Trip.aggregate([
            {
                $match: trip_query
            },
            {
                $group: {
                    _id: null,
                    running_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, 1, 0]}},
                    amount_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, { $subtract: [{ $subtract: ["$fixed_price", "$promo_payment"] }, "$promo_payment"] }, 0]}},
                    distance_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, "$estimated_distance", 0]}},

                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    previous_year: {$sum: {$cond: [{$and: [{$gte: ["$created_at", start_of_previous_year]}, {$lte: ["$created_at", end_of_previous_year]}]}, 1, 0]}},
                    total: { $sum: 1 },
                    
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, { $subtract: [{ $subtract: ["$fixed_price", "$promo_payment"] }, "$promo_payment"] }, 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_year: {$sum: {$cond: [{$and: [{$gte: ["$created_at", start_of_previous_year]}, {$lte: ["$created_at", end_of_previous_year]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_total: { $sum: { $subtract: ["$fixed_price", "$promo_payment"] } },
                    
                    distance_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$estimated_distance", 0]}},
                    distance_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$estimated_distance", 0]}},
                    distance_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$estimated_distance", 0]}},
                    distance_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$estimated_distance", 0]}},
                    distance_previous_year: {$sum: {$cond: [{$and: [{$gte: ["$created_at", start_of_previous_year]}, {$lte: ["$created_at", end_of_previous_year]}]}, "$estimated_distance", 0]}},
                    distance_total: { $sum: "$estimated_distance" },
                }
            }])

        const total_trip_histories = Trip_history.aggregate([
            {
                $match: trip_history_query
            },
            {
                $group: {
                    _id: null,
                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    previous_year: {$sum: {$cond: [{$and: [{$gte: ["$created_at", start_of_previous_year]}, {$lte: ["$created_at", end_of_previous_year]}]}, 1, 0]}},
                    total: { $sum: 1 },
                    
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_year: {$sum: {$cond: [{$and: [{$gte: ["$created_at", start_of_previous_year]}, {$lte: ["$created_at", end_of_previous_year]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_total: { $sum: { $subtract: ["$fixed_price", "$promo_payment"] } },
                    
                    distance_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$estimated_distance", 0]}},
                    distance_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$estimated_distance", 0]}},
                    distance_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$estimated_distance", 0]}},
                    distance_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$estimated_distance", 0]}},
                    distance_previous_year: {$sum: {$cond: [{$and: [{$gte: ["$created_at", start_of_previous_year]}, {$lte: ["$created_at", end_of_previous_year]}]}, "$estimated_distance", 0]}},
                    distance_total: { $sum: "$estimated_distance" }
                }
            }])

            const unassigned_trips = Trip.aggregate([
                {
                    $match: trip_query  
                },
                {
                  $project: { 
                    adminUnassignedTrips: { $size: { $ifNull: ["$unassign_data", []] }}, 
                    partnerUnassignedTrips: { $size: { $ifNull: ["$partner_unassign_data", []] }}
                  }, 
                },
                {
                  $unionWith: {
                    coll: "trip_histories",
                    pipeline: [
                      { $match: trip_query },  
                      { $project: { 
                          adminUnassignedTrips: { $size: { $ifNull: ["$unassign_data", []] } },
                          partnerUnassignedTrips: { $size: { $ifNull: ["$partner_unassign_data", []] } }
                        }
                      } 
                    ]
                  }
                },
                {
                  $group: {
                    _id: null,
                    adminUnassignedTrips: { $sum: "$adminUnassignedTrips" },
                    partnerUnassignedTrips: { $sum: "$partnerUnassignedTrips" }
                  }
                }
            ]);

            const ferry_tickets = Ferry_ticket.aggregate([
                    {
                        $match: trip_query
                    },
                    {
                    $group: {
                        _id: null,
                        amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$amount", 0]}},
                        amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$amount", 0]}},
                        amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$amount", 0]}},
                        amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$amount", 0]}},
                        amount_previous_year: {$sum: {$cond: [{$and: [{$gte: ["$created_at", start_of_previous_year]}, {$lte: ["$created_at", end_of_previous_year]}]}, "$amount", 0]}},
                        amount_total: { $sum: "$amount" }
                    }
                }
            ])
    
    
            const [totalTrips, totalTripHistories, unassignedTrips, ferryTickets] = await Promise.all([
                total_trips,
                total_trip_histories,
                unassigned_trips,
                ferry_tickets
            ])
            const emptyDataObject = {
                today: 0,
                current_month: 0,
                previous_month: 0,
                current_year: 0,
                previous_year: 0,
                total: 0,
                amount_today: 0,
                amount_current_month: 0,
                amount_previous_month: 0,
                amount_current_year: 0,
                amount_previous_year: 0,
                amount_total: 0,
                distance_today: 0,
                distance_current_month: 0,
                distance_previous_month: 0,
                distance_current_year: 0,
                distance_previous_year: 0,
                distance_total: 0,
            };
            
            const no_data_history = { ...emptyDataObject };
            const no_data = {
                ...emptyDataObject,
                running_trips: 0,
                amount_trips: 0,
                distance_trips: 0,
            };
            
            array['running_trips'] = totalTrips[0] || no_data;
            array['trip_histories'] = totalTripHistories[0] || no_data_history;
            array['ferry'] = ferryTickets[0] || no_data_history;
            if(show_ferry_amount == "0"){
                array['ferry'] = no_data_history
            }
            array['all_countries'] = all_countries;
            array['selected_countries'] = selected_country;

            array['total_paid_amount'] = totalPaidAmount;
        array['total_paid_amount_history'] = totalPaidAmountHistory
        array['total_amount_deu'] = totalAmountDueFinal;
        array['total_amount_deu_history'] = totalAmountDueHistory
        array['total_promo_amount'] = totalPromoAmount;
        array['clientes'] = paidTripsClientes;
        array['un_paid_client'] = unpaidTripsClientes;
        array['un_paid_partner'] = totalPaidAmountPartner;
        array['total_partner_deu'] = totalDuePartner;
        array['un_paid_partner_all'] = unpaidPartners;
        array['paid_partner_all']= paidPartners;
        array['total_unassigned_trips']= unassignedTrips;
        if(req.session.admin.type == 1 && req.session.admin.url_array.indexOf('statistics_facturado') == -1){
            array['trip_histories'].running =  0
            array['trip_histories'].amount_today =  0
            array['trip_histories'].amount_current_month =  0
            array['trip_histories'].amount_previous_month =  0
            array['trip_histories'].amount_current_year =  0
            array['trip_histories'].amount_total =  0

            array['running_trips'].amount_trips = 0
            array['running_trips'].amount_today = 0
            array['running_trips'].amount_current_month = 0
            array['running_trips'].amount_previous_month = 0
            array['running_trips'].amount_current_year = 0
            array['running_trips'].amount_total = 0

            array['ferry'].amount_today = 0
            array['ferry'].amount_current_month = 0
            array['ferry'].amount_previous_month = 0
            array['ferry'].amount_current_year = 0
            array['ferry'].amount_previous_year = 0
            array['ferry'].amount_total = 0

        }
        return res.render('statistics', { 
            detail: array, country, show_ferry_amount
        });

    } catch (e) {
        console.log(e)
        return res.render('statistics', { 
            detail:  []
        });
    }
}

exports.fleet_data = async function (req, res) {    
    try {    
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        }    

        const admin = req.session.admin
        let selected_country = req.body.selected_country || []
        let all_countries = []
        if(admin.super_admin){
            all_countries = await Country.find({
                isBusiness: 1
            })         
        }

        const country = await Country.findOne({
            _id: admin.country_id
        })
        let query = {}
        if(!admin.super_admin){
            query['country_id'] = Schema(admin.country_id)
        }else{
            let selected_countries = selected_country ? selected_country.map(s => Schema(s)) : [];
            if(selected_countries.length){
                query['country_id'] = {$in: selected_countries}
            }
        }


        const current_date = moment().tz(country.countrytimezone);
        const start_of_day = current_date.startOf('day').toDate();
        const firstDateCurrentMonth = current_date.startOf('month').toDate();
        const firstDateOfPreviousMonth = current_date.clone().subtract(1, 'months').startOf('month').toDate();
        const lastDateOfPreviousMonth = current_date.clone().subtract(1, 'months').endOf('month').toDate();
        const start_of_year = current_date.startOf('year').toDate();
        const array = [];            

        const total_provider = Providers.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: null,
                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    total: { $sum: 1 }
                }
            }]) 

        const total_trucks = Partner.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: null,
                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, { $size: "$vehicle_detail" }, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, { $size: "$vehicle_detail" }, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, { $size: "$vehicle_detail" }, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, { $size: "$vehicle_detail" }, 0]}},
                    total: { $sum: { $size: "$vehicle_detail" } },
                }
            }
        ])
        const no_data =             
            {
                today: 0,
                current_month: 0,
                previous_month: 0,
                current_year: 0,
                total: 0
            }

        const [totalProvider, totalTrucks] = await Promise.all([
            total_provider,
            total_trucks
        ])
        array['providers'] = totalProvider[0] || no_data;
        array['trucks'] = totalTrucks[0] || no_data;
        array['all_countries'] = all_countries;
        array['selected_countries'] = selected_country;

        return res.render('fleet_data', { 
            detail: array 
        });

    } catch (e) {
        console.log(e)
        return res.render('fleet_data', { 
            detail: [] 
        });
    }
}

exports.data_users = async function (req, res) {    
    try {    
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        }    

        const admin = req.session.admin

        const country = await Country.findOne({
            _id: admin.country_id
        })
        let selected_country = req.body.selected_country || []
        let all_countries = []
        if(admin.super_admin){
            all_countries = await Country.find({
                isBusiness: 1
            })         
        }

        let user_query = {}
        let partner_query = {}
        let userAndroidquery = {device_type: "android"}
        let useriOSquery = {device_type: "ios"}
        let providerAndroidquery = {device_type: "android"}
        let country_query = {}

        if(!admin.super_admin){
            user_query['country'] = country.countryname
            partner_query['country_id'] = country._id
            userAndroidquery = {device_type: "android", country: country.countryname }
            useriOSquery = {device_type: "ios", country: country.countryname}
            providerAndroidquery = {device_type: "android", country_id: country._id }
            country_query = {country_id: country._id}    
        }else{
            let selected_countries = selected_country ? selected_country.map(s => Schema(s)) : [];
            const selected_country_names = all_countries
            .filter(country => 
              selected_countries.map(id => id.toString()).includes(country._id.toString())
            )
            .map(country => country.countryname);
          
            if(selected_countries.length){
                user_query['country'] = {$in: selected_country_names}
                partner_query['country_id'] = {$in: selected_countries}
                userAndroidquery = {device_type: "android", country: {$in: selected_country_names} }
                useriOSquery = {device_type: "ios", country: {$in: selected_country_names}}
                providerAndroidquery = {device_type: "android", country_id: {$in: selected_countries} }
                country_query = {country_id: {$in: selected_countries}}    
            }
        }

        const current_date = moment().tz(country.countrytimezone);
        const start_of_day = current_date.startOf('day').toDate();
        const firstDateCurrentMonth = current_date.startOf('month').toDate();
        const firstDateOfPreviousMonth = current_date.clone().subtract(1, 'months').startOf('month').toDate();
        const lastDateOfPreviousMonth = current_date.clone().subtract(1, 'months').endOf('month').toDate();
        const start_of_year = current_date.startOf('year').toDate();

        const totalUsersPromise = User.aggregate([
            {
                $match: user_query
            },
            {
                $group: {
                    _id: null,
                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    total: { $sum: 1 }
                }
            }
        ]);

        const totalPartnersPromise = Partner.aggregate([
            {
                $match: partner_query
            },
            {
                $group: {
                    _id: null,
                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    total: { $sum: 1 }
                }
            }
        ]);
        const usersAndroidPromise = User.count(userAndroidquery);
        const usersiOSPromise = User.count(useriOSquery);
        const providersAndroidPromise = Providers.count(providerAndroidquery);
        const corporatesPromise = Corporate.count(country_query);
        const partnersPromise = Partner.count(country_query);
        const no_data =             
        {
            today: 0,
            current_month: 0,
            previous_month: 0,
            current_year: 0,
            total: 0
        }
        
        const [totalUsers, totalPartners, usersAndroid, usersiOS, providersAndroid, corporates, partners] = await Promise.all([
            totalUsersPromise,
            totalPartnersPromise,
            usersAndroidPromise,
            usersiOSPromise,
            providersAndroidPromise,
            corporatesPromise,
            partnersPromise
        ]);
        
        let allUsersCount = usersAndroid + usersiOS + providersAndroid + corporates + partners;

        const usersAndroidPercentage = ((usersAndroid * 100) / allUsersCount).toFixed(2);
        const usersiOSPercentage = ((usersiOS * 100) / allUsersCount).toFixed(2);
        const providersAndroidPercentage = ((providersAndroid * 100) / allUsersCount).toFixed(2);
        const corporatesPercentage = ((corporates * 100) / allUsersCount).toFixed(2);
        const partnersPercentage = ((partners * 100) / allUsersCount).toFixed(2);

        const array = {
            total_users: totalUsers[0] || no_data,
            total_partners: totalPartners[0] || no_data,
            users_android: usersAndroidPercentage,
            users_ios: usersiOSPercentage,
            providers_android: providersAndroidPercentage,
            corporates: corporatesPercentage,
            partners: partnersPercentage,
            all_countries: all_countries,
            selected_countries: selected_country
        };

        return res.render('data_users', { 
            detail: array
        });

    } catch (e) {
        console.log(e)
        return res.render('data_users', { 
            detail: [] 
        });
    }
}

exports.total_trucks_chart = async function (req, res) {
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        }    
        const admin = req.session.admin
        let selected_country = req.body.selected_country || []
        let all_countries = []
        if(admin.super_admin){
            all_countries = await Country.find({
                isBusiness: 1
            })         
        }

        let query = {}
        let pipeline_query = {}
        if(!admin.super_admin){
            query['country_id'] = Schema(admin.country_id)
            pipeline_query['country_id'] = Schema(admin.country_id)
        }else{
            let selected_countries = selected_country ? selected_country.map(s => Schema(s)) : [];
            if(selected_countries.length){
                query['country_id'] = {$in: selected_countries}
                pipeline_query= {$in: ["$country_id", selected_countries]}
            }
        }
        const [truckTypeCounts, truckTypeCityCounts] = await Promise.all([
            Partner.aggregate([
                {
                    $match: query
                },
                {
                    $unwind: "$vehicle_detail"
                },
                {
                    $group: {
                        _id: "$vehicle_detail.admin_type_id",
                        count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "types",
                        localField: "_id",
                        foreignField: "_id",
                        as: "type"
                    }
                },
                {
                    $unwind: "$type"
                },
                {
                    $project: {
                        _id: 0, 
                        typename: "$type.typename",
                        count: 1
                    }
                }
            ]),
            
            Partner.aggregate([
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: "cities",
                        let: { city_details_id: "$city_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$_id", "$$city_details_id"] },
                                            pipeline_query
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    cityname: 1
                                }
                            }
                        ],
                        as: "city_details"
                    }
                },
                {
                    $unwind: "$city_details"
                },
                {
                    $group: {
                        _id: "$city_details._id",
                        city: { $first: "$city_details.cityname" },
                        count: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: "$vehicle_detail",
                                        as: "vehicle",
                                        cond: { $eq: ["$$vehicle.state", 1] }
                                    }
                                }
                            }
                        }
                    }
                }
            ])
        ]);

        let totalTruckCount = truckTypeCounts.reduce((total, truckType) => total + truckType.count, 0);
        truckTypeCounts.forEach(truckType => {
            truckType.percentage = (truckType.count * 100) / totalTruckCount;
        });

        let totalTruckByCityCounts = truckTypeCityCounts.reduce((total, truckByCity) => total + truckByCity.count, 0);
        truckTypeCityCounts.forEach(truckByCity => {
            truckByCity.percentage = (truckByCity.count * 100) / totalTruckByCityCounts;
        });

        res.json({ truckTypeCounts, truckTypeCityCounts });

    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "An error occurred while fetching truck data." });
    }
}

exports.getUnassignedTrips = async function (req, res) {    
try {
    if (typeof req.session.userid == 'undefined') {
        res.redirect('/admin');
        return;
    }    

    const admin = req.session.admin
    let country_query = {$match:{}};
    
    const unassign_unwind = {
        $unwind: "$unassign_data"
    }
    const partner_unassign_unwind = {
        $unwind: "$partner_unassign_data"
    }

    const admin_lookup = {
        $lookup:
        {
            from: "admins",
            let: { admin_id: { $toObjectId: "$unassign_data.unassign_admin_id"} },
            pipeline: [
                { $match: 
                    { $expr: 
                        { $and: 
                            [
                                { $eq: [  "$_id", "$$admin_id" ] },
                            ] 
                        }
                    }
                },
                {
                    $project: {
                        _id: 0, 
                        username: 1
                    }
                } 
            ],
            as: "admin_details"
        }
    }

    const partner_lookup = {
        $lookup:
        {
            from: "partners",
            let: { partner_id: { $toObjectId: "$unassign_data.unassign_partner_id"} },
            pipeline: [
                { $match: 
                    { $expr: 
                        { $and: 
                            [
                                { $eq: [  "$_id", "$$partner_id" ] },
                            ] 
                        }
                    }
                },
                {
                    $project: {
                        _id: 0, 
                        first_name: 1,
                        last_name: 1,
                    }
                } 
            ],
            as: "partner_details"
        }
    }

    const partner_lookup_2 = {
        $lookup:
        {
            from: "partners",
            let: { partner_id: { $toObjectId: "$partner_unassign_data.unassign_partner_id"} },
            pipeline: [
                { $match: 
                    { $expr: 
                        { $and: 
                            [
                                { $eq: [  "$_id", "$$partner_id" ] },
                            ] 
                        }
                    }
                },
                {
                    $project: {
                        _id: 0, 
                        first_name: 1,
                        last_name: 1,
                    }
                } 
            ],
            as: "partner_details"
        }
    }

    if(!admin.super_admin){
        country_query["$match"]["country_id"] = {$eq: Schema(admin.country_id)}
    }

    const getAdminUnassignData = async (model) => {
        return model.aggregate([
            country_query,
            { $match: { "unassign_data.0": { $exists: true } } },
            unassign_unwind,
            admin_lookup,
            partner_lookup,
            { $project: { unique_id: 1, unassign_reason: 1, unassign_admin_id: 1, created_at: 1, server_start_time_for_schedule: 1, unassign_data: 1, admin_details: 1, partner_details: 1 } }
        ]);
    };
    const getPartnerUnassignData = async (model) => {
    return model.aggregate([
        country_query,
        { $match: { "partner_unassign_data.0": { $exists: true } } },
        partner_unassign_unwind,
        partner_lookup_2,
        { $project: { unique_id: 1, unassign_reason: 1, unassign_partner_id: 1, created_at: 1, server_start_time_for_schedule: 1, partner_unassign_data: 1,  partner_details: 1 } }
    ]);
    };

    const [adminUnassignedTrips, adminUnassignedTripHistories, partnerUnassignedTrips, partnerUnassignedTripHistories] = await Promise.all([
        getAdminUnassignData(Trip), getAdminUnassignData(Trip_history),
        getPartnerUnassignData(Trip), getPartnerUnassignData(Trip_history)
    ]);
    const combinedTrips = [...adminUnassignedTrips, ...adminUnassignedTripHistories, ...partnerUnassignedTrips, ...partnerUnassignedTripHistories];
combinedTrips.sort((a, b) => b.unique_id - a.unique_id);

    res.json({trips: combinedTrips})
    return
    

} catch (e) {
    console.log(e)
}
}