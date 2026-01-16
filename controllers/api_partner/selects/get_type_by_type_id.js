const citytypeValidationService = require('./utils/citytype-validation-service');
const lookUpTypes = require('./utils/lookup-types');
const CityTypeModel = require('mongoose').model('city_type')
const City = require('mongoose').model('City');


async function getCityDetails({countryname, cityname}) {
    return City.findOne({ countryname, cityname, isBusiness: constant_json.YES });
}

async function getTypeByTypeId(req, res) {
	if (!req.body?.token)
		return res.status(401).json({
			status: false,
			message: 'Token not found',
			error_code: error_message.ERROR_CODE_INVALID_TOKEN,
		});

	const clientsTypes = ['user_id', 'provider_id', 'corporate_id'];
	
	const clientType = clientsTypes.find((element) => {
		return element in req.body;
	});

	const params = {
		body: req.body,
		clientType,
	};

	if (!params.body.typeId) {
		return res.status(400).json({
			status: false,
			message: 'Type service id not found',
		});
	}

	const countryName = params.body.country;
	const cityName = params.body.city;
	const id = params.body[params.clientType];
  
	const clientValidated = await citytypeValidationService.validateClient({
		id,
		clientType: params.clientType,
		token: params.body.token,
	});
  
	if (!clientValidated.status) {
		return res.status(clientValidated.response.status).json({
			status: false,
			message: clientValidated.response.message,
		});
	}
  
	const { userType } = clientValidated;

	const city = await getCityDetails({countryname: countryName, cityname: cityName});
	if (!city) {
		return res.json({ success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY });
	}

	try {
		const match = {
			$match: {
				cityid: city._id,
				is_business: 1,
				user_type: parseInt(userType),
			},
		};

		const lookup = lookUpTypes.getLookUpTypesByTypeId({
			typeId: params.body?.typeId,
		});
		const unwind = {
			$unwind: '$typeInfo',
		};

		const fieldAdded = {
			$addFields: {
				type: '$typeInfo',
			},
		};

		const project = {
			$project: {
				_id: 1,
				typeid: 1,
				typename: 1,
				type: 1,
			},
		};

		const services = await CityTypeModel.aggregate([
			match,
			lookup,
			unwind,
			fieldAdded,
			project,
		]);

		let service = {}
		if (services.length > 0) {
			service = services[0]
		}

		return res.status(200).json({
			status: true,
			data: service,
		});
	} catch (error) {
		console.error('Error in getServiceTypes', error);
		return res.status(400).json({
			status: false,
			message: 'Error in get service types',
		});
	}
}

module.exports = getTypeByTypeId;