var admin = require('../admin_controllers/dashboard');

module.exports = function (app) {

    app.route('/statistics').get(admin.statistics);
    app.route('/statistics').post(admin.statistics);
    app.route('/getUnassignedTrips').post(admin.getUnassignedTrips);
    app.route('/fleet_data').get(admin.fleet_data);
    app.route('/fleet_data').post(admin.fleet_data);
    app.route('/data_users').get(admin.data_users);
    app.route('/data_users').post(admin.data_users);
    app.route('/total_trucks_chart').post(admin.total_trucks_chart);
};