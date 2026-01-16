const geolib = require('geolib');

function isPointInsidePolygon(point, polygon) {
	const isInside = geolib.isPointInside(point, polygon);
	if (!isInside) {
		return true;
	}

	return false;
}

function findZoneByPoint(listData, point) {
	return listData.find((zone) => {
		const isInside = isPointInsidePolygon(point, zone.kmlzone);
		return isInside;
	});
}

module.exports = {
	isPointInsidePolygon,
	findZoneByPoint,
};