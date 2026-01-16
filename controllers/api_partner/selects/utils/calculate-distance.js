const SettingsModel = require('mongoose').model('Settings');

const radius = {
	km: 6371,
	mile: 3959,
	meter: 6371000,
}

function haversineDistance(params) {
	const [fromLat, fromLong] = params.fromLocation;
	const [toLat, toLong] = params.toLocation;
  
	const radiusPicked = params.radius ?? 'km';
  
	const distanceLat = ((toLat - fromLat) * Math.PI) / 180;
	const distanceLong = ((toLong - fromLong) * Math.PI) / 180;
	const haversineIntermediateValue =
		Math.sin(distanceLat / 2) * Math.sin(distanceLat / 2) +
		Math.cos((fromLat * Math.PI) / 180) *
			Math.cos((toLat * Math.PI) / 180) *
			Math.sin(distanceLong / 2) *
			Math.sin(distanceLong / 2);
	const angularDistance =
		2 *
		Math.atan2(
			Math.sqrt(haversineIntermediateValue),
			Math.sqrt(1 - haversineIntermediateValue),
		);
  
    return angularDistance * radius[radiusPicked];
  }

async function getRouteMapInfo({ origin, destination, stops, optimize }) {
	if (!Number(origin[0]) && !Number(origin[1])) {
		return {
			distance: 0,
			reorder: [],
			legs: [],
		};
	}
	
	const settings = await SettingsModel.findOne().lean();
	const URL_API_GOOGLE_DIRECTIONS = `https://maps.googleapis.com/maps/api/directions/json?key=${settings.backend_google_key}&origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}`;
	let steps = '';
	
	if (stops != null && stops != 'undefined' && stops.length > 0) {
		steps = stops.map((stop) => `|${stop.location[0]},${stop.location[1]}|`).join('');
	}
	
	const waypoints = optimize ? `optimize:true${steps}` : steps;
	const url = `${URL_API_GOOGLE_DIRECTIONS}${stops.length ? `&waypoints=${waypoints}` : ''}`;
	
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP Api map error! Status: ${response.status}`);
		}

		const data = await response.json();
		const distance = data.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
		const reorder = data.routes[0].waypoint_order;
		const legs = data.routes[0].legs;

		return {
			distance,
			reorder,
			legs,
		};
	} catch (error) {
		console.error('Error in getRouteMapInfo', error);
		throw error;
	}
}

module.exports = {
	haversineDistance,
	getRouteMapInfo,
};