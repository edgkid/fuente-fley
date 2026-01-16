var admin = require('../admin_controllers/map_view');

module.exports = function (app) {

    app.route('/mapview').get(admin.map);
    app.route('/provider_track').get(admin.provider_track);
    app.route('/fetch_provider_list').post(admin.fetch_provider_list);
    app.route('/fetch_provider_detail').post(admin.fetch_provider_detail);
    app.route('/fetch_provider_list_of_refresh').post(admin.fetch_provider_list_of_refresh);
    
    app.route('/get_all_provider_list').post(admin.get_all_provider_list);
    app.route('/track_trips').get(admin.fetch_trips);
    app.route('/track_trips').post(admin.fetch_trips);
    app.route('/map_get_provider_data').post(admin.map_get_provider_data);
    
}