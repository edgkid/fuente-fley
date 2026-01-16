var trip = require('../../app/controllers/trip'); // include trip controller ////

module.exports = function (app) {
    
    app.route('/createtrip').post(trip.create);
    app.route('/provider_createtrip').post(trip.provider_create);
    app.route('/send_request').post(trip.send_request_from_dispatcher);
    
    app.route('/gettrips').post(trip.provider_get_trips);
    app.route('/gettripsdetails').post(trip.provider_get_trip_details);
    app.route('/usergettripstatus').post(trip.user_get_trip_status);
    app.route('/respondstrip').post(trip.responds_trip);
    app.route('/canceltrip').post(trip.trip_cancel_by_user);
    app.route('/tripcancelbyprovider').post(trip.trip_cancel_by_provider);
    app.route('/tripcancelbyadmin').post(trip.trip_cancel_by_admin);
    app.route('/scheduledtripcancelbyadmin').post(trip.scheduled_trip_cancel_by_admin);
    app.route('/settripstatus').post(trip.provider_set_trip_status);
    app.route('/settripstopstatus').post(trip.provider_set_trip_stop_status);
    app.route('/completetrip').post(trip.provider_complete_trip);
    app.route('/tripeditbyadmin').get(trip.edit_trip);
    app.route('/updatetrip').post(trip.update_trip);  

    
    app.route('/pay_payment').post(trip.pay_payment);
    app.route('/pay_tip_payment').post(trip.pay_tip_payment);
    app.route('/pay_stripe_intent_payment').post(trip.pay_stripe_intent_payment);
    app.route('/fail_stripe_intent_payment').post(trip.fail_stripe_intent_payment);
    app.route('/userhistory').post(trip.user_history);
    app.route('/usertripdetail').post(trip.user_tripdetail);
    app.route('/providertripdetail').post(trip.provider_tripdetail);
    app.route('/providergettripstatus').post(trip.providergettripstatus);

    app.route('/providerhistory').post(trip.provider_history);
    app.route('/usergiverating').post(trip.user_rating);
    app.route('/providergiverating').post(trip.provider_rating);
    app.route('/providergivedestinationrating').post(trip.provider_destination_rating);
    app.route('/getuserinvoice').post(trip.user_invoice);

    app.route('/getproviderinvoice').post(trip.provider_invoice);
    app.route('/usersetdestination').post(trip.user_setdestination);
    app.route('/getgooglemappath').post(trip.getgooglemappath);
    app.route('/setgooglemappath').post(trip.setgooglemappath);
    app.route('/optimize_route').post(trip.optimize_route);
    app.route('/get_optimized_route').post(trip.get_optimized_route);

    app.route('/check_destination').post(trip.check_destination);

    app.route('/user_submit_invoice').post(trip.user_submit_invoice);
    app.route('/provider_submit_invoice').post(trip.provider_submit_invoice);
    
    app.route('/getnearbyprovider').post(trip.get_near_by_provider);
    app.route('/twilio_voice_call').post(trip.twilio_voice_call);

    app.route('/refund_amount_in_wallet').post(trip.refund_amount_in_wallet);
    app.route('/refund_amount_in_card').post(trip.refund_amount_in_card);
    
    app.route('/upload_trip_images').post(trip.upload_trip_images);
    app.route('/upload_pod_images').post(trip.upload_pod_images);
    app.route('/upload_pod_per_stop').post(trip.upload_pod_per_stop);
    
    app.route('/pay_by_other_payment_mode').post(trip.pay_by_other_payment_mode);
    
    app.route('/get_provider_assigned_trips').post(trip.get_provider_assigned_trips);
    app.route('/provider_confirm_trip').post(trip.provider_confirm_trip);
    app.route('/web_fareestimate').post(trip.w_fareestimate);
    app.route('/upload_chat_images').post(trip.upload_chat_images);
    app.route('/complete_card_payment_trip').post(trip.complete_card_payment_trip);
    app.route('/userPendingTrips').post(trip.userPendingTrips);
    app.route('/providerDropTrip').post(trip.providerDropTrip);
    app.route('/userNotifyUnload').post(trip.userNotifyUnload);
    app.route('/provider_change_drop_trip_status').post(trip.provider_change_drop_trip_status);        
    app.route('/userGetTripVehicleDocs').post(trip.user_get_trip_vehicle_docs);        
    
};



