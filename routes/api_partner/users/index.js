const { getInfo } = require('../../../controllers/api_partner/users');
const { verifications } = require('../../../../config/middlewares/index')

module.exports = function(app, {baseURL}) {
    app.route(`${baseURL}/user-info/:phone`).get(
        verifications.checkApiPartnerToken,
        getInfo
    );
}