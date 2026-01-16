const CountryModel = require('mongoose').model('Country');
const CityModel = require('mongoose').model('City');
const calculateDistance = require('./calculate-distance');
const geolocation = require('./geolocation');

async function getNearByCities(specs) {
  try {
    const { countryData, currentLocation } = specs;
    const specsCityFilter = !countryData
      ? {
					cityLatLong: {
						$near: currentLocation,
						$maxDistance: 1,
					},
					isBusiness: constant_json.YES, 
				}
      : {
					countryid: countryData._id,
					isBusiness: constant_json.YES,
				};
    
    const citiesData = await CityModel.find(specsCityFilter).lean();

    return { status: true, data: citiesData };
  } catch (error) {
    console.error('Error in getNearByCities', error);
    return {
      status: false,
    };
  }
}

function findNearestCity({ citiesData, currentLocation }) {
	let finalDistance = Infinity;

  const nearbyCityDetails = citiesData.reduce(
    (acc, city) => {
      const distance = calculateDistance.haversineDistance({
        fromLocation: currentLocation,
        toLocation: city.cityLatLong,
      });

      if (!city.is_use_city_boundary) {
        const isInside = geolocation.isPointInsidePolygon(
          {
            latitude: currentLocation[0],
            longitude: currentLocation[1],
          },
          city.city_locations
        );

        if (isInside && distance < finalDistance) {
          acc.finalCityId = city._id;
          acc.finalCityDetails = city;
          finalDistance = distance;
        }
      }

      if (distance < city.cityRadius && distance < finalDistance) {
        acc.finalCityId = city._id;
        acc.finalCityDetails = city;
        finalDistance = distance;
      }

      return acc;
    },
    { finalCityId: null, finalCityDetails: {} }
  );

  return nearbyCityDetails;
}

async function getLocationData({
	country,
	currentLocation,
	countryCode,
}) {
	const countryData = await CountryModel
		.findOne({
			$or: [
				{ countryname: country },
				{ alpha2: { $exists: true, $eq: countryCode } },
			],
		})
		.lean();
  
	const citiesResponse = await getNearByCities({
		countryData,
		currentLocation,
	});
  
	if (!citiesResponse.status) {
		return {
			status: false,
			response: {
				status: 400,
				message: 'No city found',
				error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY,
			},
		};
	}
  
	const size = citiesResponse.data.length;
  
	if (!size) {
		return {
			status: false,
			response: {
				status: 400,
				message: 'No city found',
				error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY,
			},
		};
	}
  
	const nearbyCityDetails = findNearestCity({
		citiesData: citiesResponse.data,
		currentLocation,
	});
  
	return {
		status: true,
		nearbyCityDetails,
	};
}

module.exports = {
	getLocationData,
};