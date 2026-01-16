require('./constant');
const utils = require('./utils');
const myTrips = require('./trip');
const myAnalytics = require('./provider_analytics');
const allemails = require('./emails');
const Provider = require('mongoose').model('Provider');
const Trip = require('mongoose').model('Trip');
const Trip_history = require('mongoose').model('Trip_history');
const TripLocation = require('mongoose').model('trip_location');
const Document = require('mongoose').model('Document');
const Provider_Document = require('mongoose').model('Provider_Document');
const Country = require('mongoose').model('Country');
const City = require('mongoose').model('City');
const Type = require('mongoose').model('Type');
const console = require('./console');
const Citytype = require('mongoose').model('city_type');
const Partner = require('mongoose').model('Partner');
const Provider_Vehicle_Document = require('mongoose').model('Provider_Vehicle_Document');
const CityZone = require('mongoose').model('CityZone');
const User = require('mongoose').model('User');
const mongoose = require('mongoose');
const Wallet_history = require('mongoose').model('Wallet_history');
const geolib = require('geolib');
const Card = require('mongoose').model('Card');
const Reviews = require('mongoose').model('Reviews');
const Schema = mongoose.Types.ObjectId;
const Settings = require('mongoose').model('Settings')

//// PROVIDER REGISTER USING POST SERVICE ///////
exports.provider_register = function (req, res) {

    utils.check_request_params(req.body, [{name: 'email', type: 'string'},{name: 'country_phone_code', type: 'string'},{name: 'phone', type: 'string'},
        {name: 'first_name', type: 'string'},{name: 'last_name', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((provider) => {
                if (provider) {
                    if (provider.login_by == 'manual') {
                        res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                    } else {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED_WITH_SOCIAL
                        });
                    }
                } else {
                    let phone = req.body.phone
                    let phone_with_zero = utils.phoneWithZero(phone)
                    let phone_without_zero = utils.phoneWithoutZero(phone)
        
                    Provider.findOne({
                        phone: {$in: [phone_with_zero, phone_without_zero]},
                        country_phone_code: req.body.country_phone_code
                    }).then((provider) => {

                        if (provider) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                        } else {
                            var query = {};
                            if (req.body.city_id) {
                                query['_id'] = req.body.city_id;
                            } else {
                                query['cityname'] = req.body.city;
                            }

                            City.findOne(query).then((city) => {
                                // console.log(city)
                                var city_id = city._id;
                                var city_name = city.cityname;
                                var country_id = city.countryid;
                                var token = utils.tokenGenerator(32);

                                var gender = req.body.gender;
                                if (gender != undefined) {
                                    gender = ((gender).trim()).toLowerCase();
                                }


                                var first_name = req.body.first_name;
                                first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

                                var last_name = req.body.last_name;
                                last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                                var referral_code = (utils.tokenGenerator(8)).toUpperCase();

                                var provider = new Provider({
                                    first_name: first_name,
                                    last_name: last_name,
                                    country_phone_code: req.body.country_phone_code,
                                    email: ((req.body.email).trim()).toLowerCase(),
                                    phone: phone_without_zero,
                                    gender: gender,
                                    service_type: null,
                                    car_model: req.body.car_model,
                                    car_number: req.body.car_number,
                                    device_token: req.body.device_token,
                                    device_type: req.body.device_type,
                                    bio: req.body.bio,
                                    address: req.body.address,
                                    zipcode: req.body.zipcode,
                                    social_unique_id: req.body.social_unique_id,
                                    login_by: req.body.login_by,
                                    device_timezone: req.body.device_timezone,
                                    city: city_name,
                                    cityid: city_id,
                                    country_id: country_id,
                                    country: req.body.country,
                                    wallet_currency_code: "",
                                    token: token,
                                    referral_code: referral_code,
                                    is_available: 1,
                                    is_document_uploaded: 0,
                                    is_referral: 0,
                                    is_partner_approved_by_admin: 1,
                                    is_active: 0,
                                    is_approved: 0,
                                    rate: 0,
                                    rate_count: 0,
                                    is_trip: [],
                                    received_trip_from_gender: [],
                                    languages: [],
                                    admintypeid: null,
                                    wallet: 0,
                                    bearing: 0,
                                    picture: "",
                                    provider_type: Number(constant_json.PROVIDER_TYPE_PARTNER),
                                    provider_type_id: null,
                                    providerLocation: [0, 0],
                                    providerPreviousLocation: [0, 0],
                                    app_version: req.body.app_version

                                });
                                /////////// FOR IMAGE /////////

                                var pictureData = req.body.pictureData;
                                if (pictureData != undefined && pictureData != "") {
                                    var image_name = provider._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                    provider.picture = url;

                                    utils.saveImageAndGetURL(image_name + '.jpg', req, res, 2);
                                }

                                if (req.files != undefined && req.files.length > 0) {
                                    var image_name = provider._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                    provider.picture = url;
                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                                }
                                ///////////////////////////

                                if (req.body.login_by == "manual") {
                                    var crypto = require('crypto');
                                    var password = req.body.password;
                                    var hash = crypto.createHash('md5').update(password).digest('hex');
                                    provider.password = hash;
                                    provider.social_unique_id = ""
                                    Country.findOne({countryphonecode: req.body.country_phone_code}).then((country) => {
                                        if (country) {
                                            var wallet_currency_code = country.currencycode;
                                            provider.wallet_currency_code = wallet_currency_code;

                                            utils.insert_documets_for_new_providers(provider,1, country._id, function(document_response){
                                                provider.is_document_uploaded = document_response.is_document_uploaded;
                                                
                                                provider.save().then(() => {
                                                    if (provider?.email) {
                                                        allemails.sendProviderRegisterEmail(provider.email, provider.country_id);
                                                    }
                                                    var response = {};
                                                    response.first_name = provider.first_name;
                                                    response.last_name = provider.last_name;
                                                    response.email = provider.email;
                                                    response.country_phone_code = provider.country_phone_code;
                                                    response.is_document_uploaded = provider.is_document_uploaded;
                                                    response.address = provider.address;
                                                    response.is_approved = provider.is_approved;
                                                    response._id = provider._id;
                                                    response.social_ids = provider.social_ids;
                                                    response.social_unique_id = provider.social_unique_id;
                                                    response.phone = provider.phone;
                                                    response.login_by = provider.login_by;
                                                    response.is_documents_expired = provider.is_documents_expired;
                                                    response.account_id = provider.account_id;
                                                    response.bank_id = provider.bank_id;
                                                    response.city = provider.city;
                                                    response.country = provider.country;
                                                    response.rate = provider.rate;
                                                    response.rate_count = provider.rate_count;
                                                    response.is_referral = provider.is_referral;
                                                    response.token = provider.token;
                                                    response.referral_code = provider.referral_code;
                                                    response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                                    response.service_type = provider.service_type;
                                                    response.admintypeid = provider.admintypeid;
                                                    response.is_available = provider.is_available;
                                                    response.is_active = provider.is_active;
                                                    response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                                    response.picture = provider.picture;
                                                    response.wallet_currency_code = provider.wallet_currency_code;
                                                    response.country_detail = {"is_referral": country.is_provider_referral}


                                                    res.json({
                                                        success: true,
                                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOU_REGISTERED_SUCCESSFULLY,
                                                        provider_detail: response,
                                                        phone_number_min_length: setting_detail.minimum_phone_number_length,
                                                        phone_number_length: setting_detail.maximum_phone_number_length
                                                    });
                                                }, (err) => {
                                                    console.log(err);
                                                    res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                });
                                                });

                                            });
                                        }

                                    });
                                } else {
                                    provider.password = "";
                                    Country.findOne({countryphonecode: req.body.country_phone_code}).then((country) => {

                                        if (country) {
                                            var wallet_currency_code = country.currencycode;
                                            provider.wallet_currency_code = wallet_currency_code;
                                            utils.insert_documets_for_new_providers(provider, 1, country._id, function(document_response){
                                                provider.is_document_uploaded = document_response.is_document_uploaded;
                                                provider.save().then(() => {
                                                    if (provider?.email) {
                                                        allemails.sendProviderRegisterEmail(provider.email, provider.country_id);
                                                    }
                                                    var response = {};
                                                    response.first_name = provider.first_name;
                                                    response.last_name = provider.last_name;
                                                    response.email = provider.email;
                                                    response.country_phone_code = provider.country_phone_code;
                                                    response.is_document_uploaded = provider.is_document_uploaded;
                                                    response.address = provider.address;
                                                    response.is_approved = provider.is_approved;
                                                    response._id = provider._id;
                                                    response.social_ids = provider.social_ids;
                                                    response.social_unique_id = provider.social_unique_id;
                                                    response.phone = provider.phone;
                                                    response.login_by = provider.login_by;
                                                    response.is_documents_expired = provider.is_documents_expired;
                                                    response.account_id = provider.account_id;
                                                    response.bank_id = provider.bank_id;
                                                    response.referral_code = provider.referral_code;
                                                    response.city = provider.city;
                                                    response.is_referral = provider.is_referral;
                                                    response.country = provider.country;
                                                    response.rate = provider.rate;
                                                    response.rate_count = provider.rate_count;
                                                    response.token = provider.token;
                                                    response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                                    response.service_type = provider.service_type;
                                                    response.admintypeid = provider.admintypeid;
                                                    response.is_available = provider.is_available;
                                                    response.is_active = provider.is_active;
                                                    response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                                    response.picture = provider.picture;
                                                    response.wallet_currency_code = provider.wallet_currency_code;
                                                    response.country_detail = {"is_referral": country.is_provider_referral}

                                                    res.json({
                                                        success: true,
                                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOU_REGISTERED_SUCCESSFULLY,
                                                        provider_detail: response,
                                                        phone_number_min_length: setting_detail.minimum_phone_number_length,
                                                        phone_number_length: setting_detail.maximum_phone_number_length

                                                    });
                                                }, (err) => {
                                                    console.log(err);
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                    });
                                                });

                                            });
                                        }

                                    });

                                }
                            }, (err) => {
                                console.log(err);
                                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                            });

                        }
                    }, (err) => {
                        console.log(err);
                        res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                    });
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.provider_login = function (req, res) {

    utils.check_request_params(req.body, [{name: 'email', type: 'string'},{name: 'password', type: 'string'}], function (response) {
        if (response.success) {
            if (req.body.login_by == "manual") {
                var email = req.body.email.toLowerCase();
                Provider.findOne({email: email}).then((provider) => {

                    if (!provider) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_PROVIDER});
                    } else if (provider) {

                        var crypto = require('crypto');
                        var password = req.body.password;
                        var hash = crypto.createHash('md5').update(password).digest('hex');
                        if (provider.password != hash) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_PASSWORD});
                        } else {
                            Country.findOne({countryname: provider.country}).then(() => {
                                Provider_Document.find({
                                    provider_id: provider._id,
                                    option: 1,
                                    is_uploaded: 0
                                }).then((providerdocument) => {

                                    if (providerdocument.length > 0) {
                                        provider.is_document_uploaded = 0;
                                    } else {
                                        provider.is_document_uploaded = 1;
                                    }

                                    var token = utils.tokenGenerator(32);
                                    provider.token = token;
                                    var device_token = "";
                                    var device_type = "";
                                    provider.token = token;
                                    if (provider.device_token != "" && provider.device_token != req.body.device_token) {
                                        device_token = provider.device_token;
                                        device_type = provider.device_type;
                                    }

                                    provider.app_version = req.body.app_version;
                                    provider.device_token = req.body.device_token;
                                    provider.device_type = req.body.device_type;
                                    provider.login_by = req.body.login_by;
                                    Partner.findOne({_id: provider.provider_type_id}, function (err, partnerdata) {

                                        var partner_email = "";
                                        if (partnerdata) {
                                            partner_email = partnerdata.email;
                                        }
                                        provider.save().then(() => {
                                            if (device_token != "") {
                                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PROVIDER_LOGIN_IN_OTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                            }
                                            var response = {};
                                            response.first_name = provider.first_name;
                                            response.last_name = provider.last_name;
                                            response.email = provider.email;
                                            response.country_phone_code = provider.country_phone_code;
                                            response.is_document_uploaded = provider.is_document_uploaded;
                                            response.address = provider.address;
                                            response.is_approved = provider.is_approved;
                                            response._id = provider._id;
                                            response.social_ids = provider.social_ids;
                                            response.social_unique_id = provider.social_unique_id;
                                            response.phone = provider.phone;
                                            response.login_by = provider.login_by;
                                            response.is_documents_expired = provider.is_documents_expired;
                                            response.account_id = provider.account_id;
                                            response.bank_id = provider.bank_id;
                                            response.is_referral = provider.is_referral;
                                            response.referral_code = provider.referral_code;
                                            response.city = provider.city;
                                            response.country = provider.country;
                                            response.rate = provider.rate;
                                            response.rate_count = provider.rate_count;
                                            response.token = provider.token;
                                            response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                            response.service_type = provider.service_type;
                                            response.admintypeid = provider.admintypeid;
                                            response.is_available = provider.is_available;
                                            response.is_active = provider.is_active;
                                            response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                            response.picture = provider.picture;
                                            response.wallet_currency_code = provider.wallet_currency_code;

                                            Country.findOne({countryphonecode: provider.country_phone_code}).then((country) => {
                                                if (country) {
                                                    response.country_detail = {"is_referral": country.is_provider_referral}
                                                } else {
                                                    response.country_detail = {"is_referral": false}
                                                }
                                                return res.json({
                                                    success: true, provider_detail: response, trip_detail: provider.is_trip,
                                                    phone_number_min_length: setting_detail.minimum_phone_number_length,
                                                    phone_number_length: setting_detail.maximum_phone_number_length
                                                });
                                            });

                                        }, (err) => {
                                            console.log(err);
                                            res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                        });
                                        });
                                    });
                                });
                            });
                        }

                    }

                }, (err) => {
                    console.log(err);
                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                });
            } else {

                Provider.findOne({social_unique_id: req.body.social_unique_id}).then((provider) => {

                    if (!provider) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_PROVIDER});
                    } else if (provider) {

                        Country.findOne({countryname: provider.country}).then((country) => {
                            Provider_Document.find({
                                provider_id: provider._id,
                                option: 1,
                                is_uploaded: 0
                            }).then((providerdocument) => {

                                if (providerdocument.length > 0) {
                                    provider.is_document_uploaded = 0;
                                } else {
                                    provider.is_document_uploaded = 1;
                                }

                                var token = utils.tokenGenerator(32);
                                provider.token = token;
                                var device_token = "";
                                var device_type = "";
                                provider.token = token;
                                if (provider.device_token != "" && provider.device_token != req.body.device_token) {
                                    device_token = provider.device_token;
                                    device_type = provider.device_type;
                                }


                                provider.app_version = req.body.app_version;
                                provider.device_token = req.body.device_token;
                                provider.device_type = req.body.device_type;
                                provider.login_by = req.body.login_by;
                                Partner.findOne({_id: provider.provider_type_id}, function (err, partnerdata) {

                                        var partner_email = "";
                                        if (partnerdata) {
                                            partner_email = partnerdata.email;
                                        }
                                        provider.save().then(() => {
                                            if (device_token != "") {
                                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PROVIDER_LOGIN_IN_OTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                            }
                                            var response = {};
                                            response.first_name = provider.first_name;
                                            response.last_name = provider.last_name;
                                            response.email = provider.email;
                                            response.country_phone_code = provider.country_phone_code;
                                            response.is_document_uploaded = provider.is_document_uploaded;
                                            response.address = provider.address;
                                            response.is_approved = provider.is_approved;
                                            response._id = provider._id;
                                            response.social_ids = provider.social_ids;
                                            response.social_unique_id = provider.social_unique_id;
                                            response.phone = provider.phone;
                                            response.login_by = provider.login_by;
                                            response.is_referral = provider.is_referral;
                                            response.referral_code = provider.referral_code;
                                            response.is_documents_expired = provider.is_documents_expired;
                                            response.account_id = provider.account_id;
                                            response.bank_id = provider.bank_id;
                                            response.city = provider.city;
                                            response.country = provider.country;
                                            response.rate = provider.rate;
                                            response.rate_count = provider.rate_count;
                                            response.token = provider.token;
                                            response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                            response.service_type = provider.service_type;
                                            response.admintypeid = provider.admintypeid;
                                            response.is_available = provider.is_available;
                                            response.is_active = provider.is_active;
                                            response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                            response.picture = provider.picture;
                                            response.wallet_currency_code = provider.wallet_currency_code;
                                            if (country) {
                                                response.country_detail = {"is_referral": country.is_provider_referral}
                                            } else {
                                                response.country_detail = {"is_referral": false}
                                            }
                                            return res.json({
                                                success: true, provider_detail: response, trip_detail: provider.is_trip,
                                                phone_number_min_length: setting_detail.minimum_phone_number_length,
                                                phone_number_length: setting_detail.maximum_phone_number_length
                                            });

                                        }, (err) => {
                                            console.log(err);
                                            res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                        });
                                    });
                                });
                            });
                        });
                    }
                }, (err) => {
                    console.log(err);
                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                });
            }
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

/////// get  provider Info  /////////////
exports.get_provider_info = async function (req, res) {
    try {
        utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], async function (response) {
            if (!response.success) {
                res.json({
                    success: false,
                    error_code: response.error_code,
                    error_description: response.error_description
                });
            }
            let user = await User.findOne({_id: req.body.user_id}).select({token:1}).lean()
            if(!user){
                res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                return;
            }
            if (user.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                return;
            }
            let provider = await Provider.findOne({_id: req.body.provider_id}).lean()
            let cedula = await Provider_Document.findOne({provider_id: provider._id, name:"Cédula"}) 
            cedula = cedula ? cedula.unique_code : ""
            if (!provider) {
                res.json({success: false, error_code: error_message.ERROR_CODE_NOT_GET_YOUR_DETAIL});
                return;
            } 
            res.json({
                success: true,
                message: success_messages.MESSAGE_CODE_FOR_PROVIDER_GET_YOUR_DETAIL,
                provider: provider,
                cedula: cedula
            });
        });
    } catch (e) {
     console.log(e);   
    }
};

exports.get_provider_detail = async function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], async function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then( async (provider) => {
                if (provider) {
                    if (provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        
                        
                        
                        Citytype.findOne({_id: provider.service_type}).then(async (type_detail) => {
                            let partner_ids = []
                            let vehicle_list = []
                            if(provider.partner_ids.length > 0){
                                provider.partner_ids.forEach((partner) => {
                                    partner_ids.push(partner.partner_id)
                                })
                            }
                            var partner_detail_array = []
                            Partner.find({_id: partner_ids}).then(async (partner_detail)=>{

                                    if(partner_detail.length > 0){
                                        partner_detail.forEach((partner) => {
                                            let partner_status_index = provider.partner_ids.findIndex(x => (x.partner_id).toString() == (partner._id).toString())
                                            if(partner_status_index !== -1){
                                                let partner_data = {
                                                        wallet: partner.wallet,
                                                        name: partner.first_name +' '+ partner.last_name,
                                                        phone: partner.phone,
                                                        country_phone_code: partner.country_phone_code,
                                                        status: provider.partner_ids[partner_status_index].status,
                                                        _id: partner._id
                                                    }
                
                                                    partner_detail_array.push(partner_data)
                                            }
                                        })
                                    }
                                    if(req.body.is_vehicle_list && provider.vehicle_detail.length > 0 ){

                                        var vehicle_lookup = {
                                            $lookup: {
                                                from: "type_details",  
                                                localField: "vehicle_detail.selected_model_id",
                                                foreignField: "_id",
                                                as: "selected_models"
                                              }
                                                                          
                                        }
                                        var Schema = mongoose.Types.ObjectId;
                                        var condition = {$match: {"_id": Schema(req.body.provider_id)}};
                            
                                        let providers_vehicle = await Provider.aggregate([condition,vehicle_lookup,
                                            {
                                                $unwind: "$vehicle_detail"
                                              },
                                              {
                                                $lookup: {
                                                  from: "type_models",  
                                                  localField: "vehicle_detail.selected_model_id",
                                                  foreignField: "_id",
                                                  as: "selected_models"
                                                }
                                              },
    
                                               {
                                                $lookup:
                                                {
                                                    from: "types",
                                                    localField: "vehicle_detail.admin_type_id",
                                                    foreignField: "_id",
                                                    as: "type_detail"
                                                }
                                            },
                                             {
                                                $unwind: {
                                                    path: "$type_detail",
                                                    preserveNullAndEmptyArrays: true
                                                }
                                            },                                          
                                             {
                                                $group: {
                                                    _id: null,
                                                    "vehicle_detail": {
                                                        $push: {
                                                            is_selected: "$vehicle_detail.is_selected",
                                                            passing_year: "$vehicle_detail.passing_year",
                                                            color: "$vehicle_detail.color",
                                                            model: "$vehicle_detail.model",
                                                            plate_no: "$vehicle_detail.plate_no",
                                                            name: "$vehicle_detail.name",
                                                            _id: "$vehicle_detail._id",
                                                            partner_id: "$_id",
                                                            type_image_url: '$type_detail.type_image_url',
                                                            typename: '$type_detail.typename',
                                                            accessibility: "$vehicle_detail.accessibility",
                                                            selected_model_id: "$selected_models",
                                                            selected_services_id: "$vehicle_detail.selected_services_id",
                                                            selected_capacity_id: "$vehicle_detail.selected_capacity_id",
                                                            state: "$vehicle_detail.state"
                                                        }
                                                    }
                                                }
                                            },
                                            ])
                                            vehicle_list = providers_vehicle[0].vehicle_detail
                                    }
                                // if (type_detail) {
                                
                                //     Country.findOne({_id: type_detail.countryid}).then((country_data) => {
                                //         City.findOne({_id: type_detail.cityid}).then((city_data) => {
                                //             Type.findOne({_id: type_detail.typeid}).then((type_data) => {
                                //                 var type_image_url = type_data.type_image_url;
                                //                 var currency = country_data.currencysign;
                                //                 var country_id = country_data._id;
                                //                 var is_auto_transfer = country_data.is_auto_transfer;
                                //                 var unit = city_data.unit;
                                //                 var is_check_provider_wallet_amount_for_received_cash_request = city_data.is_check_provider_wallet_amount_for_received_cash_request;
                                //                 var provider_min_wallet_amount_set_for_received_cash_request = city_data.provider_min_wallet_amount_set_for_received_cash_request;


                                //                 var type_details = {
                                //                     typeid: type_data._id,
                                //                     typename: type_data.typename,
                                //                     base_price: type_detail.base_price,
                                //                     type_image_url: type_image_url,
                                //                     map_pin_image_url: type_data.map_pin_image_url,
                                //                     base_price_distance: type_detail.base_price_distance,
                                //                     distance_price: type_detail.price_per_unit_distance,
                                //                     time_price: type_detail.price_for_total_time,
                                //                     currency: currency,
                                //                     is_auto_transfer: is_auto_transfer,
                                //                     country_id: country_id,
                                //                     unit: unit,
                                //                     is_check_provider_wallet_amount_for_received_cash_request: is_check_provider_wallet_amount_for_received_cash_request,
                                //                     provider_min_wallet_amount_set_for_received_cash_request: provider_min_wallet_amount_set_for_received_cash_request,
                                //                     server_time: new Date(),
                                //                     is_surge_hours: type_detail.is_surge_hours,
                                //                     surge_start_hour: type_detail.surge_start_hour,
                                //                     surge_end_hour: type_detail.surge_end_hour,
                                //                     timezone: city_data.timezone
                                //                 }
                                //                 provider.country_detail = {is_referral: country_data.is_provider_referral}

                                //                 res.json({
                                //                     success: true,
                                //                     message: success_messages.MESSAGE_CODE_FOR_PROVIDER_GET_YOUR_DETAIL,
                                //                     provider: provider,
                                //                     type_details: type_details,
                                //                     partner_detail: partner_detail_array,
                                //                     vehicle_list: vehicle_list
                                //                 });

                                //             });
                                //         });
                                //     });

                                
                                // } else {
                                    res.json({
                                        success: true,
                                        partner_detail: partner_detail_array,
                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_GET_YOUR_DETAIL,
                                        provider: provider,
                                        vehicle_list: vehicle_list

                                    });
                                // }
                            });

                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.provider_heat_map = function (req, res) {
    utils.check_request_params(req.body, [{ name: 'provider_id', type: 'string' }], async function (response) {
        if (!response.success) {
            return res.json({ success: false, error_code: response.error_code, error_description: response.error_description });
        }
        try {
            let provider = await Provider.findOne({ _id: req.body.provider_id });

            if (!provider) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND });
            }

            if (req.body.token != null && provider.token != req.body.token) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN });
            }

            let now = new Date();
            now.setHours(now.getHours() - 1);

            let condition = { provider_id: provider._id, is_trip_completed: 1, created_at: { $gte: now } }
            let select = { _id: 0, sourceLocation: 1 }

            let trip_data = await Trip.find(condition).select(select).lean();
            let trip_history_data = await Trip_history.find(condition).select(select).lean();
            let pickup_locations = trip_data.concat(trip_history_data);

            if (pickup_locations.length == 0) {
                return res.json({ success: false });
            }
            return res.json({ success: true, pickup_locations: pickup_locations });

        } catch (e) {
            return res.json({ success: false, error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG });
        }
    })
};

// update provider
exports.provider_update = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'first_name', type: 'string'},{name: 'last_name', type: 'string'},
        {name: 'phone', type: 'string'},{name: 'country_phone_code', type: 'string'},], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {

                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        if (provider.login_by !== "manual") {
                            
                            if (req.files != undefined && req.files.length > 0) {
                                utils.deleteImageFromFolder(provider.picture, 2);
                                var image_name = provider._id + utils.tokenGenerator(4);
                                var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                provider.picture = url;
                                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                            }

                            var first_name = req.body.first_name;
                            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                            var last_name = req.body.last_name;
                            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                            provider.first_name = first_name;
                            provider.last_name = last_name;
                            provider.country_phone_code = req.body.country_phone_code;
                            provider.phone = req.body.phone;
                            provider.bio = req.body.bio;
                            provider.gender = req.body.gender;
                            provider.address = req.body.address;
                            provider.zipcode = req.body.zipcode;
                            provider.languages = req.body.languages;
                            provider.received_trip_from_gender = req.body.received_trip_from_gender;
                            provider.save().then(() => {

                                var response = {};
                                response.first_name = provider.first_name;
                                response.last_name = provider.last_name;
                                response.email = provider.email;
                                response.country_phone_code = provider.country_phone_code;
                                response.is_document_uploaded = provider.is_document_uploaded;
                                response.address = provider.address;
                                response.is_approved = provider.is_approved;
                                response._id = provider._id;
                                response.social_ids = provider.social_ids;
                                response.social_unique_id = provider.social_unique_id;
                                response.phone = provider.phone;
                                response.login_by = provider.login_by;
                                response.is_documents_expired = provider.is_documents_expired;
                                response.account_id = provider.account_id;
                                response.bank_id = provider.bank_id;
                                response.city = provider.city;
                                response.country = provider.country;
                                response.rate = provider.rate;
                                response.referral_code = provider.referral_code;
                                response.rate_count = provider.rate_count;
                                response.is_referral = provider.is_referral;
                                response.token = provider.token;
                                response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                response.service_type = provider.service_type;
                                response.admintypeid = provider.admintypeid;
                                response.is_available = provider.is_available;
                                response.is_active = provider.is_active;
                                response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                response.picture = provider.picture;

                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOUR_PROFILE_UPDATED_SUCCESSFULLY,
                                    provider_detail: response
                                });
                            }, (err) => {
                                console.log(err);
                                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                            });
                        } else {
                            var crypto = require('crypto');
                            var old_password = req.body.old_password;
                            var hash_old = crypto.createHash('md5').update(old_password).digest('hex');
                            var crypto = require('crypto');
                            var new_password = req.body.new_password;

                            if (provider.password == hash_old) {

                                if (new_password != '') {
                                    var hash_new = crypto.createHash('md5').update(new_password).digest('hex');
                                    provider.password = hash_new;
                                }
                                if (req.files != undefined && req.files.length > 0) {
                                    utils.deleteImageFromFolder(provider.picture, 2);
                                    var image_name = provider._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                    provider.picture = url;

                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);

                                }

                                var first_name = req.body.first_name;
                                first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                                var last_name = req.body.last_name;
                                last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);


                                provider.first_name = first_name;
                                provider.last_name = last_name;
                                provider.country_phone_code = req.body.country_phone_code;
                                provider.phone = req.body.phone;
                                provider.bio = req.body.bio;
                                provider.gender = req.body.gender;
                                provider.address = req.body.address;
                                provider.zipcode = req.body.zipcode;
                                provider.languages = req.body.languages;
                                provider.received_trip_from_gender = req.body.received_trip_from_gender;
                                provider.save().then(() => {
                                    var response = {};
                                    response.first_name = provider.first_name;
                                    response.last_name = provider.last_name;
                                    response.email = provider.email;
                                    response.country_phone_code = provider.country_phone_code;
                                    response.is_document_uploaded = provider.is_document_uploaded;
                                    response.address = provider.address;
                                    response.is_approved = provider.is_approved;
                                    response._id = provider._id;
                                    response.social_ids = provider.social_ids;
                                    response.social_unique_id = provider.social_unique_id;
                                    response.phone = provider.phone;
                                    response.login_by = provider.login_by;
                                    response.is_documents_expired = provider.is_documents_expired;
                                    response.account_id = provider.account_id;
                                    response.bank_id = provider.bank_id;
                                    response.city = provider.city;
                                    response.country = provider.country;
                                    response.rate = provider.rate;
                                    response.referral_code = provider.referral_code;
                                    response.rate_count = provider.rate_count;
                                    response.token = provider.token;
                                    response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                    response.service_type = provider.service_type;
                                    response.admintypeid = provider.admintypeid;
                                    response.is_available = provider.is_available;
                                    response.is_active = provider.is_active;
                                    response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                response.picture = provider.picture;
                                    
                                    res.json({
                                        success: true,
                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOUR_PROFILE_UPDATED_SUCCESSFULLY,
                                        provider_detail: response
                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });

                            } else {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
                                });
                            }
                        }


                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


exports.update_location = function (req, res) {
    // console.log('update location : '+ new Date().toString())
    utils.check_request_params(req.body, [], function (response) {

        if (response.success && req.body.location && req.body.location.length>0) {
            var location_unique_id = 0;
            if (req.body.location_unique_id != undefined) {
                location_unique_id = req.body.location_unique_id;
            }
            req.body.latitude = req.body.location[0]
            req.body.longitude = req.body.location[1]
           
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_INVALID_TOKEN
                        });
                    } else {
                        var trip_id = req.body.trip_id;
                        var now = new Date();
                        if(!trip_id){
                            trip_id = provider.is_trip[0];
                        }
                        Trip.findOne({
                            _id: trip_id,
                            confirmed_provider: req.body.provider_id,
                            is_trip_completed: 0,
                            is_trip_cancelled: 0,
                            is_trip_end: 0
                        }).then((trip) => {

                            if (!trip) {

                                Citytype.findOne({_id: provider.service_type}, function(error, city_type){
                                    if(city_type){
                                        if(!provider.zone_queue_id){
                                            CityZone.find({cityid: provider.cityid, _id:{$in: city_type.zone_ids}}).then((city_zone_list)=>{
                                                if(city_zone_list && city_zone_list.length>0){
                                                    var i = 0;
                                                    var geo;
                                                    var selected_city_zone_data;
                                                    city_zone_list.forEach(async function (city_zone_data) {

                                                        if(!geo){
                                                            geo = geolib.isPointInside(
                                                                {latitude:req.body.latitude, longitude: req.body.longitude},
                                                                city_zone_data.kmlzone
                                                            );
                                                            selected_city_zone_data = city_zone_data;
                                                        }
                                                        
                                                        i++;
                                                        if(i==city_zone_list.length){

                                                            if(geo){
                                                                provider = await utils.add_in_zone_queue_new(selected_city_zone_data._id, provider);
                                                            }

                                                            provider.providerPreviousLocation = provider.providerLocation;
                                                            provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                            provider.bearing = req.body.bearing;
                                                            provider.location_updated_time = now;
                                                            provider.save().then(() => {
                                                                res.json({
                                                                    success: true,
                                                                    location_unique_id: location_unique_id,
                                                                    providerLocation: provider.providerLocation

                                                                });
                                                            }, (err) => {
                                                                console.log(err);
                                                                res.json({
                                                                    success: false,
                                                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                                });
                                                            });
                                                        }

                                                    })
                                                } else {
                                                    provider.providerPreviousLocation = provider.providerLocation;
                                                    provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                    provider.bearing = req.body.bearing;
                                                    provider.location_updated_time = now;
                                                    provider.save().then(() => {
                                                        res.json({
                                                            success: true,
                                                            location_unique_id: location_unique_id,
                                                            providerLocation: provider.providerLocation

                                                        });
                                                    }, (err) => {
                                                        console.log(err);
                                                        res.json({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                }
                                            }, () => {
                                                provider.providerPreviousLocation = provider.providerLocation;
                                                provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                provider.bearing = req.body.bearing;
                                                provider.location_updated_time = now;
                                                provider.save().then(() => {
                                                    res.json({
                                                        success: true,
                                                        location_unique_id: location_unique_id,
                                                        providerLocation: provider.providerLocation

                                                    });
                                                }, (err) => {
                                                    console.log(err);
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                    });
                                                });
                                            });
                                        
                                        } else {
                                            CityZone.findOne({ _id: provider.zone_queue_id }, async function (error, city_zone_data) {
                                                if (city_zone_data) {
                                                    var geo = geolib.isPointInside(
                                                        { latitude: req.body.latitude, longitude: req.body.longitude },
                                                        city_zone_data.kmlzone
                                                    );
                                                    if (!geo) {

                                                        provider = await utils.remove_from_zone_queue_new(provider);

                                                        provider.providerPreviousLocation = provider.providerLocation;
                                                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                        provider.bearing = req.body.bearing;
                                                        provider.location_updated_time = now;
                                                        provider.save().then(() => {
                                                            res.json({
                                                                success: true,
                                                                location_unique_id: location_unique_id,
                                                                providerLocation: provider.providerLocation
                                                            });
                                                        }, (err) => {
                                                            console.log(err);
                                                            res.json({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                            });
                                                        });

                                                    } else {
                                                        provider.providerPreviousLocation = provider.providerLocation;
                                                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                        provider.bearing = req.body.bearing;
                                                        provider.location_updated_time = now;
                                                        provider.save().then(() => {
                                                            res.json({
                                                                success: true,
                                                                location_unique_id: location_unique_id,
                                                                providerLocation: provider.providerLocation
                                                            });
                                                        }, (err) => {
                                                            console.log(err);
                                                            res.json({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                            });
                                                        });
                                                    }

                                                } else {
                                                    provider.providerPreviousLocation = provider.providerLocation;
                                                    provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                    provider.bearing = req.body.bearing;
                                                    provider.location_updated_time = now;
                                                    provider.save().then(() => {
                                                        res.json({
                                                            success: true,
                                                            location_unique_id: location_unique_id,
                                                            providerLocation: provider.providerLocation
                                                        });
                                                    }, (err) => {
                                                        console.log(err);
                                                        res.json({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                }
                                            })
                                        }
                                    } else {
                                        provider.providerPreviousLocation = provider.providerLocation;
                                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                                        provider.bearing = req.body.bearing;
                                        provider.location_updated_time = now;
                                        provider.save().then(() => {
                                            res.json({
                                                success: true,
                                                location_unique_id: location_unique_id,
                                                providerLocation: provider.providerLocation
                                            });
                                        }, (err) => {
                                            console.log(err);
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                            });
                                        });
                                    }
                                });
                            } else {
                                var unit_set = trip.unit;
                                var is_provider_status = trip.is_provider_status

                                if (provider.providerLocation[0] == undefined || provider.providerLocation[1] == undefined || provider.providerLocation[0] == 0 || provider.providerLocation[1] == 0) {
                                    var location = req.body.location;
                                    provider.providerPreviousLocation = provider.providerLocation;
                                    provider.providerLocation = [Number(req.body.location[location.length - 1][0]), Number(req.body.location[location.length - 1][1])];
                                    provider.bearing = req.body.bearing;
                                    provider.location_updated_time = now;
                                    trip.provider_providerPreviousLocation = provider.providerPreviousLocation;
                                    trip.providerLocation = [Number(req.body.location[location.length - 1][0]), Number(req.body.location[location.length - 1][1])];
                                    trip.bearing = req.body.bearing;
                                    Trip.findByIdAndUpdate(trip._id, trip, ()=>{

                                    });
                                    provider.save().then(() => {
                                        res.json({
                                            success: true,
                                            location_unique_id: location_unique_id,
                                            providerLocation: provider.providerLocation,
                                            total_distance: trip.total_distance,
                                            total_time: trip.total_time
                                        });
                                    }, (err) => {
                                        console.log(err);
                                        res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                });

                                    });
                                } else {
                                    if (trip.provider_trip_start_time != null) {
                                        var minutes = utils.getTimeDifferenceInMinute(now, trip.provider_trip_start_time);
                                        trip.total_time = minutes;
                                        Trip.findByIdAndUpdate(trip._id, {total_time: minutes}, ()=>{

                                        });
                                    }

                                    var all_temp_locations = req.body.location;
                                    var all_locations = [];
                                    var locations = [];
                                    TripLocation.findOne({tripID: trip_id}).then((tripLocation) => {

                                        if (trip.is_provider_status == 6) {
                                            var store_locations = tripLocation.startTripToEndTripLocations;
                                            var store_locations_size = store_locations.length;
                                            var locations_size = all_temp_locations.length;

                                            if (locations_size > 1) {

                                                for (var i = 0; i < locations_size; i++) {
                                                    is_add = true;
                                                    for (var j = i + 1; j < locations_size; j++) {
                                                        if (Number(all_temp_locations[i][0]) == Number(all_temp_locations[j][0]) && Number(all_temp_locations[i][1]) == Number(all_temp_locations[j][1])) {
                                                            is_add = false;
                                                            break;
                                                        }
                                                    }
                                                    if (is_add) {
                                                        all_locations.push(all_temp_locations[i]);
                                                    }
                                                }
                                            } else {
                                                all_locations = all_temp_locations;
                                            }

                                            locations_size = all_locations.length;

                                            var is_add = false;
                                            for (var i = 0; i < locations_size; i++) {
                                                is_add = true;
                                                for (var j = 0; j < store_locations_size; j++) {
                                                    if (Number(all_locations[i][0]) == Number(store_locations[j][0]) && Number(all_locations[i][1]) == Number(store_locations[j][1])) {
                                                        is_add = false;
                                                        break;
                                                    }
                                                }
                                                if (is_add) {
                                                    locations.push(all_locations[i]);
                                                }
                                            }
                                        } else {
                                            locations = all_temp_locations;
                                        }


                                        if (locations.length > 0) {
                                            var providerPreviousLocation = provider.providerPreviousLocation;
                                            var providerLocation = provider.providerLocation;

                                            var total_distance = trip.total_distance;
                                            var location_updated_time = provider.location_updated_time;
                                            var temp_location_updated_time = 0;
                                            var temp_diff = 0;
                                            var now = null;
                                            var max_distance = 0.05;
                                            var distance_diff = 0;
                                            var time_diff = 0;
                                            var location = [];

                                            for (var i = 0; i < locations.length; i++) {
                                                now = new Date(Number(locations[i][2]));

                                                providerPreviousLocation = providerLocation;
                                                providerLocation = [Number(locations[i][0]), Number(locations[i][1])];

                                                distance_diff = Math.abs(utils.getDistanceFromTwoLocation(providerPreviousLocation, providerLocation));
                                                time_diff = Math.abs(utils.getTimeDifferenceInSecond(location_updated_time, now));

                                                if (temp_location_updated_time > 0) {
                                                    temp_diff = (Number(locations[i][2]) - temp_location_updated_time) / 1000;
                                                }
                                                temp_location_updated_time = Number(locations[i][2]);

                                                // if ((distance_diff < max_distance * time_diff && distance_diff > 0.005) || time_diff == 0) {
                                                if ((distance_diff < max_distance * time_diff && distance_diff > 0.005) ||  (  distance_diff < max_distance && time_diff == 0)  ){

                                                    location = [Number(providerLocation[0]), Number(providerLocation[1]), time_diff, Number(locations[i][2]), temp_diff];
                                                    switch (trip.is_provider_status) {
                                                        case 2:
                                                            tripLocation.providerStartToStartTripLocations.push(location);
                                                            break;
                                                        case 6:
                                                            tripLocation.startTripToEndTripLocations.push(location);
                                                            break;
                                                        default:
                                                            break;
                                                    }

                                                    location_updated_time = now;
                                                    if (trip.is_provider_status == 6) {
                                                        var td = distance_diff; // km                                                    
                                                        if (unit_set == 0) { /// 0 = mile
                                                            td = td * 0.621371;
                                                        }
                                                        total_distance = +total_distance + +td;
                                                    }
                                                }
                                            }

                                            trip.providerPreviousLocation = providerPreviousLocation;
                                            trip.providerLocation = providerLocation;
                                            trip.total_distance = Number(total_distance.toFixed(2));
                                            Trip.findByIdAndUpdate(trip._id, {total_time: minutes, total_distance: trip.total_distance, providerLocation: trip.providerLocation, providerPreviousLocation: trip.providerPreviousLocation}, ()=>{

                                            // })
                                            // trip.save().then(() => {

                                                tripLocation.save().then(() => {
                                                    res.json({
                                                        success: true,
                                                        location_unique_id: location_unique_id,
                                                        providerLocation: provider.providerLocation,
                                                        total_distance: trip.total_distance,
                                                        total_time: trip.total_time

                                                    });

                                                    if (is_provider_status == 6) {
                                                        utils.set_google_road_api_locations(tripLocation);
                                                    }
                                                }, () => {
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                    });

                                                });
                                            }, () => {
                                                res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                });

                                            });

                                            provider.providerPreviousLocation = providerPreviousLocation;
                                            provider.providerLocation = providerLocation;
                                            provider.location_updated_time = now;
                                            provider.bearing = req.body.bearing;
                                            provider.save();

                                        } else {
                                            res.json({
                                                success: true,
                                                location_unique_id: location_unique_id,
                                                providerLocation: provider.providerLocation,
                                                total_distance: trip.total_distance, total_time: trip.total_time

                                            });
                                        }
                                    });

                                }

                            }
                        }, () => {
                                provider.providerPreviousLocation = provider.providerLocation;
                                provider.providerLocation = [req.body.latitude, req.body.longitude];
                                provider.bearing = req.body.bearing;
                                provider.location_updated_time = now;
                                provider.save().then(() => {
                                    res.json({
                                        success: true,
                                        location_unique_id: location_unique_id,
                                        providerLocation: provider.providerLocation

                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                });
                                });
                        });

                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            });
            
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


exports.update_location_socket = function (req, res) {
    utils.check_request_params(req.body, [], async function (response) {
        if (!(response.success && req.body.location && req.body.location.length > 0)) {
            res([{ success: false, error_code: response.error_code, error_description: response.error_description }]);
            return;
        }
        let location_unique_id = 0;
        let now = new Date();

        if (req.body.location_unique_id != undefined) {
            location_unique_id = req.body.location_unique_id;
        }

        req.body.latitude = req.body.location[0][0]
        req.body.longitude = req.body.location[0][1]

        try {
            let provider = await Provider.findOne({ _id: req.body.provider_id })
            if (!provider) {
                res([{ success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND }]);
                return;
            }

            if (req.body.token != null && provider.token != req.body.token) {
                res([{ success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN }]);
                return;
            }

            if (provider.is_trip.length == 0) {
                let city_type = await Citytype.findOne({ _id: provider.service_type })
                if (!city_type) {
                    provider.providerPreviousLocation = provider.providerLocation;
                    provider.providerLocation = [req.body.latitude, req.body.longitude];
                    provider.bearing = req.body.bearing;
                    provider.location_updated_time = now;
                    await Provider.updateOne({ _id: provider._id }, provider.getChanges())

                    res([{ success: true, location_unique_id: location_unique_id, providerLocation: provider.providerLocation }]);
                    return;
                }

                try {
                    if (!provider.zone_queue_id) {
                        let city_zone_list = await CityZone.find({ cityid: provider.cityid, _id: { $in: city_type.zone_ids } });
                        if (!(city_zone_list && city_zone_list.length > 0)) {
                            provider.providerPreviousLocation = provider.providerLocation;
                            provider.providerLocation = [req.body.latitude, req.body.longitude];
                            provider.bearing = req.body.bearing;
                            provider.location_updated_time = now;
                            await Provider.updateOne({ _id: provider._id }, provider.getChanges())

                            res([{ success: true, location_unique_id: location_unique_id, providerLocation: provider.providerLocation }]);
                            return;
                        }

                        let i = 0;
                        let geo;
                        let selected_city_zone_data;
                        for (const city_zone_data of city_zone_list) {
                            if (!geo) {
                                geo = geolib.isPointInside(
                                    { latitude: req.body.latitude, longitude: req.body.longitude },
                                    city_zone_data.kmlzone
                                );
                                selected_city_zone_data = city_zone_data;
                            }

                            i++;
                            if (i == city_zone_list.length) {
                                if (geo) {
                                    provider = await utils.add_in_zone_queue_new(selected_city_zone_data._id, provider);
                                }

                                provider.providerPreviousLocation = provider.providerLocation;
                                provider.providerLocation = [req.body.latitude, req.body.longitude];
                                provider.bearing = req.body.bearing;
                                provider.location_updated_time = now;
                                await Provider.updateOne({ _id: provider._id }, provider.getChanges())

                                res([{ success: true, location_unique_id: location_unique_id, providerLocation: provider.providerLocation }]);
                                return;
                            }
                        }
                    }

                    let city_zone_data = await CityZone.findOne({ _id: provider.zone_queue_id });
                    if (!city_zone_data) {
                        provider.providerPreviousLocation = provider.providerLocation;
                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                        provider.bearing = req.body.bearing;
                        provider.location_updated_time = now;
                        await Provider.updateOne({ _id: provider._id }, provider.getChanges())

                        res([{ success: true, location_unique_id: location_unique_id, providerLocation: provider.providerLocation }]);
                        return;
                    }

                    let geo = geolib.isPointInside({ latitude: req.body.latitude, longitude: req.body.longitude }, city_zone_data.kmlzone);
                    if (!geo) {
                        provider = await utils.remove_from_zone_queue_new(provider);
                        provider.providerPreviousLocation = provider.providerLocation;
                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                        provider.bearing = req.body.bearing;
                        provider.location_updated_time = now;
                        await Provider.updateOne({ _id: provider._id }, provider.getChanges())

                        res([{ success: true, location_unique_id: location_unique_id, providerLocation: provider.providerLocation }]);
                        return;
                    }

                    provider.providerPreviousLocation = provider.providerLocation;
                    provider.providerLocation = [req.body.latitude, req.body.longitude];
                    provider.bearing = req.body.bearing;
                    provider.location_updated_time = now;
                    await Provider.updateOne({ _id: provider._id }, provider.getChanges())

                    res([{ success: true, location_unique_id: location_unique_id, providerLocation: provider.providerLocation }]);
                    return;
                } catch (e) {
                    provider.providerPreviousLocation = provider.providerLocation;
                    provider.providerLocation = [req.body.latitude, req.body.longitude];
                    provider.bearing = req.body.bearing;
                    provider.location_updated_time = now;
                    await Provider.updateOne({ _id: provider._id }, provider.getChanges())

                    res([{ success: true, location_unique_id: location_unique_id, providerLocation: provider.providerLocation }]);
                    return;
                }
            }

            let responses = []
            for (const trip of provider.is_trip) {
                responses.push(await exports.update_is_trip_location(req, trip, provider))
            }

            res(responses)
            return;
        } catch (e) {
            console.log(e)

            res([{ success: false, error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG }]);
            return;
        }
    });
};

exports.update_is_trip_location = async function (req, trip_id, provider) {
    // console.log(req.body)
    let now = new Date();
    let location_unique_id = 0;

    if (req.body.location_unique_id != undefined) {
        location_unique_id = req.body.location_unique_id;
    }

    req.body.latitude = req.body.location[0][0]
    req.body.longitude = req.body.location[0][1]

    try {
        let trip = await Trip.findOne({
            _id: trip_id,
            confirmed_provider: req.body.provider_id,
            is_trip_completed: 0,
            is_trip_cancelled: 0,
            is_trip_end: 0
        })

        let unit_set = trip.unit;

        if (provider.providerLocation[0] == undefined || provider.providerLocation[1] == undefined || provider.providerLocation[0] == 0 || provider.providerLocation[1] == 0) {
            let location = req.body.location;
            provider.providerPreviousLocation = provider.providerLocation;
            provider.providerLocation = [Number(req.body.location[location.length - 1][0]), Number(req.body.location[location.length - 1][1])];
            provider.bearing = req.body.bearing;
            provider.location_updated_time = now;

            trip.provider_providerPreviousLocation = provider.providerPreviousLocation;
            trip.providerLocation = [Number(req.body.location[location.length - 1][0]), Number(req.body.location[location.length - 1][1])];
            trip.bearing = req.body.bearing;

            await Trip.findByIdAndUpdate(trip._id, trip);
            await Provider.updateOne({ _id: provider._id }, provider.getChanges())

            return {
                success: true,
                location_unique_id: location_unique_id,
                providerLocation: provider.providerLocation,
                total_distance: trip.total_distance,
                total_time: trip.total_time,
                trip_id,
                speed: 0
            };
        }

        if (trip.provider_trip_start_time != null) {
            var minutes = utils.getTimeDifferenceInMinute(now, trip.provider_trip_start_time);
            trip.total_time = minutes;
            await Trip.findByIdAndUpdate(trip._id, { total_time: minutes });
        }

        let all_temp_locations = req.body.location;
        let all_locations = [];
        let locations = [];
        let tripLocation = await TripLocation.findOne({ tripID: trip_id })

        if (trip.is_provider_status == 6) {
            let speed = 0
            if(req.body.speed){
                speed = parseFloat(req.body.speed.toFixed(1));
            }
            tripLocation.speed =  speed > tripLocation.speed  ?  speed : tripLocation.speed 
            let store_locations = tripLocation.startTripToEndTripLocations;
            let store_locations_size = store_locations.length;
            let locations_size = all_temp_locations.length;

            if (locations_size > 1) {
                let is_add = false;
                for (let i = 0; i < locations_size; i++) {
                    is_add = true;
                    for (let j = i + 1; j < locations_size; j++) {
                        if (Number(all_temp_locations[i][0]) == Number(all_temp_locations[j][0]) && Number(all_temp_locations[i][1]) == Number(all_temp_locations[j][1])) {
                            is_add = false;
                            break;
                        }
                    }
                    if (is_add) {
                        all_locations.push(all_temp_locations[i]);
                    }
                }
            } else {
                all_locations = all_temp_locations;
            }

            locations_size = all_locations.length;
            let is_add = false;
            for (let i = 0; i < locations_size; i++) {
                is_add = true;
                for (let j = 0; j < store_locations_size; j++) {
                    if (Number(all_locations[i][0]) == Number(store_locations[j][0]) && Number(all_locations[i][1]) == Number(store_locations[j][1])) {
                        is_add = false;
                        break;
                    }
                }
                if (is_add) {
                    locations.push(all_locations[i]);
                }
            }
        } else {
            locations = all_temp_locations;
        }

        if (locations.length == 0) {
            return {
                success: true,
                location_unique_id: location_unique_id,
                providerLocation: provider.providerLocation,
                total_distance: trip.total_distance,
                total_time: trip.total_time,
                trip_id,
                speed: req.body.speed
            };
        }

        let providerPreviousLocation = trip.providerPreviousLocation;
        let providerLocation = trip.providerLocation;
        let total_distance = trip.total_distance;
        let location_updated_time = provider.location_updated_time;
        let temp_location_updated_time = 0;
        let temp_diff = 0;
        let max_distance = 0.05;
        let distance_diff = 0;
        let time_diff = 0;
        let location = [];
        now = null;
        for (let i = 0; i < locations.length; i++) {
            now = new Date(Number(locations[i][2]));

            providerPreviousLocation = providerLocation;
            providerLocation = [Number(locations[i][0]), Number(locations[i][1])];

            distance_diff = Math.abs(utils.getDistanceFromTwoLocation(providerPreviousLocation, providerLocation));
            time_diff = Math.abs(utils.getTimeDifferenceInSecond(location_updated_time, now));

            if (temp_location_updated_time > 0) {
                temp_diff = (Number(locations[i][2]) - temp_location_updated_time) / 1000;
            }
            temp_location_updated_time = Number(locations[i][2]);
            // if ((distance_diff < max_distance * time_diff && distance_diff > 0.005) || (distance_diff < max_distance && time_diff == 0)) {
                location = [Number(providerLocation[0]), Number(providerLocation[1]), time_diff, Number(locations[i][2]), temp_diff];                   
                    switch (trip.is_provider_status) {
                        case 2:
                            tripLocation.providerStartToStartTripLocations.push(location);
                            break;
                        case 6:
                            tripLocation.startTripToEndTripLocations.push(location);
                            break;
                        case 7:
                            if(trip?.drop_trip_status == CONTAINER_DROP_STATUS.PICKED_UP){
                                tripLocation.arrivedTripToEndTripLocations ||= [];
                                tripLocation.arrivedTripToEndTripLocations.push(location);
                            }else{
                                tripLocation.startTripToEndTripLocations.push(location);
                            }
                            break;
                        default:
                            break;
                    }

                location_updated_time = now;
                if (trip.is_provider_status >= 6 && trip.is_provider_status <= 7) {
                    let td = distance_diff; // km  
                    if (unit_set == 0) { /// 0 = mile
                        td = td * 0.621371;
                    }
                    total_distance = +total_distance + +td;
                }
            // }
        }
        trip.providerPreviousLocation = providerPreviousLocation;
        trip.providerLocation = providerLocation;
        trip.total_distance = Number(total_distance.toFixed(2));

        await Trip.findByIdAndUpdate(trip._id, {
            total_time: minutes,
            total_distance: trip.total_distance,
            providerLocation: trip.providerLocation,
            providerPreviousLocation: trip.providerPreviousLocation,
            speed: req.body.speed
        })

        await TripLocation.updateOne({ _id: tripLocation._id }, tripLocation.getChanges())
        provider.providerPreviousLocation = providerPreviousLocation;
        provider.providerLocation = providerLocation;
        provider.location_updated_time = now;
        provider.bearing = req.body.bearing;

        if (setting_detail.is_receive_new_request_near_destination) {
            if (trip.trip_type != Number(constant_json.TRIP_TYPE_CAR_RENTAL) &&
                trip.is_ride_share != 1 &&
                trip.is_provider_status >= 6) {
                if (trip.destinationLocation) {
                    let destination_diff_km = Math.abs(utils.getDistanceFromTwoLocation(trip.destinationLocation, providerLocation));
                    let destination_diff_meter = destination_diff_km * 1000;
                    if (destination_diff_meter <= setting_detail.near_destination_radius) {
                        if (!provider.is_near_trip) { provider.is_near_trip = [] }
                        if (provider.is_near_trip.length == 0) {
                            provider.is_near_available = 1;
                        }
                    } else {
                        provider.is_near_available = 0;
                    }
                }
            }
        }
        await Provider.updateOne({ _id: provider._id }, provider.getChanges())

        return {
            success: true,
            location_unique_id: location_unique_id,
            providerLocation: provider.providerLocation,
            total_distance: trip.total_distance,
            total_time: trip.total_time,
            trip_id,
            speed: req.body.speed
        };
    } catch (e) {
        console.log(e)
        provider.providerPreviousLocation = provider.providerLocation;
        provider.providerLocation = [req.body.latitude, req.body.longitude];
        provider.bearing = req.body.bearing;
        provider.location_updated_time = now;
        await Provider.updateOne({ _id: provider._id }, provider.getChanges())

        return { success: true, location_unique_id: location_unique_id, providerLocation: provider.providerLocation };
    }
}


//// LOGOUT PROVIDER  SERVICE //
exports.logout = function (req, res) {
    utils.check_request_params(req.body, [{ name: 'provider_id', type: 'string' }], async function (response) {
        if (!response.success) {
            return res.json({ success: false, error_code: response.error_code, error_description: response.error_description });
        }
        try {
            let provider = await Provider.findOne({ _id: req.body.provider_id });
            if (!provider) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND });
            }
            if (req.body.token != null && provider.token != req.body.token) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN });
            }
            provider.device_token = "";
            provider.is_active = 0;
            await provider.save();
            await utils.remove_from_zone_queue_new(provider);
            return res.json({ success: true, message: success_messages.MESSAGE_CODE_FOR_PROVIDER_LOGOUT_SUCCESSFULLY });
        } catch (e) {
            console.log(e)
            return res.json({ success: false, error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG });
        }
    });
};

////PROVIDER STATE change_provider_status 
exports.change_provider_status = function (req, res) {
    utils.check_request_params(req.body, [{ name: 'provider_id', type: 'string' }], async function (response) {
        if (!response.success) {
            return res.json({ success: false, error_code: response.error_code, error_description: response.error_description });
        }
        try {
            let provider = await Provider.findOne({ _id: req.body.provider_id });
            if (!provider) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND });
            }
            if (req.body.token != null && provider.token != req.body.token) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN });
            }

            let city_detail = await City.findOne({ _id: provider.cityid });
            let city_timezone = city_detail.timezone;
            let state = Number(req.body.is_active);
            let start_time = null;
            let dateNow = new Date();
            if (provider.is_active != state) {
                if (state == 1) {
                    provider.start_online_time = dateNow;
                    provider.location_updated_time = dateNow;
                } else {
                    start_time = provider.start_online_time;
                    provider.start_online_time = null;
                    provider.is_go_home = 0;

                }
                provider.is_active = state;
                myAnalytics.insert_daily_provider_analytics(city_timezone, provider._id, 0, start_time);
            }

            await provider.save();
            await utils.remove_from_zone_queue_new(provider);
            return res.json({
                success: true,
                message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOU_ACTIVE_SUCCESSFULLY,
                is_active: provider.is_active
            });
        } catch (e) {
            console.log(e)
            res.json({ success: false, error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG });
        }
    });
};

exports.change_go_home_status = function (req, res) {
    utils.check_request_params(req.body, [{ name: 'provider_id', type: 'string' }], async function (response) {
        if (!response.success) {
            return res.json({ success: false, error_code: response.error_code, error_description: response.error_description });
        }
        try {
            let provider = await Provider.findOne({ _id: req.body.provider_id });
            if (!provider) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND });
            }
            if (req.body.token != null && provider.token != req.body.token) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN });
            }
            if (!provider.address_location && Number(req.body.is_go_home) == 1) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_ADDRESS_NOT_ADDED });
            }
            if (!provider.address_location) { provider.address_location = [0, 0] }
            if (provider.address_location == [0, 0] && Number(req.body.is_go_home) == 1) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_ADDRESS_NOT_ADDED });
            }
            provider.is_go_home = Number(req.body.is_go_home);

            await provider.save();
            return res.json({
                success: true,
                message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOU_ACTIVE_SUCCESSFULLY
            });
        } catch (e) {
            console.log(e)
            res.json({ success: false, error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG });
        }
    });
};
//////////////////////////////


/////////// update city type////////////

exports.provider_updatetype = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'typeid', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {

                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        utils.remove_from_zone_queue_new(provider);
                        var typeid = req.body.typeid;
                        provider.service_type = typeid;

                        Citytype.findOne({_id: typeid}).then((city_type) => {
                            if (city_type) {
                                provider.cityid = city_type.cityid;
                                provider.city = city_type.cityname;

                                // start 2 april //
                                provider.admintypeid = city_type.typeid;
                                // end 2 april //
                                provider.save();
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_TYPE_UPDATE_SUCCESSFULLY
                                });

                            } else {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND
                                });
                            }

                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.getproviderlatlong = function (req, res) {
    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'trip_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        Trip.findOne({_id: req.body.trip_id, confirmed_provider: req.body.provider_id}).then((trip) => {

                            if (!trip) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_NO_TRIP});
                            } else {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOU_GET_LATLONG,
                                    providerLocation: provider.providerLocation,
                                    bearing: provider.bearing,
                                    total_distance: trip.total_distance,
                                    total_time: trip.total_time
                                });
                            }

                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

///////////////   UPDATE DEVICE TOKEN///////
exports.update_device_token = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        provider.device_token = req.body.device_token;
                        provider.save().then(() => {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOUR_DEVICE_TOKEN_UPDATE_SUCCESSFULLY
                            });
                        }, (err) => {
                            console.log(err);
                            res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.get_provider_vehicle_list = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            var mongoose = require('mongoose');
            var Schema = mongoose.Types.ObjectId;
            var condition = {$match: {"_id": Schema(req.body.provider_id)}};
            var vunwind = {$unwind: "$vehicle_detail"}

            var lookup = {
                $lookup:
                    {
                        from: "types",
                        localField: "vehicle_detail.admin_type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
            };
            var unwind = {
                $unwind: {
                    path: "$type_detail",
                    preserveNullAndEmptyArrays: true
                }
            };

            var group = {
                $group: {
                    _id: null,
                    "vehicle_detail": {
                        $push: {
                            is_selected: "$vehicle_detail.is_selected",
                            admin_type_id: "$vehicle_detail.admin_type_id",
                            service_type: "$vehicle_detail.service_type",
                            passing_year: "$vehicle_detail.passing_year",
                            color: "$vehicle_detail.color",
                            model: "$vehicle_detail.model",
                            plate_no: "$vehicle_detail.plate_no",
                            name: "$vehicle_detail.name",
                            _id: "$vehicle_detail._id",
                            is_documents_expired: "$vehicle_detail.is_documents_expired",
                            is_document_uploaded: "$vehicle_detail.is_document_uploaded",
                            is_selected: "$vehicle_detail.is_selected",
                            type_image_url: '$type_detail.type_image_url'
                        }
                    }
                }
            }
            Provider.aggregate([condition, vunwind, lookup, unwind, group]).then((provider) => {

                if (provider.length == 0) {
                    res.json({success: true, vehicle_list: []})
                } else {
                    res.json({success: true, vehicle_list: provider[0].vehicle_detail})
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            })
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.change_current_vehicle = function (req, res) {
    utils.check_request_params(req.body, [{ name: 'provider_id', type: 'string' }, { name: 'vehicle_id', type: 'string' }], async function (response) {
        if (!response.success) {
            return res.json({ success: false, error_code: response.error_code, error_description: response.error_description });
        }
        try {
            let provider = await Provider.findOne({ _id: req.body.provider_id })
            if (!provider) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND });
            }
            if (req.body.token != null && provider.token != req.body.token) {
                return res.json({ success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN });
            }
            let index = provider.vehicle_detail.findIndex((x) => x.is_selected == true)
            provider.vehicle_detail[index].is_selected = false;
            let new_index = provider.vehicle_detail.findIndex((x) => (x._id).toString() == (req.body.vehicle_id).toString());

            if (provider.vehicle_detail[new_index].service_type == null) {
                return res.json({ success: false });
            }

            provider.vehicle_detail[new_index].is_selected = true;
            provider.service_type = provider.vehicle_detail[new_index].service_type;
            provider.admintypeid = provider.vehicle_detail[new_index].admin_type_id;
            provider.is_vehicle_document_uploaded = provider.vehicle_detail[new_index].is_document_uploaded;

            provider.markModified('vehicle_detail');

            await provider.save();
            await utils.remove_from_zone_queue_new(provider);
            return res.json({ success: true })
        } catch (e) {
            console.log(e);
            return res.json({ success: false, error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG });
        }
    });
};

exports.get_provider_vehicle_detail = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var index = provider.vehicle_detail.findIndex((x) => (x._id).toString() == (req.body.vehicle_id).toString())

                        if (index == -1) {
                            res.json({success: false})
                        } else {
                            Provider_Vehicle_Document.find({vehicle_id: req.body.vehicle_id}).then((provider_vehicle_document) => {

                                Type.findOne({_id: provider.vehicle_detail[index].admin_type_id}).then((type) => {
                                    if (type) {
                                        provider.vehicle_detail[index].type_image_url = type.type_image_url;
                                        res.json({
                                            success: true,
                                            vehicle_detail: provider.vehicle_detail[index],
                                            document_list: provider_vehicle_document
                                        })

                                    } else {
                                        provider.vehicle_detail[index].type_image_url = '';
                                        res.json({
                                            success: true,
                                            vehicle_detail: provider.vehicle_detail[index],
                                            document_list: provider_vehicle_document
                                        })

                                    }
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                })
                            });
                        }
                    }
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.upload_vehicle_document = function (req, res) {
    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_id', type: 'string'},{name: 'document_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        Provider_Vehicle_Document.findOne({
                            _id: req.body.document_id,
                            vehicle_id: req.body.vehicle_id,
                            provider_id: req.body.provider_id
                        }).then((providervehicledocument) => {

                            if (providervehicledocument) {
                                if (req.files != undefined && req.files.length > 0) {
                                    utils.deleteImageFromFolder(providervehicledocument.document_picture, 3);
                                    var image_name = providervehicledocument._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                                    providervehicledocument.document_picture = url;
                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);
                                }
                                providervehicledocument.is_uploaded = 1;
                                providervehicledocument.unique_code = req.body.unique_code;
                                providervehicledocument.expired_date = req.body.expired_date;
                                providervehicledocument.is_document_expired = false;


                                providervehicledocument.save().then(() => {
                                    // if (provider.is_vehicle_document_uploaded == false) {
                                    Provider_Vehicle_Document.find({
                                        vehicle_id: req.body.vehicle_id,
                                        option: 1,
                                        provider_id: req.body.provider_id,
                                        is_uploaded: 0
                                    }).then((providervehicledocumentuploaded) => {
                                        Provider_Vehicle_Document.find({
                                            vehicle_id: req.body.vehicle_id,
                                            option: 1,
                                            provider_id: req.body.provider_id,
                                            is_document_expired: true
                                        }).then((expired_providervehicledocumentuploaded) => {
                                            var index = provider.vehicle_detail.findIndex((x) => x._id == req.body.vehicle_id);

                                            if (expired_providervehicledocumentuploaded.length == 0) {
                                                provider.vehicle_detail[index].is_documents_expired = false;
                                            } else {
                                                provider.vehicle_detail[index].is_documents_expired = true;
                                            }
                                            if (providervehicledocumentuploaded.length == 0) {
                                                provider.vehicle_detail[index].is_document_uploaded = true;
                                            } else {
                                                provider.vehicle_detail[index].is_document_uploaded = false;
                                            }
                                            provider.markModified('vehicle_detail');
                                            if(provider.vehicle_detail[index].is_selected){
                                                if (providervehicledocumentuploaded.length == 0) {
                                                    provider.is_vehicle_document_uploaded = true;
                                                } else {
                                                    provider.is_vehicle_document_uploaded = false;
                                                }
                                            }
                                            provider.save();
                                        });

                                    });
                                    // }
                                    res.json({success: true, document_detail: providervehicledocument})
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });

                            } else {
                                res.json({success: false})
                            }
                        });
                    }
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.provider_update_vehicle_detail = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_name', type: 'string'},{name: 'plate_no', type: 'string'},
        {name: 'model', type: 'string'},{name: 'color', type: 'string'},{name: 'passing_year', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var index = provider.vehicle_detail.findIndex((x) => (x._id).toString() == (req.body.vehicle_id).toString())

                        if (index == -1) {
                            res.json({success: false})
                        } else {
                            provider.vehicle_detail[index].name = req.body.vehicle_name;
                            provider.vehicle_detail[index].plate_no = req.body.plate_no;
                            provider.vehicle_detail[index].model = req.body.model;
                            provider.vehicle_detail[index].color = req.body.color;
                            provider.vehicle_detail[index].accessibility = req.body.accessibility;
                            provider.vehicle_detail[index].passing_year = req.body.passing_year;
                            Provider.findOneAndUpdate({_id: req.body.provider_id}, {vehicle_detail: provider.vehicle_detail}, {new: true}).then((providerupdate) => {
                                res.json({success: true, vehicle_detail: providerupdate.vehicle_detail[index]})
                            })
                        }
                    }
                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
}

exports.provider_add_vehicle = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_name', type: 'string'},
        {name: 'passing_year', type: 'string'},{name: 'model', type: 'string'},{name: 'color', type: 'string'},
        {name: 'plate_no', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        if (provider.vehicle_detail.length == 0) {
                            provider.service_type = null;
                            provider.admintypeid = null;
                        }

                        if(req.body.selected_model_id){
                            req.body.selected_model_id = ObjectId(req.body.selected_model_id)
                        }
            
                        req.body.selected_services_id = req.body.selected_services_id || []
            
                        if(req.body.selected_capacity_id){
                            req.body.selected_capacity_id = ObjectId(req.body.selected_capacity_id)
                        }
            
                        var mongoose = require('mongoose');
                        var ObjectId = mongoose.Types.ObjectId;
                        var x = new ObjectId();
                        var vehicel_json = {
                            _id: x,
                            name: req.body.vehicle_name,
                            accessibility: req.body.accessibility,
                            plate_no: req.body.plate_no,
                            model: req.body.model,
                            color: req.body.color,
                            passing_year: req.body.passing_year,
                            service_type: null,
                            admin_type_id: null,
                            is_documents_expired: false,
                            is_selected: false,
                            is_document_uploaded: false
                        }

                        if(req.body.service_type){
                            vehicel_json.service_type = Schema(req.body.service_type);
                            vehicel_json.admin_type_id = Schema(req.body.admin_type_id);
                            if (provider.vehicle_detail.length == 0) {
                                provider.service_type = Schema(req.body.service_type);
                                provider.admintypeid = Schema(req.body.admin_type_id);
                                provider.is_approved = 1;
                                provider.is_document_uploaded = 1;
                                provider.is_vehicle_document_uploaded = true;
                                vehicel_json.is_selected = true;
                                vehicel_json.is_document_uploaded = true;
                            }
                        }
                        
                        Country.findOne({countryname: provider.country}).then((country) => {

                            Document.find({countryid: country._id, type: 2}).then((document) => {

                                var is_document_uploaded = false;

                                var document_size = document.length;

                                if (document_size !== 0) {

                                    var count = 0;
                                    for (var i = 0; i < document_size; i++) {

                                        if (document[i].option == 0) {
                                            count++;
                                        } else {
                                            break;
                                        }
                                        if (count == document_size) {
                                            is_document_uploaded = true;
                                        }
                                    }

                                    document.forEach(function (entry) {
                                        var providervehicledocument = new Provider_Vehicle_Document({
                                            vehicle_id: x,
                                            provider_id: provider._id,
                                            document_id: entry._id,
                                            name: entry.title,
                                            option: entry.option,
                                            document_picture: "",
                                            unique_code: entry.unique_code,
                                            expired_date: "",
                                            is_unique_code: entry.is_unique_code,
                                            is_expired_date: entry.is_expired_date,
                                            is_document_expired: false,
                                            is_uploaded: 0
                                        });
                                        providervehicledocument.save().then(() => {
                                        });
                                    });
                                    vehicel_json.is_document_uploaded = is_document_uploaded;
                                } else {
                                    vehicel_json.is_document_uploaded = true;
                                }
                                provider.vehicle_detail.unshift(vehicel_json);
                                provider.save().then(() => {
                                    Provider_Vehicle_Document.find({vehicle_id: x}, function (err, provider_vehicle_document) {
                                        res.json({
                                            success: true,
                                            vehicle_detail: vehicel_json,
                                            document_list: provider_vehicle_document
                                        })
                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });
                            });

                        });
                    }
                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });

};

//update_provider_setting
exports.update_provider_setting = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        provider.languages = req.body.languages;
                        provider.received_trip_from_gender = req.body.received_trip_from_gender;
                        if (typeof req.body.is_go_home != 'undefined') {
                            provider.is_go_home = req.body.is_go_home;
                        }
                        if (typeof req.body.address != 'undefined') {
                            provider.address = req.body.address;
                        }
                        if (typeof req.body.address_location != 'undefined') {
                            provider.address_location = req.body.address_location;
                        }

                        provider.save().then(() => {
                            res.json({
                                success: true, languages: provider.languages,
                                received_trip_from_gender: provider.received_trip_from_gender
                            })
                        }, (err) => {
                            console.log(err);
                            res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                        });
                    }

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_GET_YOUR_DETAIL});

                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
}

exports.get_provider_setting_detail = function (req, res) {

    var terms_and_condition_url = 'https://' + req.get('host') + "/provider-terms&condition";
    var privacy_policy_url = 'https://' + req.get('host') + "/provider-privacy";
    
    var setting_response = {};
    setting_response.is_provider_social_login = setting_detail.is_provider_social_login
    setting_response.terms_and_condition_url =  terms_and_condition_url
    setting_response.privacy_policy_url = privacy_policy_url
    setting_response.admin_phone = setting_detail.admin_phone;
    setting_response.contactUsEmail = setting_detail.contactUsEmail;
    setting_response.is_tip = setting_detail.is_tip;
    setting_response.is_toll = setting_detail.is_toll;
    setting_response.scheduled_request_pre_start_minute = setting_detail.scheduled_request_pre_start_minute;
    setting_response.providerEmailVerification = setting_detail.providerEmailVerification;
    setting_response.stripe_publishable_key = setting_detail.stripe_publishable_key;
    setting_response.providerSms = setting_detail.providerSms;
    setting_response.twilio_call_masking = setting_detail.twilio_call_masking;
    setting_response.is_provider_initiate_trip = setting_detail.is_provider_initiate_trip;
    setting_response.providerPath = setting_detail.providerPath;
    setting_response.image_base_url = setting_detail.image_base_url;
    setting_response.is_show_estimation_in_provider_app = setting_detail.is_show_estimation_in_provider_app;
    setting_response.is_show_estimation_in_user_app = setting_detail.is_show_estimation_in_user_app;
    setting_response.is_driver_go_home = setting_detail.is_driver_go_home;
    setting_response.is_driver_go_home_change_address = setting_detail.is_driver_go_home_change_address;
    setting_response.driver_app_insta_ad_url = setting_detail.driver_app_insta_ad_url;
    setting_response.provider_ads_url = "";

    
    if(req.body.device_type == 'android') {
        setting_response.android_provider_app_google_key = setting_detail.android_provider_app_google_key;
        setting_response.android_provider_app_version_code = setting_detail.android_provider_app_version_code;
        setting_response.android_provider_app_force_update = setting_detail.android_provider_app_force_update;
		setting_response.android_places_autocomplete_key = setting_detail.android_places_autocomplete_key;
    } else {
        setting_response.ios_provider_app_google_key = setting_detail.ios_provider_app_google_key;
        setting_response.ios_provider_app_version_code = setting_detail.ios_provider_app_version_code;
        setting_response.ios_provider_app_force_update = setting_detail.ios_provider_app_force_update;
		setting_response.ios_places_autocomplete_key = setting_detail.ios_places_autocomplete_key;		
    }

    setting_response.minimum_phone_number_length = setting_detail.minimum_phone_number_length;
    setting_response.maximum_phone_number_length = setting_detail.maximum_phone_number_length;

    var provider_id = req.body.provider_id;
    if(provider_id == ''){
        provider_id = null;
    }
    Provider.findOne({_id: provider_id}).then((provider_detail)=>{
        if(provider_detail && provider_detail.token !== req.body.token){
            res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN, setting_detail: setting_response});
        } else {
            var response = {};
            if (provider_detail) {
                let country_condition = { countryname: provider_detail.country }
                if (provider_detail.country_id) {
                    country_condition = {
                        $or: [
                            { _id: provider_detail.country_id },
                            { countryname: provider_detail.country },
                        ]
                    }
                }
                let partner_ids = []
                if(provider_detail.partner_ids.length > 0){
                    provider_detail.partner_ids.forEach((partner) => {
                        partner_ids.push(partner.partner_id)
                    })
                }
                Partner.find({_id: partner_ids}).then(async (partner_detail)=>{
                    response.partner_detail = []
                    if(partner_detail.length > 0){
                        partner_detail.forEach((partner) => {
                            let partner_status_index = provider_detail.partner_ids.findIndex(x => (
                                (x.partner_id).toString() == (partner._id).toString() 
                                && x.status == 0)
                            )

                            if(partner_status_index !== -1){
                                let partner_data = {
                                        name: partner.first_name +' '+ partner.last_name,
                                        phone: partner.phone,
                                        country_phone_code: partner.country_phone_code,
                                        status: provider_detail.partner_ids[partner_status_index].status,
                                        _id: partner._id
                                    }

                                    response.partner_detail.push(partner_data)
                            }
                        })
                    }

                Country.findOne(country_condition).then(async (country) => {
                    const settings = await Settings.findOne()

                    const advertise_data = settings.advertise_urls.find(obj => obj.country_id.toString() === country._id.toString());
                    if(advertise_data){
                        setting_response.provider_ads_url = advertise_data.flety_driver_ads_url
                    }

                    response.first_name = provider_detail.first_name;
                    response.last_name = provider_detail.last_name;
                    response.email = provider_detail.email;
                    response.country_phone_code = provider_detail.country_phone_code;
                    response.is_document_uploaded = provider_detail.is_document_uploaded;
                    response.address = provider_detail.address;
                    response.address_location = provider_detail.address_location;
                    response.is_approved = provider_detail.is_approved;
                    response._id = provider_detail._id;
                    response.social_ids = provider_detail.social_ids;
                    response.social_unique_id = provider_detail.social_unique_id;
                    response.phone = provider_detail.phone;
                    response.login_by = provider_detail.login_by;
                    response.is_documents_expired = provider_detail.is_documents_expired;
                    response.account_id = provider_detail.account_id;
                    response.bank_id = provider_detail.bank_id;
                    response.city = provider_detail.city;
                    response.country = provider_detail.country;
                    response.rate = provider_detail.rate;
                    response.rate_count = provider_detail.rate_count;
                    response.token = provider_detail.token;
                    response.is_vehicle_document_uploaded = provider_detail.is_vehicle_document_uploaded;
                    response.service_type = provider_detail.service_type;
                    response.admintypeid = provider_detail.admintypeid;
                    response.is_available = provider_detail.is_available;
                    response.is_active = provider_detail.is_active;
                    response.is_go_home = provider_detail.is_go_home;
                    response.is_partner_approved_by_admin = provider_detail.is_partner_approved_by_admin;
                    response.picture = provider_detail.picture;
                    response.wallet_currency_code = provider_detail.wallet_currency_code;
                    response.is_referral = provider_detail.is_referral;
                    response.referral_code = provider_detail.referral_code;
                    response.country_detail = {"is_referral": country.is_provider_referral}

                    if (!provider_detail.is_near_trip) { provider_detail.is_near_trip = [] }
                    if (provider_detail.is_trip.length == 0 && provider_detail.is_near_trip.length != 0) {
                        provider_detail.is_trip = provider_detail.is_near_trip;
                        provider_detail.is_available = 0;
                        provider_detail.is_near_trip = []
                        await provider_detail.save();
                    }

                    var near_trip_detail = undefined;
                    var near_trip_details = undefined;
                    if (provider_detail.is_near_trip.length != 0) {
                        near_trip_detail = await Trip.findOne({ _id: provider_detail.is_near_trip[0], is_provider_accepted: 0 })
                    }

                    if (near_trip_detail) {
                        var start_time = near_trip_detail.updated_at;
                        var end_time = new Date();
                        var res_sec = utils.getTimeDifferenceInSecond(end_time, start_time);
                        var provider_timeout = setting_detail.provider_timeout;
                        var time_left_to_responds_trip = provider_timeout - res_sec;
                        var new_user_detail = await User.findOne({ _id: near_trip_detail.user_id })
                        near_trip_details = {
                            trip_id: provider_detail.is_near_trip[0],
                            user_id: near_trip_detail.user_id,
                            is_provider_accepted: near_trip_detail.is_provider_accepted,
                            is_provider_status: near_trip_detail.is_provider_status,
                            trip_type: near_trip_detail.trip_type,
                            source_address: near_trip_detail.source_address,
                            destination_address: near_trip_detail.destination_address,
                            sourceLocation: near_trip_detail.sourceLocation,
                            destinationLocation: near_trip_detail.destinationLocation,
                            is_trip_end: near_trip_detail.is_trip_end,
                            time_left_to_responds_trip: time_left_to_responds_trip,
                            user: {
                                first_name: new_user_detail.first_name,
                                last_name: new_user_detail.last_name,
                                phone: new_user_detail.phone,
                                country_phone_code: new_user_detail.country_phone_code,
                                rate: new_user_detail.rate,
                                rate_count: new_user_detail.rate_count,
                                picture: new_user_detail.picture
                            }
                        }
                    }
                    return res.json({
                        success: true, setting_detail: setting_response, phone_number_min_length: setting_detail.minimum_phone_number_length,
                        phone_number_length: setting_detail.maximum_phone_number_length,
                        provider_detail: response, trip_detail: provider_detail.is_trip, near_trip_detail: near_trip_details
                    });
                });
            });

               
            } else {
                res.json({success: true,setting_detail: setting_response})
            }
        }
    })
};



exports.get_provider_privacy_policy = function (req, res) {
    res.send(setting_detail.provider_privacy_policy)
};

exports.get_provider_terms_and_condition = function (req, res) {
    res.send(setting_detail.provider_terms_and_condition)
};



exports.apply_provider_referral_code = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'referral_code', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}, function (err, provider) {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var is_skip = req.body.is_skip;

                        if (is_skip == 0) {
                            var referral_code = req.body.referral_code;
                            Provider.findOne({referral_code: referral_code}).then((providerData) => {
                                if (!providerData) {
                                    res.json({success: false, error_code: error_message.ERROR_CODE_REFERRAL_CODE_INVALID});
                                } else if (providerData.country != provider.country) {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_YOUR_FRIEND_COUNTRY_NOT_MATCH_WITH_YOU
                                    });
                                } else {
                                    
                                        if (provider.is_referral == 1) {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_YOU_HAVE_ALREADY_APPLY_REFERRAL_CODE
                                            });
                                        } else {
                                            Country.findOne({countryphonecode: provider.country_phone_code}).then((country) => {

                                                var providerRefferalCount = providerData.total_referrals;

                                                if (providerRefferalCount < country.providerreferral) {

                                                    var total_wallet_amount = utils.addWalletHistory(constant_json.PROVIDER_UNIQUE_NUMBER, providerData.unique_id, providerData._id, null,
                                                        providerData.wallet_currency_code, providerData.wallet_currency_code,
                                                        1, country.bonus_to_providerreferral, providerData.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_REFERRAL, "Provider used your referral code, provider id : " + provider.unique_id);

                                                    providerData.total_referrals = +providerData.total_referrals + 1;
                                                    providerData.wallet = total_wallet_amount;
                                                    providerData.save().then(() => {
                                                    });

                                                    provider.is_referral = 1;
                                                    provider.referred_by = providerData._id;

                                                    total_wallet_amount = utils.addWalletHistory(constant_json.PROVIDER_UNIQUE_NUMBER, provider.unique_id, provider._id, null,
                                                        provider.wallet_currency_code, provider.wallet_currency_code,
                                                        1, country.referral_bonus_to_provider, provider.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_REFERRAL, "Using refferal code : " + referral_code + " of provider id : " + providerData.unique_id);

                                                    provider.wallet = total_wallet_amount;
                                                    provider.save().then(() => {
                                                        res.json({
                                                            success: true,
                                                            message: success_messages.MESSAGE_CODE_REFERRAL_PROCESS_SUCCESSFULLY_COMPLETED
                                                        });
                                                    });

                                                } else {

                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_REFERRAL_CODE_EXPIRED
                                                    });
                                                }

                                            });
                                        }

                                   
                                }

                            });
                        } else {
                            provider.is_referral = 1;
                            provider.save().then(() => {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_YOU_HAVE_SKIPPED_FOR_REFERRAL_PROCESS
                                });


                            });
                        }
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});

                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


exports.get_provider_referal_credit = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        var condition = { $match: { user_id: {$eq: Schema(req.body.provider_id)} } }
                        var referral_condition = {$match: {wallet_comment_id: {$eq: Number(constant_json.ADDED_BY_REFERRAL) }}}
                        var group = {
                            $group:{
                                _id: null,
                                total_referral_credit: {$sum: '$added_wallet'}
                            }
                        }

                        Wallet_history.aggregate([condition, referral_condition, group]).then((wallet_history_count)=>{
                            if(wallet_history_count.length>0){
                                res.json({success: true, total_referral_credit: wallet_history_count[0].total_referral_credit})
                            } else {
                                res.json({success: true, total_referral_credit: 0});
                            }
                        })
                    }

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.delete_provider = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then(async (provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        let password = utils.encryptPassword(req.body.password?req.body.password:'');
                        let social_index = provider.social_ids.indexOf(req.body.social_id);

                        if(social_index!==-1 || provider.password==password){

                            let provider_detail = await Provider.findOne({phone: '0000000000'});
                            if(!provider_detail){
                                provider_detail = new Provider({
                                    _id: Schema('00000000000000'),
                                    first_name: 'anonymous',
                                    last_name: 'provider',
                                    email: 'anonymousprovider@gmail.com',
                                    phone: '0000000000',
                                    country_phone_code: '',
                                })
                                await provider_detail.save();
                            }

                            await Trip_history.updateMany({confirmed_provider: provider._id}, {confirmed_provider: provider_detail._id, current_provider: provider_detail._id});
                            await Trip.updateMany({confirmed_provider: provider._id}, {confirmed_provider: provider_detail._id, current_provider: provider_detail._id});
                            await Wallet_history.updateMany({user_id: provider._id}, {user_id: provider_detail._id});
                            await Card.deleteMany({user_id: provider._id});
                            await Provider_Document.deleteMany({provider_id: provider._id});
                            await Provider_Vehicle_Document.deleteMany({provider_id: provider._id});
                            await Provider.deleteOne({_id: provider._id});

                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_DELETE_SUCCESSFULLY
                            });

                        } else {
                            res.json({
                                success: false,
                                error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
                            });
                        }

                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});

                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


exports.get_provider_rating = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then(async (provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var page;

                        if (req.body.page == undefined || req.body.page == 0)
                        {
                            page = 1;
                        } else
                        {
                            page = req.body.page;
                        }
                
                        var number_of_rec = 10;
                
                        var provider_condition = {$match: {"provider_id": Schema(req.body.provider_id)}};
                        var sort = {"$sort": {}};
                        sort["$sort"]['unique_id'] = parseInt(-1);
                              
                        var skip = {};
                        skip["$skip"] = (page-1) * number_of_rec;
                
                        var limit = {}
                        limit["$limit"] = number_of_rec;
                        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

                        Reviews.aggregate([provider_condition, count]).then((array) => { 
                            if (!array || array.length == 0)
                            {
                                array = [];
                                res.json({success: true, review_list: array, 'pages': 0});
                            } else {
                                var pages = Math.ceil(array[0].total / number_of_rec);
                                Reviews.aggregate([ provider_condition, sort, skip, limit]).allowDiskUse(true).then((array) => { 
                                    res.json({success: true, review_list: array, 'pages': pages});
                                }, (err) => {
                                    utils.error_response(err, res)
                                });
                            }
                        }, (err) => {
                            utils.error_response(err, res)
                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
                }
            })
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    })
}

exports.provider_accept_reject_partner_request = function (req, res) {
    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (!provider) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
                } else {
                    if (provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        if(req.body.is_accepted){

                            var index = provider.partner_ids.findIndex((x)=>x.partner_id==req.body.partner_id);
                            if(index != -1){
                                provider.partner_ids[index].status = Number(constant_json.PARTNER_REQUEST_ACCEPTED);
                            }
                            provider.markModified('partner_ids');
                            provider.save().then(()=>{
                                res.json({success: true, message: success_messages.MESSAGE_CODE_PARTNER_REQUEST_ACCEPT_SUCCESSFULLY});
                            })
                        } else {
                            var index = provider.partner_ids.findIndex((x)=>x.partner_id==req.body.partner_id);
                            if(index != -1){
                                provider.partner_ids.splice(index, 1);
                            }
                            provider.markModified('partner_ids');
                            provider.save().then(()=>{
                                res.json({success: true, message: success_messages.MESSAGE_CODE_PARTNER_REQUEST_REJECT_SUCCESSFULLY});
                            })
                        }
                    }
                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
}

exports.get_provider_trip_details = async function (req, res) {
    try{
        utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}, {name: 'token', type: 'string'}, {name: 'trip_id', type: 'string'}], async function (response) {
            if (response.success) {
                let user = await Provider.findOne({_id: req.body.provider_id, token: req.body.token})
                if (!user) {
                    return res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                }
                let trip = await Trip.findById(req.body.trip_id)
                if(!trip){
                    trip = await Trip_history.findById(req.body.trip_id)
                }
                if(!trip){
                    return res.json({success: false, error_code: error_message.ERROR_CODE_NO_TRIP_FOUND});
                }
                res.json({
                    success: true,
                    trip_detail: trip
                });

            }
        });
    } catch(e){
        console.log(e)
    }
}


exports.provider_start_scheduled_trip = async function(req,res){
    try {
        let provider = await Provider.findOne({_id: req.body.provider_id})
        if (!provider) {
            res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
            return;
        } 
        if (provider.token != req.body.token) {
            res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            return;
        } 
        let trip = await Trip.findOne({
            _id: req.body.trip_id,
            is_trip_cancelled: 0,
            is_trip_completed: 0,
            is_trip_end: 0,
        })

        let assigned_trips = await Trip.find({
            _id: { $ne: req.body.trip_id },
            assigned_provider_id: provider._id,
            is_provider_status: { $lt: PROVIDER_STATUS.TRIP_COMPLETED }
        }, { start_date_tag: 1 });
        const current_trip_time = new Date(trip.start_date_tag);
        let conflictingTrip = assigned_trips.some(trip => new Date(trip.start_date_tag) < current_trip_time);
        if (conflictingTrip) {
            res.json({success: false, error_code: error_message.ERROR_CODE_TRIP_ALREADY_EXISTS_BEFORE_CURRENT_TRIP})
            return;        
        }
        
        let city_detail = await City.findOne({_id: trip.city_id}).select({timezone:1, unit:1}).lean()
        if (!city_detail) {
            res.json({success: false, error_code: error_message.ERROR_CODE_CITY_TYPE_NOT_FOUND})
            return;        
        }

        let user = await User.count({ _id: trip.user_id })
        if (user == 0) {
            res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND})
            return;                              
        }    
        
        if(!trip.assigned_provider_id || trip.assigned_provider_id.toString() != provider._id.toString()){
            res.json({success: false, error_code: error_message.ERROR_CODE_YOU_ARE_NOT_ASSIGNED_TO_THIS_TRIP});
            return;
        }

        if(trip.provider_id != null || trip.current_provider != null || trip.current_providers.length != 0){
            res.json({success: false, error_code: error_message.ERROR_CODE_TRIP_IS_ALREADY_ACCEPTED});
            return;
        }
        if(provider.is_available != 1 || provider.is_trip.length != 0){
            res.json({success:false, error_code: error_message.ERROR_CODE_BUSY_DRIVER_WITH_OTHER_TRIP})
            return;        
        }
        
        trip.is_trip_cancelled = 0;
        trip.is_schedule_trip_start = false;
        trip.providers_id_that_rejected_trip = [];
        await Trip.updateOne({ _id: trip._id }, trip.getChanges())
        let city_timezone = city_detail.timezone;

        delete trip.provider_to_user_estimated_distance;
        delete trip.provider_to_user_estimated_time;

        trip.current_provider = provider._id;
        trip.provider_type = Number(constant_json.PROVIDER_TYPE_PARTNER);
        trip.unit = city_detail.unit;
        trip.is_provider_accepted = 0;
        var current_providers = [];
        current_providers.push(provider._id);
        trip.find_nearest_provider_time = new Date();
        trip.current_providers = current_providers;
        await Trip.updateOne({ _id: trip._id }, trip.getChanges())
                    
        var trips = [];
        trips.push(trip._id);
    
        var is_trip_condition = { _id: provider._id, is_trip: [] };
        let is_trip_update = { is_available: 0, is_trip: trips, is_near_available: 0, $inc: { total_request: 1 } };
        let updateCount = await Provider.updateOne(is_trip_condition, is_trip_update)
        if (updateCount.modifiedCount == 0) {
            res.json({success:false})
            return;                              
        }       

        var is_trip_condition = { _id: provider._id, is_trip: trip._id };
        let provider_detail = await Provider.findOne(is_trip_condition);
        if (!provider_detail) {
            res.json({success:false})
            return;                              
        }

        utils.send_socket_request(trip._id, provider_detail._id);
        myAnalytics.insert_daily_provider_analytics(city_timezone, provider_detail._id, TRIP_STATUS.WAITING_FOR_PROVIDER, null);
        if (trip.is_provider_accepted == 1) {
            res.json({success: false, error_code: error_message.ERROR_CODE_TRIP_IS_ALREADY_ACCEPTED})
            return;                              
        } 
        myTrips.accept_trip(provider_detail, trip, trip.provider_type_id, function (accept_trip_response) {
            res.json(accept_trip_response);
            return;                              
        });
    } catch (e) {
        console.log(e);
    }

}


exports.provider_account_deletion_info = function (req, res, next){
	res.render('provider_account_deletion_page');
} 
