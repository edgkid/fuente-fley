const createTripsRoutes = require('./create_trip')
const selectsRoutes = require('./selects')
const usersRoutes = require('./users')

module.exports = function (app) {
    console.log('API PARTNER ROUTES');
    const specs = {
        baseURL: '/v1/partner'
    };

    createTripsRoutes(app, specs);

    // SELECTS
    selectsRoutes(app, specs);

    usersRoutes(app, specs);
}