const Country = require('mongoose').model('Country');
const City = require('mongoose').model('City');
const Corporate = require('mongoose').model('Corporate');
const Citytype = require('mongoose').model('city_type');
const utils = require('../../utils')
const geolib = require('geolib');

async function getCountry({subAdminCountry, countryCode}) {
    return Country.findOne({
        $and: [
            { $or: [{ countryname: subAdminCountry }, { alpha2: { $exists: true, $eq: countryCode } }] },
            { isBusiness: constant_json.YES }
        ]
    });
}

async function getCityDetails({countryname, cityname}) {
    return City.findOne({ countryname, cityname, isBusiness: constant_json.YES });
}

function getFinalCityDetails({cityDetails, currentCityLatLong}) {
    let finalDistance = 1000000;
    let finalCityId = null;
    let finalCityDetails = {};

    cityDetails.forEach(cityDetail => {
        const cityLatLong = cityDetail.cityLatLong;
        const distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(currentCityLatLong, cityLatLong);
        const cityRadius = cityDetail.cityRadius;

        const insideCityBoundary = cityDetail.is_use_city_boundary ? geolib.isPointInside({ latitude: currentCityLatLong[0], longitude: currentCityLatLong[1] }, cityDetail.city_locations) : distanceFromSubAdminCity < cityRadius;

        if (insideCityBoundary && distanceFromSubAdminCity < finalDistance) {
            finalDistance = distanceFromSubAdminCity;
            finalCityId = cityDetail._id;
            finalCityDetails = cityDetail;
        }
    });

    return { finalCityId, finalCityDetails };
}

function getUserType(corporateDetails) {
    let user_type = 0;
    let user_type_id = corporateDetails._id;
    if (corporateDetails.is_own_service_type && corporateDetails.is_own_service_type == 1) {
        user_type = constant_json.CORPORATE_UNIQUE_NUMBER;
    }
    if (corporateDetails.corporate_type_id) {
        const mainCorporate = Corporate.findOne({ _id: corporateDetails.corporate_type_id }).select({ _id: 1 }).lean();
        if (mainCorporate) {
            user_type_id = mainCorporate._id;
        }
    }
    return { user_type, user_type_id };
};

async function getCityTypesItems({countryId, cityId, userType, userTypeId}) {
    const countryIdCondition = { $match: { 'countryid': { $eq: countryId } } };
    const cityIdCondition = { $match: { 'cityid': { $eq: cityId } } };
    const businessCondition = { $match: { 'is_business': { $eq: 1 } } };
    const userTypePricingCondition = userType === constant_json.CORPORATE_UNIQUE_NUMBER ? { $match: { 'user_type_id': { $eq: userTypeId } } } : { $match: { 'user_type': { $eq: 0 } } };
    const cityTypeProjects = {
        $project: {
            _id: 1,
            // countryid: 1,
            // is_business: 1,
            // cityid: 1,
            typeid: 1,
            typename: 1,
        }
    }


    return Citytype.aggregate([
        countryIdCondition, cityIdCondition, businessCondition, userTypePricingCondition,
        cityTypeProjects
    ]);
}


const getCityTypes = async (req, res) => {
    try {
        const { user_type, user_type_id } = req.body;
        // const corporate = await Corporate.findOne({ _id: req.body.user_type_id });
        // console.log("🚀 ~ getCityTypes ~ corporate:", corporate)
        // if (!corporate) {
        //     return res.json({ success: false, error_code: error_message.ERROR_CODE_INVALID_USER_TYPE_ID });
        // }

        // const { user_type, user_type_id } = getUserType(corporate);
        
        const country = await getCountry({
            subAdminCountry: req.body.subAdminCountry, 
            countryCode: req.body.country_code
        });

        if (!country) {
            return res.json({ success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY });
        }
        
        const city = await getCityDetails({countryname: req.body.subAdminCountry, cityname: req.body.cityName});
        if (!city) {
            return res.json({ success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY });
        }

        let cityId = city._id;
        if (req.body.latitude && req.body.longitude) {
            const { finalCityId } = getFinalCityDetails({
                cityDetails: city, 
                currentCityLatLong: [req.body.latitude, req.body.longitude]
            });
            if (!finalCityId) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY });
            }

            cityId = finalCityId
        }

        const cityTypesItems = await getCityTypesItems({
            countryId: country._id, 
            cityId, 
            userType: user_type, 
            userTypeId: user_type_id
        });

        return res.json({ success: true, items: cityTypesItems});
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = getCityTypes;