const { trips } = require('../../../controllers/api_partner')
const { verifications } = require('../../../../config/middlewares/index')

module.exports = function (app, {baseURL}){
    app.route(`${baseURL}/need-ferry`).post(verifications.checkApiPartnerToken, trips.needFerry);
    app.route(`${baseURL}/getfareestimate`).post(verifications.checkApiPartnerToken, trips.getFareEstimate);
    app.route(`${baseURL}/createtrip`).post(
        verifications.checkApiPartnerToken,
        verifications.checkUser,
        trips.create
    );
}