var requests = require('../admin_controllers/request');
var providers = require('../admin_controllers/provider');
var provider_earning = require('../admin_controllers/provider_earning');
const { checkAdminSession } = require('../middlewares/sessionMiddleware');


module.exports = function (app) {

    app.route('/today_requests').get(requests.list);
    app.route('/requests').get(requests.list);
    app.route('/running_requests').get(requests.list);
    app.route('/admin_incoming_requests').get(requests.admin_incoming_requests);
    app.route('/request_history').get(requests.history);

    app.route('/trip_refund_amount').post(requests.trip_refund_amount);
    app.route('/genetare_request_excel').post(requests.genetare_request_excel);

    app.route('/today_requests').post(requests.list);
    app.route('/requests').post(requests.list);
    app.route('/running_requests').post(requests.list);
    app.route('/admin_incoming_requests').post(requests.admin_incoming_requests);
    app.route('/request_history').post(requests.history);

    app.route('/trip_map').post(requests.trip_map);
    app.route('/request_sort').post(requests.list);
    app.route('/request_search').post(requests.list);
    app.route('/trip_invoice').post(provider_earning.statement_provider_earning);

    app.route('/requsest_status_ajax').post(requests.requsest_status_ajax);
    app.route('/chat_history').post(requests.chat_history);
    app.route('/get_partner_for_trip').post(requests.get_partner_for_trip);
    app.route('/assign_trip_to_partner').post(requests.assign_trip_to_partner);
    app.route('/unassign_trip_to_partner').post(requests.unassign_trip_to_partner);
    app.route('/admin_get_provider_documents').post(requests.admin_get_provider_documents);
    app.route('/userTrackTrip').get(requests.other_user_track_trip);
    app.route('/change_trip_paid_status_corporate_partner').post(requests.change_trip_paid_status_corporate_partner);
    app.route('/admin_change_preqliuidation').post(requests.admin_change_preqliuidation);
    app.route('/admin_delete_pod').post(requests.delete_pod);
    app.route('/admin_reset_trip_status').post(requests.reset_trip_status);
    app.route('/admin_add_note').post(checkAdminSession, requests.admin_add_note);
    app.route('/admin_delete_note').post(checkAdminSession, requests.admin_delete_note);
    app.route('/admin_complete_trip').post(checkAdminSession, requests.admin_complete_trip);

};



