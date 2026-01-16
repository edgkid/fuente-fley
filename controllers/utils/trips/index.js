/**
 * Filters stops excluding the main destination address.
 *
 * @param {Array<Object>} destination_addresses - List of destination addresses.
 * Each object should have the following structure:
 * [
 *   {
 *     "address": "Maracay, Aragua, Venezuela",
 *     "location": [10.2441931, -67.60661640000001]
 *   },
 *   {
 *     "address": "Valencia, Carabobo, Venezuela",
 *     "location": [10.1579312, -67.9972104]
 *   }
 * ]
 *
 * @param {Array<Object>} delivery_details - Delivery details.
 * Each object should have the following structure:
 * [
 *   {
 *     "address": "Mérida, Venezuela",
 *     "address_type": "destination",
 *     "city": "",
 *     "no_of_stops": "1",
 *     "note": "nsnzsnsnnsn",
 *     "user_details": {
 *       "company_name": "nndnsnsns",
 *       "country_phone_code": "+58",
 *       "image_url": "",
 *       "name": "kkjdndnnsn",
 *       "phone": "452613489"
 *     }
 *   }
 * ]
 *
 * @returns {Array<Object>} List of filtered destination addresses.
 */
const getStopsWithoutDestination = (
    destination_addresses,
    delivery_details
) => {
    if (delivery_details && delivery_details.length > 0) {
        return destination_addresses.reduce((acc, element) => {
            if (delivery_details[0].address !== element.address) {
                acc.push({
                    address: element.address,
                    location: [
                        Number(element.location[0]),
                        Number(element.location[1]),
                    ],
                    stops_inside: element.stops_inside,
                    stop_username: element.stop_username,
                    stop_user_phone: element.stop_user_phone,
                })
            }
            return acc
        }, [])
    }

    return destination_addresses
}

module.exports = {
    getStopsWithoutDestination,
}
