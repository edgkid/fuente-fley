const RedZoneAreaModel = require('mongoose').model('RedZoneArea');
const CityZoneModel = require('mongoose').model('CityZone');
const ZoneValueModel = require('mongoose').model('ZoneValue');
const geolocation = require('../utils/geolocation');

const models = {
	redZoneAreaModel: RedZoneAreaModel,
	cityZoneModel: CityZoneModel,
}

async function checkZone({ model, cityId, currentLocation }) {
	try {
		const zonesData = await model.find({ cityid: cityId }).lean();
		const isInside = geolocation.findZoneByPoint(zonesData, {
			latitude: currentLocation[0],
			longitude: currentLocation[1],
		});

		return { isInside, status: true };
	} catch (error) {
		console.error('Error checking zone', error);
		return { status: false };
	}
}

async function checkZones({ cityId, currentLocation, modelName }) {
	const { isInside: zoneInside, status } = await checkZone({
		model: models[modelName],
		cityId,
		currentLocation,
	});

	return status ? { zoneInside } : { zoneInside: null };
}

async function getValueFromTwoZones({
	serviceTypeId,
	zoneOriginId,
	zoneDestinationId,
}) {
	try {
		const zoneValue = await ZoneValueModel
			.findOne({
				service_type_id: serviceTypeId,
				$or: [
					{
						from: zoneOriginId,
						to: zoneDestinationId,
					},
					{
						from: zoneDestinationId,
						to: zoneOriginId,
					},
				],
			})
			.select({ amount: 1 })
			.lean();

		return { zoneValue };
	} catch (error) {
		console.error('Error getting value from two zones', error);
		return { zoneValue: null };
	}
}

module.exports = {
	checkZones,
	getValueFromTwoZones,
};