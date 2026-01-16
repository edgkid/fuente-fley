const { selects } = require('../../../controllers/api_partner')
const { verifications } = require('../../../../config/middlewares/index')

module.exports = function(app, {baseURL}) {
    console.log("🚀 ~ baseURL:", baseURL)
    app.route(`${baseURL}/citytype/capacity-types`).post(
        verifications.checkApiPartnerToken, 
        verifications.checkUser,
        selects.getCapacitiesTypes
    );

    app.route(`${baseURL}/citytype/services`).post(
        verifications.checkApiPartnerToken, 
        verifications.checkUser,
        selects.getServicesTypes
    );

    app.route(`${baseURL}/citytype/types`).post(
        verifications.checkApiPartnerToken, 
        verifications.checkUser,
        selects.getTypeByTypeId
    );
    
    app.route(`${baseURL}/citytype/models-types`).post(
        verifications.checkApiPartnerToken, 
        verifications.checkUser,
        selects.getModelsCars
    );

    app.route(`${baseURL}/citytype/service-types`).post(
        verifications.checkApiPartnerToken, 
        verifications.checkUser,
        selects.getCityTypes
    );
}