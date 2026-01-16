const Trip_history = require('mongoose').model('Trip_history');
const utils = require('./utils');
const allemails = require('./emails');
const User = require('mongoose').model('User');
const Provider = require('mongoose').model('Provider');
const Promo_Code = require('mongoose').model('Promo_Code');
const Citytype = require('mongoose').model('city_type');
const User_promo_use = require('mongoose').model('User_promo_use');
const Trip = require('mongoose').model('Trip');
const Country = require('mongoose').model('Country');
const City = require('mongoose').model('City');
const CityZone = require('mongoose').model('CityZone');
const ZoneValue = require('mongoose').model('ZoneValue');
const Airport = require('mongoose').model('Airport');
const AirportCity = require('mongoose').model('Airport_to_City');
const CitytoCity = require('mongoose').model('City_to_City');
const Partner = require('mongoose').model('Partner');
const console = require('./console');
const geolib = require('geolib');
const Corporate = require('mongoose').model('Corporate');
const Wallet_history = require('mongoose').model('Wallet_history');
const mongoose = require('mongoose');
const Schema = mongoose.Types.ObjectId;
const country_list = require('../../country_list.json')
const Card = require('mongoose').model('Card');
const User_Document = require('mongoose').model('User_Document');
const Helper = require('mongoose').model('Helper');
const Provider_Document = require('mongoose').model('Provider_Document');
const tripService = require("../services/trip.service");
const axios = require("axios").default
const Settings = require('mongoose').model('Settings')
const Type = require('mongoose').model('Type');
const jwt = require('jsonwebtoken')

exports.update_password = function (req, res) {

    utils.check_request_params(req.body, [{ name: 'phone', type: 'string' },
        {name: 'password', type: 'string'}], function (response) {
        if (response.success) {
            var phone = req.body.phone;
            var country_phone_code = req.body.country_phone_code;
            var password = req.body.password;
            var query = { phone: phone }
            if (country_phone_code) {
                query = { phone: phone, country_phone_code: country_phone_code };
            }
            User.findOne(query).then((user) => {
                if (user) {
                    user.password = utils.encryptPassword(password);
                    user.save().then(() => {
                        res.json({success: true, message: success_messages.MESSAGE_CODE_PASSWORD_RESET_SUCCESSFULLY});
                    });
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_USER});
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

exports.get_otp = function (req, res) {

    utils.check_request_params(req.body, [{name: 'phone', type: 'string'}], function (response) {
        if (response.success) {
            let  phone = req.body.phone;
            let country_phone_code = req.body.country_phone_code;
            let phone_with_zero = utils.phoneWithZero(phone)
            let phone_without_zero = utils.phoneWithoutZero(phone)

            var otpForSMS = utils.generateOtp(6);
            User.findOne({phone: {$in: [phone_with_zero, phone_without_zero]}, country_phone_code: country_phone_code}).then((user) => {
                if (user) {
                    country_phone_code = country_phone_code ? country_phone_code : user.country_phone_code
                    let phoneWithCode = utils.phoneWithCode(phone_without_zero, country_phone_code)
                    utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 1, otpForSMS);
                    res.json({success: true, otpForSMS: otpForSMS});
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_USER});
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


exports.check_user_registered = async function (req, res) {

    utils.check_request_params(req.body, [{name: 'country_phone_code', type: 'string'},{name: 'phone', type: 'string'}], function (response) {
        if (response.success) {
                let phone = req.body.phone
                const country_phone_code = req.body.country_phone_code;
                let phone_with_zero = utils.phoneWithZero(phone)
                let phone_without_zero = utils.phoneWithoutZero(phone)
                let phoneWithCode = utils.phoneWithCode(phone_without_zero, country_phone_code)
                // generate otp //
                var otpForSMS = utils.generateOtp(6);
                //var otpForSMS = "111111";
                User.findOne({phone: {$in: [phone_with_zero, phone_without_zero]}, country_phone_code: country_phone_code}).then((user) => {
                    if (user) {
                        res.json({success: true, message: success_messages.MESSAGE_CODE_USER_EXIST});
                    } else {
                        var userSms = setting_detail.userSms;
                        if (userSms == true) {
                            res.json({success: true, otpForSMS: otpForSMS, userSms: userSms});
                            utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 1, otpForSMS);
                        } else {
                            res.json({success: true, userSms: userSms});
                        }
                    }
                });
            // }
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

// forgotpassword
exports.forgotpassword = function (req, res) {

    utils.check_request_params(req.body, [{name: 'email', type: 'string'},], function (response) {
        if (response.success) {
            var type = req.body.type; //1 = user  0 = Provider
            if (type == 1) {
                User.findOne({email: req.body.email}).then((user) => {
                    if (!user) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NOT_REGISTERED_OR_INVALID_EMAIL_ID});
                    } else {
                        var new_password = utils.generatePassword(6);
                        user.password = utils.encryptPassword(new_password);
                        user.save().then(() => {
                        });
                        var phoneWithCode = user.country_phone_code + user.phone;
                        utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 3, new_password);
                        allemails.userForgotPassword(req, user, new_password);
                        res.json({success: true, message: success_messages.MESSAGE_CODE_RESET_PASSWORD_SUCCESSFULLY});
                    }
                });
            } else {
                Provider.findOne({email: req.body.email}).then((provider) => {
                    if (!provider) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NOT_REGISTERED_OR_INVALID_EMAIL_ID});
                    } else {
                        var new_password = utils.generatePassword(6);
                        provider.password = utils.encryptPassword(new_password);
                        provider.save().then(() => {
                        });
                        var phoneWithCode = provider.country_phone_code + provider.phone;
                        utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 3, new_password);
                        allemails.providerForgotPassword(req, provider, new_password);
                        res.json({success: true, message: success_messages.MESSAGE_CODE_RESET_PASSWORD_SUCCESSFULLY});
                    }
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

// OTP verification
exports.verification = function (req, res) {

    utils.check_request_params(req.body, [{name: 'phone', type: 'string'},{name: 'country_phone_code', type: 'string'}], function (response) {
        if (response.success) {
            var type = req.body.type;
            var email = req.body.email;
            let phone = req.body.phone
            let phone_with_zero = utils.phoneWithZero(phone)
            let phone_without_zero = utils.phoneWithoutZero(phone)
            let phoneWithCode = utils.phoneWithCode(phone_without_zero, country_phone_code)
            // generate otp //
            var otpForSMS = utils.generateOtp(6);
            var otpForEmail = utils.generateOtp(6);
            if (type == 1) {
                User.findOne({email: req.body.email}).then((user) => {

                    if (user) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                    } else {

                        User.findOne({phone: {$in: [phone_with_zero, phone_without_zero]}}).then((user) => {
                            if (user) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                            } else {

                                var userEmailVerification = setting_detail.userEmailVerification;
                                var userSms = setting_detail.userSms;
                                if (userSms == true) {
                                    utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 1, otpForSMS);
                                }

                                if (userEmailVerification == true) {
                                    allemails.emailForOTPVerification(req, email, otpForEmail, 2);
                                }

                                res.json({success: true, otpForSMS: otpForSMS, otpForEmail: otpForEmail});

                            }

                        });
                    }

                });
            } else {
                Provider.findOne({email: req.body.email}).then((provider) => {
                    if (provider) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                    } else {

                        Provider.findOne({phone: req.body.phone}).then((provider) => {
                            if (provider) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                            } else {

                                var providerEmailVerification = setting_detail.providerEmailVerification;
                                var providerSms = setting_detail.providerSms;
                                ///////////// GENERATE OTP ///////////
                                if (providerSms == true) {
                                    utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 2, otpForSMS);
                                }
                                if (providerEmailVerification == true) {
                                    allemails.emailForOTPVerification(req, email, otpForEmail, 2);
                                }
                                res.json({success: true, otpForSMS: otpForSMS, otpForEmail: otpForEmail});

                            }

                        });
                    }

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

exports.verify_email_phone = function (req, res) {

    utils.check_request_params(req.body, [{name: 'phone', type: 'string'}], function (response) {
        if (response.success) {
            var type = req.body.type;
            if (type == 1) {
                User.findOne({email: req.body.email}).then((user) => {
                    if (user) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                    } else {
                        User.findOne({phone: req.body.phone,country_phone_code:req.body.country_phone_code}).then((user) => {
                            if (user) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                            } else {
                                res.json({success: true});
                            }
                        });
                    }
                });
            } else {
                Provider.findOne({email: req.body.email}).then((provider) => {
                    if (provider) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                    } else {
                        Provider.findOne({phone: req.body.phone,country_phone_code:req.body.country_phone_code}).then((provider) => {
                            if (provider) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                            } else {
                                res.json({success: true});
                            }
                        });
                    }

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

// user_register_new //
exports.user_register = function (req, res) {

    utils.check_request_params(req.body, [{name: 'first_name', type: 'string'},{name: 'last_name', type: 'string'},{name: 'email', type: 'string'},
        {name: 'phone', type: 'string'},{name: 'country_phone_code', type: 'string'}], function (response) {
        if (response.success) {
            var social_id = req.body.social_unique_id;
            var social_id_array = [];
            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            } else {
                social_id_array.push(social_id);
            }

            var gender = req.body.gender;
            if (gender != undefined) {
                gender = ((gender).trim()).toLowerCase();
            }

            var first_name = req.body.first_name;
            var last_name = req.body.last_name;
            var email = req.body.email;

            if (email == undefined || email == null || email == "") {
                email = null;
            } else {
                email = ((req.body.email).trim()).toLowerCase();
            }
            var referral_code = (utils.tokenGenerator(8)).toUpperCase();
            let phone = req.body.phone
            let phone_with_zero = utils.phoneWithZero(phone)
            let phone_without_zero = utils.phoneWithoutZero(phone)

            var token = utils.tokenGenerator(32);
            User.findOne({email: email}).then((user_email) => {
                User.findOne({phone: {$in: [phone_with_zero, phone_without_zero]}, country_phone_code: req.body.country_phone_code}).then((user_phone) => {

                    if (!user_email && !user_phone) {
                        if (email == null) {
                            email = "";
                        }

                        if (first_name.length > 0) {
                            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                        } else {
                            first_name = "";
                        }

                        if (last_name.length > 0) {
                            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                        } else {
                            last_name = "";
                        }

                        var user = new User({
                            first_name: first_name,
                            last_name: last_name,
                            email: email,
                            country_phone_code: req.body.country_phone_code,
                            phone: phone_without_zero,
                            gender: gender,
                            device_token: req.body.device_token,
                            device_type: req.body.device_type,
                            address: req.body.address,
                            social_ids: social_id_array,
                            social_unique_id: req.body.social_unique_id,
                            login_by: req.body.login_by,
                            device_timezone: req.body.device_timezone,
                            city: req.body.city,
                            token: token,
                            country: req.body.country,
                            referral_code: referral_code,
                            user_type: Number(constant_json.USER_TYPE_NORMAL),
                            app_version: req.body.app_version
                        });

                        // FOR PASSWORD
                        if (social_id == null) {
                            user.password = utils.encryptPassword(req.body.password);
                        }

                        // FOR PROFILE IMAGE 
                        if (req.files != undefined && req.files.length > 0) {
                            var image_name = user._id + utils.tokenGenerator(4);
                            var url = utils.getImageFolderPath(req, 1) + image_name + '.jpg';
                            user.picture = url;
                            utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 1);

                        }


                        var country_phone_code = user.country_phone_code;
                        Country.findOne({countryphonecode: country_phone_code}).then((country) => {
                            if (country) {
                                user.wallet_currency_code = country.currencycode;
                                user.country = country.countryname;
                                user.save().then(() => {
                                    if (user?.email) {
                                        allemails.sendUserRegisterEmail(user.email, user.country);
                                    }
                                    // FOR ADD DOCUEMNTS
                                    utils.insert_documets_for_new_users(user, Number(constant_json.USER_TYPE_NORMAL), country._id, function(document_response){
                                        var response = {};
                                        response.first_name = user.first_name;
                                        response.last_name = user.last_name;
                                        response.email = user.email;
                                        response.country_phone_code = user.country_phone_code;
                                        response.is_document_uploaded = user.is_document_uploaded;
                                        response.address = user.address;
                                        response.is_approved = user.is_approved;
                                        response.user_id = user._id;
                                        response.social_ids = user.social_ids;
                                        response.social_unique_id = user.social_unique_id;
                                        response.login_by = user.login_by;
                                        response.city = user.city;
                                        response.country = user.country;
                                        response.referral_code = user.referral_code;
                                        response.rate = user.rate;
                                        response.rate_count = user.rate_count;
                                        response.is_referral = user.is_referral;
                                        response.token = user.token;
                                        response.phone = user.phone;
                                        response.wallet_currency_code = user.wallet_currency_code;

                                        response.country_detail = {"is_referral": country.is_referral, country_code: country.alpha2}
                                        res.json({
                                            success: true,
                                            message: success_messages.MESSAGE_CODE_USER_REGISTERED_SUCCESSFULLY,
                                            user_detail: response
                                        });
                                    });
                                });

                            } else {

                                let i = country_list.findIndex(i => i.code == country_phone_code);
                                if (i != -1) {
                                    user.wallet_currency_code = country_list[0].currency_code;
                                } else {
                                    user.wallet_currency_code = "";
                                }
                                user.is_document_uploaded = 1;
                                user.save().then(() => {
                                    if (user?.email) {
                                        allemails.sendUserRegisterEmail(user.email, user.country);
                                    }

                                    var response = {};
                                        response.first_name = user.first_name;
                                        response.last_name = user.last_name;
                                        response.email = user.email;
                                        response.country_phone_code = user.country_phone_code;
                                        response.is_document_uploaded = user.is_document_uploaded;
                                        response.address = user.address;
                                        response.is_approved = user.is_approved;
                                        response.user_id = user._id;
                                        response.social_ids = user.social_ids;
                                        response.social_unique_id = user.social_unique_id;
                                        response.login_by = user.login_by;
                                        response.city = user.city;
                                        response.country = user.country;
                                        response.referral_code = user.referral_code;
                                        response.rate = user.rate;
                                        response.rate_count = user.rate_count;
                                        response.is_referral = user.is_referral;
                                        response.token = user.token;
                                        response.country_detail = {"is_referral": false, alpha2: ""};
                                        response.phone = user.phone;
                                        response.picture = user.picture;
                                        response.wallet_currency_code = user.wallet_currency_code;
                                        res.json({
                                            success: true,
                                            message: success_messages.MESSAGE_CODE_USER_REGISTERED_SUCCESSFULLY,
                                            user_detail: response
                                        });
                                });
                            }
                        });
                    } else {

                        if (social_id == null) {
                            if (user_phone) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                            } else {
                                res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                            }
                        } else {

                            if (user_email && user_email.phone == req.body.phone) {
                                user_email.social_ids.push(social_id);
                                user_email.save().then(() => {
                                });
                                var response = {};
                                response.first_name = user_email.first_name;
                                response.last_name = user_email.last_name;
                                response.email = user_email.email;
                                response.country_phone_code = user_email.country_phone_code;
                                response.is_document_uploaded = user_email.is_document_uploaded;
                                response.address = user_email.address;
                                response.is_approved = user_email.is_approved;
                                response.user_id = user_email._id;
                                response.social_ids = user_email.social_ids;
                                response.social_unique_id = user_email.social_unique_id;
                                response.login_by = user_email.login_by;
                                response.city = user_email.city;
                                response.country = user_email.country;
                                response.referral_code = user_email.referral_code;
                                response.rate = user_email.rate;
                                response.rate_count = user_email.rate_count;
                                response.is_referral = user_email.is_referral;
                                response.token = user_email.token;
                                response.country_detail = {"is_referral": false}
                                response.phone = user_email.phone;
                                response.picture = user_email.picture;
                                response.wallet_currency_code = user_email.wallet_currency_code;
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_USER_REGISTERED_SUCCESSFULLY,
                                    user_detail: response
                                });
                            } else if (user_phone && (user_phone.email == email || user_phone.email == "")) {
                                user_phone.social_ids.push(social_id);
                                user_phone.email = email;
                                user_phone.save().then(() => {
                                });
                                var response = {};
                                response.first_name = user_phone.first_name;
                                response.last_name = user_phone.last_name;
                                response.email = user_phone.email;
                                response.country_phone_code = user_phone.country_phone_code;
                                response.is_document_uploaded = user_phone.is_document_uploaded;
                                response.address = user_phone.address;
                                response.is_approved = user_phone.is_approved;
                                response.user_id = user_phone._id;
                                response.social_ids = user_phone.social_ids;
                                response.social_unique_id = user_phone.social_unique_id;
                                response.login_by = user_phone.login_by;
                                response.city = user_phone.city;
                                response.country = user_phone.country;
                                response.referral_code = user_phone.referral_code;
                                response.rate = user_phone.rate;
                                response.rate_count = user_phone.rate_count;
                                response.is_referral = user_phone.is_referral;
                                response.token = user_phone.token;
                                response.country_detail = {"is_referral": false}
                                response.phone = user_phone.phone;
                                response.wallet_currency_code = user_phone.wallet_currency_code;
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_USER_REGISTERED_SUCCESSFULLY,
                                    user_detail: response
                                });
                            } else {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED_WITH_SOCIAL
                                });
                            }
                        }
                    }
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


exports.user_login = async function (req, res) {

    utils.check_request_params(req.body, [{name: 'email', type: 'string'},{name: 'password', type: 'string'}], async function (response) {
        if (response.success) {
            var email = req.body.email;
            if (email != undefined) {
                email = ((req.body.email).trim()).toLowerCase();
            }

            var social_id = req.body.social_unique_id;

            var encrypted_password = req.body.password;
            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = "";
            }
            if (encrypted_password == undefined || encrypted_password == null || encrypted_password == "") {
                encrypted_password = "";
            } else {
                encrypted_password = utils.encryptPassword(encrypted_password);
            }

            let phone_with_zero = utils.phoneWithZero(email)
            let phone_without_zero = utils.phoneWithoutZero(email)

            var query = {$or: [{'phone': phone_with_zero, 'country_phone_code': req.body.country_phone_code},{'phone': phone_without_zero, 'country_phone_code': req.body.country_phone_code}, {social_ids: {$all: [social_id]}}]};

            User.findOne(query).then(async (user_detail) => {
                if (social_id == undefined || social_id == null || social_id == "") {
                    social_id = null;
                }
                if ((social_id == null && email == "")) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_USER});
                } else if (user_detail) {

                    if (social_id == null && encrypted_password != "" && encrypted_password != user_detail.password) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_PASSWORD});
                    } else if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_YOU_ARE_NOT_REGISTERED_WITH_THIS_SOCIAL});
                    } else {
                        if (user_detail.device_token != "" && user_detail.device_token != req.body.device_token) {
                            utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user_detail.device_type, user_detail.device_token, push_messages.PUSH_CODE_FOR_USER_LOGIN_IN_OTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                        }
                        user_detail.device_token = req.body.device_token;
                        user_detail.device_type = req.body.device_type;
                        user_detail.login_by = req.body.login_by;
                        user_detail.app_version = req.body.app_version;
                        user_detail.user_type = Number(constant_json.USER_TYPE_NORMAL);
                        user_detail.token = utils.tokenGenerator(32);

                        user_detail.save(async function(){

                            var response = {};
                            response.first_name = user_detail.first_name;
                            response.last_name = user_detail.last_name;
                            response.email = user_detail.email;
                            response.country_phone_code = user_detail.country_phone_code;
                            response.is_document_uploaded = user_detail.is_document_uploaded;
                            response.address = user_detail.address;
                            response.is_approved = user_detail.is_approved;
                            response.user_id = user_detail._id;
                            response.social_ids = user_detail.social_ids;
                            response.social_unique_id = user_detail.social_unique_id;
                            response.login_by = user_detail.login_by;
                            response.city = user_detail.city;
                            response.country = user_detail.country;
                            response.referral_code = user_detail.referral_code;
                            response.rate = user_detail.rate;
                            response.rate_count = user_detail.rate_count;
                            response.is_referral = user_detail.is_referral;
                            response.token = user_detail.token;
                            response.phone = user_detail.phone;
                            response.picture = user_detail.picture;
                            response.wallet_currency_code = user_detail.wallet_currency_code;

                            var corporate_id = null;
                            if(user_detail.corporate_ids && user_detail.corporate_ids.length>0){
                                corporate_id = user_detail.corporate_ids[0].corporate_id;
                            }

                            Corporate.findOne({_id: corporate_id}).then(async (corporate_detail)=>{

                                if(corporate_detail){
                                    response.corporate_detail = {
                                        name: corporate_detail.name,
                                        phone: corporate_detail.phone,
                                        country_phone_code: corporate_detail.country_phone_code,
                                        status: user_detail.corporate_ids[0].status,
                                        _id: corporate_detail._id
                                    }
                                }

                                Country.findOne({countryphonecode: user_detail.country_phone_code}).then(async (country) => {
                                    if (country) {
                                        response.country_detail = {"is_referral": country.is_referral, country_code: country.alpha2}
                                    } else {
                                        response.country_detail = {"is_referral": false, alpha2: ""}
                                    }

                                    let pipeline = [
                                        {$match: {'split_payment_users.user_id': user_detail._id}},
                                        {$match: {'is_trip_cancelled': 0}},
                                        {
                                            $project: {
                                                trip_id: '$_id',
                                                is_trip_end: 1,
                                                currency: 1,
                                                user_id: 1,
                                                split_payment_users:  {
                                                    $filter: {
                                                        input: "$split_payment_users",
                                                        as: "item",
                                                        cond: {$eq: ["$$item.user_id", user_detail._id]}
                                                    }
                                                }
                                            }
                                        },
                                        {$unwind: "$split_payment_users"},
                                        {$match: {
                                            $or: [
                                                {'split_payment_users.status': SPLIT_PAYMENT.WAITING},
                                                {
                                                    $and: [
                                                        {'split_payment_users.status': SPLIT_PAYMENT.ACCEPTED},
                                                        {'split_payment_users.payment_status': {$ne: PAYMENT_STATUS.COMPLETED}},
                                                        {'is_trip_end': 1}
                                                    ]
                                                },
                                                {
                                                    $and: [
                                                        {'split_payment_users.status': SPLIT_PAYMENT.ACCEPTED},
                                                        {'split_payment_users.payment_status': {$ne: PAYMENT_STATUS.COMPLETED}},
                                                        {'split_payment_users.payment_mode': null}
                                                    ]
                                                }
                                            ]
                                        }},
                                        {
                                            $lookup:
                                                    {
                                                        from: "users",
                                                        localField: "user_id",
                                                        foreignField: "_id",
                                                        as: "user_detail"
                                                    }
                                        },
                                        {$unwind: "$user_detail"},
                                        {
                                            $project: {
                                                trip_id: 1,
                                                first_name: '$user_detail.first_name',
                                                last_name: '$user_detail.last_name',
                                                phone: '$user_detail.phone',
                                                country_phone_code: '$user_detail.country_phone_code',
                                                user_id: '$user_detail._id',
                                                is_trip_end: 1,
                                                currency: 1,
                                                status: '$split_payment_users.status',
                                                payment_mode: '$split_payment_users.payment_mode',
                                                payment_status: '$split_payment_users.payment_status',
                                                payment_intent_id: '$split_payment_users.payment_intent_id',
                                                total: '$split_payment_users.total',
                                            }
                                        },
                                    ]
                                    let split_payment_request = await Trip.aggregate(pipeline);
                                    if(split_payment_request.length==0){
                                        split_payment_request = await Trip_history.aggregate(pipeline);
                                    }
                                    const trip_search_query = { is_provider_status:{$gt: 1}, user_id: user_detail._id, is_trip_cancelled: 0, is_trip_completed: 0, is_trip_end:0};
                                    let running_trips = await Trip.find(trip_search_query).select({_id:1}).lean()
                                    running_trips = running_trips.map((trip) => trip._id);

                                    // if(user_detail.current_trip_id){
                                    //     Trip.findOne({_id: user_detail.current_trip_id}).then((trip_detail)=>{
                                    //         Trip_history.findOne({_id: user_detail.current_trip_id}).then((trip_history_detail)=>{
                                    //             if(!trip_detail){
                                    //                 trip_detail = trip_history_detail;
                                    //             }
                                    //             response.trip_id = user_detail.current_trip_id;
                                    //             response.provider_id = trip_detail.current_provider;
                                    //             response.is_provider_accepted = trip_detail.is_provider_accepted;
                                    //             response.is_provider_status = trip_detail.is_provider_status;
                                    //             response.is_trip_end = trip_detail.is_trip_end;
                                    //             response.is_trip_completed = trip_detail.is_trip_completed;
                                    //             response.is_user_invoice_show = trip_detail.is_user_invoice_show;
                                    //             res.json({success: true, split_payment_request: split_payment_request[0], user_detail: response});  
                                    //         }); 
                                    //     });
                                    // } else {
                                        res.json({success: true, split_payment_request: split_payment_request[0], user_detail: response, running_trips: running_trips});
                                    // }
                                });
                            });
                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_USER});
                }
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


////////// GET  USER DETAIL ///////
exports.get_user_detail = function (req, res) {
    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, function (err, user) {
                if (err && !user) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_GET_YOUR_DETAIL});
                } else {
                    Country.findOne({countryphonecode: user.country_phone_code}, {"is_referral": 1}).then((country) => {
                        var country_detail = {"is_referral": false};
                        if (country) {
                            country_detail = {"is_referral": country.is_referral};
                        }

                        res.json({success: true, message: success_messages.MESSAGE_CODE_GET_YOUR_DETAIL,

                                user_id: user._id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                country_phone_code: user.country_phone_code,
                                phone: user.phone,
                                email: user.email,
                                wallet: user.wallet,
                                wallet_currency_code: user.wallet_currency_code,
                                picture: user.picture,
                                bio: user.bio,
                                address: user.address,
                                city: user.city,
                                country: user.country,
                                zipcode: user.zipcode,
                                login_by: user.login_by,
                                gender: user.gender,
                                social_unique_id: user.social_unique_id,
                                social_ids: user.social_ids,
                                device_token: user.device_token,
                                device_type: user.device_type,
                                device_timezone: user.device_timezone,
                                referral_code: user.referral_code,
                                token: user.token,
                                is_approved: user.is_approved,
                                app_version: user.app_version,
                                is_referral: user.is_referral,
                                is_document_uploaded: user.is_document_uploaded,
                                country_detail: country_detail,
                                rate: user.rate,
                                rate_count: user.rate_count
                        });
                    });

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


exports.user_update = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'phone', type: 'string'},
        {name: 'first_name', type: 'string'},{name: 'last_name', type: 'string'},{name: 'country_phone_code', type: 'string'}], function (response) {
        if (response.success) {
            var user_id = req.body.user_id;
            var old_password = req.body.old_password;
            var social_id = req.body.social_unique_id;
            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            }
            if (old_password == undefined || old_password == null || old_password == "") {
                old_password = "";
            } else {
                old_password = utils.encryptPassword(old_password);
            }
            User.findOne({_id: user_id}).then((user) => {
                if (user) {
                 /*
                    if (req.body.token !== null && user.token !== req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else if (social_id == null && old_password != "" && old_password != user.password) {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
                        });

                    } else */if (social_id != null && user.social_ids.indexOf(social_id) < 0) {
                        res.json({success: false, error_code: 111});
                    } else {
                        Country.findOne({_id: user.country_id}).then(() => {
                            var new_email = req.body.email;
                            var new_phone = req.body.phone;

                            if (req.body.new_password != "") {
                                var new_password = utils.encryptPassword(req.body.new_password);
                                req.body.password = new_password;
                            }
                            if(!new_email){
                                new_email = null;
                            }

                            req.body.social_ids = user.social_ids;

                            User.findOne({_id: {'$ne': user_id}, email: new_email}).then((user_details) => {


                                if (user_details) {

                                    res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});

                                } else {
                                    User.findOne({_id: {'$ne': user_id}, country_phone_code: req.body.country_phone_code,  phone: new_phone}).then((user_phone_details) => {

                                        if (user_phone_details) {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED
                                            });
                                        } else {
                                            var social_id_array = [];
                                            if (social_id != null) {
                                                social_id_array.push(social_id);
                                            }
                                           // var user_update_query = {$or: [{'password': old_password}  ]};
                                            user_update_query = {$and: [{'_id': user_id}, user_update_query]};
                                            var user_update_query = {_id: user_id};
                                            User.findOneAndUpdate(user_update_query, req.body, {new: true}).then(async (user) => {
                                                if (user) {
                                                    if (req.files != undefined && req.files.length > 0) {
                                                        utils.deleteImageFromFolder(user.picture, 1);
                                                        var image_name = user._id + utils.tokenGenerator(4);
                                                        var url = utils.getImageFolderPath(req, 1) + image_name + '.jpg';
                                                        user.picture = url;
                                                        utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 1);
                                                    }

                                                    var first_name = (req.body.first_name).trim();
                                                    if (first_name != "" && first_name != undefined && first_name != null) {
                                                        first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                                                    } else {
                                                        first_name = "";
                                                    }
                                                    var last_name = (req.body.last_name).trim();
                                                    if (last_name != "" && last_name != undefined && last_name != null) {
                                                        last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                                                    } else {
                                                        last_name = "";
                                                    }
                                                    user.first_name = first_name;
                                                    user.last_name = last_name;
                                                    user.email = req.body.email;
                                                    user.country_phone_code = req.body.country_phone_code;
                                                    user.phone = req.body.phone;
                                                    user.bio = req.body.bio;
                                                    user.gender = req.body.gender;
                                                    user.address = req.body.address;
                                                    user.zipcode = req.body.zipcode;
                                                    user.city = req.body.city;
                                                    await user.save()

                                                    var response = {};
                                                    response.first_name = user.first_name;
                                                    response.last_name = user.last_name;
                                                    response.email = user.email;
                                                    response.country_phone_code = user.country_phone_code;
                                                    response.is_document_uploaded = user.is_document_uploaded;
                                                    response.address = user.address;
                                                    response.is_approved = user.is_approved;
                                                    response.user_id = user._id;
                                                    response.social_ids = user.social_ids;
                                                    response.social_unique_id = user.social_unique_id;
                                                    response.login_by = user.login_by;
                                                    response.city = user.city;
                                                    response.country = user.country;
                                                    response.referral_code = user.referral_code;
                                                    response.rate = user.rate;
                                                    response.rate_count = user.rate_count;
                                                    response.is_referral = user.is_referral;
                                                    response.token = user.token;
                                                    response.country_detail = {"is_referral": false}
                                                    response.phone = user.phone;
                                                    response.picture = user.picture;
                                                    response.wallet_currency_code = user.wallet_currency_code;

                                                    res.json({
                                                        success: true,
                                                        message: success_messages.MESSAGE_CODE_YOUR_PROFILE_UPDATED_SUCCESSFULLY,
                                                        user_detail: response
                                                    });

                                                } else {
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND
                                                    });

                                                }

                                            });
                                        }
                                    });
                                }

                            });

                        });
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

//// LOGOUT USER  SERVICE /////
exports.logout = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, function (err, user) {
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        user.device_token = "";
                        user.save().then(() => {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_LOGOUT_SUCCESSFULLY
                            });

                        });
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

///////////////////////////////// UPDATE DEVICE TOKEN //////////////////////
exports.update_device_token = function (req, res) {
    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {
                    if (user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        user.device_token = req.body.device_token;
                        user.save().then(() => {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_YOUR_DEVICE_TOKEN_UPDATE_SUCCESSFULLY
                            });
                        });
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


//////////////APPLY REFERAL CODE-//
exports.apply_referral_code = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'referral_code', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, function (err, user) {
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var referral_code = req.body.referral_code;
                        User.findOne({referral_code: referral_code}).then((userData) => {
                            if (!userData) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_REFERRAL_CODE_INVALID});
                            } else if (userData.country != user.country) {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_YOUR_FRIEND_COUNTRY_NOT_MATCH_WITH_YOU
                                });
                            } else {
                                var is_skip = req.body.is_skip;

                                if (is_skip == 0) {
                                    if (user.is_referral == 1) {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_YOU_HAVE_ALREADY_APPLY_REFERRAL_CODE
                                        });
                                    } else {
                                        Country.findOne({countryname: user.country}).then((country) => {

                                            var userRefferalCount = userData.total_referrals;

                                            if (userRefferalCount < country.userreferral) {

                                                var total_wallet_amount = utils.addWalletHistory(constant_json.USER_UNIQUE_NUMBER, userData.unique_id, userData._id, null,
                                                    userData.wallet_currency_code, userData.wallet_currency_code,
                                                    1, country.bonus_to_userreferral, userData.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_REFERRAL, "User used your referral code, User id : " + user.unique_id);

                                                userData.total_referrals = +userData.total_referrals + 1;
                                                userData.wallet = total_wallet_amount;
                                                userData.save().then(() => {
                                                });

                                                user.is_referral = 1;
                                                user.referred_by = userData._id;

                                                total_wallet_amount = utils.addWalletHistory(constant_json.USER_UNIQUE_NUMBER, user.unique_id, user._id, null,
                                                    user.wallet_currency_code, user.wallet_currency_code,
                                                    1, country.referral_bonus_to_user, user.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_REFERRAL, "Using refferal code : " + referral_code + " of User id : " + userData.unique_id);

                                                user.wallet = total_wallet_amount;
                                                user.save().then(() => {
                                                    res.json({
                                                        success: true,
                                                        message: success_messages.MESSAGE_CODE_REFERRAL_PROCESS_SUCCESSFULLY_COMPLETED,
                                                        user_id: user._id,
                                                        is_referral: user.is_referral,
                                                        first_name: user.first_name,
                                                        last_name: user.last_name,
                                                        country_phone_code: user.country_phone_code,
                                                        phone: user.phone,
                                                        email: user.email,
                                                        picture: user.picture,
                                                        bio: user.bio,
                                                        address: user.address,
                                                        city: user.city,
                                                        country: user.country,
                                                        zipcode: user.zipcode,
                                                        login_by: user.login_by,
                                                        social_unique_id: user.social_unique_id,
                                                        device_token: user.device_token,
                                                        device_type: user.device_type,
                                                        referral_code: user.referral_code,
                                                        device_timezone: user.device_timezone
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

                                } else {
                                    user.is_referral = 1;
                                    user.save().then(() => {
                                        res.json({
                                            success: true,
                                            message: success_messages.MESSAGE_CODE_YOU_HAVE_SKIPPED_FOR_REFERRAL_PROCESS,
                                            user_id: user._id,
                                            is_referral: user.is_referral,
                                            first_name: user.first_name,
                                            last_name: user.last_name,
                                            country_phone_code: user.country_phone_code,
                                            phone: user.phone,
                                            email: user.email,
                                            picture: user.picture,
                                            bio: user.bio,
                                            address: user.address,
                                            city: user.city,
                                            country: user.country,
                                            zipcode: user.zipcode,
                                            login_by: user.login_by,
                                            social_unique_id: user.social_unique_id,
                                            device_token: user.device_token,
                                            device_type: user.device_type,
                                            referral_code: user.referral_code,
                                            device_timezone: user.device_timezone
                                        });


                                    });
                                }
                            }

                        });
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

async function get_trip_distance(origin, destination, stops = null, optimize) { //TODO: ORDER STOPS BEFORE CALLING THIS FUNCTION

    const settings = await Settings.findOne({})
    const URL_API_GOOGLE_DIRECTIONS = `https://maps.googleapis.com/maps/api/directions/json?key=${settings.backend_google_key}&origin=${origin.location[0]},${origin.location[1]}&destination=${destination.location[0]},${destination.location[1]}`
    let steps = "";
    let op = false;

    if (optimize === "true" || optimize === true){
        op = true;
    }


    if (destination) {
        stops.push({
            address: destination.address,
            location: destination.location
        })
    }
    if (op) {
        const accessToken = await getAccessToken();  
        const deliveries = stops.map((stop, index) => ({
            deliveries: {
                label: String(index),
                arrivalLocation: {
                latitude: Number(stop.location[0]),
                longitude: Number(stop.location[1])
            }}
        }));
        const requestBody = {
            model: {
                shipments: deliveries,
                vehicles: [
                    {
                        label: 'Vehiculo_1',
                        costPerHour: 1.0,
                        startLocation: {
                            latitude: +origin.location[0],
                            longitude: +origin.location[1]
                        }
                    }
                ],
            }
        };
    
        const routeResult = await callRoutesPreferred(accessToken, requestBody);
        const route = routeResult.routes[0];

        const reorder = route.visits;
        const kmTotal = route.metrics;
        const transitions = route.transitions;
        const distances = transitions
        .filter(transition => transition.travelDistanceMeters !== undefined)
        .map(transition => transition.travelDistanceMeters);
    

        const distanciaAproximada = (kmTotal.travelDistanceMeters).toFixed(2);
        let new_order = []
        const order = [];
        for(let i = 0; i < reorder.length; i++){
            new_order.push(stops[reorder[i].visitLabel]);
            order.push(Number(reorder[i].visitLabel));
        }
        new_order = new_order.map((stop, index) => {
            return {
                ...stop,
                distance: {
                    value: distances[index] || 0
                }
            };
        });
        
        return [distanciaAproximada,order, new_order];

    } else {
        if (stops != null && stops != "undefined" && stops.length > 0) {
            steps = stops.map(stop => `|${stop.location[0]},${stop.location[1]}|`).join('');
        }
    
        const waypoints = steps;
    
        const url = `${URL_API_GOOGLE_DIRECTIONS}${steps? `&waypoints=${waypoints}` : ""}`
 
        const response = await axios.get(url);
        const data = response.data

        const distance = data.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
        const reorder = data.routes[0].waypoint_order;
        const legs = data.routes[0].legs;
        
        return [distance,reorder, legs];
    }

}

exports.get_trip_distance = get_trip_distance;

async function count_stops_types({legs, optimized}) {
    const settings = await Settings.findOne({})
    threshold = settings.stop_threshold * 1000;
    let stops_types = {
        "inside": 0,
        "outside": 0
    };

    const last_leg = legs[legs.length - 1];
    let shiftRemove = last_leg?.distance?.value != undefined  ? 2 : 1;
    shiftRemove = optimized ? 0 : shiftRemove;
    
    const stops_legs = legs.slice(0, legs.length - shiftRemove);
    stops_types = stops_legs.reduce((acc, leg) => {
        if (leg.distance.value === 0) return acc;
        if (leg.distance.value >= threshold) {
            acc.outside += 1;
        } else {
            acc.inside += 1;
        }
        return acc;
    }, stops_types);

    return stops_types;
}

exports.count_stops_types = count_stops_types;

function get_stops (body) {
    let stops = [];
    if (!('stops_address' in body) || !body.stops_address.length) return stops;

    const destination_latitude = Number(body.destination_latitude);
    const destination_longitude = Number(body.destination_longitude);
    const last_stop = body.stops_address[body.stops_address.length - 1];
    stops = body.stops_address;

    if (Number(last_stop.location[0]) === destination_latitude &&
        Number(last_stop.location[1]) === destination_longitude) {
        stops = body.stops_address.slice(0, body.stops_address.length - 1)
    }

    return stops
}

exports.get_stops = get_stops;

async function fare_estimation(
    body,
  	price_index,
    city_type = null,
    typename = '',
    model_name = '',
    service_name = ''
) {

    let final_city_type = null;

    if (city_type) {

        final_city_type = city_type

    } else {
        let init_city_type = await Citytype.findOne({typename: typename});

        let model_type = await ModelType.findOne({model_name: model_name});
        let service_type = await ServiceType.findOne({service_name: service_name});
        let model_service_condition = {
            _id: {$in: city_type_init.model_pricing_ids},
            modelid : {_id : model_type._id},
            serviceid : {_id: service_type._id}
        }

        final_city_type = await Citytype.findOne(model_service_condition);

        body.service_type_id = String(init_city_type._id);
        body.selected_model_id = String(model_type._id);
        body.selected_service_id = String(service_type._id);
    }

    let price_km = final_city_type[`price_per_km_${price_index}`]


	let stops = get_stops(body);

	const origin = {
		address: "Origin",
		location:[
			body.pickup_latitude,
			body.pickup_longitude
		]
	};
	const destination = {
		address: "Destination",
		location:[
			body.destination_latitude,
			body.destination_longitude
		]
	};

	let data = await get_trip_distance(origin, destination, stops);
    let distance = data[0]
    const legs = data[2];
	let stops_types_count = await count_stops_types({legs});

	let estimated_fare = distance * price_km +
		(final_city_type.cost_per_stop_inside_city * stops_types_count.inside) +
		(final_city_type.cost_per_stop_outside_city * stops_types_count.outside) +
		(final_city_type.cost_per_helper * body.number_of_helpers_load) +
		(final_city_type.cost_per_helper * body.number_of_helpers_download);
	return estimated_fare;
}

exports.fare_estimation = fare_estimation;

/// Function for an api that returns the order of the points for the frontend
exports.optimizedOrder = async function(req,res){
    const settings = await Settings.findOne({})
    let steps = "";
    let data = null;
    let response = null;
    let origin = {
        address: "Origin", location: [
            req.body.pickup_latitude,
            req.body.pickup_longitude
        ]
    };

    let destination = {
            address: "Destination", location: [
                req.body.destination_latitude,
                req.body.destination_longitude
            ]
        };

    let stops = [];
    stops = req.body.stops_address;
    for(let i = 0; i < stops.length; i++) {
            steps += `|${stops[i].location[0]},${stops[i].location[1]}|`;
        };
    response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.location[0]},${origin.location[1]}&destination=${destination.location[0]},${destination.location[1]}&waypoints=optimize:true${steps}&key=${settings.backend_google_key}`
    );

    data = response?.data;
    reorder = data?.routes[0]?.waypoint_order;
    let new_order = []
    for(let i = 0; i < reorder?.length; i++){
        new_order.push(stops[reorder[i]]);
    }
    res.json({
        success: true,
        order: reorder,
        optimized_stops: new_order,
    });
}

async function getAccessToken() {
    const settings = await Settings.findOne({})

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const claims = {
        iss: settings.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        iat: iat,
        exp: exp
    };

    const token = jwt.sign(claims, settings.private_key, {
        algorithm: 'RS256'
    });

    const postData = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
    }).toString();

    const response = await axios.post('https://oauth2.googleapis.com/token', postData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })

    if (response.data.access_token) {
        return response.data.access_token;
    } else {
        return new Error(`No se obtuvo el token de acceso: ${response.data.error_description || response.data.error}`)
    }
}

async function callRoutesPreferred(accessToken, requestBody) {    
    const settings = await Settings.findOne({})
    const url = `https://routeoptimization.googleapis.com/v1/projects/${settings.firebase_projectId}:optimizeTours`;

    try {
        const response = await axios.post(url, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-Goog-Api-Key': settings.backend_google_key,
            },
            params: {
                alt: 'json'
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`Error en la API Routes Preferred (${error.response.status}): ${error.response.data.error?.message || JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            throw new Error(`No se recibió respuesta del servidor: ${error.message}`);
        } else {
            throw new Error(`Error al configurar la solicitud: ${error.message}`);
        }
    }
}

exports.newOptimizedOrder = async function(req, res) {
    const accessToken = await getAccessToken();

    const stops = req.body.stops_address;

    const deliveries = stops.map((stop, index) => ({
        deliveries: {
            label: String(index),
            arrivalLocation: {
            latitude: Number(stop.location[0]),
            longitude: Number(stop.location[1])
        }}
    }));

    const requestBody = {
        model: {
            shipments: deliveries,
            vehicles: [
                {
                    label: 'Vehiculo_1',
                    costPerHour: 1.0,
                    startLocation: {
                        latitude: +req.body.pickup_latitude,
                        longitude: +req.body.pickup_longitude
                    }
                }
            ],
        }
    };

    const routeResult = await callRoutesPreferred(accessToken, requestBody);
  

    const reorder = routeResult.routes[0].visits;
    const kmTotal = routeResult.routes[0].metrics;
    const distanciaAproximada = (kmTotal.travelDistanceMeters / 1000).toFixed(2);
    
    const new_order = []
    const order = [];
    for(let i = 0; i < reorder.length; i++){
        new_order.push(stops[reorder[i].visitLabel]);
        order.push(Number(reorder[i].visitLabel));
    }

    res.json({
        success: true,
        order,
        optimized_stops: new_order,
        approximate_distance: `${distanciaAproximada} km`
    });
}

exports.aproxdistance = async function (req, res){
        //Calculating aproximated distance
        let origin = {
            address: "Origin", location: [
                req.body.pickup_latitude,
                req.body.pickup_longitude
            ]
        };

        let destination = {
                address: "Destination", location: [
                    req.body.destination_latitude,
                    req.body.destination_longitude
                ]
            };

        let stops = []
        stops = get_stops(req.body);
        let optm = req.body.optimize
        //order stops
        //stops = stops.sort((a,b) => utils.getDistanceFromTwoLocation(a.location,origin.location) -  utils.getDistanceFromTwoLocation(b.location,origin.location))
        //
        let data = await get_trip_distance(
            origin,
            destination,
            stops,
            optm
        );
        let distance = data[0]
        let distanciaAproximada = (distance / 1000).toFixed(2);
        //
        if(req.body.val == 1){
            res.json({
                success: true,
                distance: distance,
                approximate_distance: `${distanciaAproximada} km`
            });
        }else{
            res.json({success:false,})
        }


};

///////////////FARE CALCULATOR FOR ESTIMATE FARE///////
 exports.getfareestimate = async function (req, res) {
    utils.check_request_params(req.body, [{name: 'service_type_id', type: 'string'}], async function (response) {
        if (response.success) {
            Citytype.findOne({_id: Schema(req.body.service_type_id)}).then(async (citytype) => {
                var geo = false;
                var geo2 = false
                var zone1, zone2, k = 0;
                let is_city_caracas = false;
                let cancellation_fees = 0;
                let body = req.body
                if (!citytype) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NO_SERVICE_TYPE_FOUND});
                } else {
                    cancellation_fees = citytype.cancellation_fee
                    var city_id = citytype.cityid;
                    const country = await Country.findOne({_id: citytype.countryid},{countryname: 1}).lean()

                    City.findOne({_id: city_id}).then((city) => {
                        if (!city) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_NO_SERVICE_TYPE_FOUND});
                        } else {
                            let city_pickup_distance = utils
                                .getDistanceFromTwoLocation([
                                    body.pickup_latitude, 
                                    body.pickup_longitude
                                ], city.cityLatLong);
                            if(city.is_caracas && city.is_use_city_boundary){

                                var inside_city = geolib.isPointInside(
                                    {
                                        latitude:  body.pickup_latitude,
                                        longitude:  body.pickup_longitude
                                    },
                                    city.city_locations
                                );
                                if(inside_city){
                                    is_city_caracas = true;
                                }
                            } else {
                                if (city.is_caracas && city_pickup_distance < city.cityRadius) {
                                    is_city_caracas = true;
                                }
                            }

                            // req.body.is_city_caracas = is_city_caracas
                            var unit_set = city.unit;

                            var time = body.time;
                            var timeMinutes;
                            timeMinutes = time * 0.0166667;

                            const originCoordinates = {
                                latitude: body.pickup_latitude, 
                                longitude: body.pickup_longitude
                            }

                            const destinationCoordinates = {
                                latitude: body.destination_latitude,
                                longitude: body.destination_longitude
                            };

                            var distance = body.distance;
                            var distanceKmMile = distance;

                            if (unit_set == 1) {
                                distanceKmMile = distance * 0.001;
                            } else {
                                distanceKmMile = distance * 0.000621371;
                            }

                            if (city.zone_business == 1) {
                                CityZone.find({cityid: city_id})
                                    .then((cityzone) => {
                                    if (
                                        citytype.is_zone == 1 &&
                                        cityzone !== null &&
                                        cityzone.length > 0
                                    ) {

                                        var zone_count = cityzone.length;
                                        cityzone.forEach(function (cityzoneDetail) {

                                            geo = geolib.isPointInside(
                                                originCoordinates,
                                                cityzoneDetail.kmlzone
                                            );
                                            geo2 = geolib.isPointInside(
                                                destinationCoordinates,
                                                cityzoneDetail.kmlzone
                                            );
                                            if (geo) {
                                                zone1 = cityzoneDetail.id;

                                            }
                                            if (geo2) {
                                                zone2 = cityzoneDetail.id;

                                            }
                                            k++;
                                            if (k == zone_count) {
                                                ZoneValue.findOne({
                                                    model_id: { $in: req.body.selected_model_id },
                                                    service_type_id: req.body.service_type_id,
                                                    $or: [{
                                                        from: zone1,
                                                        to: zone2
                                                    }, {
                                                        from: zone2,
                                                        to: zone1
                                                    }]
                                                }).then(async (zonevalue) => {
                                                    let helpers_price = 0;
                                                    let boat_ticket = 0;
                                                    let nightShift = 0;
                                                    let inside_stops_price = 0;
                                                    let outside_stops_price = 0;
                                                    let free_stops = citytype.free_stops;   
                                                    let total_stops_inside_city = 0;      

                                                    const number_of_helpers_load = body.number_of_helpers_load || 0;
                                                    const number_of_helpers_download = body.number_of_helpers_download || 0;
                                                    const cost_travel_insurance = citytype.cost_travel_insurance || 0;
                                                    const costPerHelper = zonevalue?.cost_per_helper ?? 0;
                                                    const amount = zonevalue?.amount ?? 0;
                                                    const zone_boat_price = zonevalue?.boat_ticket ? 
                                                                    zonevalue?.boat_ticket : 0;
                                                    const boat_ticket_check = body.boat_ticket_check;
                                                    let nightShiftCount = body.night_shift;
                                                    const nightShiftPrice = zonevalue?.night_shift ? 
                                                                    zonevalue?.night_shift : 0;
                                                    let internal_transit = 0
                                                    let is_margarita = false;
                                                    let optimize = body.optimize
                                                    if (zonevalue) {
                                                        if(
                                                            number_of_helpers_load > 0
                                                        ){
                                                            helpers_price += number_of_helpers_load * costPerHelper;
                                                        }

                                                        if( 
                                                            number_of_helpers_download > 0
                                                        ){
                                                            helpers_price += number_of_helpers_download * costPerHelper;
                                                        }
                                                        
                                                        let op = false;
                                                        if (optimize === "true" || optimize === true){
                                                            op = true; 
                                                        }

                                                        let origin = {
                                                                address: "Origin", location: [
                                                                    originCoordinates.latitude,
                                                                    originCoordinates.longitude
                                                                ]
                                                            };
                                                            
                                                        let destination = {
                                                                address: "Destination", location: [
                                                                    destinationCoordinates.latitude,
                                                                    destinationCoordinates.longitude
                                                                ]
                                                            };

                                                        let stops = []                       
                                                        stops = get_stops(body);
                                                        let data = ((!Number(origin.location[0]) && !Number(origin.location[1])) || (!Number(destination.location[0]) && !Number(destination.location[1]))) ?
                                                                    [0,[],[]] : 
                                                                    await get_trip_distance(
                                                                        origin, 
                                                                        destination, 
                                                                        stops,
                                                                        op
                                                                    );
                                                        
                                                        data_stops = data[1]
                                                        legs = data[2]
                                                        let reorder_stops = []
                                                        if( data_stops.length > 0){
                                                            for (let i = 0; i < data_stops.length; i++){
                                                                reorder_stops.push(stops[data_stops[i]])
                                                            }
                                                        }

                                                        let stops_types_count = await count_stops_types({legs, optimized: op});

                                                        outside_stops_price = stops_types_count.outside * 
                                                                zonevalue.cost_per_stop_outside_city;
                                                        
                                                        total_stops_inside_city = stops_types_count.inside - free_stops > 0 ? 
                                                                            stops_types_count.inside - free_stops : 0;

                                                        inside_stops_price = total_stops_inside_city * 
                                                            zonevalue.cost_per_stop_inside_city;

                                                        const validateOriginLocation = await tripService
                                                            .validateLocation(originCoordinates, constant_json.STATES.NUEVA_ESPARTA);

                                                        const validateDestinationLocation = await tripService
                                                            .validateLocation(destinationCoordinates, constant_json.STATES.NUEVA_ESPARTA);

                                                        if(validateOriginLocation && validateDestinationLocation) {} 
                                                        else if(validateOriginLocation || validateDestinationLocation) {    
                                                            is_margarita = true;
                                                            if(Number(boat_ticket_check) === 1) {
                                                                boat_ticket = zone_boat_price
                                                            }
                                                        }

                                                        internal_transit = tripService
                                                        .calculateTransitPrice(
                                                            body?.selected_transit_type_number, 
                                                            country?.countryname,
                                                            zonevalue?.ti_zone, 
                                                        );
                                                        nightShift = Number(nightShiftPrice) * nightShiftCount;
                                                        const estimated_fare = Number(amount) + Number(helpers_price) +                 
                                                                            Number(nightShift) + Number(boat_ticket) +
                                                                            Number(inside_stops_price) + Number(outside_stops_price) + 
                                                                            Number(cost_travel_insurance) + Number(internal_transit);

                                                        res.json({
                                                            success: true,
                                                            message: success_messages.MESSAGE_CODE_YOU_GET_FARE_ESTIMATE,
                                                            trip_type: constant_json.TRIP_TYPE_ZONE,
                                                            time: timeMinutes,
                                                            distance: (distanceKmMile).toFixed(2),
                                                            estimated_fare: Number(estimated_fare),
                                                            unit_set: city.unit,
                                                            cancellation_fees:cancellation_fees,
                                                            is_fixed_fees_used: 1,
                                                            stops_address: req.body.stops_address || [],
                                                            is_margarita,
                                                            boat_ticket_price: boat_ticket,
                                                            night_shift_count: nightShiftCount,
                                                            boat_ticket_check,
                                                            night_shift_price: nightShiftPrice
                                                        });

                                                    } else {
                                                        airport(city_id,
                                                            citytype,
                                                            req.body,
                                                            timeMinutes,
                                                            distanceKmMile,
                                                            res);
                                                    }
                                                })

                                            }

                                        });

                                    } else {
                                        airport(
                                            city_id,
                                            citytype,
                                            req.body,
                                            timeMinutes,
                                            distanceKmMile,
                                            res);
                                    }

                                });
                            } else if (city.zone_business != 1) {
                                other(
                                    city_id,
                                    citytype,
                                    req.body,
                                    timeMinutes,
                                    distanceKmMile,
                                    res,
                                    originCoordinates,
                                    destinationCoordinates,
                                    req.body.night_shift,
                                    req.body.optimize,
                                );
                            } else {
                                airport(
                                    city_id,
                                    citytype,
                                    req.body,
                                    timeMinutes,
                                    distanceKmMile,
                                    res);
                            }
                        }
                    });
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

function airport(cityid, citytype, body, timeMinutes, distanceKmMile, res) {

    Airport.find({city_id: cityid}).then((airport_data) => {
        if (airport_data != null && airport_data.length > 0) {
            City.findOne({'_id': cityid, airport_business: 1}).then((city) => {
                if (city) {

                    var pickup_airport;
                    var dest_airport;
                    var airport_id;
                    airport_data.forEach(function (airportDetail) {

                            pickup_airport = geolib.isPointInside(
                                {
                                    latitude: body.pickup_latitude,
                                    longitude: body.pickup_longitude
                                },
                                airportDetail.kmlzone
                            );

                            dest_airport = geolib.isPointInside(
                                {
                                    latitude:  body.destination_latitude,
                                    longitude:  body.destination_longitude
                                },
                                airportDetail.kmlzone
                            );

                            if (pickup_airport) {
                                city_distance = utils.getDistanceFromTwoLocation([body.destination_latitude, body.destination_longitude], city.cityLatLong);

                                if(city.is_use_city_boundary){
                                    var inside_city = geolib.isPointInside(
                                        {
                                            latitude:  body.pickup_latitude,
                                            longitude:  body.pickup_longitude
                                        },
                                        city.city_locations
                                    );
                                    if(inside_city){
                                        airport_id = airportDetail._id;
                                    }
                                } else {
                                    if (city_distance < city.cityRadius) {
                                        airport_id = airportDetail._id;
                                    }
                                }
                            }
                            if (dest_airport) {
                                city_distance = utils.getDistanceFromTwoLocation([body.pickup_latitude, body.pickup_longitude], city.cityLatLong);
                                if(city.is_use_city_boundary){
                                    var inside_city = geolib.isPointInside(
                                        {
                                            latitude:  body.destination_latitude,
                                            longitude:  body.destination_longitude
                                        },
                                        city.city_locations
                                    );
                                    if(inside_city){
                                        airport_id = airportDetail._id;
                                    }
                                } else {
                                    if (city_distance < city.cityRadius) {
                                        airport_id = airportDetail._id;
                                    }
                                }
                            }
                        });

                        if(airport_id){
                                AirportCity.findOne({
                                    airport_id: airport_id,
                                    service_type_id: citytype._id
                                }).then((airportcity) => {

                                    if (airportcity && airportcity.price > 0) {
                                        var estimated_fare = (airportcity.price).toFixed(2);
                                        var trip_type = constant_json.TRIP_TYPE_AIRPORT;
                                        res.json({
                                            success: true,
                                            trip_type: trip_type,
                                            message: success_messages.MESSAGE_CODE_YOU_GET_FARE_ESTIMATE,
                                            time: timeMinutes,
                                            distance: (distanceKmMile).toFixed(2),
                                            estimated_fare: Number(estimated_fare),
                                            unit_set: city.unit,
                                            cancellation_fees: citytype.cancellation_fee
                                        });

                                    } else {
                                        cityCheck(
                                            cityid,
                                            citytype,
                                            body,
                                            timeMinutes,
                                            distanceKmMile,
                                            res);
                                    }

                                })


                        } else {
                            cityCheck(
                                cityid,
                                citytype,
                                body,
                                timeMinutes,
                                distanceKmMile,
                                res);
                        }


                } else {
                    cityCheck(
                        cityid,
                        citytype,
                        body,
                        timeMinutes,
                        distanceKmMile,
                        res);
                }
            })
        } else {
            cityCheck(
                cityid,
                citytype,
                body,
                timeMinutes,
                distanceKmMile,
                res);
        }

    });
}

function cityCheck(cityid, citytype, body, timeMinutes, distanceKmMile, res) {

    var flag = 0;
    var k = 0;
    var optimize = body.optimize || false;
    City.findOne({'_id': cityid, city_business: 1}).then((city) => {

        const originCoordinates = {
            latitude: body.pickup_latitude,
            longitude: body.pickup_longitude
        }

        const destinationCoordinates = {
            latitude: body.destination_latitude,
            longitude: body.destination_longitude
        };

        if (city) {
            CitytoCity.find({city_id: cityid, service_type_id: citytype._id, destination_city_id: {$in: city.destination_city}}).then((citytocity) => {

                if (citytocity !== null && citytocity.length > 0) {

                    citytocity.forEach(function (citytocity_detail) {

                        City.findById(citytocity_detail.destination_city_id).then((city_detail) => {
                            if (flag == 0) {

                                var city_radius = city_detail.cityRadius;
                                var destination_city_radius = utils.getDistanceFromTwoLocation([body.destination_latitude, body.destination_longitude], city_detail.cityLatLong);

                                var inside_city;
                                if(city_detail.city_locations && city_detail.city_locations.length>2){
                                    inside_city = geolib.isPointInside(
                                        {
                                            latitude:  body.destination_latitude,
                                            longitude:  body.destination_longitude
                                        },
                                        city_detail.city_locations
                                    );
                                }

                                if (citytocity_detail.price > 0 && ((!city_detail.is_use_city_boundary && city_radius > destination_city_radius) || (city_detail.is_use_city_boundary && inside_city))) {
                                    var estimated_fare = (citytocity_detail.price).toFixed(2);
                                    var trip_type = constant_json.TRIP_TYPE_CITY;
                                    flag = 1;
                                    res.json({
                                        success: true,
                                        trip_type: trip_type,
                                        message: success_messages.MESSAGE_CODE_YOU_GET_FARE_ESTIMATE,
                                        time: timeMinutes,
                                        distance: (distanceKmMile).toFixed(2),
                                        estimated_fare: Number(estimated_fare),
                                        unit_set: city.unit,
                                        cancellation_fees: citytype.cancellation_fee,
                                        stops_address: body.stops_address || []
                                    })

                                } else if (citytocity.length - 1 == k) {
                                    other(
                                        cityid,
                                        citytype,
                                        body,
                                        timeMinutes,
                                        distanceKmMile,
                                        res,
                                        originCoordinates,
                                        destinationCoordinates,
                                        body.night_shift,
                                        optimize,
                                    );
                                } else {
                                    k++;
                                }
                            }
                        });
                    });
                } else {
                    other(
                        cityid,
                        citytype,
                        body,
                        timeMinutes,
                        distanceKmMile,
                        res,
                        originCoordinates,
                        destinationCoordinates,
                        body.night_shift,
                        optimize,
                    )
                }
            });
        } else {
            other(
                cityid,
                citytype,
                body,
                timeMinutes,
                distanceKmMile,
                res,
                originCoordinates,
                destinationCoordinates,
                body.night_shift,
                optimize,
            )
        }
    });
}

async function getSteps(origin, destination){
    const settings = await Settings.findOne({});
    const URL_API_GOOGLE_DIRECTIONS = `https://maps.googleapis.com/maps/api/directions/json?key=${settings.backend_google_key}&origin=${origin.location[0]},${origin.location[1]}&destination=${destination.location[0]},${destination.location[1]}`;
   
    const response = await axios.get(url);
    const data = response.data
    return data;
}

async function other(
    cityid, citytype, body, timeMinutes,
    distanceKmMile,
    res,
    originCoordinates = {
        latitude: 0,
        longitude: 0
    },
    destinationCoordinates = {
        latitude: 0,
        longitude: 0
    },
    night_shift = 0,
    optimize = false
) {
    try {
        let op = false;
        if (optimize === "true" || optimize === true){
            op = true;
        }

        let data_stops =[]
        const city = await City.findOne({_id: cityid});

        const country = await Country.findOne({_id: citytype.countryid})

        let model_pricing_type = null
        let model_service_condition = {_id: {$in: citytype.model_pricing_ids}}

        if(body.selected_model_id){

            model_service_condition['modelid._id'] = Schema(body.selected_model_id)
        }

        if(body.selected_service_id){
            model_service_condition['serviceid._id'] = Schema(body.selected_service_id)
        }

        if(body.selected_capacity_id){
            model_service_condition['capacityid._id'] = Schema(body.selected_capacity_id)
        }

        if(
            body.selected_model_id ||
            body.selected_service_id ||
            body.selected_capacity_id
        ){

            model_pricing_type = await Citytype.findOne(model_service_condition)
        }
        //let est = await fare_estimation(body, 'f', model_pricing_type);

        let origin = {
                address: "Origin", location: [
                    originCoordinates.latitude,
                    originCoordinates.longitude
                ]
            };

        let destination = {
                address: "Destination", location: [
                    destinationCoordinates.latitude,
                    destinationCoordinates.longitude
                ]
            };

        let stops = []
        stops = get_stops(body);
        let data = ((!Number(origin.location[0]) && !Number(origin.location[1])) || (!Number(destination.location[0]) && !Number(destination.location[1]))) ?
                    [0,[],[]] :
                    await get_trip_distance(
                        origin,
                        destination,
                        stops,
                        op
                    );

        let distance = data[0]
        data_stops = data[1]
        legs = data[2]
        let reorder_stops = []
        if( data_stops.length > 0){
            for (let i = 0; i < data_stops.length; i++){
                reorder_stops.push(stops[data_stops[i]])
            }
        }

        let stops_types_count = await count_stops_types({legs, optimized: op});


        let distanceKmMile = distance != 0 ? distance / 1000 : 0;

        let free_stops = citytype.free_stops
        let total_stops_inside_city = 0
        let inside_stops_price = 0;
        let outside_stops_price = 0;
        let helpers_price = 0;
        let helperQuantity = 0;
        let tax = citytype.tax;
        let price_per_unit_distance1 = distanceKmMile * citytype.price_per_unit_distance;
        let price_per_unit_distance = citytype.price_per_unit_distance;
        let is_min_fare_used = 0;
        let is_fixed_fees_used = 0;
        let cost_travel_insurance = citytype.cost_travel_insurance || 0;
        let boat_ticket_check = body.boat_ticket_check;
        let destination_stop = 0;
        let promoCode = null
        let promo_payment = 0;

        if(!model_pricing_type){
            //Esta dando error
            res.json({success: false, error_code: error_message.ERROR_CODE_NO_SERVICE_TYPE_FOUND});
            return
        }


        outside_stops_price = stops_types_count.outside *
                model_pricing_type.cost_per_stop_outside_city;

        total_stops_inside_city = stops_types_count.inside - free_stops > 0 ?
                                    stops_types_count.inside - free_stops : 0;

        if(body.courier_flow_type != constant_json.COURIER_ESCOMBRO_FLOW){
            destination_stop++;
        }

        if(body.destination_stops && body.destination_stops.length){
            destination_stop = destination_stop + body.destination_stops.length
        }
        destination_stop = destination_stop > free_stops ?
                destination_stop - free_stops : 0

        inside_stops_price = total_stops_inside_city *
                model_pricing_type.cost_per_stop_inside_city;

        if(
            body.number_of_helpers_load &&
            body.number_of_helpers_load > 0
        ){
            helpers_price += body.number_of_helpers_load * model_pricing_type.cost_per_helper;
            helperQuantity += body.number_of_helpers_load
        }

        if(
            body.number_of_helpers_download &&
            body.number_of_helpers_download > 0
        ){
            helpers_price += body.number_of_helpers_download * model_pricing_type.cost_per_helper;
            helperQuantity += body.number_of_helpers_download
        }

        let distanceFixed = 0;
        if(
            body.courier_flow_type == constant_json.COURIER_CISTERNA_FLOW ||
            body.courier_flow_type == constant_json.COURIER_ESCOMBRO_FLOW
        ){
            is_fixed_fees_used = 1
            model_pricing_type = await calculateCityWisePricing(body, model_pricing_type, originCoordinates, destinationCoordinates, citytype)
            price_per_unit_distance1 = model_pricing_type.fixed_fees
        }else{
            const pricesResult = await tripService
                    .calculateTariff(distanceKmMile, model_pricing_type);

            price_per_unit_distance = pricesResult.price_per_unit_distance;
            price_per_unit_distance1 = price_per_unit_distance * distanceKmMile;

            let recalculatePriceDistance = await tripService
                .recalculateTariff(
                    price_per_unit_distance1,
                    model_pricing_type,
                    distanceKmMile,
                    pricesResult.price_per_unit_distance
                );

            if(recalculatePriceDistance.fixed) {
                price_per_unit_distance = recalculatePriceDistance.pricePerUnit;
                price_per_unit_distance1 = recalculatePriceDistance.price;
            }

            if(distanceKmMile < 17){
                is_min_fare_used = 1;
            }

            distanceFixed = recalculatePriceDistance.distanceFixed;
        }

        let nightShift = 0;
        let nightShiftCount = Number(night_shift);
        let is_margarita = false;
        let boat_ticket = 0;
        let internal_transit = 0
        internal_transit = tripService
        .calculateTransitPrice(
            body?.selected_transit_type_number,
            country?.countryname,
            model_pricing_type?.ti_internal_transit,
        );
        const validateOriginLocation = await tripService
            .validateLocation(originCoordinates, constant_json.STATES.NUEVA_ESPARTA);

        const validateDestinationLocation = await tripService
            .validateLocation(destinationCoordinates, constant_json.STATES.NUEVA_ESPARTA);

        if(validateOriginLocation && validateDestinationLocation) {}
        else if(validateOriginLocation || validateDestinationLocation) {
            nightShiftCount += 1;
            is_margarita = true;
            if(Number(boat_ticket_check) === 1) {
                boat_ticket = model_pricing_type.boat_ticket ?
                    model_pricing_type.boat_ticket : 0;
            }
        }

        let trip_type = constant_json.TRIP_TYPE_NORMAL;
        price_per_unit_distance1 = (price_per_unit_distance1).toFixed(2);
        nightShift = Number(model_pricing_type.night_shift ?
                model_pricing_type.night_shift : 0) * nightShiftCount;

        let total = Number(price_per_unit_distance1) +
                Number(inside_stops_price) +
                Number(outside_stops_price) +
                Number(nightShift) +
                Number(internal_transit) +
                Number(boat_ticket);

        total = total + (total * 0.01 * tax);
        let estimated_fare = Number(total);

        if(
            estimated_fare < model_pricing_type.min_fare ||
            is_min_fare_used == 1
        ) {
            total = Number(model_pricing_type.min_fare) +
                Number(helpers_price) +
                Number(inside_stops_price) +
                Number(outside_stops_price) +
                Number(nightShift) +
                Number(internal_transit) +
                Number(boat_ticket);

            total = total + (total * 0.01 * tax);
            estimated_fare = total + Number(cost_travel_insurance);
            is_min_fare_used = 1;
        }  else {
            estimated_fare = Number(total) + Number(cost_travel_insurance) + Number(helpers_price);
        }

        if (body.promo_id) {
            promoCode = await Promo_Code.findOne({_id: body.promo_id})
        }
        if (promoCode) {
            promo_value = promoCode.code_value;
            promo_payment = promoCode.code_type == 1 ? promo_value : Number((promo_value * 0.01 * estimated_fare).toFixed(2));
        }

        return res.json({
            success: true,
            trip_type: trip_type,
            distanceFixed,
            user_tax_fee: 0,
            user_miscellaneous_fee: 0,
            message: success_messages.MESSAGE_CODE_YOU_GET_FARE_ESTIMATE,
            time: timeMinutes * 2,
            distance: (distanceKmMile).toFixed(2),
            is_min_fare_used: is_min_fare_used,
            is_fixed_fees_used: is_fixed_fees_used,
            base_price: 0,
            price_per_unit_distance: price_per_unit_distance,
            price_per_unit_time: 0,
            estimated_fare,
            unit_set: city.unit,
            cancellation_fees: citytype.cancellation_fee,
            is_margarita,
            boat_ticket_price: boat_ticket,
            night_shift_count: nightShiftCount,
            boat_ticket_check,
            helpers_quantity: helperQuantity,
            night_shift_price: model_pricing_type.night_shift,
            stops_address: reorder_stops,
            promo_payment
        });
    } catch (e) {
        console.log(e)
        return res.json({
            success: false,
        });
    }

}


////APPLY PROMO CODE///
exports.remove_promo_code = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'trip_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {

                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        const user_condition = {$or: [{user_id: req.body.user_id}, {user_id: user.user_type_id}]}
                        User_promo_use.findOneAndRemove({user_condition, trip_id: req.body.trip_id}, function(){
                            Trip.findOne({_id: req.body.trip_id}, function(error, trip){

                                Promo_Code.findOne({_id: trip.promo_id}, function(error, promocode_data){
                                    trip.promo_id = null;
                                    trip.save();
                                    if(promocode_data){
                                        promocode_data.user_used_promo--;
                                        promocode_data.save();
                                    }
                                    res.json({success: true, message: success_messages.MESSAGE_CODE_PROMOCODE_REMOVE_SUCCESSFULLY});
                                })
                            })
                        })
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

exports.apply_promo_code = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'promocode', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {

                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        let user_id  = user.user_type_id ? user.user_type_id : user._id

                        var now = new Date();
                        if(req.body.trip_id){
                            Trip.findOne({_id: req.body.trip_id}).then(async (trip) => {
                                if (trip) {
                                    var country_id = trip.country_id;
                                    let promocode= await Promo_Code.findOne({
                                        promocode: req.body.promocode,
                                        state: 1,
                                        countryid: country_id,
                                        start_date: {$lte: now},
                                        code_expiry: {$gte: now}
                                    })

                                    if (!promocode) {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                        });
                                        return;
                                    }

                                    if (promocode.user_used_promo >= promocode.code_uses) {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                        });
                                        return;
                                    }
                                    let used_promo_data = User_promo_use.find({
                                                user_id: user_id,
                                                promo_id: promocode._id
                                            })
                                    if (used_promo_data.length >= promocode.code_uses_per_user) {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_PROMOTIONAL_CODE_ALREADY_USED
                                        });
                                        return;
                                    }
                                    let selected_service_id = trip?.service_details?._id || null
                                    let promo_service = promocode.serviceid || []
                                    if(promo_service.length){
                                        let is_service = promo_service.some(serviceId => serviceId.toString() === selected_service_id?.toString());
                                        if (!is_service) {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_PROMO_CODE_SELECTED_SEVICE_NOT_VALID
                                            });
                                            return;
                                        }
                                    }

                                    Citytype.findOne({_id: trip.service_type_id}).then((citytypedetail) => {
                                        if (citytypedetail) {
                                            var cityid = citytypedetail.cityid;
                                            var countryid = citytypedetail.countryid;
                                            City.findOne({_id: cityid}).then((citydetail) => {

                                                var promo_apply_for_cash = citydetail.isPromoApplyForCash;
                                                var promo_apply_for_card = citydetail.isPromoApplyForCard;
                                                var is_promo_apply = 1;
                                                // temporarily turned off payment gateway check for promo

                                                // if (trip.payment_mode == constant_json.PAYMENT_MODE_CASH && promo_apply_for_cash == constant_json.YES) {
                                                //     is_promo_apply = 1;
                                                // } else if (trip.payment_mode == constant_json.PAYMENT_MODE_CARD && promo_apply_for_card == constant_json.YES) {
                                                //     is_promo_apply = 1;
                                                // }

                                                trip_count = user.completed_request;
                                                is_promo_code_valid = false;
                                                if (!promocode.completed_trips_type) {
                                                    promocode.completed_trips_type = 2;
                                                }
                                                if (!promocode.completed_trips_value) {
                                                    promocode.completed_trips_value = 0;
                                                }
                                                if (promocode.completed_trips_type == 1) {
                                                    is_promo_code_valid = (promocode.completed_trips_value == trip_count);
                                                } else if (promocode.completed_trips_type == 2) {
                                                    is_promo_code_valid = (trip_count >= promocode.completed_trips_value);
                                                }
                                                if (is_promo_code_valid) {
                                                    if (is_promo_apply) {

                                                        if (promocode.cityid.indexOf(cityid) !== -1 && promocode.countryid.equals(countryid)) {
                                                            trip.promo_id = promocode._id;
                                                            trip.promo_code = promocode.promocode;
                                                            trip.save();
                                                            promocode.user_used_promo = promocode.user_used_promo + 1;
                                                            promocode.save();
                                                            var userpromouse = new User_promo_use({
                                                                promo_id: promocode._id,
                                                                promocode: promocode.promocode,
                                                                user_id: user_id,
                                                                promo_type: promocode.code_type,
                                                                promo_value: promocode.code_value,
                                                                trip_id: trip._id,
                                                                user_used_amount: 0

                                                            });
                                                            userpromouse.save().then(() => {
                                                                res.json({
                                                                    success: true, promo_id: promocode._id,
                                                                    message: success_messages.MESSAGE_CODE_PROMOTIONAL_CODE_APPLIED_SUCCESSFULLY
                                                                });
                                                            });
                                                        } else {

                                                            res.json({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_FOR_YOUR_AREA
                                                            });
                                                        }
                                                    } else {
                                                        res.json({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_APPLY_ON_YOUR_PAYMENT_MODE
                                                        });
                                                    }
                                                } else {
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                                    });
                                                }
                                            });
                                        } else {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_INVALID_PROMO_CODE
                                            });
                                        }
                                    });

                                } else {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_INVALID_PROMO_CODE
                                    });
                                }
                            });
                        } else {
                            var country_id = req.body.country_id;
                            Promo_Code.findOne({
                                promocode: req.body.promocode,
                                state: 1,
                                countryid: country_id,
                                start_date: {$lte: now},
                                code_expiry: {$gte: now}
                            }).then(async (promocode) => {

                                if (!promocode) {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                    });
                                    return;
                                }
                                if (promocode.user_used_promo >= promocode.code_uses) {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                    });
                                    return;
                                }
                                let selected_service_id = req.body.promo_serviceid || null
                                let promo_service = promocode.serviceid || []
                                if(promo_service.length){
                                    let is_service = promo_service.some(serviceId => serviceId.toString() === selected_service_id?.toString());
                                    if (!is_service) {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_PROMO_CODE_SELECTED_SEVICE_NOT_VALID
                                        });
                                        return;
                                    }
                                }
                                let used_promo_data = await User_promo_use.find({
                                    user_id: user_id,
                                    promo_id: promocode._id
                                })

                                if (!used_promo_data) {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_PROMOTIONAL_CODE_ALREADY_USED
                                    });
                                    return;
                                }
                                if (used_promo_data.length >= promocode.code_uses_per_user) {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_PROMOTIONAL_CODE_ALREADY_USED
                                    });
                                    return;
                                }

                                City.findOne({_id: req.body.city_id}).then((citydetail) => {

                                    var promo_apply_for_cash = citydetail.isPromoApplyForCash;
                                    var promo_apply_for_card = citydetail.isPromoApplyForCard;
                                    var is_promo_apply = 1;
                                    // if (req.body.payment_mode == constant_json.PAYMENT_MODE_CASH && promo_apply_for_cash == constant_json.YES) {
                                    //     is_promo_apply = 1;
                                    // } else if (req.body.payment_mode == constant_json.PAYMENT_MODE_CARD && promo_apply_for_card == constant_json.YES) {
                                    //     is_promo_apply = 1;
                                    // }

                                    trip_count = user.completed_request;
                                    is_promo_code_valid = false;
                                    if (!promocode.completed_trips_type) {
                                        promocode.completed_trips_type = 2;
                                    }
                                    if (!promocode.completed_trips_value) {
                                        promocode.completed_trips_value = 0;
                                    }
                                    if (promocode.completed_trips_type == 1) {
                                        is_promo_code_valid = (promocode.completed_trips_value == trip_count);
                                    } else if (promocode.completed_trips_type == 2) {
                                        is_promo_code_valid = (trip_count >= promocode.completed_trips_value);
                                    }
                                    if (is_promo_code_valid) {
                                        if (is_promo_apply) {

                                            if (promocode.cityid.indexOf(req.body.city_id) !== -1 && promocode.countryid.equals(country_id)) {
                                                res.json({
                                                    success: true,
                                                    promo_id: promocode._id,
                                                    promocode_name: promocode.name,
                                                    promo_apply_for_cash: promo_apply_for_cash,
                                                    promo_apply_for_card: promo_apply_for_card,
                                                    message: success_messages.MESSAGE_CODE_PROMOTIONAL_CODE_APPLIED_SUCCESSFULLY
                                                });
                                            } else {

                                                res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_FOR_YOUR_AREA
                                                });
                                            }
                                        } else {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_APPLY_ON_YOUR_PAYMENT_MODE
                                            });
                                        }
                                    } else {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                        });
                                    }

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
//////////////// USER REFERAL CREDIT////////

exports.get_user_referal_credit = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        var condition = { $match: { user_id: {$eq: Schema(req.body.user_id)} } }
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
//////// ADD WALLET AMOUNT ///

exports.add_wallet_amount = function (req, res) {
    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            if(req.body.udf2){
                req.body.type = req.body.udf2;
            }
            if(req.body.udf3){
                req.body.user_id = req.body.udf3;
            }
            var type = Number(req.body.type);
            if(req.body.udf1){
                req.body.payment_gateway_type = req.body.udf1;
            }
            switch (type) {
                case Number(constant_json.USER_UNIQUE_NUMBER): // 10
                    type = Number(constant_json.USER_UNIQUE_NUMBER);
                    Table = User;
                    break;
                case Number(constant_json.PROVIDER_UNIQUE_NUMBER): // 11
                    type = Number(constant_json.PROVIDER_UNIQUE_NUMBER);
                    Table = Provider;
                    break;
                case Number(constant_json.CORPORATE_UNIQUE_NUMBER):
                    type = Number(constant_json.CORPORATE_UNIQUE_NUMBER);
                    Table = Corporate;
                    break;
                case Number(constant_json.PARTNER_UNIQUE_NUMBER):
                    type = Number(constant_json.PARTNER_UNIQUE_NUMBER);
                    Table = Partner;
                    break;
                default:
                    type = Number(constant_json.USER_UNIQUE_NUMBER); // 10
                    Table = User;
                    break;
            }
            Table.findOne({_id: req.body.user_id}).then((detail) => {

                if (detail.token != req.body.token && !req.body.udf2) {

                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else {

                    var payment_id = Number(constant_json.PAYMENT_BY_STRIPE);
                    try {
                        payment_id = req.body.payment_id;
                    } catch (error) {
                        console.error(err);
                    }

                    switch (payment_id) {
                        case Number(constant_json.PAYMENT_BY_STRIPE):
                            break;
                        case Number(constant_json.PAYMENT_BY_PAYPAL):
                            break;
                    }

                    if(!req.body.payment_gateway_type || req.body.payment_gateway_type == PAYMENT_GATEWAY.stripe){
                        var stripe_secret_key = setting_detail.stripe_secret_key;

                        var stripe = require("stripe")(stripe_secret_key);
                        stripe.paymentIntents.retrieve(req.body.payment_intent_id, function(error, intent){

                            if(intent && intent.charges && intent.charges.data && intent.charges.data.length>0) {

                                var total_wallet_amount = utils.addWalletHistory(type, detail.unique_id, detail._id, detail.country_id, detail.wallet_currency_code, detail.wallet_currency_code,
                                    1, (intent.charges.data[0].amount/100), detail.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_CARD, "Card : "+intent.charges.data[0].payment_method_details.card.last4)

                                detail.wallet = total_wallet_amount;
                                detail.save().then(() => {
                                    res.json({
                                        success: true,
                                        message: success_messages.MESSAGE_CODE_WALLET_AMOUNT_ADDED_SUCCESSFULLY,
                                        wallet: detail.wallet,
                                        wallet_currency_code: detail.wallet_currency_code

                                    });
                                });

                            } else {

                            }
                        });
                    } else  if(req.body.payment_gateway_type == PAYMENT_GATEWAY.paystack){
                        var total_wallet_amount = utils.addWalletHistory(type, detail.unique_id, detail._id, detail.country_id, detail.wallet_currency_code, detail.wallet_currency_code,
                                1, (req.body.paystack_data.amount/100), detail.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_CARD, "Card : "+req.body.paystack_data.authorization.last4)

                            detail.wallet = total_wallet_amount;
                            detail.save().then(() => {
                                message = "Wallet Amount Added Sucessfully.";
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_WALLET_AMOUNT_ADDED_SUCCESSFULLY,
                                    wallet: detail.wallet,
                                    wallet_currency_code: detail.wallet_currency_code

                                });
                            });
                    } else  if(req.body.payment_gateway_type == PAYMENT_GATEWAY.payu){
                        var total_wallet_amount = utils.addWalletHistory(type, detail.unique_id, detail._id, detail.country_id, detail.wallet_currency_code, detail.wallet_currency_code,
                                    1, (req.body.amount), detail.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_CARD, "Card : "+req.body.cardnum)

                        detail.wallet = total_wallet_amount;
                        detail.save().then(() => {
                            if(req.body.udf4){
                                message = "Wallet Amount Added Sucessfully.";
                                res.redirect(req.body.udf4);
                            } else {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_WALLET_AMOUNT_ADDED_SUCCESSFULLY,
                                    wallet: detail.wallet,
                                    wallet_currency_code: detail.wallet_currency_code

                                });
                            }
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

exports.change_user_wallet_status = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, function (err, user) {

                if (user.token != req.body.token) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else {
                    var status = req.body.is_use_wallet;
                    user.is_use_wallet = status;
                    user.save().then((user) => {
                        res.json({
                            success: true,
                            message: success_messages.MESSAGE_CODE_CHANGE_WALLET_STATUS_SUCCESSFULLY,
                            is_use_wallet: user.is_use_wallet
                        });
                    });
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

exports.set_home_address = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            if (req.body.home_address !== undefined) {
                req.body.home_location = [req.body.home_latitude, req.body.home_longitude]
            }

            if (req.body.work_address !== undefined) {
                req.body.work_location = [req.body.work_latitude, req.body.work_longitude]
            }

            User.findOne({_id: req.body.user_id}).then((user) => {

                if (!user) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                } else {
                    if (user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        User.findByIdAndUpdate(req.body.user_id, req.body).then(() => {
                            res.json({success: true, message: success_messages.MESSAGE_CODE_SET_ADDRESS_SUCCESSFULLY});

                        })
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

exports.get_home_address = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, {
                token: 1,
                home_address: 1,
                work_address: 1,
                home_location: 1,
                work_location: 1
            }).then((user) => {
                if (!user) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                } else {
                    if (user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        res.json({success: true, user_address: user});
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

exports.get_user_privacy_policy = function (req, res) {
    res.send(setting_detail.user_privacy_policy)
};

exports.get_user_terms_and_condition = function (req, res) {
    res.send(setting_detail.user_terms_and_condition)
};

exports.get_user_setting_detail = async function (req, res) {

    var terms_and_condition_url = 'https://' + req.get('host') + "/terms&condition";
    var privacy_policy_url =  'https://' + req.get('host') + "/privacy";

    var setting_response = {};
    setting_response.terms_and_condition_url =  terms_and_condition_url
    setting_response.privacy_policy_url = privacy_policy_url
    setting_response.is_user_social_login = setting_detail.is_user_social_login
    setting_response.is_allow_multiple_stop = setting_detail.is_allow_multiple_stop;
    setting_response.multiple_stop_count = setting_detail.multiple_stop_count;
    setting_response.user_app_insta_ad_url = setting_detail.user_app_insta_ad_url;
    if(req.body.device_type == 'android') {
        setting_response.admin_phone = setting_detail.admin_phone;
        setting_response.contactUsEmail = setting_detail.contactUsEmail;
        setting_response.android_user_app_google_key = setting_detail.android_user_app_google_key;
        setting_response.android_user_app_version_code = setting_detail.android_user_app_version_code;
        setting_response.android_user_app_force_update = setting_detail.android_user_app_force_update;
        setting_response.is_tip = setting_detail.is_tip;
        setting_response.scheduled_request_pre_start_minute = setting_detail.scheduled_request_pre_start_minute;
        setting_response.schedule_request_limit = setting_detail.scheduled_request_day_limit;
        setting_response.stripe_publishable_key = setting_detail.stripe_publishable_key;
        setting_response.userPath = setting_detail.userPath;
        setting_response.userSms = setting_detail.userSms;
        setting_response.userEmailVerification = setting_detail.userEmailVerification;
        setting_response.twilio_call_masking = setting_detail.twilio_call_masking;
        setting_response.is_show_estimation_in_provider_app = setting_detail.is_show_estimation_in_provider_app;
        setting_response.is_show_estimation_in_user_app = setting_detail.is_show_estimation_in_user_app;
        setting_response.android_places_autocomplete_key = setting_detail.android_places_autocomplete_key;

    } else {
        setting_response.admin_phone = setting_detail.admin_phone;
        setting_response.contactUsEmail = setting_detail.contactUsEmail;
        setting_response.ios_user_app_google_key = setting_detail.ios_user_app_google_key;
        setting_response.ios_user_app_version_code = setting_detail.ios_user_app_version_code;
        setting_response.ios_user_app_force_update = setting_detail.ios_user_app_force_update;
        setting_response.is_tip = setting_detail.is_tip;
        setting_response.scheduled_request_pre_start_minute = setting_detail.scheduled_request_pre_start_minute;
        setting_response.schedule_request_limit = setting_detail.scheduled_request_day_limit;
        setting_response.stripe_publishable_key = setting_detail.stripe_publishable_key;
        setting_response.userPath = setting_detail.userPath;
        setting_response.userSms = setting_detail.userSms;
        setting_response.twilio_call_masking = setting_detail.twilio_call_masking;
        setting_response.is_show_estimation_in_provider_app = setting_detail.is_show_estimation_in_provider_app;
        setting_response.is_show_estimation_in_user_app = setting_detail.is_show_estimation_in_user_app;
        setting_response.ios_places_autocomplete_key = setting_detail.ios_places_autocomplete_key;
        setting_response.userEmailVerification = setting_detail.userEmailVerification;
    }
    setting_response.image_base_url = setting_detail.image_base_url;
    setting_response.minimum_phone_number_length = setting_detail.minimum_phone_number_length;
    setting_response.maximum_phone_number_length = setting_detail.maximum_phone_number_length;
    setting_response.is_split_payment = setting_detail.is_split_payment;
    setting_response.max_split_user = setting_detail.max_split_user;
    setting_response.user_ads_url = "";
    var user_id = req.body.user_id;
    if(user_id == ''){
        user_id = null;
    }
    User.findOne({_id: user_id}).then(async (user_detail)=>{
        if(user_detail && user_detail.token !== req.body.token){
            res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN, setting_detail: setting_response});
        } else {
            var response = {};
            const trip_search_query = { is_provider_status:{$gt: 1}, user_id: user_id, is_trip_cancelled: 0, is_trip_completed: 0, is_trip_end:0};
            let running_trips = await Trip.find(trip_search_query).select({_id:1}).lean()
            running_trips = running_trips.map((trip) => trip._id);

            if(user_detail){
                response.first_name = user_detail.first_name;
                response.last_name = user_detail.last_name;
                response.email = user_detail.email;
                response.country_phone_code = user_detail.country_phone_code;
                response.is_document_uploaded = user_detail.is_document_uploaded;
                response.address = user_detail.address;
                response.is_approved = user_detail.is_approved;
                response.user_id = user_detail._id;
                response.social_ids = user_detail.social_ids;
                response.social_unique_id = user_detail.social_unique_id;
                response.phone = user_detail.phone;
                response.login_by = user_detail.login_by;
                response.city = user_detail.city;
                response.country = user_detail.country;
                response.referral_code = user_detail.referral_code;
                response.rate = user_detail.rate;
                response.rate_count = user_detail.rate_count;
                response.is_referral = user_detail.is_referral;
                response.token = user_detail.token;
                response.picture = user_detail.picture;
                response.wallet_currency_code = user_detail.wallet_currency_code;

                var corporate_id = null;
                if(user_detail.corporate_ids && user_detail.corporate_ids.length>0){
                    corporate_id = user_detail.corporate_ids[0].corporate_id;
                }

                Corporate.findOne({_id: corporate_id}).then(async (corporate_detail)=>{

                    if(corporate_detail){
                        response.corporate_detail = {
                            name: corporate_detail.name,
                            phone: corporate_detail.phone,
                            country_phone_code: corporate_detail.country_phone_code,
                            status: user_detail.corporate_ids[0].status,
                            _id: corporate_detail._id
                        }
                    }

                    Country.findOne({countryphonecode: user_detail.country_phone_code}).then(async (country) => {
                        if (country) {
                            const settings = await Settings.findOne()
                            const advertise_data = settings.advertise_urls.find(obj => obj.country_id.toString() === country._id.toString());
                            if(advertise_data){
                                setting_response.user_ads_url = advertise_data.flety_user_ads_url
                            }
                            response.country_detail = {"is_referral": country.is_referral, country_code: country.alpha2}
                        } else {
                            response.country_detail = {"is_referral": false, alpha2: ""}
                        }

                        let pipeline = [
                            {$match: {'split_payment_users.user_id': user_detail._id}},
                            {$match: {'is_trip_cancelled': 0}},
                            {
                                $project: {
                                    trip_id: '$_id',
                                    is_trip_end: 1,
                                    currency: 1,
                                    user_id: 1,
                                    split_payment_users:  {
                                        $filter: {
                                            input: "$split_payment_users",
                                            as: "item",
                                            cond: {$eq: ["$$item.user_id", user_detail._id]}
                                        }
                                    }
                                }
                            },
                            {$unwind: "$split_payment_users"},
                            {$match: {
                                $or: [
                                    {'split_payment_users.status': SPLIT_PAYMENT.WAITING},
                                    {
                                        $and: [
                                            {'split_payment_users.status': SPLIT_PAYMENT.ACCEPTED},
                                            {'split_payment_users.payment_status': {$ne: PAYMENT_STATUS.COMPLETED}},
                                            {'is_trip_end': 1}
                                        ]
                                    },
                                    {
                                        $and: [
                                            {'split_payment_users.status': SPLIT_PAYMENT.ACCEPTED},
                                            {'split_payment_users.payment_status': {$ne: PAYMENT_STATUS.COMPLETED}},
                                            {'split_payment_users.payment_mode': null}
                                        ]
                                    }
                                ]
                            }},
                            {
                                $lookup:
                                        {
                                            from: "users",
                                            localField: "user_id",
                                            foreignField: "_id",
                                            as: "user_detail"
                                        }
                            },
                            {$unwind: "$user_detail"},
                            {
                                $project: {
                                    trip_id: 1,
                                    first_name: '$user_detail.first_name',
                                    last_name: '$user_detail.last_name',
                                    phone: '$user_detail.phone',
                                    country_phone_code: '$user_detail.country_phone_code',
                                    user_id: '$user_detail._id',
                                    is_trip_end: 1,
                                    currency: 1,
                                    status: '$split_payment_users.status',
                                    payment_mode: '$split_payment_users.payment_mode',
                                    payment_status: '$split_payment_users.payment_status',
                                    payment_intent_id: '$split_payment_users.payment_intent_id',
                                    total: '$split_payment_users.total',
                                }
                            },
                        ]
                        let split_payment_request = await Trip.aggregate(pipeline);
                        if(split_payment_request.length==0){
                            split_payment_request = await Trip_history.aggregate(pipeline);
                        }
                        // if(user_detail.current_trip_id){
                        //     Trip.findOne({_id: user_detail.current_trip_id}).then((trip_detail)=>{
                        //         Trip_history.findOne({_id: user_detail.current_trip_id}).then((trip_history_detail)=>{
                        //             if(!trip_detail){
                        //                 trip_detail = trip_history_detail;
                        //             }
                        //             response.trip_id = user_detail.current_trip_id;
                        //             response.provider_id = trip_detail.current_provider;
                        //             response.is_provider_accepted = trip_detail.is_provider_accepted;
                        //             response.is_provider_status = trip_detail.is_provider_status;
                        //             response.is_trip_end = trip_detail.is_trip_end;
                        //             response.is_trip_completed = trip_detail.is_trip_completed;
                        //             response.is_user_invoice_show = trip_detail.is_user_invoice_show;
                        //             res.json({success: true, setting_detail: setting_response, user_detail: response, split_payment_request: split_payment_request[0]});   
                        //         });
                        //     });
                        // } else {
                            
                            res.json({success: true, setting_detail: setting_response, user_detail: response, split_payment_request: split_payment_request[0], running_trips: running_trips});   
                        // }
                    });
                });
            } else {
                res.json({success: true, setting_detail: setting_response, running_trips: running_trips})
            }
        }
    })
}


exports.user_accept_reject_corporate_request = function (req, res) {
    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (!user) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                } else {
                    if (user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        if(req.body.is_accepted){
                            if (user.corporate_wallet_limit < 0) {
                                var wallet = utils.precisionRoundTwo(Number(user.corporate_wallet_limit));
                                var status = constant_json.DEDUCT_WALLET_AMOUNT
                                var total_wallet_amount = utils.addWalletHistory(constant_json.USER_UNIQUE_NUMBER, user.unique_id, user._id, user.country_id, user.wallet_currency_code, user.wallet_currency_code,
                                    1, Math.abs(wallet), user.wallet, status, constant_json.ADDED_BY_ADMIN, "Corporate Wallet Settlement")
                                user.wallet = total_wallet_amount;
                                user.corporate_wallet_limit = 0;
                            }

                            var index = user.corporate_ids.findIndex((x)=>x.corporate_id==req.body.corporate_id);
                            user.user_type_id = req.body.corporate_id;
                            if(index != -1){
                                user.corporate_ids[index].status = Number(constant_json.CORPORATE_REQUEST_ACCEPTED);
                            }
                            user.markModified('corporate_ids');
                            user.save().then(()=>{
                                res.json({success: true, message: success_messages.MESSAGE_CODE_CORPORATE_REQUEST_ACCEPT_SUCCESSFULLY});
                            })
                        } else {
                            var index = user.corporate_ids.findIndex((x)=>x.corporate_id==req.body.corporate_id);
                            if(index != -1){
                                user.corporate_ids.splice(index, 1);
                            }
                            user.markModified('corporate_ids');
                            user.save().then(()=>{
                                res.json({success: true, message: success_messages.MESSAGE_CODE_CORPORATE_REQUEST_REJECT_SUCCESSFULLY});
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

exports.add_favourite_driver = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {

                    user.favourite_providers.push(req.body.provider_id);
                    user.save(()=>{
                        res.json({success: true, message: success_messages.MESSAGE_CODE_ADD_FAVOURITE_DRIVER_SUCCESSFULLY});
                    }, ()=>{

                    });
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                }
            });
        }
    });
}

exports.get_favourite_driver = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {

                    var condition = {$match: {_id: {$in: user.favourite_providers}}}
                    var project = {
                        $project: {
                            first_name: 1,
                            last_name: 1,
                            picture: 1
                        }
                    }
                    Provider.aggregate([condition, project], function(error, provider_list){
                        if(error){
                            res.json({success: true, provider_list: []});
                        } else {
                            res.json({success: true, provider_list: provider_list});
                        }
                    })

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                }
            });
        }
    });
}

exports.remove_favourite_driver = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {

                    var index = user.favourite_providers.findIndex((x)=> (x).toString() == req.body.provider_id);
                    if(index !== -1){
                        user.favourite_providers.splice(index, 1);
                    }
                    user.save(()=>{
                        res.json({success: true, message: success_messages.MESSAGE_CODE_REMOVE_FAVOURITE_DRIVER_SUCCESSFULLY});
                    }, ()=>{

                    });

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                }
            });
        }
    });
}

exports.get_all_driver_list = async function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {

                    var approved_condition = {$match: {is_approved: {$eq: 1}}}
                    var country_condition = {$match: {country_phone_code: {$eq: user.country_phone_code}}}
                    var fav_condition = {$match: {_id: {$nin: user.favourite_providers}}}
                    var search = {$match: {$or: [{email: req.body.search_value}, {phone: req.body.search_value}]}}
                    var project = {
                        $project: {
                            first_name: 1,
                            last_name: 1,
                            picture: 1
                        }
                    }

                    Provider.aggregate([approved_condition, fav_condition, country_condition, search, project]).then((provider_list)=>{
                        res.json({success: true, provider_list: provider_list});
                    });

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                }
            });
        }
    });
}

exports.search_user_for_split_payment = async function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}, {name: 'search_user', type: 'string'}], async function (response) {
        if (response.success) {
            let user = await User.findOne({_id: req.body.user_id});
            if (user) {
                if (user.token != req.body.token) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else {
                    if(req.body.search_user){
                        let trip_detail = await Trip.findOne({_id: user.current_trip_id},{ split_payment_users: 1});
                        if(!trip_detail){
                            return res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_DETAIL_NOT_FOUND});
                        }

                        let phones = [];
                        let emails = [];
                        trip_detail.split_payment_users.forEach((split_payment_user_detail)=>{
                            phones.push(split_payment_user_detail.phone);
                            emails.push(split_payment_user_detail.email);
                        })

                        let search_user_detail = await User.findOne({
                            _id: {$ne: req.body.user_id},
                            phone: {$nin: phones},
                            email: {$nin: emails},
                            country_phone_code: user.country_phone_code,
                            $or: [{phone: req.body.search_user},{email: req.body.search_user}]
                        }, {first_name: 1, last_name: 1, email: 1, phone: 1, country_phone_code: 1, _id: 1, picture: 1});
                        if(search_user_detail){
                            res.json({success: true, search_user_detail: search_user_detail});
                        } else {
                            res.json({success: false, error_code: error_message.ERROR_CODE_DETAIL_NOT_FOUND});
                        }
                    } else {
                        res.json({success: false, error_code: error_message.ERROR_CODE_DETAIL_NOT_FOUND});
                    }
                }

            } else {
                res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
            }
        }
    });
}

exports.send_split_payment_request = async function (req, res) {
    try{
        utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}, {name: 'split_request_user_id', type: 'string'}, {name: 'trip_id', type: 'string'}], async function (response) {
            if (response.success) {
                let user = await User.findOne({_id: req.body.user_id})
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        let search_user_detail = await User.findOne({country_phone_code: user.country_phone_code, _id: req.body.split_request_user_id },
                            {first_name: 1, split_payment_requests: 1, last_name: 1, email: 1, phone: 1, device_token: 1, device_type: 1, country_phone_code: 1, _id: 1, picture: 1});
                        if(search_user_detail){
                            let detail = {
                                user_id: req.body.split_request_user_id,
                                first_name: search_user_detail.first_name,
                                last_name: search_user_detail.last_name,
                                phone: search_user_detail.phone,
                                country_phone_code: search_user_detail.country_phone_code,
                                email: search_user_detail.email,
                                picture: search_user_detail.picture,
                                payment_intent_id: "",
                                status: 0,
                                payment_mode: null,
                                payment_status: 0,
                                total: 0,
                                remaining_payment: 0,
                                cash_payment: 0,
                                card_payment: 0,
                                wallet_payment: 0
                            }
                            let trip_detail = await Trip.findOneAndUpdate({_id: user.current_trip_id, 'split_payment_users.user_id': search_user_detail._id}, {
                                'split_payment_users.$.status': 0
                            });

                            if(!trip_detail){
                                trip_detail = await Trip.findOneAndUpdate({_id: user.current_trip_id}, {
                                    '$push': {'split_payment_users': detail}
                                });
                            }

                            if(trip_detail){
                                let split_payment_request = {
                                    "_id": trip_detail._id,
                                    "is_trip_end": 0,
                                    "trip_id": trip_detail._id,
                                    "first_name": user.first_name,
                                    "last_name": user.last_name,
                                    "phone": user.phone,
                                    "country_phone_code": user.country_phone_code,
                                    "user_id": user._id,
                                    "status": 0,
                                    "payment_mode": null,
                                    "payment_status": 0,
                                    "payment_intent_id": "",
                                    "total": 0
                                }
                                utils.update_request_status_socket(trip_detail._id);
                                utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, search_user_detail.device_type, search_user_detail.device_token, push_messages.PUSH_CODE_FOR_SPLIT_PAYMENT_REQUEST, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, split_payment_request);
                                res.json({success: true, message: success_messages.MESSAGE_CODE_ADD_SPLIT_REQUEST_SEND_SUCCESSFULLY});

                            } else {
                                res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_DETAIL_NOT_FOUND});
                            }

                        } else {
                            res.json({success: false, error_code: error_message.ERROR_CODE_DETAIL_NOT_FOUND});
                        }

                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                }
            }
        });
    } catch(e){
        console.log(e)
    }
}

exports.accept_or_reject_split_payment_request = async function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}, {name: 'trip_id', type: 'string'}, {name: 'status', type: 'number'}], async function (response) {
        if (response.success) {
            let user = await User.findOne({_id: req.body.user_id})
            if (user) {
                if (req.body.token != null && user.token != req.body.token) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else {
                    if(req.body.status==SPLIT_PAYMENT.ACCEPTED || req.body.status==SPLIT_PAYMENT.REJECTED){
                        let trip_detail = await Trip.findOneAndUpdate({_id: req.body.trip_id, 'split_payment_users.user_id': user._id}, {
                            'split_payment_users.$.status': req.body.status
                        });
                        if(trip_detail){

                            let user = await User.findOne({_id: trip_detail.user_id})
                            if(user){
                                if(req.body.status==SPLIT_PAYMENT.ACCEPTED){
                                    utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user.device_type, user.device_token, push_messages.PUSH_CODE_FOR_ACCEPT_SPLIT_PAYMENT_REQUEST, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                } else {
                                    utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user.device_type, user.device_token, push_messages.PUSH_CODE_FOR_REJECT_SPLIT_PAYMENT_REQUEST, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                }
                            }
                            utils.update_request_status_socket(trip_detail._id);
                            if(req.body.status==SPLIT_PAYMENT.ACCEPTED){
                                res.json({success: true, message: success_messages.MESSAGE_CODE_ADD_SPLIT_REQUEST_ACCEPTED_SUCCESSFULLY});
                            } else {
                                res.json({success: true, message: success_messages.MESSAGE_CODE_ADD_SPLIT_REQUEST_REJECTED_SUCCESSFULLY});
                            }
                        }  else {
                            res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_DETAIL_NOT_FOUND});
                        }
                    } else {
                        res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                    }

                }
            } else {
                res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
            }
        }
    });
}

exports.remove_split_payment_request = async function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}, {name: 'split_request_user_id', type: 'string'}], async function (response) {
        if (response.success) {
            let user = await User.findOne({_id: req.body.user_id})
            if (user) {
                if (req.body.token != null && user.token != req.body.token) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else {

                    let trip_detail = await Trip.findOneAndUpdate({_id: user.current_trip_id, 'split_payment_users.user_id': req.body.split_request_user_id}, {
                        $pull: {split_payment_users: {user_id: req.body.split_request_user_id}}
                    });
                    if(trip_detail){
                        let user = await User.findOne({_id: req.body.split_request_user_id})
                        if(user){
                            utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user.device_type, user.device_token, push_messages.PUSH_CODE_FOR_REMOVE_SPLIT_PAYMENT_REQUEST, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                        }
                        utils.update_request_status_socket(trip_detail._id);
                        res.json({success: true, message: success_messages.MESSAGE_CODE_ADD_SPLIT_REQUEST_CANCELLED_SUCCESSFULLY});
                    }  else {
                        res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_DETAIL_NOT_FOUND});
                    }

                }
            } else {
                res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
            }
        }
    });
}

exports.update_split_payment_payment_mode = async function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}, {name: 'payment_mode', type: 'number'}], async function (response) {
        if (response.success) {
            let user = await User.findOne({_id: req.body.user_id})
            if (user) {
                if (req.body.token != null && user.token != req.body.token) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else {

                    if(req.body.payment_mode==Number(constant_json.PAYMENT_MODE_CARD)){
                        let trip = await Trip.findOne({_id: req.body.trip_id});
                        if(!trip){
                            return res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_DETAIL_NOT_FOUND});
                        }
                        let card_detail = await Card.findOne({user_id: req.body.user_id, payment_gateway_type: trip.payment_gateway_type});
                        if(!card_detail){
                            return res.json({success: false, error_code: error_message.ERROR_CODE_ADD_CREDIT_CARD_FIRST});
                        }
                    }

                    let trip_detail = await Trip.findOneAndUpdate({_id: req.body.trip_id, 'split_payment_users.user_id': user._id}, {
                        'split_payment_users.$.payment_mode': req.body.payment_mode
                    });
                    if(trip_detail){
                        res.json({success: true, message: success_messages.MESSAGE_CODE_ADD_SPLIT_REQUEST_PAYMENT_MODE_SET_SUCCESSFULLY});
                    }  else {
                        res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_DETAIL_NOT_FOUND});
                    }
                }
            } else {
                res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
            }
        }
    });
}

exports.delete_user = async function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}, {name: 'token', type: 'string'}], async function (response) {
        if (response.success) {
            let user = await User.findOne({_id: req.body.user_id})
            if (user) {
                if (req.body.token != null && user.token != req.body.token) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else {
                    let password = utils.encryptPassword(req.body.password?req.body.password:'');
                    let social_index = user.social_ids.indexOf(req.body.social_id);

                    if(social_index!==-1 || user.password==password){
                        let user_detail = await User.findOne({phone: '0000000000'});
                        if(!user_detail){
                            user_detail = new User({
                                _id: Schema('000000000000000000000000'),
                                first_name: 'anonymous',
                                last_name: 'user',
                                email: 'anonymoususer@gmail.com',
                                phone: '0000000000',
                                country_phone_code: '',
                            })
                            await user_detail.save();
                        }

                        await Trip_history.updateMany({user_id: user._id}, {user_id: user_detail._id});
                        await Trip.updateMany({user_id: user._id}, {user_id: user_detail._id});
                        await Wallet_history.updateMany({user_id: user._id}, {user_id: user_detail._id});
                        await Card.deleteMany({user_id: user._id});
                        await User_Document.deleteMany({user_id: user._id});
                        await User.deleteOne({_id: user._id});

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
        }
    });
}


exports.get_user_trip_details = async function (req, res) {
    try{
        utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}, {name: 'token', type: 'string'}, {name: 'trip_id', type: 'string'}], async function (response) {
            if (response.success) {
                let user = await User.findOne({_id: req.body.user_id, token: req.body.token})
                if (!user) {
                    return res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                }
                let trip = await Trip.findById(req.body.trip_id).lean()
                if(!trip){
                    trip = await Trip_history.findById(req.body.trip_id).lean()
                }
                if(!trip){
                    return res.json({success: false, error_code: error_message.ERROR_CODE_NO_TRIP_FOUND});
                }

                let partner = null
                let plate_number = ""
                if(trip.provider_type_id){
                    partner = await Partner.findById(trip.provider_type_id).select({country_phone_code:1,phone:1,vehicle_detail:1})
                    if(trip.assigned_vehicle_id && partner && partner.vehicle_detail.length > 0){
                        let vehicle_index = partner.vehicle_detail.findIndex(x => x._id.toString() == trip.assigned_vehicle_id.toString());
                        if(vehicle_index != -1){
                            plate_number = partner.vehicle_detail[vehicle_index].plate_no
                        }
                    }
                }

                let helpers_list = []
                if(trip.helpers_list && trip.helpers_list.length > 0){
                    helpers_list = await Helper.find({_id: {$in: trip.helpers_list}}).lean()
                }

                trip.helpers_detail = helpers_list
                if(trip.assigned_provider_id){

                }
                let cedula = await Provider_Document.findOne({provider_id: trip.assigned_provider_id, name:"Cédula"})
                cedula = cedula ? cedula.unique_code : ""
                res.json({
                    success: true,
                    trip_detail: trip,
                    partner: partner,
                    plate_no: plate_number,
                    cedula: cedula
                });
            }
        });
    } catch(e){
        console.log(e)
    }
}

exports.chat_push_notification = async function (req, res) {
    try {
        utils.check_request_params(req.body, [{name: 'trip_id', type: 'string'}], async function (response) {
            if (!response.success) {
                res.status(400).json({
                    success: false,
                    error_code: response.error_code,
                    error_description: response.error_description
                });
                return;
            }
            if(req.body.web){
                const trip_id = Schema(req.body.trip_id);
                let trip_detail = await Trip.findOne({_id: trip_id}).select({_id:1,provider_id:1, user_id:1 }).lean()
                if(!trip_detail){
                    trip_detail = await Trip_history.findOne({_id: trip_id}).select({_id:1,provider_id:1, user_id:1 }).lean()
                }
    
                const user_data = await User.findOne({_id: trip_detail.user_id}).select({device_token:1, device_type:1}).lean()
                const provider_data = await Provider.findOne({_id: trip_detail.provider_id}).select({device_token:1, device_type:1}).lean()
                const extraParam = {
                    trip_id: trip_detail._id
                }
                const user_type = req.body.web 
                let push_code = ""
                switch (Number(user_type)) {
                    case Number(constant_json.ADMIN_UNIQUE_NUMBER) :
                    push_code = push_messages.PUSH_CODE_FOR_ADMIN_SEND_MESSAGE;
                    break;
                    case Number(constant_json.PARTNER_UNIQUE_NUMBER):
                    push_code = push_messages.PUSH_CODE_FOR_PARTNER_SEND_MESSAGE;
                    break;
                    case Number(constant_json.CORPORATE_UNIQUE_NUMBER) :
                    push_code = push_messages.PUSH_CODE_FOR_CORPORATE_SEND_MESSAGE;
                    break;
                }
                if(user_data){
                    utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user_data.device_type, user_data.device_token, push_code, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, extraParam, 1);
                }
                if(provider_data){
                    utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider_data.device_type, provider_data.device_token, push_code, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, extraParam, 1);
                }
                res.json({success: true});
                return;
            }
            let user_id = req.body.user_id;
            let type = Number(req.body.type);
            let trip_id = Schema(req.body.trip_id);
            let unique_number = constant_json.USER_UNIQUE_NUMBER;
            let push_code = "";
            let Sender_table = User;
            switch (type) {
                case Number(constant_json.USER_UNIQUE_NUMBER):
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Sender_table = User;
                break;
                case Number(constant_json.PROVIDER_UNIQUE_NUMBER):
                type = Number(constant_json.PROVIDER_UNIQUE_NUMBER);
                Sender_table = Provider;
                break;
                default:
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Sender_table = User;
                break;
            }
            let sender = await Sender_table.findOne({_id: user_id, token:req.body.token}).select({device_token:1, device_type:1}).lean()
            if(!sender){
                res.json({
                    success: true,
                });
                return;
            }

            let trip_detail = await Trip.findOne({_id: trip_id}).select({_id:1,provider_id:1, user_id:1 }).lean()
            if(!trip_detail){
                res.json({
                    success: true,
                });
                return;
            }
            let Receiver_table = Provider;
            switch (type) {
                case Number(constant_json.USER_UNIQUE_NUMBER):
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Receiver_table = Provider;
                receiver_id = trip_detail.provider_id;
                unique_number = constant_json.PROVIDER_UNIQUE_NUMBER;
                push_code = push_messages.PUSH_CODE_FOR_USER_SENT_MESSAGE
                break;
                case Number(constant_json.PROVIDER_UNIQUE_NUMBER):
                type = Number(constant_json.PROVIDER_UNIQUE_NUMBER);
                Receiver_table = User;
                receiver_id = trip_detail.user_id;
                unique_number = constant_json.USER_UNIQUE_NUMBER;
                push_code = push_messages.PUSH_CODE_FOR_PROVIDER_SENT_MESSAGE;
                break;
                default:
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Receiver_table = Provider;
                receiver_id = trip_detail.provider_id;
                unique_number = constant_json.PROVIDER_UNIQUE_NUMBER;
                push_code = push_messages.PUSH_CODE_FOR_USER_SENT_MESSAGE;
                break;
            }
            let receiver = await Receiver_table.findOne({_id: receiver_id}).select({device_token:1, device_type:1}).lean()
            if(!receiver){
                res.json({success: true});
                return;
            }
            let device_type = "";
            let device_token = "";
            device_token = receiver.device_token;
            device_type = receiver.device_type;
            let extraParam = {
                trip_id: trip_detail._id
            }
            utils.sendPushNotification(unique_number, device_type, device_token, push_code, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, extraParam, 1);
            res.json({success: true});
        });
    } catch (e) {
        console.log(e);
    }

}


exports.running_trips = async function(req, res){
    try {
        let user_count = await User.count({_id: req.body.user_id, token: req.body.token})
        if(user_count == 0){
            return res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});  
        } 
        const trip_search_query = { is_provider_status:{$gt: 1}, user_id: req.body.user_id, is_trip_cancelled: 0, is_trip_completed: 0, is_trip_end:0, drop_trip_status: {$ne: CONTAINER_DROP_STATUS.DROPPED}};
        let running_trips = await Trip.find(trip_search_query).select({_id:1}).lean()
        running_trips = running_trips.map((trip) => trip._id);

        res.json({success:true,running_trips:running_trips })
    } catch (e) {
        res.json({success:true,running_trips:[] })
        console.log(e);
    }
}

exports.need_ferry = async function(req, res) {
    let result = {};

    await utils.check_request_params(
        req.body,
        [
            { name: 'origin', type: 'object' },
            { name: 'destination', type: 'object' },
        ],
        async function (response) {
            result = response;
    });

    if (!result.success) {
        return res.json({
            success: false,
            error_code: result.error_code,
            error_description: result.error_description
        });
    }

    let originCoordinates = req.body.origin;
    let destinationCoordinates = req.body.destination;
    let isMargarita = false, needFerry = false;

    const validateOriginLocation = await tripService
        .validateLocation(originCoordinates, constant_json.STATES.NUEVA_ESPARTA);

    const validateDestinationLocation = await tripService
        .validateLocation(destinationCoordinates, constant_json.STATES.NUEVA_ESPARTA);

    if(validateOriginLocation && validateDestinationLocation) {
        isMargarita = true;
        needFerry = false;
    } else if(validateOriginLocation || validateDestinationLocation) {
        isMargarita = true;
        needFerry = true;
    }

    return res.json({
        success: true,
        isMargarita,
        needFerry
    });
}


exports.user_account_deletion_info = function (req, res, next){
	res.render('user_account_deletion_page');
}

async function getNewPricing(body, new_city_type){
    let new_city_pricing_condition = {_id: {$in: new_city_type.model_pricing_ids}}

    if(body.selected_model_id){
        new_city_pricing_condition['modelid._id'] = Schema(body.selected_model_id)
    }

    if(body.selected_service_id){
        new_city_pricing_condition['serviceid._id'] = Schema(body.selected_service_id)
    }

    if(body.selected_capacity_id){
        new_city_pricing_condition['capacityid._id'] = Schema(body.selected_capacity_id)
    }

    if(
        body.selected_model_id ||
        body.selected_service_id ||
        body.selected_capacity_id
    ){
        const model_pricing_type_new = await Citytype.findOne(new_city_pricing_condition)
        model_pricing_type = model_pricing_type_new ? model_pricing_type_new : model_pricing_type
        return model_pricing_type;
    }

}

async function calculateCityWisePricing(body, model_pricing_type, originCoordinates, destinationCoordinates, citytype){
    const { lat, lng } = getCoordinatesPickDest(body.courier_flow_type, destinationCoordinates, originCoordinates, constant_json);
    const city_data = await City.findOne({ cityLatLong : { $near: [Number(lat), Number(lng)], $maxDistance: 1 }})
    const new_city_type = await Citytype.findOne({typeid: citytype.typeid, cityid: city_data._id})
    if(new_city_type?.model_pricing_ids?.length){
        model_pricing_type = await getNewPricing(body, new_city_type)
    }

    return model_pricing_type

}

function getCoordinatesPickDest(courier_flow_type, destinationCoordinates, originCoordinates, constant_json) {
    const coordinatesMap = {
        [constant_json.COURIER_CISTERNA_FLOW]: () => ({
            lat: destinationCoordinates.latitude,
            lng: destinationCoordinates.longitude
        }),
        [constant_json.COURIER_ESCOMBRO_FLOW]: () => ({
            lat: originCoordinates.latitude,
            lng: originCoordinates.longitude
        })
    };
    return (coordinatesMap[courier_flow_type] || (() => ({ lat: 0, lng: 0 })))();
}
