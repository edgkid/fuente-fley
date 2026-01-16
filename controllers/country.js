const console = require('./console')
const utils = require('./utils')
const Country = require('mongoose').model('Country')
const City = require('mongoose').model('City')
const CountryService = require('../services/country.service')

exports.get_country_city_list = function (req, res) {
    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            var lookup = {
                $lookup: {
                    from: 'cities',
                    localField: '_id',
                    foreignField: 'countryid',
                    as: 'city_detail',
                },
            }
            var unwind = { $unwind: '$city_detail' }
            var condition = { $match: { isBusiness: { $eq: 1 } } }
            var rrr = {
                $redact: {
                    $cond: [
                        { $eq: ['$city_detail.isBusiness', 1] },
                        '$$KEEP',
                        '$$PRUNE',
                    ],
                },
            }

            var group = {
                $group: {
                    _id: '$_id',
                    countryname: { $first: '$countryname' },
                    alpha2: { $first: '$alpha2' },
                    countryphonecode: { $first: '$countryphonecode' },
                    phone_number_min_length: {
                        $first: '$phone_number_min_length',
                    },
                    phone_number_length: { $first: '$phone_number_length' },
                    city_list: {
                        $push: {
                            _id: '$city_detail._id',
                            full_cityname: '$city_detail.full_cityname',
                            cityname: '$city_detail.cityname',
                        },
                    },
                },
            }

            Country.aggregate([condition, lookup, unwind, group]).then(
                (country_list) => {
                    res.json({ success: true, country_list: country_list })
                },
                (error) => {
                    res.json({ success: true, country_list: [] })
                }
            )
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description,
            })
        }
    })
}

exports.countries_list = async function (req, res) {
    utils.check_request_params(req.body, [], async function (response) {
        if (!response.success) {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
        const country_name = req.body.country || null
        let country = await CountryService.getCountries(null, country_name)
              
        if (country.length === 0) {
            return res.json({success: false, error_code: error_message.ERROR_CODE_NO_COUNTRY_FOUND});
        } 
        let city_list = await CountryService.getCityListCountry(country[0]._id)
        city_list = city_list.map((city) => city.cityname);

        res.json({
            success: true,
            message: success_messages.MESSAGE_CODE_GET_COUNTRY_LIST_SUCCESSFULLY,
            country: country,
            city_list: city_list
        });

    });
};
exports.cities_list = async function (req, res) {
    let cities = await CountryService.getCityListCountries([
        {
            _id: req.params.countryId
        },
    ])

    res.json({
        success: true,
        message: success_messages.MESSAGE_CODE_GET_COUNTRY_LIST_SUCCESSFULLY,
        cities,
    })
}
