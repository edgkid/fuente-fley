var Trip_history = require('mongoose').model('Trip_history');
var utils = require('../controllers/utils');
var allemails = require('../controllers/emails');
var Trip = require('mongoose').model('Trip');
var crypto = require('crypto');
var fs = require('fs');
var Document = require('mongoose').model('Document');
var moment = require('moment');
var Settings = require('mongoose').model('Settings');
var City = require('mongoose').model('City');
var Citytype = require('mongoose').model('city_type');
var Provider = require('mongoose').model('Provider');
var Partner = require('mongoose').model('Partner');
var Type = require('mongoose').model('Type');
var Country = require('mongoose').model('Country');
var Provider_Document = require('mongoose').model('Provider_Document');
var xl = require('excel4node');
var fs = require("fs");
var Partner_Vehicle_Document = require('mongoose').model('Partner_Vehicle_Document');
var Provider_Vehicle_Document = require('mongoose').model('Provider_Vehicle_Document');
var myPartners = require('./partner');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var Wallet_history = require('mongoose').model('Wallet_history');
var console = require('../controllers/console');
var Card = require('mongoose').model('Card');
var Wallet_history = require('mongoose').model('Wallet_history');
var Provider = require('mongoose').model('Provider');
let Type_Models = require('mongoose').model('type_model');
let Type_Services = require('mongoose').model('type_services');
let Type_Capacity = require('mongoose').model('type_capacity');
var User = require('mongoose').model('User');
const Helper = require('mongoose').model('Helper');
const Corporate = require('mongoose').model('Corporate');
const filterService = require('../services/filter.service')
const CountryService = require("../services/country.service")

exports.register = function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        Country.find({
            isBusiness: constant_json.YES
        }).then((country) => { 
            var is_public_demo = setting_detail.is_public_demo;
            res.render("partner_register", {
                is_public_demo: is_public_demo, 
                country: country
            });
            delete message;
        });
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
};

exports.partner_create = function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        Partner.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((response) => { 

            if (response) {
                message = admin_messages.error_message_email_already_used;
                res.redirect('/partner_register');
            } else {
                Partner.findOne({phone: req.body.phone}).then((response) => { 
                    if (response) {
                        message = admin_messages.error_message_mobile_no_already_used;
                        res.redirect('/partner_register');
                    } else {
                        var password = req.body.password;
                        var hash = crypto.createHash('md5').update(password).digest('hex');

                        function randomValueHex(Len) {
                            return crypto.randomBytes(Math.ceil(Len / 2)).
                                    toString('hex').
                                    slice(0, Len);
                        }
                        var referral_code = randomValueHex(6);

                        function TokenGenerator(length) {
                            if (typeof length == "undefined")
                                length = 32
                            var token = "";
                            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                            for (var i = 0; i < length; i++)
                                token += possible.charAt(Math.floor(Math.random() * possible.length));
                            return token;
                        }

                        var first_name = req.body.first_name;
                        first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

                        var last_name = req.body.last_name;
                        last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

                        var partner_company_name = req.body.partner_company_name;
                        partner_company_name = partner_company_name.charAt(0).toUpperCase() + partner_company_name.slice(1);

                        var token = TokenGenerator(32);

                        var code = req.body.country_phone_code;
                        var code_name = code.split(' ');
                        var country_code = code_name[0];
                        var country_name = "";

                        for (i = 1; i <= (code_name.length) - 1; i++) {

                            country_name = country_name + " " + code_name[i];
                        }

                        country_name = country_name.substr(1);

                        var partnercount = 1;

                        Partner.count({}, function(error, partner_count){

                            if (partner_count) {
                                partnercount = partner_count + 1;
                            }

                            var partner = new Partner({
                                unique_id: partnercount,
                                first_name: first_name,
                                last_name: last_name,
                                email: ((req.body.email).trim()).toLowerCase(),
                                country_phone_code: country_code,
                                phone: req.body.phone,
                                password: hash,
                                address: req.body.address,
                                city: req.body.city,
                                country_id: req.body.country_id,
                                city_id: req.body.city,
                                wallet_currency_code: req.body.wallet_currency_code,
                                country: country_name,
                                partner_company_name: partner_company_name,
                                is_approved: 0,
                                wallet: 0,
                                token: token,
                                referral_code: referral_code
                            });

                            var array = [];
                            var file_list_size = 0;
                            var files_details = req.files;
                            if (files_details != null || files_details != 'undefined') {
                                file_list_size = files_details.length;

                                var file_data;
                                var file_id;
                                var file_name = "";

                                for (i = 0; i < file_list_size; i++) {

                                    file_data = files_details[i];
                                    file_id = file_data.fieldname;
                                    file_name = '';
                                    file_data_path = "";
                                    proof = "";

                                    if (file_id == 'idproof') {
                                        var image_name = partner._id + utils.tokenGenerator(5);
                                        var url = utils.getImageFolderPath(req, 8) + image_name + '.jpg';
                                        proof = url;
                                        array['proof'] = proof;
                                        utils.saveImageFromBrowser(req.files[i].path, image_name + '.jpg', 8);
                                    }

                                    if (file_id == 'pictureData') {
                                        var image_name = partner._id + utils.tokenGenerator(5);
                                        var url = utils.getImageFolderPath(req, 7) + image_name + '.jpg';
                                        if (url == undefined) {
                                            partner.picture = "";
                                        } else {
                                            partner.picture = url;
                                        }
                                        utils.saveImageFromBrowser(req.files[i].path, image_name + '.jpg', 7);
                                    }

                                }
                            }
                            // var pictureData = req.body.pictureData;
                            // if (pictureData.length != "") {
                            //     var image_name = partner._id + utils.tokenGenerator(4);
                            //     var url = utils.getImageFolderPath(req, 7) + image_name + '.jpg';
                            //     partner.picture = url;
                            //     //utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                            //     pictureData = pictureData.split(',')
                            //     pictureData = pictureData[1]
                            //     req.body.pictureData = pictureData;
                            //     utils.saveImageAndGetURL(image_name, req, res, 7);
                            // }

                            if (array.proof == undefined) {
                                partner.government_id_proof = "";
                            } else {
                                partner.government_id_proof = array.proof;
                            }

                            partner.save().then(() => { 
                                var email_notification = setting_detail.email_notification;
                                if (partner?.email) {
                                    allemails.sendPartnerRegisterEmail(partner.email, partner.country_id);
                                }
                                message = admin_messages.success_message_registration;
                                res.redirect('/partner_login');
                            }, (err) => {
                                utils.error_response(err, res)
                            });
                        });
                    }
                });
            }

        });
    } else {
        res.redirect('/partner_providers');
    }

};

exports.city_list = function (req, res) {

    // City.find({countryname: req.body.countryname, isBusiness: constant_json.YES}, function (err, data) {
    City.find({countryname: req.body.countryname}, function (err, data) {
            res.json(data);
    });

};

exports.login = function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        res.render('partner_login');
        delete message;
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
};

exports.partner_login = function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        var crypto = require('crypto');
        var password = req.body.password;
        var hash = crypto.createHash('md5').update(password).digest('hex');
        // for remove case sencitive 
        var email = req.body.email.toLowerCase();
        Partner.findOne({email: email}).then((partner) => { 
            if (!partner) {
                message = admin_messages.error_message_email_not_registered;
                res.redirect("/partner_login");
            } else {
                if (partner.password == hash) {
                    if (partner.is_approved == 1) {
                        req.session.partner = partner;

                        ////////////  token generate /////
                        function TokenGenerator(length) {
                            if (typeof length == "undefined")
                                length = 32
                            var token = "";
                            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                            for (var i = 0; i < length; i++)
                                token += possible.charAt(Math.floor(Math.random() * possible.length));
                            return token;
                        }

                        var token = TokenGenerator(32);

                        partner.token = token;

                        partner.device_token = req.body.device_token;
                        partner.save().then(() => { 
                                message = admin_messages.success_message_login;
                                res.redirect('/partner_providers');
                        }, (err) => {
                            utils.error_response(err, res)
                        });
                    } else {
                        message = admin_messages.error_message_admin_not_approved
                        res.redirect("partner_login");;
                    }
                } else {
                    message = admin_messages.error_message_password_wrong;
                    res.redirect('/partner_login');
                }
            }
        });
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
};

exports.profile = function (req, res) {
    if (typeof req.session.partner != "undefined") {
        Partner.findById(req.session.partner._id).then((response) => { 
            let rif = []
            if(response){
                let str = response.rif;
                rif = str.split(/-(.+)/).slice(0, 2);

            }
            Country.findOne({countryname: response.country}).then((countrydata) => { 
                    var is_public_demo = setting_detail.is_public_demo;
                    req.session.partner = response;
                    
                    const templateName = process.env.INTEGRATION_NEW_TRAVEL === 'true' ? "partner_profile" : "partner_profile_old";
                    console.log(templateName, 'templateName');
                    res.render(templateName, {
                        phone_number_min_length: setting_detail.minimum_phone_number_length, 
                        phone_number_length: setting_detail.maximum_phone_number_length, 
                        is_public_demo: is_public_demo, 
                        login1: response, 
                        countrydata,
                        rif:rif,
                        new_profile: process.env.NEW_COORPARTE_PROFILE
                    });
                    delete message;
            });
        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.edit_profile = function (req, res) {
    if (typeof req.session.partner != "undefined") {

        var id = req.body.id
        Partner.findOne({phone: req.body.phone, _id: {$ne: id}}).then((user) => { 
            if (user)
            {
                message = admin_messages.error_message_mobile_no_already_used;
                res.redirect('/profiles')
            } else
            {
                Partner.findById(id).then((partner_detail) => { 
                    var crypto = require('crypto');
                    var password = req.body.password;
                    if(req.body.rif0 != '' && req.body.rif1){
                        req.body.rif = req.body.rif0+'-'+req.body.rif1
                    }
                    var hash = crypto.createHash('md5').update(password).digest('hex');
                    if (partner_detail.password == hash) {
                        delete req.body.password;

                        
                        var file_list_size = 0;
                        var files_details = req.files;

                        if (files_details != null || files_details != 'undefined') {
                            file_list_size = files_details.length;

                            var file_data;
                            var file_id;

                            for (i = 0; i < file_list_size; i++) {

                                file_data = files_details[i];
                                file_id = file_data.fieldname;

                                if (file_id == 'government_id_proof') {
                                    utils.deleteImageFromFolder(partner_detail.government_id_proof, 8);
                                    var image_name = partner_detail._id + utils.tokenGenerator(5);
                                    var url = utils.getImageFolderPath(req, 8) + image_name + '.jpg';
                                    req.body.government_id_proof = url;
                                    utils.saveImageFromBrowser(req.files[i].path, image_name + '.jpg', 8);
                                }

                                if (file_id == 'pictureData') {
                                    utils.deleteImageFromFolder(partner_detail.picture, 7);

                                    var image_name = partner_detail._id + utils.tokenGenerator(5);
                                    var url = utils.getImageFolderPath(req, 8) + image_name + '.jpg';
                                    req.body.picture = url;
                                    utils.saveImageFromBrowser(req.files[i].path, image_name + '.jpg', 8);
                                }

                                if (file_id == 'rif_url' && (!partner_detail.rif_url || partner_detail.rif_url == "")) {
                                    utils.deleteImageFromFolder(partner_detail.rif_url, 8);
        
                                    let mime_type = req.files[i].mimetype.split('/')[1]
                                    let file_name = partner_detail._id + utils.tokenGenerator(5);
                                    let url = utils.getImageFolderPath(req, 8) + file_name + '.' + mime_type;
        
                                    req.body.rif_url = url;
                                    utils.saveImageFromBrowser(req.files[i].path, file_name + '.' + mime_type, 8);
                                }
        
                                if (file_id == 'document_2' && (!partner_detail.document_2 || partner_detail.document_2 == "")) {
                                    utils.deleteImageFromFolder(partner_detail.document_2, 8);
        
                                    var image_name = partner_detail._id + utils.tokenGenerator(5);
        
                                    var url = utils.getImageFolderPath(req, 8) + image_name + '.pdf';
                                    req.body.document_2 = url;
                                    utils.saveImageFromBrowser(req.files[i].path, image_name + '.pdf', 8);
                                }
        
                            }
                            Partner.findByIdAndUpdate(id, req.body, {new : true}).then((user) => { 
    
                                req.session.partner = user;
                                message = admin_messages.success_message_profile_update;
                                res.redirect('profile');
                            });
                        }
                    } else {
                        message = admin_messages.error_message_current_password_wrong;
                        res.redirect('profile');
                    }
                })
            }
        });

    } else {
        res.redirect('/partner_login');
    }
};


exports.add = function (req, res) {
    if (typeof req.session.partner != 'undefined') {

        Country.findOne({countryname: req.session.partner.country}).then((country_detail) => { 

            City.find({countryid: country_detail._id, isBusiness: constant_json.YES}).then((citydata) => { 
                res.render("partner_provider_detail_edit", {citydata: citydata, country_phone_code: country_detail.countryphonecode, phone_number_min_length: setting_detail.minimum_phone_number_length, phone_number_length: setting_detail.maximum_phone_number_length});
                delete message;
            });
        });
    } else {
        res.redirect('/partner_login');
    }
}


exports.create_provider = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Provider.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((response) => {

            if (response) {
                alert_message_type = "alert-danger";
                message = admin_messages.error_message_email_already_used;
                res.redirect('/partner_providers');
            } else {
                Provider.findOne({phone: req.body.phone}).then((response) => {

                    
                    if (response) {
                        alert_message_type = "alert-danger";
                        message = admin_messages.error_message_mobile_no_already_used;
                        res.redirect('/partner_providers');
                    } else {
                        City.findOne({cityname: req.body.city}).then((city) => { 
                            var city_id = city._id;
                            var password = req.body.password;
                            var token = utils.tokenGenerator(32);
                            var first_name = req.body.first_name;
                            var last_name = req.body.last_name;
                            var zipcode = "";
                            var address = "";
                            if (first_name != undefined) {
                                first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                            }
                            if (last_name != undefined) {
                                last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                
                            }
                
                            if (zipcode != undefined)
                            {
                                zipcode = req.body.zipcode;
                            }
                            if (address != undefined)
                            {
                                address = (req.body.address).trim();
                            }
                
                            var referral_code = (utils.tokenGenerator(8)).toUpperCase();
                            var provider = new Provider({
                                first_name: first_name,
                                last_name: last_name,
                                country_phone_code: req.body.country_phone_code,
                                email: ((req.body.email).trim()).toLowerCase(),
                                phone: req.body.phone,
                                password: utils.encryptPassword(password),
                                service_type: null,
                                referral_code: referral_code,
                                car_model: req.body.car_model,
                                car_number: req.body.car_number,
                                device_token: "",
                                device_type: "",
                                bio: "",
                                address: address,
                                zipcode: zipcode,
                                social_unique_id: "",
                                login_by: "",
                                device_timezone: "",
                                providerLocation: [
                                    0,
                                    0
                                ],
                                city: req.body.city,
                                cityid: city_id,
                                country: req.session.partner.country,
                                token: token,
                                is_available: 1,
                                is_document_uploaded: 0,
                                is_active: 0,
                                is_approved: 0,
                                is_partner_approved_by_admin: 1,
                                rate: 0,
                                rate_count: 0,
                                is_trip: [],
                                admintypeid: null,
                                wallet: 0,
                                partner_name: req.session.partner.first_name + ' ' + req.session.partner.last_name,
                                bearing: 0,
                                picture: "",
                                provider_type: Number(constant_json.PROVIDER_TYPE_PARTNER),
                                provider_type_id: req.session.partner._id
                            });
                
                
                            if (req.files != undefined) {
                                if(req.files.length != 0){
                                    var image_name = provider._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                    provider.picture = url;
                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                                }
                            }
                
                            Country.findOne({countryname: provider.country}).then((country) => { 
                
                                if (country) {
                                    var country_id = country._id;
                                    Document.find({countryid: country_id, type: 1}).then((document) => { 
                
                                        var is_document_uploaded = 0;
                                        var document_size = document.length;
                                        if (document_size !== 0) {
                                            var count = 0;
                                            for (var i = 0; i < document_size; i++) {
                                                if (document[i].option == 0) {
                                                    count++;
                                                } else {
                                                    break;
                                                }
                                            }
                
                                            if (count == document_size) {
                                                is_document_uploaded = 1;
                                            }
                
                
                                            document.forEach(function (entry) {
                                                var providerdocument = new Provider_Document({
                                                    provider_id: provider._id,
                                                    document_id: entry._id,
                                                    name: entry.title,
                                                    option: entry.option,
                                                    document_picture: "",
                                                    unique_code: entry.unique_code,
                                                    expired_date: "",
                                                    degree: "",
                                                    issue_date: null,
                                                    is_degree: document.is_degree,
                                                    is_issue_date: document.is_issue_date,                                    
                                                    is_unique_code: entry.is_unique_code,
                                                    is_expired_date: entry.is_expired_date,
                                                    is_document_expired: false,
                                                    is_uploaded: 0
                
                                                });
                
                                                provider.is_document_uploaded = is_document_uploaded;
                                                providerdocument.save().then(() => {
                                                }, (err) => {
                                                    console.log(err);
                                                });
                                            });
                
                                        } else {
                                            is_document_uploaded = 1;
                                            provider.is_document_uploaded = is_document_uploaded;
                                        }
                                        provider.wallet_currency_code = country.currencycode;
                                        provider.save().then(() => { 
                                                if (provider?.email) {
                                                    allemails.sendProviderRegisterEmail(provider.email, provider.country_id);
                                                }                                
                                                message = "Provider Add Successfully"
                                                res.redirect('/partner_providers');
                                                setTimeout(() => {
                                                    delete message;
                                                }, 1000)
                                        }, (err) => {
                                                    utils.error_response(err, res)
                                        });
                                    });
                                } else
                                {
                                    res.json({success: false});
                                }
                
                            });
                        });
                    }
                });
            }
        });
        


    } else {
        res.redirect('/partner_login');
    }
};


exports.edit = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        var id = req.body.id;
        Provider.findById(id).then((providers) => { 
            var city_type = providers.city;
            city_type_query = {};
            city_type_query['cityname'] = city_type;

            var lookup = {
                $lookup:
                        {
                            from: "types",
                            localField: "typeid",
                            foreignField: "_id",
                            as: "type_detail"
                        }
            };
            var unwind = {$unwind: "$type_detail"};
            Country.findOne({"countryname": providers.country}).then((country_detail) => { 
                City.find({"countryname": providers.country, isBusiness: constant_json.YES}).then((city_list) => { 

                    var cityid_condition = {$match: {'cityid': {$eq: Schema(providers.cityid)}}};

                    Citytype.aggregate([cityid_condition, lookup, unwind]).then((type_available) => { 
                        var is_public_demo = setting_detail.is_public_demo;
                        res.render('partner_provider_detail_edit', {city_list: city_list, country_phone_code: country_detail.countryphonecode, phone_number_min_length: setting_detail.minimum_phone_number_length, phone_number_length: setting_detail.maximum_phone_number_length, is_public_demo: is_public_demo, data: providers, service_type: type_available, 'moment': moment});
                        delete message;
                    }, (err) => {
                                    utils.error_response(err, res)
                    });
                });
            });
            
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.update = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        var id = req.body.id;
        var first_name = req.body.first_name;
        req.body.first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

        var last_name = req.body.last_name;
        req.body.last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

        if(req.body.password){
            var crypto = require('crypto');
            var hash = crypto.createHash('md5').update(req.body.password).digest('hex');
            req.body.password = hash;
        }
        
        Citytype.findOne({_id: req.body.service_type}).then((citytype) => { 
            if (citytype)
            {
                req.body.admintypeid = citytype.typeid;
            } else
            {
                req.body.service_type = null;
                req.body.admintypeid = null;
            }
            City.findOne({cityname: req.body.city}).then((city) => { 
                if (city)
                {
                    req.body.cityid = city._id;
                }
                if (typeof req.files == 'undefined') {

                    Provider.findByIdAndUpdate(id, req.body).then(() => { 
                            res.redirect("/partner_providers");
                        
                    });
                } else {
                    Provider.findOne({ _id: id }).then((provider) => {
                        if (req.files.length != 0) {
                            var picture = req.files[0].originalname;
                            if (picture != "") {

                                utils.deleteImageFromFolder(provider.picture, 2);
                                var image_name = id + utils.tokenGenerator(4);
                                var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                req.body.picture = url;
                                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                            }
                        }
                        Provider.findByIdAndUpdate(id, req.body).then(() => {
                            res.redirect("/partner_providers");
                        })
                    });
                }
            });
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.partner_provider_history = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {

        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var sort_order;
        var sort_field;
        var filter_start_date;
        var filter_end_date;

        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }
        if (req.body.search_item == undefined) {
            search_item = 'user_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';
        } else {
            search_item = req.body.search_item;
            search_value = req.body.search_value;
            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;
        }

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                var date = new Date(Date.now());
                date = date.setHours(0, 0, 0, 0);
                start_date = new Date(0);
                end_date = new Date(Date.now());
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            end_date = new Date(Date.now());
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        var number_of_rec = 10;


        var lookup = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        var unwind1 = {$unwind: "$provider_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {

            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        var filter = {"$match": {}};
        filter["$match"]['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        var condition = {"$match": {'provider_id': {$eq: Schema(req.body.id)}}};

        Trip_history.aggregate([filter, condition, lookup, unwind, lookup1, unwind1, search, count]).then((array) => { 
            if (array.length == 0) {
                res.render('partner_providers_history', { detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date });
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip_history.aggregate([filter, condition, lookup, unwind, lookup1, unwind1, search, sort, skip, limit]).then((array) => { 
                    res.render('partner_providers_history', { detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date });
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
        
    } else {
        res.redirect('/partner_login');
    }

};

exports.partner_trip_map = async function (req, res) {
     if (typeof req.session.partner == 'undefined') {
        res.redirect('/partner_login');
    } else {
        var id = req.body.id;
        var user_name = req.body.u_name;
        var provider_name = req.body.pr_name;
        var query = {};
        query['tripID'] = id;
        var Trip_Location = require('mongoose').model('trip_location');

        Trip.findById(id).then(async (trips) => { 
            if(!trips){
                trips = await Trip_history.findById(id)
            }
            const partnerId = trips.provider_type_id;   // este es el partner dueño del vehículo
            const plate = trips?.assigned_vehicle_details?.vehicle_plate_no;

            let vehicleFound = null;

            if (partnerId && plate) {

                const Partner = require('mongoose').model('Partner');  
                const partner = await Partner.findById(partnerId);

                if (partner && Array.isArray(partner.vehicle_detail)) {
                    vehicleFound = partner.vehicle_detail.find(v => v.plate_no == plate);
                }
            }

            if (vehicleFound) {
                trips.assigned_vehicle_details.hasDevicesTemperature = vehicleFound.hasDevicesTemperature;
            }

 
            Trip_Location.findOne(query).then((locations) => { 
                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places&callback=initialize"
                if (!locations) {
                    res.render('partner_trip_map', {'data': trips, 'url': url, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});

                } else { 
                      res.render('partner_trip_map', {'data': trips, 'url': url, 'trip_path_data': locations, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});
                }
            });
        });
    }
};

exports.documents = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        var id = req.body.id;
        query = {};
        query['provider_id'] = id;
        Provider_Document.find(query).then((array) => { 
                res.render('partner_provider_documents', {detail: array, id: id});
            
        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.partner_forgot_password = function (req, res) {

    if (typeof req.session.partner == 'undefined') {
        res.render('partner_forgot_password');
        delete message;
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
}

exports.partner_forgot_password_email = function (req, res) {

    if (typeof req.session.partner == "undefined") {
        Partner.findOne({email: req.body.email}).then((response) => { 
            if (response) {
                function TokenGenerator(length) {
                    if (typeof length == "undefined")
                        length = 32
                    var token = "";
                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                    for (var i = 0; i < length; i++)
                        token += possible.charAt(Math.floor(Math.random() * possible.length));
                    return token;
                }

                var token = TokenGenerator(32);
                var id = response.id;
                var link = 'https://' + req.get('host') + '/partner_newpassword?id=' + id + '&&token=' + token;


                utils.mail_notification(response.email, req.__('reset_password'), link);


                Partner.findOneAndUpdate({_id: id}, {token: token}).then(() => { 
                    
                        message = admin_messages.success_message_send_link;
                        res.redirect("/partner_login");
                    
                });

            } else {
                message = admin_messages.error_message_email_not_registered;
                res.redirect('/partner_forgot_password');
            }
        });
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
}

exports.edit_psw = function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        var id = req.query.id;
        var token = req.query.token;
        res.render('partner_new_password', {'id': id, 'token': token});
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
}

exports.update_psw = function (req, res) {

    if (typeof req.session.partner == "undefined") {
        var query = {};
        query['_id'] = req.body.id;
        query['token'] = req.body.token;

        var password = req.body.password;
        var hash = crypto.createHash('md5').update(password).digest('hex');

        function TokenGenerator(length) {
            if (typeof length == "undefined")
                length = 32
            var token = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < length; i++)
                token += possible.charAt(Math.floor(Math.random() * possible.length));
            return token;
        }
        var token = TokenGenerator(32);

        Partner.findOneAndUpdate(query, {password: hash, token: token}).then((response) => { 
            if (!response) {
                res.redirect('partner_forgot_password');
            } else {
                res.redirect('partner_login');
            }
        });
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
}



exports.sign_out = function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/partner_login');
        }
    });
}

exports.list = function (req, res, next) {

    if (typeof req.session.partner != "undefined") {
        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        let selected_country_id = req.body.selected_country_id || null

        // query['provider_type_id'] = req.session.partner._id;
        var partner_condition = {partner_ids:{$elemMatch: {partner_id:Schema(req.session.partner._id), status:1}}}
        
        if (req.body.search_item == undefined) {
            sort['_id'] = -1;

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';

        } else {

            var item = req.body.search_item;
            var value = req.body.search_value;


            search_item = item
            search_value = value;

        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }
        Provider.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query, partner_condition]}).then((provider_count) => { 

            if (provider_count != 0) {
                var provider_count = provider_count / 10;
                provider_count = Math.ceil(provider_count);

                if (req.body.page == undefined) {
                    page = 1;
                    next = parseInt(req.query.page) + 1;
                    pre = req.query.page - 1;

                    var options = {
                        sort: {unique_id: -1},
                        page: page,
                        limit: 10
                    };
                } else {
                    page = req.body.page;
                    next = parseInt(req.body.page) + 1;
                    pre = req.body.page - 1;


                }

                Provider.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query, partner_condition]}, options).then((providers) => { 
                    if (providers.docs.length <= 0) {
                        res.render('partner_providers_list', {
                            detail: [], currentpage: providers.page, pages: providers.pages,
                            next: next, pre: pre, id: req.session.partner._id, search_item, search_value
                        });
                        delete message;
                    } else {
                        var is_public_demo = setting_detail.is_public_demo;
                        var j = 1;
                        providers.docs.forEach(function (data) {
                            if (data.service_type == null) {
                                if (j == providers.docs.length) {
                                    data.service_type = null;
                                    res.render('partner_providers_list', {is_public_demo: is_public_demo,
                                        detail: providers.docs, currentpage: providers.page, pages: providers.pages,
                                        next: next, pre: pre, id: req.session.partner._id, search_item, search_value
                                    });
                                    delete message;
                                } else {
                                    data.service_type = null;
                                    j++;
                                }
                            } else {
                                Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                                    Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 

                                        if (j == providers.docs.length) {
                                            data.service_type_name = type_data.typename;
                                            res.render('partner_providers_list', {is_public_demo: is_public_demo,
                                                detail: providers.docs, currentpage: providers.page, pages: providers.pages,
                                                next: next, pre: pre, id: req.session.partner._id, search_item, search_value
                                            });
                                            delete message;
                                        } else {
                                            data.service_type_name = type_data.typename;
                                            j++;
                                        }
                                    });
                                });
                            }

                        });
                    }
                });
            } else {

                res.render('partner_providers_list', {
                    detail: array, currentpage: '', pages: '',
                    next: '', pre: '', id: req.session.partner._id, search_item, search_value
                });
                delete message;
            }
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.partner_list = async function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var query = {};
        var sort = {};
        var array = [];
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var sort_order;
        var sort_field;
        var filter_start_date;
        var filter_end_date;
        let search = [];
        let city_condition = {};
        let selected_country_id = req.body.selected_country_id || null

        if (req.body.page == undefined) {

            if (req.session.page != undefined) {
                var field = sort_field;
                var order = sort_order;
                var item = search_item;
                var value = search_value;

                var start_date = filter_start_date;
                var end_state = filter_end_date;

                sort[field] = order;
                req.body.page = req.session.page;
                delete req.session.page;
            } else {
                sort['_id'] = -1;

                search_item = 'first_name';
                search_value = '';
                sort_order = -1;
                sort_field = 'unique_id';
                filter_start_date = '';
                filter_end_date = '';

                var start_date = '';
                var end_state = '';
            }
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;

        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            search = partnerListSearchQueries(full_name, item, value);
        } else if (item == 'active') {
            query["is_approved"] = {$eq: 1}
        } else if (item == 'inactive') {
            query["is_approved"] = {$eq: 0}
        } else if (item != 'completed') {

            if (item != undefined) {
                value = value.toString().replace('+','');

                query[item] = new RegExp(value, 'i');
            }
        }
        if (search.length == 0) {
            search = [{}];
        }
        const cities = await City.find({ isBusiness: 1 },{cityname:1})
        if(req.body.selected_city != undefined && req.body.selected_city != ""){
            city_condition["city_id"] = {$eq: Schema(req.body.selected_city)}
        }

        const admin = req.session.admin

        if(!admin.super_admin){
            city_condition["country_id"] = {$eq: Schema(admin.country_id)}
        }else{
            if(selected_country_id){
                city_condition['country_id'] = {$eq: Schema(selected_country_id)}
            }
        }
        const countries = await CountryService.getCountries()

        Partner.count({$and: [{$or: search}, query, city_condition]}).then((partnercount) => { 
            var sort = {"$sort": {}};
                let number_of_rec = 10
            if (partnercount != 0) {
                if (req.body.page == undefined) {
                    page = 0;
                    next = 1;
                    pre = -1;        
                    sort["$sort"]["unique_id"] = parseInt(-1);
                } else {
                    page = req.body.page;
                    next = parseInt(req.body.page) + 1;
                    pre = req.body.page - 1;

                    if (field == 'first_name') {
                        sort["$sort"]["first_name"] = parseInt(order);
                    } else if (field == 'unique_id') {
                        sort["$sort"]["unique_id"] = parseInt(order);
                    } else {
                        sort["$sort"]["email"] = parseInt(order);
                    }

                }
                let skip = {};
                skip["$skip"] = page * number_of_rec;
                
                let limit = {};
                limit["$limit"] = number_of_rec;

                
                const pipeline = [
                    {
                        $match: {
                            $and: [
                                { $or: search },
                                query,
                                city_condition
                            ]
                        }
                    },
                    sort, 
                    skip, 
                    limit,
                    {
                        $lookup: {
                            from: 'trip_histories',
                            let: { provider_type_id: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$provider_type_id", "$$provider_type_id"] },
                                                { $eq: ["$is_trip_completed", 1] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: 'trips'
                        }
                    },
                    {
                        $lookup: {
                            from: 'providers',
                            let: { partnerId: "$_id" },
                            pipeline: [
                                {
                                    $unwind: "$partner_ids"
                                },
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$partner_ids.partner_id", "$$partnerId"] },
                                                { $eq: ["$partner_ids.status", 1] }
                                            ]
                                        }
                                    }
                                }                            
                            ],
                            as: 'providers'
                        }
                    },
                    {
                        $project: {
                            id: "$_id",
                            unique_id: 1,
                            rif: 1, 
                            vehicle_detail: {
                                $size: {
                                    $filter: {
                                        input: "$vehicle_detail",
                                        as: "detail",
                                        cond: { $eq: ["$$detail.state", 1] }
                                    }
                                }
                            },
                            providerCount: { $size: "$providers" },
                            tripCount: { $size: "$trips" },
                            first_name: 1,
                            last_name: 1,
                            partner_company_name: 1,
                            email: 1,
                            country_phone_code: 1,
                            phone: 1,
                            country: 1,
                            picture: 1,
                            is_approved: 1,
                            rif_url: 1, 
                            document_2:1,
                            city_id: 1,
                            government_id_proof: 1
                        }
                    }
                ];
                const completed_trips_condition = 
                {
                    $match: {
                        tripCount: { $gt: 0 }
                    }
                }
                if (item == 'completed') {
                    pipeline.push(completed_trips_condition)
                }
                Partner.aggregate(pipeline).then((array) => {
                    if (!array || array.length == 0){
                        res.render('partner_list', { detail: [], current_page: 1, pages: 0, next: 1, pre: 0, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, cities, selected_city: req.body.selected_city, countries, selected_country_id });
                        delete message;
                    } else {
                        var is_public_demo = setting_detail.is_public_demo;
                        let pages = Math.ceil(partnercount / number_of_rec);
                        res.render('partner_list', { is_public_demo: is_public_demo, detail: array, current_page: page, pages: pages, next: next, pre: pre, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, cities, selected_city: req.body.selected_city, countries, selected_country_id });
                        delete message;
                    }

                }, (err) => {
                    console.log(err)
                })
            } else {
                res.render('partner_list', {
                    detail: array, currentpage: '', pages: '',
                    next: '', pre: '',sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date,
                    cities, selected_city: req.body.selected_city, countries, selected_country_id
                });
                delete message;
            }
        });
    } else {
        res.redirect('/admin');
    }

};

exports.partner_provider_list = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var query = {};
        var partner_condition = {};
        var sort = {};
        var array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        partner_condition = {partner_ids:{$elemMatch: {partner_id:Schema(req.body.id)}}}

        // query['provider_type_id'] = req.body.id;
        if (!req.body.id) {
            partner_condition = {partner_ids:{$elemMatch: {partner_id:Schema(req.query.provider_type_id)}}}
            // query['provider_type_id'] = req.query.provider_type_id;
        }
        if (req.body.search_item == undefined) {
            sort['_id'] = -1;

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'Id';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_state = '';
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;
        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }


        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }
        Provider.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query, partner_condition]}).then((provider_count) => { 

            if (provider_count != 0) {
                var provider_count = provider_count / 10;
                provider_count = Math.ceil(provider_count);


                if (req.body.page == undefined) {
                    page = 1;
                    next = parseInt(req.query.page) + 1;
                    pre = req.query.page - 1;

                    var options = {
                        sort: {unique_id: -1},
                        page: page,
                        limit: 10
                    };
                } else {
                    page = req.body.page;
                    next = parseInt(req.body.page) + 1;
                    pre = req.body.page - 1;

                    if (field == 'first_name') {
                        var options = {
                            sort: {first_name: order},
                            page: page,
                            limit: 10
                        };
                    } else if (field == 'Id') {
                        var options = {
                            sort: {unique_id: order},
                            page: page,
                            limit: 10
                        };
                    } else {
                        var options = {
                            sort: {email: order},
                            page: page,
                            limit: 10
                        };
                    }

                }

                Provider.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query, partner_condition]}, options).then((providers) => { 
                    if (providers.docs.length <= 0) {
                        res.render('admin_partner_providers_list', {
                            id: req.body.id, detail: [], currentpage: providers.page, pages: providers.pages,
                            next: next, pre: pre,sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date
                        });
                    } else {
                        var is_public_demo = setting_detail.is_public_demo;
                        var j = 1;
                        providers.docs.forEach(function (data) {
                            if (data.service_type == null) {
                                if (j == providers.docs.length) {
                                    data.service_type_name = null;
                                    res.render('admin_partner_providers_list', {is_public_demo: is_public_demo,
                                        id: req.body.id, detail: providers.docs, currentpage: providers.page, pages: providers.pages,
                                        next: next, pre: pre,sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date
                                    });
                                } else {
                                    data.service_type_name = null;
                                    j++;
                                }
                            } else {
                                Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                                    Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 

                                        if (j == providers.docs.length) {
                                            data.service_type_name = type_data.typename;
                                            res.render('admin_partner_providers_list', {is_public_demo: is_public_demo,
                                                id: req.body.id, detail: providers.docs, currentpage: providers.page, pages: providers.pages,
                                                next: next, pre: pre,sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date
                                            });
                                            delete message;
                                        } else {
                                            data.service_type_name = type_data.typename;
                                            j++;
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            } else {

                res.render('admin_partner_providers_list', {
                    id: req.body.id, detail: array, currentpage: '', pages: '',
                    next: '', pre: '',sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date
                });
                delete message;
            }
        });
    } else {
        res.redirect('/admin');
    }
};


exports.partner_is_approved = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var is_approved = req.body.is_approved;

        if (is_approved == 0) {
            var change = 1;
        } else {
            var change = 0;
        }

        Partner.findByIdAndUpdate(id, {is_approved: change}).then((partnerdata) => { 
            utils.sendPushNotification(constant_json.PARTNER_UNIQUE_NUMBER, "web", "", push_messages.PUSH_CODE_FOR_PROVIDER_APPROVED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, "", partnerdata.webpush_config);

            Provider.find({provider_type_id: id}).then((pro_data) => { 
                Provider.updateMany({provider_type_id: id}, {is_partner_approved_by_admin: change}, {multi: true}).then(() => { 

                    // req.session.page = req.body.page;
                    if (is_approved == 0) {
                        var email_notification = setting_detail.email_notification;
                        if (email_notification == true) {
                            allemails.sendPartnerApprovedEmail(req, partnerdata);
                            pro_data.forEach(function (provider) {
                                if (provider.is_approved == 1) {
                                    allemails.sendProviderApprovedEmail(req, provider);
                                }
                            });
                        }
                        pro_data.forEach(function (provider) {
                            if (provider.is_approved == 1) {
                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, push_messages.PUSH_CODE_FOR_PROVIDER_APPROVED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                            }
                        });
                        message = admin_messages.success_message_partner_approved;
                        res.redirect("/partners");
                    } else {
                        allemails.sendPartnerDeclineEmail(req, partnerdata);
                        message = admin_messages.success_message_partner_declined;
                        pro_data.forEach(function (provider) {
                            if (provider.is_approved == 1) {
                                allemails.sendProviderDeclineEmail(req, provider);
                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, push_messages.PUSH_CODE_FOR_PROVIDER_DECLINED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                            }
                            provider.save().then(() => { 
                            }, (err) => {
                                    console.log(err);
                            });

                        });

                        res.redirect("/partners");
                    }
                });
            });
        });
    } else {
        res.redirect('/admin');
    }
};

exports.partner_detail = function (req, res) {

    if (typeof req.session.userid != 'undefined') {
        Partner.findById(req.body.id).then((partnerdata) => { 
       
            var is_public_demo = setting_detail.is_public_demo;
            res.render("partner_detail", {partnerdata: partnerdata, is_public_demo: is_public_demo});
           
        });
    } else {
        res.redirect('/admin');
    }
}

exports.partner_requests = async function (req, res, next) {

    if (typeof req.session.partner != 'undefined') {
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var sort_order;
        var sort_field;
        var filter_start_date;
        var filter_end_date;
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'unique_id';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

        } else {
            var request = req.body.request;
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');


            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

        }

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                var date = new Date(Date.now());
                date = date.setHours(0, 0, 0, 0);
                start_date = new Date(0);
                end_date = new Date(Date.now());
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            end_date = new Date(Date.now());
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }
        var Table = Trip_history
        if (request == 'partner_requests') {
            Table = Trip;
        }

        var number_of_rec = 10;
        const type_lookup = {
            $lookup:
                    {
                        from: "types",
                        localField: "type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        const type_unwind = {$unwind: "$type_detail"};

        var lookup = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "assigned_provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };
        var lookup2 = {
            $lookup:
                    {
                        from: "helpers",
                        localField: "helpers_list",
                        foreignField: "_id",
                        as: "helper_details"
                    }
        };


        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        
        let search = filterService.handleSearch(search_item, value, constant_json.PARTNER_UNIQUE_NUMBER);
        
        var partnerid = Schema(req.session.partner._id);
        var condition = {'provider_type_id': {$eq: Schema(partnerid)}};

        let partner = req.session.partner
        
        const country = await Country.findOne({
            _id: partner.country_id,
        })
        const countries = await CountryService.getCountries()

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
        filter["$match"]['country_id'] = { $eq: country._id };

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        var partner_condition = {};
        partner_condition['admin_assigned_partner_id'] = {$eq: partnerid}
        partner_condition ={ $match: {$or: [condition,partner_condition]}};
        let drop_trip_condition = { $match: {$or: [{drop_trip_status: {$ne:CONTAINER_DROP_STATUS.DROPPED}},{drop_trip_status: {$eq:CONTAINER_DROP_STATUS.DROPPED}, assigned_provider_id: {$ne: null}}]} }

        Table.aggregate([partner_condition, drop_trip_condition, lookup, unwind, lookup1, lookup2, search, filter, count]).then((array) => { 
            if (!array || array.length == 0) {
                array = [];
                res.render('partner_request_list', { detail: array, request: request, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date,id: partnerid, partner: req.session.partner, timezone_for_display_date: setting_detail.timezone_for_display_date, countries });
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Table.aggregate([partner_condition, drop_trip_condition, lookup, unwind, lookup1, lookup2, search, filter, sort, skip, limit, type_lookup, type_unwind]).then((array) => { 
                    res.render('partner_request_list', { detail: array, request: request, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date,id: partnerid, partner: req.session.partner, timezone_for_display_date: setting_detail.timezone_for_display_date, countries });
                });
            }
        }, (err) => {
                        utils.error_response(err, res)
        });
    } else {
        res.redirect('/partner_login');
    }

};

exports.partner_pending_requests = async function (req, res, next) {

    if (typeof req.session.partner != 'undefined') {
        let page;
        let next;
        let pre;
        let search_item;
        let search_value;
        let sort_order;
        let sort_field;
        let filter_start_date;
        let filter_end_date;
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'unique_id';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

        } else {
            var request = req.body.request;
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');


            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

        }

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                var date = new Date(Date.now());
                date = date.setHours(0, 0, 0, 0);
                start_date = new Date(0);
                end_date = new Date(Date.now());
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            end_date = new Date(Date.now());
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        const number_of_rec = 10;
        const type_lookup = {
            $lookup:
            {
                from: "types",
                localField: "vehicle_detail.admin_type_id",
                foreignField: "_id",
                as: "type_detail"
            }
        };

        const lookup = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        const unwind = {$unwind: "$user_detail"};



        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        
        let search = filterService.handleSearch(search_item, value, constant_json.PARTNER_UNIQUE_NUMBER);
        
        const partnerid = Schema(req.session.partner._id);
        let condition = {'provider_type_id': {$eq: Schema(partnerid)}};

        let partner = req.session.partner
        
        const country = await Country.findOne({
            _id: partner.country_id,
        })
        const countries = await CountryService.getCountries()

        let filter = {"$match": {}};
        filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
        filter["$match"]['country_id'] = { $eq: country._id };

        let sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        let count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        let skip = {};
        skip["$skip"] = page * number_of_rec;

        let limit = {};
        limit["$limit"] = number_of_rec;

        let partner_condition = {};
        partner_condition['admin_assigned_partner_id'] = {$eq: partnerid}
        partner_condition ={ $match: {$or: [condition,partner_condition]}};
        let pending_trip_condition = {"$match": {}};
        pending_trip_condition["$match"]['drop_trip_status'] = { $eq: CONTAINER_DROP_STATUS.DROPPED };
        pending_trip_condition["$match"]['assigned_provider_id'] = { $eq: null };
        let helpers_list = await Helper.find({helper_type_id: req.session.partner._id}).select({name:1})

        Trip.aggregate([partner_condition, pending_trip_condition, lookup, unwind, search,  count]).then((array) => { 
            if (!array || array.length == 0) {
                array = [];
                res.render('partner_pending_request', { detail: array, request: request, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date,id: partnerid, partner: req.session.partner, timezone_for_display_date: setting_detail.timezone_for_display_date, countries, helpers_list });
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([partner_condition, pending_trip_condition, lookup, unwind, search,  sort, skip, limit, type_lookup]).then((array) => { 
                    res.render('partner_pending_request', { detail: array, request: request, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date,id: partnerid, partner: req.session.partner, timezone_for_display_date: setting_detail.timezone_for_display_date, countries, helpers_list });
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect('/partner_login');
    }

};

/// add_partner_wallet_amount
exports.add_partner_wallet_amount = function (req, res) {

    if (typeof req.session.userid != 'undefined') {

        Partner.findOne({_id: req.body.user_id}).then((partner_data) => { 
            if (partner_data)
            {

                var wallet = utils.precisionRoundTwo(Number(req.body.wallet));
                var total_wallet_amount = utils.addWalletHistory(constant_json.PARTNER_UNIQUE_NUMBER, partner_data.unique_id, partner_data._id, partner_data.country_id, partner_data.wallet_currency_code, partner_data.wallet_currency_code,
                        1, wallet, partner_data.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_ADMIN, "By Admin")

                partner_data.wallet = total_wallet_amount;
                partner_data.save().then(() => { 
                   
                        res.json({success: true, wallet: partner_data.wallet, message: req.__(admin_messages.success_message_add_wallet)});
                }, (err) => {
                                    utils.error_response(err, res)
                });

            } else
            {
                res.json({success: false, error_code: req.__(admin_messages.errpr_message_add_wallet_failed)});
            }
        });
    } else
    {
        res.json({success: false, error_code: req.__(admin_messages.errpr_message_add_wallet_failed)});
    }
};



exports.add_bank_detail_partner = function (req, res) {
    
    Partner.findOne({_id: req.body.partners_id}).then((partner) => { 
        if (partner)
        {
            if (req.body.web == 1) {
                if (req.files != null || req.files != 'undefined') {
                    var image_name = partner._id + utils.tokenGenerator(10);
                    var url = utils.getImageFolderPath(req, 10) + image_name + '.jpg';
                    partner.stripe_doc = url;
                    utils.saveImageFromBrowserStripe(req.files[0].path, image_name + '.jpg', 10, function (response) {

                        if (response) {
                            partner.save().then(() => { 
                                    stripedoc();
                            }, (err) => {
                                    console.log(err);
                            });
                        }
                    });
                }
            }
            function stripedoc() {

                if (req.body.token != null && partner.token != req.body.token) {

                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else
                {
                    var password = req.body.password;
                    var encrypt_password = utils.encryptPassword(password);

                    if (partner.password !== encrypt_password)
                    {
                        res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD});
                    } else
                    {
                        Country.findOne({"countryname": partner.country}).then((country_detail) => { 

                            if (country_detail)
                            {
                                res.json({success: false, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY});
                            } else
                            {
                                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                                stripe.tokens.create({
                                    bank_account: {
                                                country: "US", // country_detail.alpha2
                                                currency: "USD",
                                                account_holder_name: req.body.account_holder_name,
                                                account_holder_type: req.body.account_holder_type,
                                                routing_number: req.body.routing_number,
                                                account_number: req.body.account_number
                                            }
                                }, function (err, token) {
                                    
                                    if (req.body.web == 1) {
                                        var path = require("path");
                                        var pictureData_buffer = fs.readFileSync(path.join(__dirname, '../../data/' + partner.stripe_doc));
                                        
                                    } else {
                                        var pictureData = req.body.document;
                                        var pictureData_buffer = new Buffer(pictureData, 'base64');
                                    }
                                    stripe.fileUploads.create({
                                        file: {
                                            data: pictureData_buffer,
                                            name: "document.jpg",
                                            type: "application/octet-stream",
                                        },
                                        purpose: "identity_document",
                                    }, function (err, fileUpload) {
                                        var err = err;

                                        if (err || !fileUpload)
                                        {
                                            res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_STRIPE_DOCUMENT});
                                        } else
                                        {

                                            var dob = req.body.dob
                                            dob = dob.split('-');
                                            stripe.accounts.create({
                                                type: 'custom',
                                                country: "US", // country_detail.alpha2
                                                email: partner.email,
                                                legal_entity: {
                                                    first_name: partner.first_name,
                                                    last_name: partner.last_name,
                                                    personal_id_number: req.body.personal_id_number,
                                                    business_name: req.body.business_name,
                                                    business_tax_id: partner.tax_id,
                                                    dob: {
                                                        day: dob[0],
                                                        month: dob[1],
                                                        year: dob[2]
                                                    },
                                                    type: req.body.account_holder_type,
                                                    address: {
                                                        city: partner.city,
                                                        country: "US",
                                                        line1: partner.line1,
                                                        line2: partner.line2
                                                    },
                                                    verification: {
                                                        document: fileUpload.id
                                                    }
                                                }
                                            }, function (err, account) {
                                                var err = err;
                                                if (err || !account) {
                                                    res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID});
                                                } else {

                                                    stripe.accounts.createExternalAccount(
                                                            account.id,
                                                            {external_account: token.id,
                                                                default_for_currency: true
                                                            },
                                                            function (err, bank_account) {
                                                                var err = err;
                                                                if (err || !bank_account)
                                                                {
                                                                    res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY});

                                                                } else
                                                                {
                                                                    partner.account_id = account.id;
                                                                    partner.bank_id = bank_account.id;
                                                                    partner.save().then(() => { 
                                                                    }, (err) => {
                                                                        console.log(err);
                                                                    });

                                                                    stripe.accounts.update(
                                                                            account.id,
                                                                            {
                                                                                tos_acceptance: {
                                                                                    date: Math.floor(Date.now() / 1000),
                                                                                    ip: req.connection.remoteAddress // Assumes you're not using a proxy
                                                                                }
                                                                            }, function (err, update_bank_account) {

                                                                        if (err || !update_bank_account) {
                                                                            var err = err;
                                                                            res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROVIDER_BANK_DETAIL_ARE_NOT_VERIFIED});
                                                                        } else {
                                                                            res.json({success: true, message: error_message.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_ADDED_SUCCESSFULLY});
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                    );
                                                }
                                                // asynchronously called
                                            });
                                        }
                                    });
                                    
                                });
                            }
                        });
                    }
                }
            }
            ;

        } else
        {

            res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
    });
};

exports.get_bank_detail_partner = function (req, res) {

    Partner.findOne({_id: req.body.partner_id}).then((partner) => { 
        if (partner)
        {
            if (req.body.token != null && partner.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else
            {
                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                stripe.accounts.retrieveExternalAccount(
                    partner.account_id,
                    partner.bank_id,
                    function (err, external_account) {
                        var err = err;

                        if (err || !external_account)
                        {
                            res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_GET_BANK_DETAIL});
                        } else
                        {
                            res.json({success: true, message: error_message.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_GET_SUCCESSFULLY,
                                bankdetails: {
                                    account_number: external_account.last4,
                                    routing_number: external_account.routing_number,
                                    account_holder_name: external_account.account_holder_name,
                                    account_holder_type: external_account.account_holder_type,
                                }
                            });
                        }
                    }
                );
            }
        } else
        {
            res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
    });
};

exports.delete_bank_detail_partner = function (req, res) {

    Partner.findOne({_id: req.body.partner_id}).then((partner) => { 

        if (partner)
        {
            if (req.body.token != null && partner.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else
            {
                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                stripe.accounts.del(partner.account_id, function (err, test) {
                    var err = err;
                    if (err || !test)
                    {
                        res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_DELETED_BANK_DETAIL_PLEASE_RETRY});
                    } else
                    {
                        partner.account_id = "";
                        partner.bank_id = "";
                        partner.save().then(() => { 
                            res.json({success: true, message: success_messages.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_DELETED_SUCCESSFULLY});
                        }, (err) => {
                                    utils.error_response(err, res)
                        });
                    }

                })
            }
        } else
        {
            res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
    });
};

exports.partner_provider_documents_edit = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Provider_Document.findById(req.body.id).then((provider_document) => { 
            
                res.render('partner_provider_documents_edit', {detail: provider_document, moment: moment});

            
        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.partner_provider_documents_update = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        Provider_Document.findById(req.body.id).then((provider_document) => { 
            
            provider_document.degree = req.body.degree;
            provider_document.issue_date = req.body.issue_date;
            provider_document.expired_date = req.body.expired_date;
            provider_document.unique_code = req.body.unique_code;
            provider_document.save().then(() => {
                if (req.files.length > 0)
                {
                    var image_name = provider_document.provider_id + utils.tokenGenerator(4);
                    var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);
    
                    provider_document.document_picture = url;
                    provider_document.is_uploaded = 1;
                    provider_document.save().then(() => { 
                        req.url = '/proivder_documents';
                        req.body = {id: provider_document.provider_id}
                        exports.documents(req, res, next)
                    }, (err) => {
                                        utils.error_response(err, res)
                    });
                } else {
                    req.url = '/proivder_documents';
                    req.body = {id: provider_document.provider_id}
                    exports.documents(req, res, next)
                }
            }, (err) => {
                console.log(err);
            });


        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.partner_vehicle = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var sort_order;
        var sort_field;
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            search_item = 'vehicle_detail.name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
        } else {
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
        }

        var number_of_rec = 10;
        
        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = { "$match": {} };
        search["$match"][search_item] = { $regex: new RegExp(value, 'i') }

        var sort = { "$sort": {} };
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = { $group: { _id: "$_id", total: { $sum: 1 } } };

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        var condition = { $match: { "_id": Schema(req.session.partner._id) } };
        var vunwind = { $unwind: "$vehicle_detail" };

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
                        selected_model_id: "$vehicle_detail.selected_model_id",
                        selected_services_id: "$vehicle_detail.selected_services_id",
                        selected_capacity_id: "$vehicle_detail.selected_capacity_id",
                        state: "$vehicle_detail.state",
                        is_approved_by_admin: "$vehicle_detail.is_approved_by_admin"
                    }
                }
            }
        };
        var unwind2 = {
            $unwind: {
                path: "$vehicle_detail",
                preserveNullAndEmptyArrays: true
            }
        };
        Partner.aggregate([condition, vunwind, lookup, unwind, group, unwind2, search, count]).then((array) => {
            if (array.length == 0) {
                array = [];
                res.render('partner_vehicle', { vehicle_list: [], 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, sort_field, sort_order, search_item, search_value })
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Partner.aggregate([condition, vunwind, lookup, unwind, group, unwind2, search, sort, skip, limit]).then((array) => {
                    res.render('partner_vehicle', { vehicle_list: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value });
                });
            }
            delete message;
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.partner_add_vehicle_details = async function (req, res) {
    // console.log(req.body)
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({ _id: req.body.partner_id }).then(async (partner) => {
            var is_selected = false;
            if (partner.vehicle_detail.length == 0) {
                is_selected = true;
            }
            const mongoose = require('mongoose');
            const ObjectId = mongoose.Types.ObjectId;
            const x = new Schema();
    
            req.body.selected_model_id = req.body.selected_model_id || []
            req.body.selected_model_id = req.body.selected_model_id.map(s => ObjectId(s));
            
            req.body.selected_services_id = req.body.selected_services_id || []
            req.body.selected_services_id = req.body.selected_services_id.map(s => ObjectId(s));

            req.body.selected_capacity_id = req.body.selected_capacity_id || []
            req.body.selected_capacity_id = req.body.selected_capacity_id.map(s => ObjectId(s));
            const plate = (req.body.plate_no || '').toString();
            const validPlate = await utils.isValidPlate(plate);
            if (!validPlate) {
                res.redirect('/partner_vehicle');
                return
            }
    

            var vehicel_json = {
                _id: x,
                name: req.body.name,
                plate_no: req.body.plate_no,
                model: req.body.model,
                color: req.body.color,
                passing_year: req.body.passing_year,
                accessibility: req.body.accessibility,
                selected_model_id: req.body.selected_model_id,
                selected_services_id: req.body.selected_services_id,
                selected_capacity_id: req.body.selected_capacity_id,
                service_type: ObjectId(req.body.citytype_id),
                admin_type_id: ObjectId(req.body.service_type),
                is_documents_expired: false,
                is_selected: is_selected,
                vehicle_type_id: ObjectId(req.body.partner_id),
                state: 0,
                is_approved_by_admin:0,
                is_document_uploaded: false,
                marca: req.body.marca,
                hasDevicesTemperature: req.body.hasDevicesTemperature,
            }


            Country.findOne({ countryname: partner.country }).then((country) => {

                Document.find({ countryid: country._id, type: 2 }).then((document) => {

                    if (document.length == 0) {
                        partner.is_vehicle_document_uploaded = true;
                        vehicel_json.is_document_uploaded = true;
                        partner.vehicle_detail.addToSet(vehicel_json);
                        partner.save().then(() => {
                            message = admin_messages.success_add_vehicle_detail;
                            res.redirect('/partner_vehicle');
                        }, (err) => {
                            console.log(err);
                        });
                    } else {
                        partner.vehicle_detail.addToSet(vehicel_json);
                        partner.save().then(() => {
                            document.forEach(function (entry, index) {
                                var partnervehicledocument = new Partner_Vehicle_Document({
                                    vehicle_id: x,
                                    partner_id: partner._id,
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
                                partnervehicledocument.save().then(() => {
                                    if (index == document.length - 1) {
                                        message = admin_messages.success_add_vehicle_detail;
                                        res.redirect('/partner_vehicle');
                                    }
                                }, (err) => {
                                    utils.error_response(err, res)
                                });
                            });
                        }, (err) => {
                            console.log(err);
                        });
                    }
                });
            });
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.partner_edit_vehicle_detail = function (req, res) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.partner_id}).then((partner) => { 
            var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);
            Partner_Vehicle_Document.find({partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id}).then( async (partner_vehicle_document) => { 

                var lookup = {
                    $lookup:
                            {
                                from: "types",
                                localField: "typeid",
                                foreignField: "_id",
                                as: "type_detail"
                            }
                };
                var unwind = {$unwind: "$type_detail"};
                var type_model_list_query = {
                    $lookup:
                    {
                        from: "type_models",
                        let: { models: '$type_detail.type_model_list' },
                        pipeline: [
                            { $match: 
                                { $expr: 
                                    { $and: 
                                        [
                                            { $in: [  "$_id", "$$models" ] },
                                            { $eq: [ "$state", 1 ] }
                                        ] 
                                    }
                                }
                            }
                        ],
                        as: "type_model_details"
                    }
                };

                var type_service_list_query = {
                    $lookup:
                    {
                        from: "type_services",
                        let: { services: '$type_detail.type_service_list' },
                        pipeline: [
                            { $match: 
                                { $expr: 
                                    { $and: 
                                        [
                                            { $in: [  "$_id", "$$services" ] },
                                            { $eq: [ "$state", 1 ] }
                                        ] 
                                    }
                                }
                            }
                        ],
                        as: "type_service_details"
                    }
                };

                var type_capacity_list_query = {
                    $lookup:
                    {
                        from: "type_capacities",
                        let: { capacities: '$type_detail.type_capacity_list' },
                        pipeline: [
                            { $match: 
                                { $expr: 
                                    { $and: 
                                        [
                                            { $in: [  "$_id", "$$capacities" ] },
                                            { $eq: [ "$state", 1 ] }
                                        ] 
                                    }
                                }
                            }
                        ],
                        as: "type_capacity_details"
                    }
                };
                let city_id = partner.city_id
                let main_city = await City.findOne({main_city:1, countryid: partner.country_id})
                if(main_city){
                    city_id = main_city._id
                }

                var cityid_condition = {$match: {'cityid': {$eq: Schema(city_id)}}};
                let user_type_condition = {$match: {'user_type': {$eq: 0}}};
                const exclude_gandola_condition = {
                    $match: {
                        model_type: { $ne: MODEL_TRUCK_TYPE.GANDOLA }
                    }
                }

                Citytype.aggregate([cityid_condition, user_type_condition, exclude_gandola_condition, lookup, unwind, type_model_list_query, type_service_list_query ,type_capacity_list_query]).then((type_available) => { 
                    // console.log({type_available})

                    res.render('add_partner_vehicle_detail', {partner_id: partner._id, vehicle_accesibility: vehicle_accesibility, type_available: type_available, partner_vehicle_document: partner_vehicle_document, vehicle_detail: partner.vehicle_detail[index]})
                    delete message;
                }, (err) => {
                                    utils.error_response(err, res)
                });

            })
        })

    } else {
        res.redirect('/partner_login');
    }
};


exports.partner_add_vehicle = function (req, res) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.session.partner._id}).then(async (partner) => { 

                var lookup = {
                    $lookup:
                            {
                                from: "types",
                                localField: "typeid",
                                foreignField: "_id",
                                as: "type_detail"
                            }
                };
                var unwind = {$unwind: "$type_detail"};
                const convertTypesSequence = {
                    "$addFields": {
                        "type_detail.sequenceInt": { "$toInt": "$type_detail.sequence" }
                    }
                }
                const sortTypes = {"$sort": {}};
                sortTypes["$sort"]['type_detail.sequenceInt'] = parseInt(1);

                const type_model_list_query = {
                    $lookup:
                        {
                            from: "type_models",
                            localField: "type_detail.type_model_list",
                            foreignField: "_id",
                            as: "type_model_details"
                        }
                };

                const type_service_list_query = {
                    $lookup:
                        {
                            from: "type_services",
                            localField: "type_detail.type_service_list",
                            foreignField: "_id",
                            as: "type_service_details"
                        }
                };

                const type_capacity_list_query = {
                    $lookup:
                        {
                            from: "type_capacities",
                            localField: "type_detail.type_capacity_list",
                            foreignField: "_id",
                            as: "type_capacity_details"
                        }
                };
                let city_id = partner.city_id
                let main_city = await City.findOne({main_city:1, countryid: partner.country_id})
                if(main_city){
                    city_id = main_city._id
                }
                var cityid_condition = {$match: {'cityid': {$eq: Schema(city_id)}}};
                let user_type_condition = {$match: {'user_type': {$eq: 0}}};
                const exclude_gandola_condition = {
                    $match: {
                        model_type: { $ne: MODEL_TRUCK_TYPE.GANDOLA }
                    }
                }

                Citytype.aggregate([cityid_condition, user_type_condition, exclude_gandola_condition, lookup, unwind, convertTypesSequence, sortTypes, type_model_list_query, type_service_list_query ,type_capacity_list_query]).then((type_available) => { 
                    res.render('add_partner_vehicle_detail', {partner_id: partner._id, vehicle_accesibility: vehicle_accesibility, type_available: type_available, vehicle_detail: undefined})
                    delete message;
                }, (err) => {
                                    utils.error_response(err, res)
                });

        })
    } else {
        res.redirect('/partner_login');
    }
};


exports.update_vehicle_detail = async function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        let partner = await Partner.findOne({_id: req.body.partner_id})
        var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);
        const plate = (req.body.plate_no || '').toString();
        const validPlate = await utils.isValidPlate(plate);
        if (!validPlate) {
            res.redirect('/partner_vehicle');
            return
        }

        if(req.body.accessibility && req.body.accessibility.length){
            req.body.accessibility.forEach((accessibility,index)=>{
                req.body.accessibility[index] = accessibility.replace('_',' ')
            })
        }

        req.body.selected_services_id = req.body.selected_services_id || []
        req.body.selected_services_id = req.body.selected_services_id.map(s => Schema(s));
        
        req.body.selected_model_id = req.body.selected_model_id || []
        req.body.selected_model_id = req.body.selected_model_id.map(s => Schema(s));
        
        req.body.selected_capacity_id = req.body.selected_capacity_id || []
        req.body.selected_capacity_id = req.body.selected_capacity_id.map(s => Schema(s));

        partner.vehicle_detail[index].name = req.body.name;
        partner.vehicle_detail[index].plate_no = req.body.plate_no;
        partner.vehicle_detail[index].model = req.body.model;
        partner.vehicle_detail[index].color = req.body.color;
        partner.vehicle_detail[index].passing_year = req.body.passing_year;
        partner.vehicle_detail[index].accessibility = req.body.accessibility;
        partner.vehicle_detail[index].selected_model_id = req.body.selected_model_id;
        partner.vehicle_detail[index].selected_services_id = req.body.selected_services_id;
        partner.vehicle_detail[index].selected_capacity_id = req.body.selected_capacity_id;
        partner.vehicle_detail[index].service_type = Schema(req.body.citytype_id),
        partner.vehicle_detail[index].admin_type_id = Schema(req.body.service_type)
        partner.vehicle_detail[index].marca = req.body.marca;
        partner.vehicle_detail[index].hasDevicesTemperature = req.body.hasDevicesTemperature === 'on';


        let provider_vehicle_update = { 
        "vehicle_detail.$.name": partner.vehicle_detail[index].name || "",
        "vehicle_detail.$.plate_no": partner.vehicle_detail[index].plate_no || "",
        "vehicle_detail.$.model": partner.vehicle_detail[index].model || "",
        "vehicle_detail.$.color": partner.vehicle_detail[index].color || "",
        "vehicle_detail.$.passing_year": partner.vehicle_detail[index].passing_year || "",
        "vehicle_detail.$.accessibility": partner.vehicle_detail[index].accessibility || [],
        "vehicle_detail.$.selected_model_id": partner.vehicle_detail[index].selected_model_id || null,
        "vehicle_detail.$.selected_services_id": partner.vehicle_detail[index].selected_services_id || [],
        "vehicle_detail.$.selected_capacity_id": partner.vehicle_detail[index].selected_capacity_id || null,
        "vehicle_detail.$.service_type": partner.vehicle_detail[index].service_type || null,
        "vehicle_detail.$.admin_type_id":partner.vehicle_detail[index].admin_type_id || null,
        "vehicle_detail.$.marca": partner.vehicle_detail[index].marca || "",
        "vehicle_detail.$.hasDevicesTemperature": partner.vehicle_detail[index].hasDevicesTemperature || false  ,
    }
        await Partner.findOneAndUpdate({_id: req.body.partner_id}, {vehicle_detail: partner.vehicle_detail}, {new : true})
        await Provider.updateMany({"vehicle_detail._id": Schema(req.body.vehicle_id) }, provider_vehicle_update)

        message = admin_messages.success_update_vehicle_detail;
        res.redirect('/partner_vehicle');

    } else {
        res.redirect('/partner_login');
    }
};


exports.vehicle_document_list_for_partner = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner_Vehicle_Document.find({partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id}).then((partner_vehicle_document) => { 

            res.render('vehicle_document_list_for_partner', {partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id, moment: moment, detail: partner_vehicle_document})
            delete message;
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.vehicle_documents_edit_for_partner = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner_Vehicle_Document.findById(req.body.id).then((partner_document) => { 
            
                res.render('vehicle_documents_edit_for_partner', {detail: partner_document, moment: moment});
            
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.vehicle_documents_update_for_partner = async function (req, res) {

    if (typeof req.session.partner == 'undefined') {
        res.redirect('/partner_login');
        return;
    }
    let partner_document = await Partner_Vehicle_Document.findById(req.body.id)
    if(partner_document.is_expired_date && ( !req.body.expired_date || req.body.expired_date == "")){
        req.body = {partner_id: partner_document.partner_id, vehicle_id: partner_document.vehicle_id}
        myPartners.vehicle_document_list_for_partner(req, res);
        return;
    }
    partner_document.expired_date = req.body.expired_date;
    partner_document.unique_code = req.body.unique_code;
    partner_document.is_document_expired = false;

    ///////////////////
    if(req.body.expired_date == undefined)
    {
        partner_document.expired_date = null;                
    }
    ////////////////////

    message = admin_messages.success_update_document;

    let partner = await Partner.findOne({_id:req.session.partner._id})

    //////////////////////////////////////
    var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == partner_document.vehicle_id);
        //////////////////////////////////////            

    if (req.files.length > 0)
    {
        utils.deleteImageFromFolder(partner_document.document_picture, 3);

        let mime_type = req.files[0].mimetype.split('/')[1]
        var image_name = partner_document.partner_id + utils.tokenGenerator(4);
        let url = utils.getImageFolderPath(req, 3) + image_name + '.' + mime_type;

        partner_document.document_picture = url;
        utils.saveImageFromBrowser(req.files[0].path, image_name + '.' + mime_type, 3);

        partner_document.is_uploaded = 1;
        await partner_document.save()

            ////////////////////
        const documentUploaded = await Partner_Vehicle_Document.find({
            vehicle_id: req.body.vehicle_id,
            option: 1,
            is_uploaded: 0
        }).select({_id:1}).lean()
        const documentExpired = await Partner_Vehicle_Document.find({
            vehicle_id: req.body.vehicle_id,
            option: 1,
            is_document_expired: true
        }).select({_id:1}).lean()
        if (documentExpired.length == 0) {
            partner.vehicle_detail[index].is_documents_expired = false;
        } else {
            partner.vehicle_detail[index].is_documents_expired = true;
        }
        if (documentUploaded.length == 0) {
            partner.vehicle_detail[index].is_document_uploaded = true;
        } else {
            partner.vehicle_detail[index].is_document_uploaded = false;
        }
        partner.markModified('vehicle_detail');
        await partner.save()
        req.body = {partner_id: partner_document.partner_id, vehicle_id: partner_document.vehicle_id}
        myPartners.vehicle_document_list_for_partner(req, res);
    } else {
        await partner_document.save()
        let partner_pending_document = await Partner_Vehicle_Document.find({_id:req.body.id,is_uploaded:0})
        if(partner_pending_document.length == 0)
        {
            partner.vehicle_detail[index].is_document_uploaded = true;        
            partner.markModified('vehicle_detail');
        }
        await partner.save()
        req.body = {partner_id: partner_document.partner_id, vehicle_id: partner_document.vehicle_id}
        myPartners.vehicle_document_list_for_partner(req, res);
    }            
};

///////////////////////////  ADMIN PANEL ////////////////////

exports.partner_vehicle_list = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var condition = {$match: {"_id": Schema(req.body.partner_id)}};
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
        var unwind = {$unwind: {
                path: "$type_detail",
                preserveNullAndEmptyArrays: true
            }
        };
        var group = {$group: {
                _id: null,
                "vehicle_detail": {$push: {
                        is_selected: "$vehicle_detail.is_selected",
                        passing_year: "$vehicle_detail.passing_year",
                        color: "$vehicle_detail.color",
                        model: "$vehicle_detail.model",
                        plate_no: "$vehicle_detail.plate_no",
                        name: "$vehicle_detail.name",
                        accessibility: "$vehicle_detail.accessibility",
                        _id: "$vehicle_detail._id",
                        partner_id: "$_id",
                        type_image_url: '$type_detail.type_image_url',
                        typename: '$type_detail.typename'
                    }}
            }
        }
        Partner.aggregate([condition, vunwind, lookup, unwind, group]).then((partner) => { 
            if (partner.length == 0) {
                res.render('partner_vehicle_list', {vehicle_list: []})
            } else {
                res.render('partner_vehicle_list', {vehicle_list: partner[0].vehicle_detail})

            }
        }, (err) => {
                                    utils.error_response(err, res)
        })
    } else {
        res.redirect('/admin');
    }
};


exports.edit_partner_vehicle_detail = function (req, res) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;

    if (typeof req.session.userid != 'undefined') {
        Partner.findOne({_id: req.body.partner_id}).then((partner) => { 
            var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);

            Partner_Vehicle_Document.find({partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id}).then((partner_vehicle_document) => { 

                var lookup = {
                    $lookup:
                            {
                                from: "types",
                                localField: "typeid",
                                foreignField: "_id",
                                as: "type_detail"
                            }
                };
                var unwind = {$unwind: "$type_detail"};
                var cityid_condition = {$match: {'cityid': {$eq: Schema(partner.city_id)}}};
            
                Citytype.aggregate([cityid_condition, lookup, unwind]).then((type_available) => { 
                    // console.log(type_available)
                    res.render('edit_partner_vehicle_detail', {partner_id: req.body.partner_id, type_available: type_available, vehicle_accesibility: vehicle_accesibility, partner_vehicle_document: partner_vehicle_document, vehicle_detail: partner.vehicle_detail[index]})
                });

            })
        })

    } else {
        res.redirect('/admin');
    }
};

// update_partner_vehicle_detail //
exports.update_partner_vehicle_detail = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Partner.findOne({_id: req.body.partner_id}).then((partner) => { 

            var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);
            partner.vehicle_detail[index].admin_type_id = Schema(req.body.service_type);
            partner.vehicle_detail[index].name = req.body.name;
            partner.vehicle_detail[index].plate_no = req.body.plate_no;
            partner.vehicle_detail[index].model = req.body.model;
            partner.vehicle_detail[index].color = req.body.color;
            partner.vehicle_detail[index].accessibility = req.body.accessibility;
            partner.vehicle_detail[index].passing_year = req.body.passing_year;

            Partner.findOneAndUpdate({_id: req.body.partner_id}, {vehicle_detail: partner.vehicle_detail}, {new : true}).then(() => { 
                myPartners.partner_vehicle_list(req, res);
            })
        });
    } else {
        res.redirect('/admin');
    }
};

/////// admin panel partner vehicle documents //
exports.vehicle_document_list_partner = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
      
        Partner_Vehicle_Document.find({partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id}).then((partner_vehicle_document) => { 
      
            res.render('partner_vehicle_document_list', {partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id, moment: moment, detail: partner_vehicle_document})

        });
    } else {
        res.redirect('/admin');
    }
};


exports.vehicle_documents_edit_partner = function (req, res) {

    if (typeof req.session.userid != 'undefined') {
        Partner_Vehicle_Document.findById(req.body.id).then((partner_vehicle_document) => { 
            
                res.render('admin_partner_vehicle_documents_edit', {detail: partner_vehicle_document, moment: moment});

        });
    } else {
        res.redirect('/admin');
    }
};

exports.vehicle_documents_update_partner = function (req, res) {
 
    if (typeof req.session.userid != 'undefined') {
        Partner_Vehicle_Document.findById(req.body.id).then((partner_vehicle_document) => { 
           
            partner_vehicle_document.expired_date = req.body.expired_date;
            partner_vehicle_document.unique_code = req.body.unique_code;

            if (req.files.length > 0)
            {
                utils.deleteImageFromFolder(partner_vehicle_document.document_picture, 3);

                let mime_type = req.files[0].mimetype.split('/')[1]
                var image_name = partner_vehicle_document.partner_id + utils.tokenGenerator(4);
                let url = utils.getImageFolderPath(req, 3) + image_name + '.' + mime_type;

                partner_vehicle_document.document_picture = url;
                utils.saveImageFromBrowser(req.files[0].path, image_name + '.' + mime_type, 3);

                partner_vehicle_document.is_uploaded = 1;
                partner_vehicle_document.save().then(() => { 
                    req.body = {partner_id: partner_vehicle_document.partner_id, vehicle_id: partner_vehicle_document.vehicle_id}
                    myPartners.vehicle_document_list_partner(req, res);
                });
            } else {
                partner_vehicle_document.save().then(() => { 
                    req.body = {partner_id: partner_vehicle_document.partner_id, vehicle_id: partner_vehicle_document.vehicle_id}
                    myPartners.vehicle_document_list_partner(req, res);
                });

            }
            
        });
    } else {
        res.redirect('/admin');
    }
};
exports.get_available_vehicle_list = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.id}).then((partner) => { 
            if (partner) {
                Citytype.findOne({_id: req.body.service_type_id},function(error, city_type_detail){
                    Provider.findOne({_id: req.body.provider_id}).then((provider) => { 
                        if (provider) {
                        var vehicle_array = [];
                        partner.vehicle_detail.forEach(function (vehicle) {
                            // if (vehicle.admin_type_id != null && vehicle.is_assigned !== true && (city_type_detail.typeid).toString() == (vehicle.admin_type_id).toString() && vehicle.is_document_uploaded == true) {
                            //     vehicle_array.push(vehicle)
                            // }
                            var idx = provider.vehicle_detail.findIndex(i=> i._id.toString() == vehicle._id.toString());
                            // console.log(vehicle.name)
                            // console.log(idx)
                            if (vehicle.admin_type_id != null && idx == -1 && (city_type_detail.typeid).toString() == (vehicle.admin_type_id).toString() && vehicle.is_document_uploaded == true) {
                                vehicle_array.push(vehicle)
                            }
                        })
                        res.json({success: true, vehicle_array: vehicle_array})
                    } else {
                        res.json({success: false})
                    }
                })
            })

            } else {
                res.json({success: false})
            }
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.assign_vehicle_to_provider = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.id}).then((partner) => { 
            if (partner) {
                var index = partner.vehicle_detail.findIndex((x) => x._id == req.body.vehicle_id);
                var vehicle_detail = partner.vehicle_detail[index]
                Provider.findOne({_id: req.body.provider_id}).then((provider) => { 
                    vehicle_detail.service_type = Schema(req.body.service_type_id);
                    provider.vehicle_detail.addToSet(vehicle_detail);
                    // provider.service_type = req.body.service_type_id;
                    // provider.admintypeid = vehicle_detail.admin_type_id;
                    // provider.vehicle_detail[provider.vehicle_detail.length-1].is_selected = true;
                    provider.is_vehicle_document_uploaded = true;
                    provider.save().then(() => { 
                        res.json({success: true});
                    });
                    // partner.vehicle_detail[index].is_assigned = true;
                    // partner.markModified('vehicle_detail');
                    // partner.save().then(() => { 
                    // })
                })
            } else {
                res.json({success: false})
            }
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.remove_vehicle_from_provider = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.id}).then((partner) => { 
            if (partner) {

                Provider.findOne({_id: req.body.provider_id}).then((provider) => { 
                    var vehicle_id;
                    provider.vehicle_detail.forEach(function (vehicle){
                        if(vehicle.is_selected){
                            vehicle_id = vehicle._id;
                        }
                    })
                    provider.vehicle_detail = [];
                    provider.service_type = null;
                    provider.admintypeid = null;
                    provider.is_vehicle_document_uploaded = false;
                    provider.save();

                    var vehicle_index = partner.vehicle_detail.findIndex(vehicle => (vehicle._id).toString() == vehicle_id);
                    partner.vehicle_detail[vehicle_index].is_assigned = false;
                    partner.vehicle_detail[vehicle_index].is_selected = false;
                    partner.markModified('vehicle_detail');
                    partner.save().then(() => { 
                        res.json({success: true});
                    })
                })
            } else {
                res.json({success: false})
            }
        });
    } else {
        res.redirect('/partner_login');
    }
}

//partner_wallet_history
exports.partner_wallet_history = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var sort_order;
        var sort_field;
        var filter_start_date;
        var filter_end_date;
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            search_item = 'wallet_description';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';
            type = 0;


        } else {
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;
            type = Number(req.body.type);

        }

        var end_date = req.body.end_date;
        var start_date = req.body.start_date;
        if (end_date == '' || end_date == undefined) {
            end_date = new Date();
        } else {
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        if (start_date == '' || start_date == undefined) {
            start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        } else {
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        }

        var number_of_rec = 10;
        
        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = { "$match": {} };
        search["$match"][search_item] = { $regex: new RegExp(value, 'i') }

        var filter = { "$match": {} };
        filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };

        var sort = { "$sort": {} };
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = { $group: { _id: null, total: { $sum: 1 } } };

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        
        var condition = { $match: { user_id: { $eq: Schema(req.session.partner._id) } } };

        Wallet_history.aggregate([condition, search, filter, count]).then((array) => {
            if (array.length == 0) {
                array = [];
                res.render('partner_wallet_history', { 'detail': array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, timezone_for_display_date: setting_detail.timezone_for_display_date, 'moment': moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date });
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Wallet_history.aggregate([condition, search, filter, sort, skip, limit]).then((array) => {
                    Partner.findOne({ _id: req.session.partner._id }, function (err, partner_detail) {
                        res.render('partner_wallet_history', { detail: array, partner_detail: partner_detail, timezone_for_display_date: setting_detail.timezone_for_display_date, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date });
                    });
                });
            }
        });
    } else {
        res.redirect('/profile');
    }
};


// genetare_partner_excel
exports.genetare_partner_excel = function (req, res) {
  
    if (typeof req.session.userid != 'undefined') {
        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        let search = [];
        const timezone = setting_detail.timezone_for_display_date
        let selected_country_id = req.body.selected_country_id || null
        const admin = req.session.admin
        if(!admin.super_admin){
            query['country_id'] = Schema(admin.country_id)
        }else{
            if(selected_country_id){
                query['country_id'] = Schema(selected_country_id)
            }
        }

        if (req.body.page == undefined) {

            if (req.session.page != undefined) {
                var field = sort_field;
                var order = sort_order;
                var item = search_item;
                var value = search_value;

                var start_date = filter_start_date;
                var end_state = filter_end_date;

                sort[field] = order;
                req.body.page = req.session.page;
                delete req.session.page;
            } else {
                sort['_id'] = -1;

                search_item = 'first_name';
                search_value = '';
                sort_order = -1;
                sort_field = 'unique_id';
                filter_start_date = '';
                filter_end_date = '';

                var start_date = '';
                var end_state = '';
            }
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;

        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                search.push(query1);
                search.push(query2);
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
                search.push(query1);
                search.push(query2);
                search.push(query3);
                search.push(query4);
                search.push(query5);
                search.push(query6);
            }
        } else if (item == 'active') {
            query["is_approved"] = {$eq: 1}
        } else if (item == 'inactive') {
            query["is_approved"] = {$eq: 0}
        } else if (item != 'completed') {

            if (item != undefined) {
                value = value.toString().replace('+','');

                query[item] = new RegExp(value, 'i');
            }
        }
        if (search.length == 0) {
            search = [{}];
        }

        var sort = {"$sort": {}};
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = -1;        
            sort["$sort"]["unique_id"] = parseInt(-1);
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;

            if (field == 'first_name') {
                sort["$sort"]["first_name"] = parseInt(order);
            } else if (field == 'unique_id') {
                sort["$sort"]["unique_id"] = parseInt(order);
            } else {
                sort["$sort"]["email"] = parseInt(order);
            }

        }
                
        const pipeline = [
            {
                $match: {
                    $and: [
                        { $or: search },
                        query
                    ]
                }
            },
            sort, 
            {
                $lookup: {
                    from: 'trip_histories',
                    let: { provider_type_id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$provider_type_id", "$$provider_type_id"] },
                                        { $eq: ["$is_trip_completed", 1] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'trips'
                }
            },
            {
                $lookup: {
                    from: 'providers',
                    let: { partnerId: "$_id" },
                    pipeline: [
                        {
                            $unwind: "$partner_ids"
                        },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$partner_ids.partner_id", "$$partnerId"] },
                                        { $eq: ["$partner_ids.status", 1] }
                                    ]
                                }
                            }
                        }                            
                    ],
                    as: 'providers'
                }
            },
            {
                $project: {
                    id: "$_id",
                    unique_id: 1,
                    vehicle_detail: {
                        $size: {
                            $filter: {
                                input: "$vehicle_detail",
                                as: "detail",
                                cond: { $eq: ["$$detail.state", 1] }
                            }
                        }
                    },
                    providerCount: { $size: "$providers" },
                    tripCount: { $size: "$trips" },
                    first_name: 1,
                    last_name: 1,
                    partner_company_name: 1,
                    email: 1,
                    country_phone_code: 1,
                    phone: 1,
                    country: 1,
                    picture: 1,
                    is_approved: 1,
                    created_at: 1
                }
            }
        ];
        const completed_trips_condition = 
        {
            $match: {
                tripCount: { $gt: 0 }
            }
        }
        if (item == 'completed') {
            pipeline.push(completed_trips_condition)
        }
        Partner.aggregate(pipeline).then((array) => {


            var date = new Date()
            var time = date.getTime()
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet('sheet1');
            var col = 1;

            ws.cell(1, col++).string(req.__('title_id'));
            ws.cell(1, col++).string(req.__('title_name'));
            ws.cell(1, col++).string(req.__('title_company_name'));
            ws.cell(1, col++).string(req.__('title_email'));
            ws.cell(1, col++).string(req.__('title_rif'));
            ws.cell(1, col++).string(req.__('title_completed'));
            ws.cell(1, col++).string(req.__('title_active_vehicles'));
            ws.cell(1, col++).string(req.__('title_registered_providers'));
            ws.cell(1, col++).string(req.__('title_phone'));
            ws.cell(1, col++).string(req.__('title_country'));
            ws.cell(1, col++).string(req.__('title_registered_date'));

            var j = 1;
            array.forEach(function (data, index) {
                col = 1;
                ws.cell(index + 2, col++).number(data.unique_id);
                ws.cell(index + 2, col++).string(data.first_name + ' ' + data.last_name);
                ws.cell(index + 2, col++).string(data.partner_company_name);
                ws.cell(index + 2, col++).string(data.email);
                ws.cell(index + 2, col++).string(data.rif ? data.rif : "" );
                ws.cell(index + 2, col++).number(data.tripCount);
                ws.cell(index + 2, col++).number(data.vehicle_detail);
                ws.cell(index + 2, col++).number(data.providerCount);
                ws.cell(index + 2, col++).string(data.country_phone_code + ' ' + data.phone);
                ws.cell(index + 2, col++).string(data.country);
                ws.cell(index + 2, col++).string(moment(data.created_at).tz(timezone).format("DD MMM 'YY") + ' ' + moment(data.created_at).tz(timezone).format("hh:mm a"));

                if (j == array.length) {
                    wb.write('data/xlsheet/' + time + '_partner.xlsx', function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            var url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_partner.xlsx";
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_partner.xlsx', function () {
                                });
                            }, 10000)
                        }
                    });
                } else {
                    j++;
                }
            })
        })
    } else {
        res.redirect('/admin');
    }

};


// genetare_partner_provider_excel
exports.genetare_partner_provider_excel = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var query = {};
        var provider_query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};

        var field = req.body.sort_item[0];
        var order = req.body.sort_item[1];
        var item = req.body.search_item;
        var value = req.body.search_value;

        sort_order = req.body.sort_item[1];
        sort_field = req.body.sort_item[0];
        search_item = item
        search_value = value;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;

        var start_date = req.body.start_date;
        var end_state = req.body.end_date;

        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else if (item == 'unique_id')
        {
            if (value !== "")
            {
                value = Number(value);
                query[item] = value

            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }

        var sort = {};
        sort[field] = order;

        provider_query['partner_ids.partner_id'] = req.body.id;
        
        
        Provider.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query,provider_query]}).then((providers) => { 

                var timezone_for_display_date = setting_detail.timezone_for_display_date;

                var j = 1;
                providers.forEach(function (data) {

                    if (data.service_type == null) {
                        if (j == providers.length) {
                            data.service_type = null;
                            generate_excel(req, res, providers, timezone_for_display_date)
                        } else {
                            data.service_type = null;
                            j++;
                        }
                    } else {
                        Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                            Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 

                                if (j == providers.length) {
                                    data.service_type_name = type_data.typename;

                                    generate_excel(req, res, providers, timezone_for_display_date)
                                } else {
                                    data.service_type_name = type_data.typename;
                                    j++;
                                }
                            });
                        });
                    }

                });

        })


    } else {
        res.redirect('/admin');
    }
}

function generate_excel(req, res, array, timezone) {
    var date = new Date()
    var time = date.getTime()
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('sheet1');
    var col = 1;

    ws.cell(1, col++).string(req.__('title_id'));
    ws.cell(1, col++).string(req.__('title_name'));
    ws.cell(1, col++).string(req.__('title_email'));
    ws.cell(1, col++).string(req.__('title_phone'));
    ws.cell(1, col++).string(req.__('title_total_request'));
    ws.cell(1, col++).string(req.__('title_completed_request'));
    ws.cell(1, col++).string(req.__('title_cancelled_request'));
    ws.cell(1, col++).string(req.__('title_accepted_request'));
    ws.cell(1, col++).string(req.__('title_city'));
    ws.cell(1, col++).string(req.__('title_car'));
    ws.cell(1, col++).string(req.__('title_app_version'));
    ws.cell(1, col++).string(req.__('title_registered_date'));

    array.forEach(function (data, index) {
        col = 1;
        ws.cell(index + 2, col++).number(data.unique_id);
        ws.cell(index + 2, col++).string(data.first_name + ' ' + data.last_name);
        ws.cell(index + 2, col++).string(data.email);
        ws.cell(index + 2, col++).string(data.country_phone_code + data.phone);
        ws.cell(index + 2, col++).number(data.total_request);
        ws.cell(index + 2, col++).number(data.completed_request);
        ws.cell(index + 2, col++).number(data.cancelled_request);
        ws.cell(index + 2, col++).number(data.accepted_request);
        ws.cell(index + 2, col++).string(data.city);
        ws.cell(index + 2, col++).string(data.service_type_name);
        ws.cell(index + 2, col++).string(data.device_type + '-' + data.app_version);
        ws.cell(index + 2, col++).string(moment(data.created_at).tz(timezone).format("DD MMM 'YY") + ' ' + moment(data.created_at).tz(timezone).format("hh:mm a"));

        if (index == array.length - 1) {
            wb.write('data/xlsheet/' + time + '_partner_provider.xlsx', function (err) {
                if (err) {
                    console.error(err);
                } else {
                    var url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_partner_provider.xlsx";
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_partner_provider.xlsx', function () {
                        });
                    }, 10000)
                }
            });
        }

    })
};

// partner_providers_excel
exports.partner_providers_excel = function (req, res) {

    if (typeof req.session.partner != 'undefined') {

        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        var partner_condition = {partner_ids:{$elemMatch: {partner_id:Schema(req.session.partner._id)}}}

        // query['provider_type_id'] = req.session.partner._id;
        if (req.body.search_item == undefined) {
            sort['_id'] = -1;

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_state = '';
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;
        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }

        var sort = {};
        sort[field] = order;

        Provider.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query, partner_condition]}).then((providers) => { 
    
                var timezone_for_display_date = setting_detail.timezone_for_display_date;

                var j = 1;
                providers.forEach(function (data) {

                    if (data.service_type == null) {
                        if (j == providers.length) {
                            data.service_type = null;
                            partner_pro_generate_excel(req, res, providers, timezone_for_display_date)
                        } else {
                            data.service_type = null;
                            j++;
                        }
                    } else {
                        Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                            Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 

                                if (j == providers.length) {
                                    data.service_type_name = type_data.typename;

                                    partner_pro_generate_excel(req, res, providers, timezone_for_display_date)
                                } else {
                                    data.service_type_name = type_data.typename;
                                    j++;
                                }
                            });
                        });
                    }

                });

        })


    } else {
        res.redirect('/partner_login');
    }
}

function partner_pro_generate_excel(req, res, array, timezone) {

    var date = new Date()
    var time = date.getTime()
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('sheet1');
    var col = 1;

    ws.cell(1, col++).string(req.__('title_id'));
    ws.cell(1, col++).string(req.__('title_name'));
    ws.cell(1, col++).string(req.__('title_email'));
    ws.cell(1, col++).string(req.__('title_phone'));
    ws.cell(1, col++).string(req.__('title_total_request'));
    ws.cell(1, col++).string(req.__('title_completed_request'));
    ws.cell(1, col++).string(req.__('title_cancelled_request'));
    ws.cell(1, col++).string(req.__('title_accepted_request'));
    ws.cell(1, col++).string(req.__('title_city'));
    ws.cell(1, col++).string(req.__('title_car'));
    ws.cell(1, col++).string(req.__('title_app_version'));
    ws.cell(1, col++).string(req.__('title_registered_date'));

    array.forEach(function (data, index) {
        col = 1;
        ws.cell(index + 2, col++).number(data.unique_id);
        ws.cell(index + 2, col++).string(data.first_name + ' ' + data.last_name);
        ws.cell(index + 2, col++).string(data.email);
        ws.cell(index + 2, col++).string(data.country_phone_code + data.phone);
        ws.cell(index + 2, col++).number(data.total_request);
        ws.cell(index + 2, col++).number(data.completed_request);
        ws.cell(index + 2, col++).number(data.cancelled_request);
        ws.cell(index + 2, col++).number(data.accepted_request);
        ws.cell(index + 2, col++).string(data.city);
        ws.cell(index + 2, col++).string(data.service_type_name);
        ws.cell(index + 2, col++).string(data.device_type + '-' + data.app_version);
        ws.cell(index + 2, col++).string(moment(data.created_at).tz(timezone).format("DD MMM 'YY") + ' ' + moment(data.created_at).tz(timezone).format("hh:mm a"));

        if (index == array.length - 1) {
            wb.write('data/xlsheet/' + time + '_partner_providers.xlsx', function (err) {
                if (err) {
                    console.error(err);
                } else {
                    var url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_partner_providers.xlsx";
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_partner_providers.xlsx', function () {
                        });
                    }, 10000)
                }
            });
        }
    })
}
;


// genetare_partner_request_excel
exports.genetare_partner_request_excel = function (req, res, next) {

    if (typeof req.session.partner != 'undefined') {
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'user_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

        } else {
            var request = req.body.request;
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');


            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

        }

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                var date = new Date(Date.now());
                date = date.setHours(0, 0, 0, 0);
                start_date = new Date(0);
                end_date = new Date(Date.now());
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            end_date = new Date(Date.now());
            var start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        const timeDiff = end_date - start_date;
        const max3Months = 1000 * 60 * 60 * 24 * 93;
        if (timeDiff > max3Months) {
            return res.json({success: false, message: req.__('error_message_export_date_range_exceeded')})
        }


        var Table = Trip_history
        if (request == 'partner_requests') {
            Table = Trip;
        }


        const type_lookup = {
            $lookup:
                    {
                        from: "types",
                        localField: "type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };
        const type_unwind = {$unwind: "$type_detail"};

        const lookup = {
            $lookup:
            {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_detail"
            }
        };
        const unwind = { $unwind: "$user_detail" };

        const lookup1 = {
            $lookup:
            {
                from: "providers",
                localField: "assigned_provider_id",
                foreignField: "_id",
                as: "provider_detail"
            }
        };


        const cedula_lookup = {
            $lookup:
            {
                from: "provider_documents",
                let: { provider_id: '$assigned_provider_id' },
                pipeline: [
                    { $match: 
                        { $expr: 
                            { $and: 
                                [
                                    { $eq: [  "$provider_id", "$$provider_id" ] },
                                    { $eq: [ "$name", "Cédula" ] }
                                ] 
                            }
                        }
                    }
                ],
                as: "provider_cedula"
            }
        };

        const helper_lookup = {
            $lookup: {
                from: "helpers",
                let: { helpers: { $ifNull: ["$helpers_list", []] }, },
                pipeline: [
                    {
                        $match: {
                            $expr: { $and: [{ $in: ["$_id", "$$helpers"] }] }
                        }
                    },
                    {
                        $project: { name: 1, cedula: 1 }
                    }
                ],
                as: "helper_detail"
            }
        };
        

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        
        let search = filterService.handleSearch(search_item, value, constant_json.PARTNER_UNIQUE_NUMBER);
       
        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);
        var condition = {$match: {'provider_type_id': {$eq: Schema(req.session.partner._id)}}};
        const skip = {};
        req.body.page_number = req.body.page_number > 0 ? req.body.page_number - 1 : 0
        skip["$skip"] = req.body.page_number * 10;
        const limit = {};
        limit["$limit"] = 10;

        Table.aggregate([condition, filter, lookup, unwind, lookup1, search, sort,type_lookup, type_unwind, cedula_lookup, helper_lookup]).then((array) => {
            if(!array.length){
                res.json({success:false})
                return;
            }
            var date = new Date()
            var time = date.getTime()
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet('sheet1');
            var col = 1;
            let note_count = 0 

            ws.cell(1, col++).string(req.__('title_id'));
            ws.cell(1, col++).string(req.__('title_user'));
            ws.cell(1, col++).string(req.__('title_provider'));
            ws.cell(1, col++).string(req.__('title_plate_no'));
            ws.cell(1, col++).string(req.__('title_origin'));
            ws.cell(1, col++).string(req.__('title_destination'));
            ws.cell(1, col++).string(req.__('title_created_date'));
            ws.cell(1, col++).string(req.__('title_truck_model'));
            ws.cell(1, col++).string(req.__('title_type_of_truck'));
            ws.cell(1, col++).string(req.__('title_total_cities'));
            ws.cell(1, col++).string(req.__('title_helpers'));
            ws.cell(1, col++).string(req.__('title_status'));
            ws.cell(1, col++).string(req.__('title_loading_date'));
            ws.cell(1, col++).string(req.__('title_loading_time'));
            ws.cell(1, col++).string(req.__('title_arrived_date'));
            ws.cell(1, col++).string(req.__('title_arrived_time'));
            ws.cell(1, col++).string(req.__('title_completed_date'));
            ws.cell(1, col++).string(req.__('title_total_time_loading'));
            ws.cell(1, col++).string(req.__('title_total_time_trip'));
            ws.cell(1, col++).string(req.__('unit_km'));
            ws.cell(1, col++).string(req.__('title_amount'));
            ws.cell(1, col++).string(req.__('title_viaticos'));
            ws.cell(1, col++).string(req.__('title_gasoil'));
            ws.cell(1, col++).string(req.__('title_chofer'));
            ws.cell(1, col++).string(req.__('title_caletero'));
            ws.cell(1, col++).string(req.__('title_otros'));
            ws.cell(1, col++).string(req.__('profit'));
            ws.cell(1, col++).string('%');
            if(req.body.request == "partner_history"){
                ws.cell(1, col++).string(req.__('title_paid'));
            }

            array.forEach(function (data, index) {
                col = 1;
                ws.cell(index + 2, col++).string(String(data.unique_id));
                ws.cell(index + 2, col++).string(String(data.user_detail.first_name + ' ' + data.user_detail.last_name));
                let provider_cedula = "";
                if (data.provider_cedula.length > 0 && data.provider_cedula[0].unique_code) {
                    provider_cedula = ' (' + String(data.provider_cedula[0].unique_code) + ')';
                }
                if (data.provider_detail.length > 0) {
                    ws.cell(index + 2, col++).string(String(data.provider_detail[0].first_name + ' ' + data.provider_detail[0].last_name + provider_cedula));
                } else {
                    col++;
                }
                
                if (data?.assigned_vehicle_details?.vehicle_plate_no) {
                        ws.cell(index + 2, col++).string(String(data?.assigned_vehicle_details?.vehicle_plate_no));
                } else {
                    col++;
                }
            
                ws.cell(index + 2, col++).string(String(data.source_address));
                ws.cell(index + 2, col++).string(String(data.initial_destination_address ?  data.initial_destination_address : data.destination_address));
                ws.cell(index + 2, col++).string(String(moment(data.created_at).tz(setting_detail.timezone_for_display_date).format('DD MMM YYYY HH:mm a')));
                ws.cell(index + 2, col++).string(String(data.type_detail.typename));
                
                if (data.model_details) {
                    ws.cell(index + 2, col++).string(String(data.model_details.model_name));
                } else {
                    col++;
                }
                
                ws.cell(index + 2, col++).string(String(data.destination_addresses.length));
                const helpersString = data.helper_detail.map(helper => `${helper.name} (${helper.cedula})`).join(', ');
                ws.cell(index + 2, col++).string(String(helpersString));
                        
                if (data.is_trip_cancelled == 1) {
                    if (data.is_trip_cancelled_by_provider == 1) {
                        ws.cell(index + 2, col++).string(req.__('title_total_cancelled_by_provider'));
                    } else if (data.is_trip_cancelled_by_user == 1) {
                        ws.cell(index + 2, col++).string(req.__('title_total_cancelled_by_user'));
                    } else {
                        ws.cell(index + 2, col++).string(req.__('title_total_cancelled'));
                    }
                } else {
                    if (data.is_provider_status == 2) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_coming'));
                    } else if (data.is_provider_status == 4) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_arrived'));
                    } else if (data.is_provider_status == 6) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_trip_started'));
                    } else if (data.is_provider_status == 7) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_arrived_at_destination'));
                    } else if (data.is_provider_status == 9) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_completed'));
                    } else if (data.is_provider_status == 1 || data.is_provider_status == 0) {
                        if (data.is_provider_accepted == 1) {
                            ws.cell(index + 2, col++).string(req.__('title_trip_status_accepted'));
                        } else {
                            ws.cell(index + 2, col++).string(req.__('title_trip_status_waiting'));
                        }
                    }
                }
                if(data.server_start_time_for_schedule){
                    ws.cell(index + 2, col++).string(String(moment(data.server_start_time_for_schedule).tz(setting_detail.timezone_for_display_date ).format("DD MMM 'YY")));
                }else{
                    ws.cell(index + 2, col++).string(String(moment(data.created_at).tz(setting_detail.timezone_for_display_date ).format("DD MMM 'YY")));
                }
                if(data.server_start_time_for_schedule){
                    ws.cell(index + 2, col++).string(String(moment(data.server_start_time_for_schedule).tz(setting_detail.timezone_for_display_date ).format("hh:mm a")));
                }else{
                    ws.cell(index + 2, col++).string(String(moment(data.created_at).tz(setting_detail.timezone_for_display_date ).format("hh:mm a")));
                }
                if(data.provider_arrived_destination_time){
                    ws.cell(index + 2, col++).string(String(moment(data.provider_arrived_destination_time).tz(setting_detail.timezone_for_display_date ).format("DD MMM 'YY")));
                }else {col++;}
                if(data.provider_arrived_destination_time){
                    ws.cell(index + 2, col++).string(String(moment(data.provider_arrived_destination_time).tz(setting_detail.timezone_for_display_date ).format("hh:mm a")));
                }else {col++;}
                ws.cell(index + 2, col++).string(String(moment(data.provider_trip_end_time).tz(setting_detail.timezone_for_display_date).format('DD MMM YYYY HH:mm a')));
                const total_waiting_time = utils.getTimeDifferenceInMinute(data.provider_trip_start_time, data.provider_arrived_time);
                if(total_waiting_time > 0){
                    ws.cell(index + 2, col++).string(String((total_waiting_time/60).toFixed(2)) + ' hr');
                }else {col++;}
                if(data.is_trip_completed == 1 && data.total_time > 0){
                    ws.cell(index + 2, col++).string(String((data.total_time/60).toFixed(2)) + ' hr');
                }else {col++;}
                
                if(data.estimated_distance && data.estimated_distance > 0){
                    ws.cell(index + 2, col++).string(String(data.estimated_distance));
                }else {col++;}
                ws.cell(index + 2, col++).string(String(data.provider_service_fees));
                if(data.expense_data){
                    ws.cell(index + 2, col++).string(String((data.expense_data.viaticos).toFixed(2)));
                    ws.cell(index + 2, col++).string(String((data.expense_data.gasoil).toFixed(2)));
                    ws.cell(index + 2, col++).string(String((data.expense_data.chofer).toFixed(2)));
                    ws.cell(index + 2, col++).string(String((data.expense_data.caletero).toFixed(2)));
                    ws.cell(index + 2, col++).string(String((data.expense_data.otros).toFixed(2)));
                    ws.cell(index + 2, col++).string(String((data.expense_data.profit_after_expense).toFixed(2)));
                    ws.cell(index + 2, col++).string(String((data.expense_data.profit_percent).toFixed(2)));
                }else {col += 7;}

                if(req.body.request == "partner_history"){
                    ws.cell(index + 2, col++).string(String(data.paid_partner == 1 ? req.__('title_yes') : req.__('title_no')));
                }
                data?.corporate_notes?.forEach((note) => {
                    ws.cell(index + 2, col++).string(String(note));
                })
                note_count = data?.corporate_notes?.length > note_count ? data.corporate_notes.length :  note_count

                
                
                if (index == array.length - 1) {
                    for(let i = 1; i <= note_count; i ++ ){
                        ws.cell(1, col++).string(req.__('title_note') + " " + String(i));
                    }

                    wb.write('data/xlsheet/' + time + '_partner_request.xlsx', function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            let url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_partner_request.xlsx";
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_partner_request.xlsx', function () {
                                });
                            }, 10000)
                        }
                    });
                }
            })
        }, (err) => {
            utils.error_response(err, res)

        });

    } else {
        res.redirect('/partner_login');
    }

};

// generate_partner_provider_history_excel
exports.generate_partner_provider_history_excel = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        

        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }
        if (req.body.search_item == undefined) {
            search_item = 'user_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';
        } else {
            search_item = req.body.search_item;
            search_value = req.body.search_value;
            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;
        }

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                var date = new Date(Date.now());
                date = date.setHours(0, 0, 0, 0);
                start_date = new Date(0);
                end_date = new Date(Date.now());
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            end_date = new Date(Date.now());
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }



        var lookup = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };


        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {

            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        var filter = {"$match": {}};
        filter["$match"]['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};

       
        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);
        var partnerid = req.session.partner._id;
        var condition = {"$match": {'provider_type_id': {$eq: Schema(partnerid)}}};

        Trip_history.aggregate([condition, lookup, unwind, lookup1, search, filter, sort]).then((array) => {
            var date = new Date()
            var time = date.getTime()

            var wb = new xl.Workbook();
            var ws = wb.addWorksheet('sheet1');
            var col = 1;

            ws.cell(1, col++).string(req.__('title_id'));
            ws.cell(1, col++).string(req.__('title_user_id'));
            ws.cell(1, col++).string(req.__('title_user'));
            ws.cell(1, col++).string(req.__('title_provider_id'));
            ws.cell(1, col++).string(req.__('title_provider'));
            ws.cell(1, col++).string(req.__('title_date'));
            ws.cell(1, col++).string(req.__('title_status'));
            ws.cell(1, col++).string(req.__('title_amount'));
            ws.cell(1, col++).string(req.__('title_payment'));
            ws.cell(1, col++).string(req.__('title_payment_status'));

            array.forEach(function (data, index) {
                col = 1;
                ws.cell(index + 2, col++).number(data.unique_id);
                ws.cell(index + 2, col++).number(data.user_detail.unique_id);
                ws.cell(index + 2, col++).string(data.user_detail.first_name + ' ' + data.user_detail.last_name);

                if (data.provider_detail.length > 0) {
                    ws.cell(index + 2, col++).number(data.provider_detail[0].unique_id);
                    ws.cell(index + 2, col++).string(data.provider_detail[0].first_name + ' ' + data.provider_detail[0].last_name);
                } else {
                    col += 2;
                }
                ws.cell(index + 2, col++).string(moment(data.created_at).format("DD MMM 'YY") + ' ' + moment(data.created_at).format("hh:mm a"));

                if (data.is_trip_cancelled == 1) {
                    if (data.is_trip_cancelled_by_provider == 1) {
                        ws.cell(index + 2, col++).string(req.__('title_total_cancelled_by_provider'));
                    } else if (data.is_trip_cancelled_by_user == 1) {
                        ws.cell(index + 2, col++).string(req.__('title_total_cancelled_by_user'));
                    } else {
                        ws.cell(index + 2, col++).string(req.__('title_total_cancelled'));
                    }
                } else {
                    if (data.is_provider_status == 2) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_coming'));
                    } else if (data.is_provider_status == 4) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_arrived'));
                    } else if (data.is_provider_status == 6) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_trip_started'));
                    } else if (data.is_provider_status == 7) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_arrived_at_destination'));
                    } else if (data.is_provider_status == 9) {
                        ws.cell(index + 2, col++).string(req.__('title_trip_status_completed'));
                    } else if (data.is_provider_status == 1 || data.is_provider_status == 0) {
                        if (data.is_provider_accepted == 1) {
                            ws.cell(index + 2, col++).string(req.__('title_trip_status_accepted'));
                        } else {
                            ws.cell(index + 2, col++).string(req.__('title_trip_status_waiting'));
                        }
                    }
                }
                ws.cell(index + 2, col++).number(data.provider_service_fees);

                if (data.payment_mode == 1) {
                    ws.cell(index + 2, col++).string(req.__('title_pay_by_cash'));
                } else {
                    ws.cell(index + 2, col++).string(req.__('title_pay_by_card'));
                }

                if (data.payment_status == 0) {
                    ws.cell(index + 2, col++).string(req.__('title_pending'));
                } else {
                    if (data.payment_status == 1) {
                        ws.cell(index + 2, col++).string(req.__('title_paid'));
                    } else {
                        ws.cell(index + 2, col++).string(req.__('title_not_paid'));
                    }
                }

                if (index == array.length - 1) {
                    wb.write('data/xlsheet/' + time + '_partner_provider_history.xlsx', function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            var url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_partner_provider_history.xlsx";
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_partner_provider_history.xlsx', function () {
                                });
                            }, 10000)
                        }
                    });
                }

            })
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.generate_partner_vehicle_excel = async function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        return res.redirect('/partner_login');
    }

    let sort_order = req.body.sort_item[1];
    let sort_field = req.body.sort_item[0];
    let search_item = req.body.search_item
    let search_value = req.body.search_value;
    let value;

    value = search_value;
    value = value.replace(/^\s+|\s+$/g, '');
    value = value.replace(/ +(?= )/g, '');

    let search = { "$match": {} };
    search["$match"][search_item] = { $regex: new RegExp(value, 'i') }

    let sort = { "$sort": {} };
    sort["$sort"][sort_field] = parseInt(sort_order);

    let condition = { $match: { "_id": Schema(req.session.partner._id) } };
    let vunwind = { $unwind: "$vehicle_detail" };

    let lookup = {
        $lookup:
        {
            from: "types",
            localField: "vehicle_detail.admin_type_id",
            foreignField: "_id",
            as: "type_detail"
        }
    };

    let unwind = {
        $unwind: {
            path: "$type_detail",
            preserveNullAndEmptyArrays: true
        }
    };

    let group = {
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
                    accessibility: "$vehicle_detail.accessibility"
                }
            }
        }
    };

    let unwind2 = {
        $unwind: {
            path: "$vehicle_detail",
            preserveNullAndEmptyArrays: true
        }
    };

    let array = await Partner.aggregate([condition, vunwind, lookup, unwind, group, unwind2, search, sort]);
    
    let date = new Date()
    let time = date.getTime()
    let wb = new xl.Workbook();
    let ws = wb.addWorksheet('sheet1');
    let col = 1;

    ws.cell(1, col++).string(req.__('title_name'));
    ws.cell(1, col++).string(req.__('title_plate_no'));
    ws.cell(1, col++).string(req.__('title_model'));
    ws.cell(1, col++).string(req.__('title_color'));
    ws.cell(1, col++).string(req.__('title_passing_year'));
    ws.cell(1, col++).string(req.__('title_service_type'));
    ws.cell(1, col++).string(req.__('title_accessibility'));

    let j = 1;
    array.forEach(function (data, index) {
        col = 1;
        ws.cell(index + 2, col++).string(String(data.vehicle_detail.name));
        ws.cell(index + 2, col++).string(String(data.vehicle_detail.plate_no));
        ws.cell(index + 2, col++).string(String(data.vehicle_detail.model));
        ws.cell(index + 2, col++).string(String(data.vehicle_detail.color));
        ws.cell(index + 2, col++).string(String(data.vehicle_detail.passing_year));

        if (data.vehicle_detail.typename == undefined) {
            ws.cell(index + 2, col++).string(String(req.__('title_not_approved')));
        } else {
            ws.cell(index + 2, col++).string(String(data.vehicle_detail.typename));
        }

        if (data.vehicle_detail.accessibility != undefined) {
            if (data.vehicle_detail.accessibility.length > 0) {
                ws.cell(index + 2, col++).string(String(data.vehicle_detail.accessibility));
            }
        }

        if (j == array.length) {
            wb.write('data/xlsheet/' + time + '_partner_vehicle.xlsx', function (err) {
                if (err) {
                    console.error(err);
                } else {
                    let url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_partner_vehicle.xlsx";
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_partner_vehicle.xlsx', function () { });
                    }, 10000)
                }
            });
        } else {
            j++;
        }
    })
};

exports.admin_delete_partner = async function (req, res) {
    if (typeof req.session.userid == 'undefined') {
        res.redirect('/admin')
        return;
    }
    if(req.session.admin.type == 1 && req.session.admin.url_array.indexOf('delete_partner_button') == -1){
        res.redirect('/admin')
        return;
    }
    let partner = await Partner.findOne({_id: req.body.partner_id})
    if (!partner) {
        res.redirect('/partners');
        return;
    }
            
    await Wallet_history.deleteMany({user_id: partner._id});
    await Card.deleteMany({user_id: partner._id});
    await Partner_Vehicle_Document.deleteMany({partner_id: partner._id});
    await Provider.updateMany({"partner_ids.partner_id":partner._id}, {$pull: { "partner_ids": {partner_id: partner._id} } })
    utils.deleteImageFromFolder(partner.rif_url, 8);
    utils.deleteImageFromFolder(partner.document_2, 8);
    utils.deleteImageFromFolder(partner.government_id_proof, 8);
    utils.deleteImageFromFolder(partner.picture, 7);

    await Partner.deleteOne({_id: partner._id});
    
    if (req.body.type === '1') {
        return req.session.destroy(function (err) {
            if (err) {
                console.log(err);
                return
            }
            res.redirect('/partner_login');
            return;
        });
    }
    
    res.redirect('/partners');
            
};

exports.partner_search_driver = async function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        return res.redirect('/partner_login');
    }

    utils.check_request_params(req.body, [{ name: 'provider_email', type: 'string' }], async function (response) {
        if (response.success) {
            
            let provider_detail = {
                _id: 1,
                unique_id: 1,
                first_name: 1,
                last_name: 1,
                phone: 1,
                device_type: 1,
                device_token: 1,
                is_approved: 1,
                service_type: 1,
                address: 1,
                email:1
            }

            let provider = await Provider.findOne({ email: req.body.provider_email, country_phone_code: req.session.partner.country_phone_code,  "partner_ids.partner_id": { $ne: Schema(req.session.partner._id) }  }).select(provider_detail).lean();
            // let provider = await Provider.findOne({ email: req.body.provider_email, country_phone_code: req.session.partner.country_phone_code }).select(provider_detail).lean();
            if (!provider) {
                return res.json({ success: false, message: "No provider found" });
            }
            if (provider.is_approved != 1) {
                return res.json({ success: false, message: "This driver is not approved. Please enter ID of an approved driver." });
            }
            return res.json({ success: true, provider: provider });
        }else{
            return res.json({ success: false, message: "No provider found" });
        }
    });
};

exports.partner_send_request = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Provider.findOne({_id: req.body.provider_id, country_phone_code: req.session.partner.country_phone_code, "partner_ids.partner_id": { $ne: Schema(req.session.partner._id) }}).then((provider_detail)=>{
            if(provider_detail){
                provider_detail.partner_ids.push({
                    partner_id: Schema(req.session.partner._id),
                    status: Number(constant_json.PARTNER_REQUEST_WAITING)
                });
                provider_detail.markModified('partner_ids');
                Partner.findOne({_id: req.session.partner._id}).then((partner_detail)=>{
                    if(partner_detail){
                        utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider_detail.device_type, provider_detail.device_token, push_messages.PUSH_CODE_FOR_NEW_PARTNER_REQUEST, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, {name: partner_detail.first_name,
                                phone: partner_detail.phone,
                                _id: partner_detail._id,
                                country_phone_code: partner_detail.country_phone_code,
                                status: provider_detail.partner_ids[0].status
                        });
                    }else{
                        res.redirect('/partner_providers');    
                    }
                });     
                provider_detail.save().then(()=>{
                    message = admin_messages.success_message_request_send_successfully;
                    res.redirect('/partner_providers');
                });
            } else {
                res.redirect('/partner_providers');
            }
        });

    } else {
        res.redirect('/partner_login');
    }
};


exports.partner_remove_user = function (req, res) {
    if (typeof req.session.partner != 'undefined') {

        Provider.findOne({_id: req.body.id}).then((provider_detail)=>{
            if(provider_detail){
                provider_detail.vehicle_detail.forEach((vehicle, index) => {
                    if(vehicle.vehicle_type_id.toString() == Schema(req.session.partner._id).toString()){
                        provider_detail.vehicle_detail.splice(index, 1);
                    }
                })
                var index1 = provider_detail.partner_ids.findIndex((x)=>x.partner_id ==req.session.partner._id);
                provider_detail.partner_ids.splice(index1, 1);
                provider_detail.save().then(()=>{
                    message = admin_messages.success_message_user_removed_successfully;
                    res.redirect('/partner_providers');
                });
            } else {
                res.redirect('/partner_providers');
            }
        });

    } else {
        res.redirect('/partner_login');
    }
};

exports.partner_assigned_driver_vehicle_list = function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        return res.redirect('/partner_login');
    }
    if (!req.body.provider_id) {
        req.body.provider_id = req.query.provider_id;
    }
    let partner_id = Schema(req.session.partner._id)
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
        var unwind = {$unwind: {
                path: "$type_detail",
                preserveNullAndEmptyArrays: true
            }
        };
        var group = {$group: {
                _id: null,
                "vehicle_detail": {$push: { $cond:[{"$eq":["$vehicle_detail.vehicle_type_id", partner_id]},
                {is_selected: "$vehicle_detail.is_selected",
                passing_year: "$vehicle_detail.passing_year",
                color: "$vehicle_detail.color",
                model: "$vehicle_detail.model",
                plate_no: "$vehicle_detail.plate_no",
                name: "$vehicle_detail.name",
                accessibility: "$vehicle_detail.accessibility",
                _id: "$vehicle_detail._id",
                provider_id: "$_id",
                type_image_url: '$type_detail.type_image_url',
                typename: '$type_detail.typename',
                state: '$vehicle_detail.state',
                is_approved_by_admin: '$vehicle_detail.is_approved_by_admin'
            },"$$REMOVE"]                   
            }
            }
        }}

        
        Provider.aggregate([condition, vunwind, lookup, unwind, group]).then((provider) => { 
            if (provider.length == 0) {
                res.render('partner_provider_vehicle_list', {provider_id: req.body.provider_id, vehicle_list: []})
            } else {
                res.render('partner_provider_vehicle_list', {provider_id: req.body.provider_id, vehicle_list: provider[0].vehicle_detail})

            }
        }, (err) => {
            utils.error_response(err, res)
        })
};

exports.change_provider_vehicle_status = function (req, res) {
    if (typeof req.session.partner != 'undefined') {

        var id = Schema(req.body.provider_id);

        var state = req.body.state;
        var vehicle_id = Schema(req.body.vehicle_id);
        let condition = {}
        condition["_id"] = {$eq: Schema(vehicle_id)};

        if (state == 1) {
            var change = 0;
        } else {
            var change = 1;
            condition["is_approved_by_admin"] = {$eq: 1};
        }        
        query = {};
        query['_id'] = id;
        
        Provider.updateOne({"_id": id, vehicle_detail: { $elemMatch:condition}}, {"vehicle_detail.$.state": change}).then(() => { 
            res.redirect("partner_assigned_driver_vehicle_list?provider_id=" + id);
        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.partner_change_vehicle_status = async function (req, res) {
    if (typeof req.session.partner != 'undefined') {

        var id = Schema(req.body.provider_id);
        var partner_id = Schema(req.session.partner._id);
        var state = req.body.state;
        var vehicle_id = req.body.vehicle_id;

        if (state == 1) {
            var change = 0;
        } else {
            var change = 1;
        }
        query = {};
        query['_id'] = id;
        let updateCount = await Partner.updateOne({'_id':partner_id, "vehicle_detail._id": Schema(vehicle_id) }, {"vehicle_detail.$.state": change})
            if (updateCount.modifiedCount != 0 && change == 0) { 
                Provider.updateMany({"vehicle_detail._id": Schema(vehicle_id) }, {"vehicle_detail.$.state": change}).then(() => { 
                    res.redirect('/partner_vehicle');
                })
            }else{
                res.redirect('/partner_vehicle');
            }
    } else {
        res.redirect('/partner_login');
    }
};


exports.partner_incoming_request  = async function (req, res, next) {

    if (typeof req.session.partner != 'undefined') {
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var sort_order;
        var sort_field;
        var filter_start_date;
        var filter_end_date;
        var payment;
        var status;
        var startdate;
        var enddate;
        var user_type_id;
        let partner_id = Schema(req.session.partner._id)
        let partner = await Partner.findById(partner_id)
        let vehicles = partner.vehicle_detail
        const { service_type_array, services_array } = await getServiceTypeArray(vehicles);
        if(req.body.user_type_id){
            user_type_id = req.body.user_type_id
        }
        if (req.body.page == undefined)
        {
            page = 0;
            next = 1;
            pre = 0;
        } else
        {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }


        if (req.body.search_item == undefined)
        {
            var request = req.path.split('/')[1];
            search_item = 'user_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';
            payment = 2;
            status = 3;

        } else
        {
            var request = req.body.request;
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');


            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;
            payment = Number(req.body.payment);
            status = Number(req.body.status);
        }

        // var user_type_id_condition = { $match: {} };
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;

        // if (req.body.user_type_id) {
        //     user_type_id_condition = { $match: { user_type_id: Schema(user_type_id) } }
        // }



        if (end_date == '' || end_date == undefined) {
            end_date = new Date();
        } else {
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        if (start_date == '' || start_date == undefined) {
            start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        } else {
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        }


        const number_of_rec = 40;

        const lookup = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        const unwind = {$unwind: "$user_detail"};

        const lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "assigned_provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };


        const lookup2 = {
            $lookup:
                    {
                        from: "city_types",
                        localField: "service_type_id",
                        foreignField: "_id",
                        as: "city_type_detail"
                    }
        };

        const unwind2 = {$unwind: "$city_type_detail"};

        const lookup3 = {
            $lookup:
                    {
                        from: "types",
                        localField: "city_type_detail.typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        const unwind3 = {$unwind: "$type_detail"};

        const lookup5 = {
            $lookup:
                    {
                        from: "promo_codes",
                        localField: "promo_id",
                        foreignField: "_id",
                        as: "promo_detail"
                    }
        };

        const unwind5 = {
            $unwind: { path: "$promo_detail", preserveNullAndEmptyArrays: true }
        };

        const lookup6 = {
            $lookup:
                    {
                        from: "helpers",
                        localField: "helpers_list",
                        foreignField: "_id",
                        as: "helper_details"
                    }
        };

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = {$match: {}};
        if (search_item == "user_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1['user_detail.first_name'] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "provider_detail.first_name")
        {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "type_detail.typename") {
            var query1 = {};
            query1[search_item] = { $regex: new RegExp(value, 'i') };
            search = { "$match": { $or: [query1] } };
        } else if (search_item == "promo_detail.promocode") {
            var query1 = {};
            query1[search_item] = { $regex: new RegExp(value, 'i') };
            search = { "$match": { $or: [query1] } };
        } else {
            var query1 = {};
            if (value != "") {
                value = Number(value)
                query1[search_item] = { $eq: value };
                search = { "$match": query1 };
            } else {
                search = { $match: {} };
            }
        }

        var payment_condition = {$match: {}};
        if (payment !== 2) {
            payment_condition['$match']['payment_mode'] = {$eq: payment}
        }

        var status_condition = {$match: {}};
        
        status_condition['$match']['is_trip_completed'] = {$eq: 0}
        status_condition['$match']['is_trip_cancelled'] = {$eq: 0}
        var condition = { $match: { is_provider_accepted: { $eq: 0 } } };
        const countries = await CountryService.getCountries()

        const trip_approve_condition = { $match: {'trip_approved': {$ne: 0}}};
        const vehicle_condition = {
            $match: {
                $and: [
                    { type_id: { $in: service_type_array } },
                    {
                        $or: [
                            { 'service_details._id': { $in: services_array } },
                            { service_details: null }
                        ]
                    }
                ]
            }
        };
               
        const country = await Country.findOne({
            _id: partner.country_id,
        })

        var filter = {
            "$match": {
                'country_id': {$eq: Schema(country._id)}
            } 
        };

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        // var trip_condition = { $match: { $or: [{ is_schedule_trip: { $eq: false } }, { is_trip_cancelled: 1 }] } }
        // console.log(service_type_array)
        var provider_assigned_condition = {$or: [{assigned_provider_id:{$eq:null}},{assigned_provider_id:{$exists: false }}]};
        provider_assigned_condition = {$match: {$or: [{provider_type_id: {$eq: partner_id}} , provider_assigned_condition]}} 
        var partner_condition = {$match: {$or: [{admin_assigned_partner_id: {$eq: null} },{admin_assigned_partner_id: {$exists: false}}], drop_trip_status: {$ne: CONTAINER_DROP_STATUS.DROPPED}}};
        // var trip_condition ={ $match: {$or: [partner_condition, service_type_condition]}};
        let helpers_list = await Helper.find({helper_type_id: partner_id}).select({name:1})

        Trip.aggregate([
            filter, partner_condition, trip_approve_condition,
            vehicle_condition, provider_assigned_condition, condition, status_condition, lookup, unwind,
              lookup1, lookup2, unwind2, lookup3, unwind3, lookup5, unwind5, lookup6,
               search, count
        ]).then((array) => { 
            // console.log(array )
            if (!array || array.length == 0)
            {

                array = [];
                res.render('partner_incoming_request', { detail: array, request: request, user_type_id, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, status, payment, id: partner_id, helpers_list: [], countries});
            } else
            {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([filter, partner_condition, vehicle_condition, condition, provider_assigned_condition, status_condition, trip_approve_condition, lookup, unwind, lookup1, lookup2, unwind2, lookup3, unwind3, lookup5, unwind5, lookup6, search, sort, skip, limit]).then(async (array) => { 
                    // array.forEach((trip) => {
                    //     console.log(trip.unique_id)
                    // })
                    array = await filterTripsByVehicles(array, vehicles);
                    res.render('partner_incoming_request', { detail: array, timezone_for_display_date: setting_detail.timezone_for_display_date, request: request, user_type_id, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, status, payment, id: partner_id, helpers_list: helpers_list, countries });
                    delete message;
                }, (err) => {
                    utils.error_response(err, res)
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.get_driver_vehicle_for_trip = function (req, res) {
    try {
    // console.log(req.body)
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }

        utils.check_request_params(req.body, [{ name: 'trip_id', type: 'string' }], function (response) {
            if (!response.success) {
                return res.json({ success: false});
            }
        });

        var id = Schema(req.body.trip_id);
        Trip.findOne({_id: id, $or:[{drop_trip_status: CONTAINER_DROP_STATUS.DROPPED},{provider_type_id:null}], provider_id:null}).then((trip) => { 
            if(trip){
                Citytype.findOne({_id: trip.service_type_id}).then((city_type_data) => { 
                    // console.log(Schema(req.session.partner._id))
                Partner.findOne({_id:Schema(req.session.partner._id)}).then(async (partner) => {

                    let trip_date_tag = utils.getTripDateTag(trip, new Date());
                    let check_trip_date_start = new Date(trip_date_tag.getTime() - 30 * 60 * 1000);
                    let check_trip_date_end = new Date(trip_date_tag.getTime() + 30 * 60 * 1000);  

                    let partner_vehicles = partner.vehicle_detail
                    
                    let available_vehicles = []
                    let available_trailers = []
                    let available_drivers = []
                    const {
                        [MODEL_TRUCK_TYPE.CHUTO]: chuto_type,
                        [MODEL_TRUCK_TYPE.TRAILER]: trailer_type,
                        [MODEL_TRUCK_TYPE.CHASIS]: chasis_type,
                        [MODEL_TRUCK_TYPE.CABEZAL]: cabezal_type,
                        [MODEL_TRUCK_TYPE.TORONTO]: toronto_type
                    } = await getTruckTypes();

                    partner_vehicles.forEach((vehicle) => {
                        let truck_type = true
                        let a = -1
                        let service = 0
                        let capacity = 0
                        let model = 0
                        if(vehicle.admin_type_id.toString() != trip.type_id.toString()){
                            truck_type = false
                        }

                        if((trip.model_type == MODEL_TRUCK_TYPE.GANDOLA && vehicle.admin_type_id.toString() == trailer_type?._id?.toString()) || (trip.model_type == MODEL_TRUCK_TYPE.CABEZAL && vehicle.admin_type_id.toString() == chasis_type?._id?.toString())){
                            truck_type = true
                        }
                        if(vehicle.vehicle_book_dates && vehicle.vehicle_book_dates.length > 0){
                            a = vehicle.vehicle_book_dates.findIndex(x => 
                                x.trip_date >= check_trip_date_start && x.trip_date <= check_trip_date_end
                            );
                        }

                        if(trip.capacity_details && vehicle.selected_capacity_id.length == 0){
                            capacity = -1
                        } else if(trip.capacity_details && vehicle.selected_capacity_id && vehicle.selected_capacity_id.length > 0){
                            capacity = vehicle.selected_capacity_id.findIndex(x => x.toString() == trip.capacity_details._id.toString());
                        }


                        if(trip.service_details && vehicle.selected_services_id.length == 0){
                            service = -1
                        } else if(trip.service_details && vehicle.selected_services_id && vehicle.selected_services_id.length > 0){
                            service = vehicle.selected_services_id.findIndex(x => x.toString() == trip.service_details._id.toString());
                        }

                        if(trip.model_details && vehicle.selected_model_id.length == 0){
                            model = -1
                        } else if(trip.model_details && vehicle.selected_model_id && vehicle.selected_model_id.length > 0){
                            model = vehicle.selected_model_id.findIndex(x => x.toString() == trip.model_details._id.toString());
                        }                        
                        if(trip.model_type == MODEL_TRUCK_TYPE.GANDOLA && vehicle.admin_type_id.toString() == chuto_type?._id?.toString()){
                            truck_type = true
                            model = 1
                        }else if (trip.model_type == MODEL_TRUCK_TYPE.CABEZAL && vehicle.admin_type_id.toString() == cabezal_type?._id?.toString()){
                            truck_type = true
                            model = 1
                        }
                        if(trip.model_type == MODEL_TRUCK_TYPE.CAMION750 && vehicle.admin_type_id.toString() == toronto_type?._id?.toString()){
                            truck_type = true
                            model = 1
                        }

                        if(a == -1 && service > -1 && capacity > -1 && model > -1 && truck_type && vehicle.state == 1 && vehicle.is_approved_by_admin == 1 && (vehicle.admin_type_id.toString() != trailer_type?._id?.toString() && vehicle.admin_type_id.toString() != chasis_type?._id?.toString())){
                            available_vehicles.push(vehicle)
                        }
                        if(a == -1 && service > -1 && capacity > -1 && model > -1 && truck_type && vehicle.state == 1 && vehicle.is_approved_by_admin == 1 && (vehicle.admin_type_id.toString() == trailer_type?._id?.toString() || vehicle.admin_type_id.toString() == chasis_type?._id?.toString())){
                            available_trailers.push(vehicle)
                        }


                    })

                    let response = await Provider.find({
                        "partner_ids": {
                            $elemMatch: {
                                partner_id: Schema(req.session.partner._id),
                                status: 1
                            }
                        },
                        $or: [
                            { "provider_trip_dates.trip_date": { $exists: false } },  
                            {
                                "provider_trip_dates": {
                                    $not: {
                                        $elemMatch: {
                                            "trip_date": { 
                                                $gte: check_trip_date_start,
                                                $lte: check_trip_date_end
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    });
                    available_drivers.push(response)
                    res.json({success: true, available_vehicles: available_vehicles,  available_trailers, available_drivers: response, trip_details:trip, city_type:city_type_data, timezone_for_display_date: setting_detail.timezone_for_display_date});
                })
            })
        }
        })
    } catch (e) {
        console.log(e)
    }
};

exports.get_driver_vehicle_for_admin_assigned_trip = function (req, res) {
    try {
        // console.log(req.body)
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }

        utils.check_request_params(req.body, [{ name: 'trip_id', type: 'string' }], function (response) {
            if (!response.success) {
                return res.json({ success: false});
            }
        });
    
        var id = Schema(req.body.trip_id);
        Trip.findOne({_id: id, provider_type_id:null, provider_id:null}).then(async (trip) => { 
            if(trip){
                let types = await Type.find().select({_id:1,typename:1}).lean()
                Citytype.findOne({_id: trip.service_type_id}).then(async (city_type_data) => { 
                    // console.log(Schema(req.session.partner._id))
                Partner.findOne({_id:Schema(req.session.partner._id)}).then(async (partner) => {

                    let trip_date_tag = utils.getTripDateTag(trip, new Date());
                    let check_trip_date_start = new Date(trip_date_tag.getTime() - 30 * 60 * 1000);
                    let check_trip_date_end = new Date(trip_date_tag.getTime() + 30 * 60 * 1000);  

                    // console.log(trip_date_now_tag)
                    let partner_vehicles = partner.vehicle_detail
                    
                    // console.log(trip_start_date_tag)
                    let available_vehicles = []
                    let available_trailers = []
                    let available_drivers = []

                    let trailer_type = await Type.findOne({model_type:MODEL_TRUCK_TYPE.TRAILER}, {_id: 1}).lean()

                    partner_vehicles.forEach((vehicle) => {
                        let a = -1
                        if(vehicle.vehicle_book_dates && vehicle.vehicle_book_dates.length > 0){
                            a = vehicle.vehicle_book_dates.findIndex(x => 
                                x.trip_date >= check_trip_date_start && x.trip_date <= check_trip_date_end
                            );
                        }
                        
                        if(a == -1 && vehicle.state == 1 && vehicle.is_approved_by_admin == 1 && vehicle.admin_type_id.toString() != trailer_type?._id?.toString()){
                            available_vehicles.push(vehicle)
                        }

                        if(a == -1 && vehicle.state == 1 && vehicle.is_approved_by_admin == 1 && vehicle.admin_type_id.toString() == trailer_type?._id?.toString()){
                            available_trailers.push(vehicle)
                        }

                        
                    })
                    let response = await Provider.find({
                        "partner_ids": {
                            $elemMatch: {
                                partner_id: Schema(req.session.partner._id),
                                status: 1
                            }
                        },
                        $or: [
                            { "provider_trip_dates.trip_date": { $exists: false } },  
                            {
                                "provider_trip_dates": {
                                    $not: {
                                        $elemMatch: {
                                            "trip_date": { 
                                                $gte: check_trip_date_start,
                                                $lte: check_trip_date_end
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    });                    
                    available_drivers.push(response)
                    res.json({success: true, available_vehicles: available_vehicles, available_trailers, available_drivers: response, trip_details:trip, city_type:city_type_data, timezone_for_display_date: setting_detail.timezone_for_display_date, types});
                })
            })
        }
        })

    } catch (e) {
        console.log(e)
    }
};

exports.partner_book_request = async function (req, res) {
    // console.log(req.body)
    if (typeof req.session.partner != 'undefined') {

        utils.check_request_params(req.body, [{ name: 'confirm_trip_id', type: 'string' },{ name: 'confirm_provider_id', type: 'string' },
        { name: 'confirm_vehicle_id', type: 'string' }], function (response) {
            if (!response.success) {
                return res.json({ success: false});
            }
        });
    
        var trip_id = Schema(req.body.confirm_trip_id);
        var provider_id = Schema(req.body.confirm_provider_id);
        var vehicle_id = Schema(req.body.confirm_vehicle_id);
        let vehicle1_type = ''
        let vehicle1_model = ''
        var vehicle2_type = ''
        var vehicle2_model = ''
        var vehicle_id_2 = null;
        let is_drop_trip = false
        var partner_id = Schema(req.session.partner._id)
        let trip = await Trip.findOne({$and:[{_id: trip_id}, {admin_assigned_partner_id:null}, {$or: [{assigned_provider_id:null}, {assigned_provider_id: {$exists: false }}, {$and: [{assigned_provider_id: {$exists: true }}, {drop_trip_status: 1}]}]}, {provider_id:null}, {confirmed_provider: null}]})
        if(!trip){
            return res.json({success:false, message: admin_messages.error_message_trip_already_booked});
        }
        console.log({tripId: trip.unique_id})
        console.log({tripCreateTime: trip.created_at})
        console.log({tripBookTime: new Date()})
        console.log({partnerEmail: req.session.partner.email})

        let helpers_list = JSON.parse(req.body.confirm_helpers) || []
        if(trip.pickup_details[0].user_details.no_of_helpers != "" && Number(trip.pickup_details[0].user_details.no_of_helpers) != 0 && helpers_list.length > 0){
            trip.helpers_list = helpers_list
        }
        let trip_date_tag = utils.getTripDateTag(trip, new Date());
        let check_trip_date_start = new Date(trip_date_tag.getTime() - 30 * 60 * 1000);
        let check_trip_date_end = new Date(trip_date_tag.getTime() + 30 * 60 * 1000);  

        let partner_condition = {}
        let partner_condition_and = []
        partner_condition_and.push({_id: partner_id})
        partner_condition_and.push({
            "vehicle_detail": {
                $elemMatch: {
                    _id: { "$eq": vehicle_id },
                    $or: [
                        { "vehicle_book_dates.trip_date": { $exists: false } },  
                        {
                            "vehicle_book_dates": {
                                $not: {
                                    $elemMatch: {
                                        "trip_date": { 
                                            $gte: check_trip_date_start,
                                            $lte: check_trip_date_end
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        });
        

        if(req.body.confirm_vehicle_id_2 != "" && trip.model_type && (trip.model_type == MODEL_TRUCK_TYPE.GANDOLA|| trip.model_type == MODEL_TRUCK_TYPE.CHUTO || trip.model_type == MODEL_TRUCK_TYPE.CABEZAL)){
            vehicle_id_2 = req.body.confirm_vehicle_id_2 || null;
            if(vehicle_id_2){
                vehicle_id_2 = Schema(vehicle_id_2)
            }
            partner_condition_and.push({
                "vehicle_detail": {
                    $elemMatch: {
                        _id: { "$eq": vehicle_id_2 },
                        $or: [
                            { "vehicle_book_dates.trip_date": { $exists: false } },  
                            {
                                "vehicle_book_dates": {
                                    $not: {
                                        $elemMatch: {
                                            "trip_date": { 
                                                $gte: check_trip_date_start,
                                                $lte: check_trip_date_end
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            });
    
        }
        partner_condition["$and"] = partner_condition_and;

        let partner = await Partner.findOne(partner_condition) 
        if(!partner){
            return res.json({success:false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
        let provider = await Provider.findOne({
            _id: provider_id,
            "partner_ids": {
                $elemMatch: {
                    partner_id: Schema(req.session.partner._id),
                    status: 1
                }
            },
            $or: [
                { "provider_trip_dates.trip_date": { $exists: false } },  
                {
                    "provider_trip_dates": {
                        $not: {
                            $elemMatch: {
                                "trip_date": { 
                                    $gte: check_trip_date_start,
                                    $lte: check_trip_date_end
                                }
                            }
                        }
                    }
                }
            ]
        });
        
        if(!provider){
            return res.json({success:false , error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }

        let vehicle_index = partner.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id.toString());

        let vehicle = partner.vehicle_detail[vehicle_index]
        trip.assigned_provider_id = provider._id;
        trip.trip_assigned_by = constant_json.PARTNER_UNIQUE_NUMBER;
        if(trip?.unassigned == 1){
            trip.unassigned = 0;
        }
        trip.assigned_provider_details = {
            _id: provider._id,
            name: provider.first_name +' '+ provider.last_name,
            email: provider.email,
            phone: provider.phone,
            country_phone_code: provider.country_phone_code
        }
         console.log(vehicle_id)
        
        var service_type = await Citytype.findOne({_id: vehicle.service_type})
        let plate_no = ""
        if(vehicle){
            plate_no = vehicle.plate_no
            vehicle1_model = service_type.typename;
            // console.log(vehicle)
            if(vehicle.selected_model_id.length > 0){
                var vehicle_model = await Type_Models.find({ _id: {$in: vehicle.selected_model_id} }).lean(); 
            }   

            if(vehicle.selected_services_id.length > 0){
                var vehicle_services = await Type_Services.find({ _id: {$in: vehicle.selected_services_id} }).lean(); 
            }   

            if(vehicle.selected_capacity_id.length > 0){
                var vehicle_capacity = await Type_Capacity.find({ _id: {$in: vehicle.selected_capacity_id} }).lean(); 
            }   

            let vehicle_model_details = []
            if(vehicle_model && vehicle_model.length > 0){
                vehicle_model.forEach((model) => {
                    let vehicle_model_data = {
                        vehicle_model_id : model._id,
                        vehicle_model_name : model.model_name
                    }
                    vehicle1_type = model.model_name;
                    vehicle_model_details.push(vehicle_model_data)
                })
            }   

            let vehicle_service_details = []
            if(vehicle_services && vehicle_services.length > 0){
                vehicle_services.forEach((service) => {
                    let vehicle_service_data = {
                        vehicle_service_id : service._id,
                        vehicle_service_name : service.service_name
                    }
                    vehicle_service_details.push(vehicle_service_data)
                })
            }   

            let vehicle_capacity_details = []
            if(vehicle_capacity && vehicle_capacity.length > 0){
                vehicle_capacity.forEach((capacity) => {
                    let vehicle_capacity_data = {
                        vehicle_capacity_id : capacity._id,
                        vehicle_capacity_name : capacity.capacity_name
                    }
                    vehicle_capacity_details.push(vehicle_capacity_data)
                })
            }   

            trip.assigned_vehicle_details = {
                vehicle_model_details : vehicle_model_details,
                vehicle_capacity_details : vehicle_capacity_details,
                vehicle_service_details : vehicle_service_details,
                vehicle_truck_type_id : service_type._id,
                vehicle_truck_type_name : service_type.typename,
                vehicle_plate_no: plate_no
                
            }
        }else{
            trip.assigned_vehicle_details = null
        }
        trip.assigned_vehicle_id = vehicle_id
        if(trip?.drop_trip_status == CONTAINER_DROP_STATUS.DROPPED){
            is_drop_trip = true
        }

        trip.provider_type_id = partner_id;
        trip.assigned_partner_name = partner.first_name +' '+ partner.last_name;

        let provider_has_vehicle = provider.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id.toString());


        if(req.body.confirm_vehicle_id_2 != "" && trip.model_type && (trip.model_type == MODEL_TRUCK_TYPE.GANDOLA || trip.model_type == MODEL_TRUCK_TYPE.CHUTO ||  trip.model_type == MODEL_TRUCK_TYPE.CABEZAL)){
            let vehicle2_index = partner.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id_2.toString());
            var vehicle_2 = partner.vehicle_detail[vehicle2_index]
            let plate_no_2 = ""
            if(vehicle_2){
                let service_type_trailer = await Citytype.findOne({_id: vehicle_2.service_type})

                plate_no_2 = vehicle_2.plate_no
                vehicle2_model = service_type_trailer.typename
                if(vehicle_2.selected_model_id.length > 0){
                    var vehicle_model_2 = await Type_Models.find({ _id: {$in: vehicle_2.selected_model_id} }).lean(); 
                }   
    
                if(vehicle_2.selected_services_id.length > 0){
                    var vehicle_services_2 = await Type_Services.find({ _id: {$in: vehicle_2.selected_services_id} }).lean(); 
                }   
    
                if(vehicle_2.selected_capacity_id.length > 0){
                    var vehicle_capacity_2 = await Type_Capacity.find({ _id: {$in: vehicle_2.selected_capacity_id} }).lean(); 
                }   
    
                let vehicle_model_details_2 = []
                if(vehicle_model_2 && vehicle_model_2.length > 0){
                    vehicle_model_2.forEach((model) => {
                        let vehicle_model_data_2 = {
                            vehicle_model_id : model._id,
                            vehicle_model_name : model.model_name
                        }
                        vehicle2_type = model.model_name
                        vehicle_model_details_2.push(vehicle_model_data_2)
                    })
                }   
    
                let vehicle_service_details_2 = []
                if(vehicle_services_2 && vehicle_services_2.length > 0){
                    vehicle_services_2.forEach((service) => {
                        let vehicle_service_data_2 = {
                            vehicle_service_id : service._id,
                            vehicle_service_name : service.service_name
                        }
                        vehicle_service_details_2.push(vehicle_service_data_2)
                    })
                }   
    
                let vehicle_capacity_details_2 = []
                if(vehicle_capacity_2 && vehicle_capacity_2.length > 0){
                    vehicle_capacity_2.forEach((capacity) => {
                        let vehicle_capacity_data_2 = {
                            vehicle_capacity_id : capacity._id,
                            vehicle_capacity_name : capacity.capacity_name
                        }
                        vehicle_capacity_details_2.push(vehicle_capacity_data_2)
                    })
                }   
                trip.assigned_vehicle_details_2 = {
                    vehicle_model_details : vehicle_model_details_2,
                    vehicle_service_details : vehicle_service_details_2,
                    vehicle_capacity_details : vehicle_capacity_details_2,
                    vehicle_truck_type_id : service_type_trailer._id,
                    vehicle_truck_type_name : service_type_trailer.typename,
                    vehicle_plate_no: plate_no_2
                }

            }
    
            trip.assigned_vehicle_id_2 = vehicle_id_2
    
        }
        let updateCount = await Trip.updateOne({'_id':trip._id}, trip.getChanges())
        if (updateCount.modifiedCount != 0) { 
            let provider_trip_date_tag = {
                trip_id: trip._id,
                trip_date: trip_date_tag
            }
            if(provider_has_vehicle == -1){
                await Provider.updateOne({ _id: provider_id }, { $push: { provider_trip_dates: provider_trip_date_tag, vehicle_detail: vehicle } })
            }else{
                await Provider.updateOne({ _id: provider_id }, { $push: { provider_trip_dates: provider_trip_date_tag } })
            }
            
            await Partner.updateOne({"vehicle_detail._id": vehicle_id},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })
            await Provider.updateMany({"vehicle_detail._id": vehicle_id},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })
            if(req.body.confirm_vehicle_id_2 != "" && trip.model_type && (trip.model_type == MODEL_TRUCK_TYPE.GANDOLA|| trip.model_type == MODEL_TRUCK_TYPE.CHUTO ||  trip.model_type == MODEL_TRUCK_TYPE.CABEZAL )){
                let provider_has_vehicle_2 = provider.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id_2.toString());
    
                if(provider_has_vehicle_2 == -1){
                    await Provider.updateOne({ _id: provider_id }, { $push: { provider_trip_dates: provider_trip_date_tag, vehicle_detail: vehicle_2 } })
                }else{
                    await Provider.updateOne({ _id: provider_id }, { $push: { provider_trip_dates: provider_trip_date_tag } })
                }
                
                await Partner.updateOne({"vehicle_detail._id": vehicle_id_2},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })
                await Provider.updateMany({"vehicle_detail._id": vehicle_id_2},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })
    
            }
            let user_detail = {
                _id: 1,
                device_type: 1,
                device_token: 1,
                user_type_id: 1,
                first_name: 1,
                last_name: 1,
                email: 1
            }
            let user = await User.findById(trip.user_id).select(user_detail).lean()
            utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, push_messages.PUSH_CODE_FOR_PROVIDER_ASSIGNED_TRIP, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
            let extra_param = {
                first_name: provider.first_name,
                last_name: provider.last_name,
                vehicle1_model:vehicle1_model,
                vehicle1_type:vehicle1_type,
                vehicle2_model:vehicle2_model,
                vehicle2_type:vehicle2_type
            }
            utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user.device_type, user.device_token, push_messages.PUSH_CODE_FOR_USER_NOTIFY_OF_TRIP_ASSIGNED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS,extra_param);
            if(is_drop_trip){
                const corporate = user.user_type_id
                ? await Corporate.findOne({ _id: user.user_type_id }, { name: 1, email: 1 }).lean()
                : null;
              
                const user_data = {
                    name: corporate?.name ?? user.first_name +" "+ user.last_name,
                    email: corporate?.email ?? user.email,
                };
                allemails.sendEmailUserNotifyEmptyTrailerLoad(req, user_data, provider.first_name +" "+ provider.last_name, plate_no, 28);
            }
                      
            return res.json({ success: true, message : admin_messages.success_message_trip_booked_successfully});        
        }
                // })
    } else {
        res.redirect('/partner_login');
    }
}

exports.partner_book_admin_assigned_request = async function (req, res) {
    // console.log(req.body)
    if (typeof req.session.partner != 'undefined') {

        utils.check_request_params(req.body, [{ name: 'confirm_trip_id', type: 'string' },{ name: 'confirm_provider_id', type: 'string' },
        { name: 'confirm_vehicle_id', type: 'string' }], function (response) {
            if (!response.success) {
                return res.json({ success: false});
            }
        });
    
        var trip_id = Schema(req.body.confirm_trip_id);
        var provider_id = Schema(req.body.confirm_provider_id);
        var vehicle_id = Schema(req.body.confirm_vehicle_id);
        var vehicle_id_2 = req.body.confirm_vehicle_id_2 || null;
        let vehicle1_type = ''
        let vehicle1_model = ''
        let vehicle2_type = ''
        let vehicle2_model = ''

        if(vehicle_id_2){
            vehicle_id_2 = Schema(vehicle_id_2)
        }
        var partner_id = Schema(req.session.partner._id)
        let trip = await Trip.findOne({$and:[{_id: trip_id}, {admin_assigned_partner_id: partner_id}, {$or: [{assigned_provider_id:null}, {assigned_provider_id: {$exists: false }}]}, {provider_id:null}, {confirmed_provider: null}]})
        if(!trip){
            return res.json({success:false, message: admin_messages.error_message_trip_already_booked});
        }
        let trip_date_tag = utils.getTripDateTag(trip, new Date());
        let check_trip_date_start = new Date(trip_date_tag.getTime() - 30 * 60 * 1000);
        let check_trip_date_end = new Date(trip_date_tag.getTime() + 30 * 60 * 1000);  

        let partner_condition = {}
        let partner_condition_and = []
        partner_condition_and.push({_id: partner_id})
        partner_condition_and.push({
            "vehicle_detail": {
                $elemMatch: {
                    _id: { "$eq": vehicle_id },
                    $or: [
                        { "vehicle_book_dates.trip_date": { $exists: false } },  
                        {
                            "vehicle_book_dates": {
                                $not: {
                                    $elemMatch: {
                                        "trip_date": { 
                                            $gte: check_trip_date_start,
                                            $lte: check_trip_date_end
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        });

        if(req.body.confirm_vehicle_id_2 != "" && trip.model_type && (trip.model_type == MODEL_TRUCK_TYPE.GANDOLA|| trip.model_type == MODEL_TRUCK_TYPE.CHUTO ||  trip.model_type == MODEL_TRUCK_TYPE.CABEZAL)){
            partner_condition_and.push({
                "vehicle_detail": {
                    $elemMatch: {
                        _id: { "$eq": vehicle_id_2 },
                        $or: [
                            { "vehicle_book_dates.trip_date": { $exists: false } },  
                            {
                                "vehicle_book_dates": {
                                    $not: {
                                        $elemMatch: {
                                            "trip_date": { 
                                                $gte: check_trip_date_start,
                                                $lte: check_trip_date_end
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            });
        }
        partner_condition["$and"] = partner_condition_and;

        let partner = await Partner.findOne(partner_condition) 
        if(!partner){
            return res.json({success:false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
        let provider = await Provider.findOne({
            _id: provider_id,
            "partner_ids": {
                $elemMatch: {
                    partner_id: Schema(req.session.partner._id),
                    status: 1
                }
            },
            $or: [
                { "provider_trip_dates.trip_date": { $exists: false } },  
                {
                    "provider_trip_dates": {
                        $not: {
                            $elemMatch: {
                                "trip_date": { 
                                    $gte: check_trip_date_start,
                                    $lte: check_trip_date_end
                                }
                            }
                        }
                    }
                }
            ]
        });

        if(!provider){
            return res.json({success:false , error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }

        let vehicle_index = partner.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id.toString());

        let vehicle = partner.vehicle_detail[vehicle_index]
        trip.assigned_provider_id = provider._id;
        trip.trip_assigned_by = constant_json.ADMIN_UNIQUE_NUMBER;
        if(trip?.unassigned == 1){
            trip.unassigned = 0;
        }
        if(trip.is_provider_accepted > 0){
            if(provider.is_trip.length != 0){
                return res.json({success:false , error_code: error_message.ERROR_CODE_BUSY_DRIVER_WITH_OTHER_TRIP});
            }
            await Provider.updateOne({ _id: provider._id },{$push: {is_trip: trip._id},$set: {is_available: 0}})
            trip.provider_first_name = provider.first_name
            trip.provider_last_name = provider.last_name
            trip.provider_id =  provider._id
            trip.confirmed_provider =  provider._id
            trip.current_provider =  provider._id
        }

        trip.assigned_provider_details = {
            _id: provider._id,
            name: provider.first_name +' '+ provider.last_name,
            email: provider.email,
            phone: provider.phone,
            country_phone_code: provider.country_phone_code,
            unique_id: provider.unique_id
        }
        // console.log(vehicle_id)
        
        var service_type = await Citytype.findOne({_id: vehicle.service_type})
        let plate_no = ""
        if(vehicle){
            plate_no = vehicle.plate_no
            vehicle1_model = service_type.typename;
            // console.log(vehicle)
            if(vehicle.selected_model_id.length > 0){
                var vehicle_model = await Type_Models.find({ _id: {$in: vehicle.selected_model_id} }).lean(); 
            }   

            if(vehicle.selected_services_id.length > 0){
                var vehicle_services = await Type_Services.find({ _id: {$in: vehicle.selected_services_id} }).lean(); 
            }   

            if(vehicle.selected_capacity_id.length > 0){
                var vehicle_capacity = await Type_Capacity.find({ _id: {$in: vehicle.selected_capacity_id} }).lean(); 
            }   

            let vehicle_model_details = []
            if(vehicle_model && vehicle_model.length > 0){
                vehicle_model.forEach((model) => {
                    let vehicle_model_data = {
                        vehicle_model_id : model._id,
                        vehicle_model_name : model.model_name
                    }
                    vehicle1_type = model.model_name;
                    vehicle_model_details.push(vehicle_model_data)
                })
            }   

            let vehicle_service_details = []
            if(vehicle_services && vehicle_services.length > 0){
                vehicle_services.forEach((service) => {
                    let vehicle_service_data = {
                        vehicle_service_id : service._id,
                        vehicle_service_name : service.service_name
                    }
                    vehicle_service_details.push(vehicle_service_data)
                })
            }   

            let vehicle_capacity_details = []
            if(vehicle_capacity && vehicle_capacity.length > 0){
                vehicle_capacity.forEach((capacity) => {
                    let vehicle_capacity_data = {
                        vehicle_capacity_id : capacity._id,
                        vehicle_capacity_name : capacity.capacity_name
                    }
                    vehicle_capacity_details.push(vehicle_capacity_data)
                })
            }   

            trip.assigned_vehicle_details = {
                vehicle_model_details : vehicle_model_details,
                vehicle_capacity_details : vehicle_capacity_details,
                vehicle_service_details : vehicle_service_details,
                vehicle_truck_type_id : service_type._id,
                vehicle_truck_type_name : service_type.typename,
                vehicle_plate_no: plate_no
            }
        }else{
            trip.assigned_vehicle_details = null
        }

        trip.assigned_vehicle_id = vehicle_id

        trip.provider_type_id = partner_id;
        trip.assigned_partner_name = partner.first_name +' '+ partner.last_name;
        
        let provider_has_vehicle = provider.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id.toString());


        if(req.body.confirm_vehicle_id_2 != "" && trip.model_type && (trip.model_type == MODEL_TRUCK_TYPE.GANDOLA|| trip.model_type == MODEL_TRUCK_TYPE.CHUTO ||  trip.model_type == MODEL_TRUCK_TYPE.CABEZAL )){
            let vehicle2_index = partner.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id_2.toString());
            var vehicle_2 = partner.vehicle_detail[vehicle2_index]
            let plate_no_2 = ""

            if(vehicle_2){

                let service_type_trailer = await Citytype.findOne({_id: vehicle_2.service_type})

                plate_no_2 = vehicle_2.plate_no
                vehicle2_model = service_type_trailer.typename
                if(vehicle_2.selected_model_id.length > 0){
                    var vehicle_model_2 = await Type_Models.find({ _id: {$in: vehicle_2.selected_model_id} }).lean(); 
                }   
    
                if(vehicle_2.selected_services_id.length > 0){
                    var vehicle_services_2 = await Type_Services.find({ _id: {$in: vehicle_2.selected_services_id} }).lean(); 
                }   
    
                if(vehicle_2.selected_capacity_id.length > 0){
                    var vehicle_capacity_2 = await Type_Capacity.find({ _id: {$in: vehicle_2.selected_capacity_id} }).lean(); 
                }   
    
                let vehicle_model_details_2 = []
                if(vehicle_model_2 && vehicle_model_2.length > 0){
                    vehicle_model_2.forEach((model) => {
                        let vehicle_model_data_2 = {
                            vehicle_model_id : model._id,
                            vehicle_model_name : model.model_name
                        }
                        vehicle2_type = model.model_name
                        vehicle_model_details_2.push(vehicle_model_data_2)
                    })
                }   
    
                let vehicle_service_details_2 = []
                if(vehicle_services_2 && vehicle_services_2.length > 0){
                    vehicle_services_2.forEach((service) => {
                        let vehicle_service_data_2 = {
                            vehicle_service_id : service._id,
                            vehicle_service_name : service.service_name
                        }
                        vehicle_service_details_2.push(vehicle_service_data_2)
                    })
                }   
    
                let vehicle_capacity_details_2 = []
                if(vehicle_capacity_2 && vehicle_capacity_2.length > 0){
                    vehicle_capacity_2.forEach((capacity) => {
                        let vehicle_capacity_data_2 = {
                            vehicle_capacity_id : capacity._id,
                            vehicle_capacity_name : capacity.capacity_name
                        }
                        vehicle_capacity_details_2.push(vehicle_capacity_data_2)
                    })
                }   
                trip.assigned_vehicle_details_2 = {
                    vehicle_model_details : vehicle_model_details_2,
                    vehicle_service_details : vehicle_service_details_2,
                    vehicle_capacity_details : vehicle_capacity_details_2,
                    vehicle_truck_type_id : service_type_trailer._id,
                    vehicle_truck_type_name : service_type_trailer.typename,
                    vehicle_plate_no: plate_no_2
                }

            }
    
            trip.assigned_vehicle_id_2 = vehicle_id_2
    
        }
        trip.save().then(async ()=>{
            let provider_trip_date_tag = {
                trip_id: trip._id,
                trip_date: trip_date_tag
            }
            if(provider_has_vehicle == -1){
                await Provider.updateOne({ _id: provider_id }, { $push: { provider_trip_dates: provider_trip_date_tag, vehicle_detail: vehicle } })
            }else{
                await Provider.updateOne({ _id: provider_id }, { $push: { provider_trip_dates: provider_trip_date_tag } })
            }
            
            await Partner.updateOne({"vehicle_detail._id": vehicle_id},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })
            await Provider.updateMany({"vehicle_detail._id": vehicle_id},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })
        if(req.body.confirm_vehicle_id_2 != "" && trip.model_type && (trip.model_type == MODEL_TRUCK_TYPE.GANDOLA|| trip.model_type == MODEL_TRUCK_TYPE.CHUTO ||  trip.model_type == MODEL_TRUCK_TYPE.CABEZAL)){
                let provider_has_vehicle_2 = provider.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id_2.toString());

                if(provider_has_vehicle_2 == -1){
                    await Provider.updateOne({ _id: provider_id }, { $push: { provider_trip_dates: provider_trip_date_tag, vehicle_detail: vehicle_2 } })
                }else{
                    await Provider.updateOne({ _id: provider_id }, { $push: { provider_trip_dates: provider_trip_date_tag } })
                }
                
                await Partner.updateOne({"vehicle_detail._id": vehicle_id_2},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })
                await Provider.updateMany({"vehicle_detail._id": vehicle_id_2},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })
    
            }
            let user_detail = {
                _id: 1,
                device_type: 1,
                device_token: 1,
            }
            let user = await User.findById(trip.user_id).select(user_detail).lean()
            utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, push_messages.PUSH_CODE_FOR_PROVIDER_ASSIGNED_TRIP, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
            let extra_param = {
                first_name: provider.first_name,
                last_name: provider.last_name,
                vehicle1_model:vehicle1_model,
                vehicle1_type:vehicle1_type,
                vehicle2_model:vehicle2_model,
                vehicle2_type:vehicle2_type
            }
            utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user.device_type, user.device_token, push_messages.PUSH_CODE_FOR_USER_NOTIFY_OF_TRIP_ASSIGNED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS,extra_param);

            return res.json({ success: true, message : admin_messages.success_message_trip_booked_successfully});        
        })
                // })
    } else {
        res.redirect('/partner_login');
    }
}

exports.partner_unassign_trip_request = async function (req, res) {

    if (typeof req.session.partner != 'undefined') {

        utils.check_request_params(req.body, [{name: 'trip_id', type: 'string'}], async function (response) {
            if (!response.success) {
                return res.json({
                        success: false,
                        error_code: response.error_code,
                        error_description: response.error_description
                    });
            }

            
            let trip_id = Schema(req.body.trip_id)
            let partner_id = Schema(req.session.partner._id)
            let trip = await Trip.findOne({_id: trip_id, provider_type_id: partner_id, $or: [{is_provider_status: {$lt: PROVIDER_STATUS.TRIP_STARTED}}, {drop_trip_status: {$gte:1}}]});
            if(!trip){
                return res.json({success:false})
            }
            let device_detail = {
                _id: 1,
                device_type: 1,
                device_token: 1,
            }

            let user = await User.findById(trip.user_id).select(device_detail).lean()
            let provider = await Provider.findById(trip.assigned_provider_id).select(device_detail).lean()

            let unassign_reason = req.body.unassign_reason || "";
            if(unassign_reason == ""){
                return res.json({success:false})
            }
            let unassign_list = trip.partner_unassign_data || []
            let unassign_obj = {
                unassign_partner_id: partner_id,
                unassign_reason: unassign_reason,
            }
            if(unassign_reason != req.__('title_unassign_reason_1') && unassign_reason != req.__('title_unassign_reason_2')){
                unassign_obj.reason_type = 1 // 0 is static reason , 1 is other reason
            }
            unassign_list.push(unassign_obj)

            if(trip.provider_id){
                let is_trip_condition = { _id: provider._id, is_trip: trip._id };
                let is_trip_update = { is_available: 1, is_trip: [] };
                await Provider.updateOne(is_trip_condition, is_trip_update)
                trip.provider_first_name = "",
                trip.provider_last_name = "",
                trip.provider_id = null,
                trip.confirmed_provider = null,
                trip.current_provider = null
            }
            trip.assigned_provider_id = null;
            trip.assigned_provider_details = null
            trip.assigned_vehicle_id = null
            trip.assigned_vehicle_id_2 = null
            trip.assigned_vehicle_details = null
            trip.assigned_vehicle_details_2 = null
            trip.provider_type_id = null;
            trip.unassigned = 1;
            trip.is_provider_confirm_trip = 0;
            trip.assigned_partner_name = "";
            trip.helpers_list = [];
            trip.sub_corporate_id = null;
            trip.is_provider_status = 0;
            trip.is_provider_accepted= 0;
            if(trip?.drop_trip_status > 0){
                trip.drop_trip_status = 0
                trip.unload_notification_sent = 0
            }
            trip.partner_unassign_data = unassign_list;

            let updateCount = await Trip.updateOne({'_id':trip._id}, trip.getChanges())
            if (updateCount.modifiedCount != 0 ) { 
                utils.reset_trip_location_data(trip._id)
                utils.remove_dates_driver_vehicle(trip._id,  trip.model_type)
                utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user.device_type, user.device_token, push_messages.PUSH_CODE_FOR_USER_NOTIFY_OF_TRIP_UNASSIGNED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider?.device_type, provider?.device_token, push_messages.PUSH_CODE_FOR_DRIVER_NOTIFY_FOR__TRIP_UNASSIGNED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
            }
            return res.json({success: true, message: req.__(admin_messages.success_message_unassigned_succesfully)});
        })
    } else {
        res.redirect('/partner_login');
    }

}

exports.truck_owner_status_change = async function (req, res) { // Change truck owner status of provider
    if (typeof req.session.partner == 'undefined') {
        res.redirect('/partner_login');
        return;
    }
    let id = req.body.id;
    let partner_id = req.session.partner._id;
    let partner = await Partner.count({_id:partner_id})
    if(partner == 0){
        res.redirect('/partner_providers');
        return;
    }
    
    let is_truck_owner = req.body.is_truck_owner;
    let change;
    if (is_truck_owner == 1) {
        change = 0;
    } else {
        change = 1;
    }

    if(change == 1){
        let provider_data = await Provider.findOne({_id: id}).select({partner_ids:1}).lean()
        let index = provider_data.partner_ids.findIndex(e => e.truck_owner == 1)
        if(index != -1){
            res.redirect('/partner_providers');
            return;
        }
    }

    await Provider.updateOne({"_id": Schema(id), "partner_ids.partner_id": Schema(partner_id) }, {"partner_ids.$.truck_owner": change})
    res.redirect('/partner_providers');
    return;
};


exports.admin_delete_partner_document = async function (req, res) {
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin')
            return;
        }
        let id = req.body.id
        let partner_detail = await Partner.findById(id).select({rif_url:1, document_2:1, government_id_proof:1}).lean()
        if(!partner_detail){
            res.redirect('/partners')
            return;
        }
        if(req.body.type == 0){ // rif
            utils.deleteImageFromFolder(partner_detail.rif_url, 8);
            await Partner.findByIdAndUpdate(id, {rif_url: null})
        }else if(req.body.type == 1){ // Constitutivo
            utils.deleteImageFromFolder(partner_detail.document_2, 8);
            await Partner.findByIdAndUpdate(id, {document_2: null})
        }else if(req.body.type == 2){ // Goverment ID Proof
            utils.deleteImageFromFolder(partner_detail.government_id_proof, 8);
            await Partner.findByIdAndUpdate(id, {government_id_proof: null})
        }
        message = admin_messages.success_message_doc_deleted_successfully
        res.redirect('/partners')

    } catch (e) {
        console.log(e)
        res.redirect('/partners')
    }
};

exports.partner_map_view = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }
        let running_trip_list = await Trip.aggregate([
            {
                $match: {
                    provider_type_id: {$eq: Schema(req.session.partner._id)},
                    is_trip_completed: 0,
                    is_trip_end: 0,
                    is_provider_status: { $gte: PROVIDER_STATUS.COMING }
                }
            },
            {
                $lookup:
                    {
                        from: "types",
                        localField: "type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
            },
            {
                $project: {
                    assigned_vehicle_details: 1,
                    providerLocation: 1,
                    assigned_provider_details: 1,
                    provider_id: 1,
                    type_image: "$type_detail.panel_map_pin_image_url"
                }
            }
        ]);

        let partner = req.session.partner
        
        const country = await Country.findOne({
            _id: partner.country_id,
        })

        const url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key 
        res.render('partner_map_view', {
            trip_list:running_trip_list, 
            map_url: url,
            latitude: country.coordinates.latitude,
            longitude: country.coordinates.longitude
        });
    } catch (e) {
        console.log(e)
    }
};

exports.partner_map_get_provider_data = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        } 
        const tripData = Trip.findOne({_id: req.body.trip_id}).select({speed:1, is_provider_status:1}).lean()
        const providerData = Provider.findOne({_id: req.body.provider_id}).select({first_name:1, last_name:1, country_phone_code:1, phone:1}).lean()
        let [trip, provider] = await Promise.all([
            tripData,
            providerData,
        ])
        res.json({success:true, provider, trip})
    } catch (e) {
        console.log(e)
        res.json({success:false, provider: null, trip: null})   
    }    
}

exports.admin_update_detail = async function (req, res, next) {
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return;
        }
        var id = req.body.id;
        let { password } = req.body;
        let { email } = req.body;
        let { first_name } = req.body;
        let { last_name } = req.body;
        let { partner_company_name } = req.body;

        let body = { password, email, first_name, last_name, partner_company_name };
        const partner_data = await Partner.findOne(
            {email: ((req.body.email).trim()).toLowerCase(), _id: {$ne:id}}).select({_id:1}
        ).lean()
        if(partner_data){
            message = admin_messages.error_message_email_already_used;
            res.redirect('/partners');
            return;
        }

        if (body.password && body.password != "") {
            var crypto = require('crypto');
            var hash = crypto.createHash('md5').update(body.password).digest('hex');
            body.password = hash;
        } else {
            delete body.password;
        }

        await Partner.findByIdAndUpdate(id, body)
        message = admin_messages.success_message_user_update;
        res.redirect('/partners');
    } catch (e) {
        console.log(e);    
    }

};

exports.partner_get_user_details = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }
        let trip = await Trip.findOne({_id: req.body.trip_id }).select({user_type_id: 1}).lean()
        if(!trip || !trip.user_type_id){
            return res.json({success: false});
        }   
        let corporate = await Corporate.findOne({_id: trip.user_type_id }).select({name: 1, phone:1, country_phone_code:1}).lean()
        if(!corporate){
            return res.json({success: false});
        }   
        return res.json({success: true, corporate});
                
    } catch (e) {
        console.log(e)
    }
};

exports.update_webpush_config = async function (req, res) {
    try {
        let type = Number(req.body.type);
        let id = req.body.id;
        let Table = Partner;
        switch (type) {
            case Number(constant_json.PARTNER_UNIQUE_NUMBER):
                type = Number(constant_json.PARTNER_UNIQUE_NUMBER);
                Table = Partner;
                break;
            case Number(constant_json.CORPORATE_UNIQUE_NUMBER):
                type = Number(constant_json.CORPORATE_UNIQUE_NUMBER);
                Table = Corporate;
                break;
            default:
                type = Number(constant_json.PARTNER_UNIQUE_NUMBER);
                Table = Partner;
                break;
        }

        await Table.updateOne({_id: Schema(id)},{webpush_config: req.body.subscription})
        res.json({success:true})
    } catch (e) {
        console.log(e)
    }
}

exports.partner_remove_vehicle = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }
        const vehicle_id = req.body.vehicle_id
        let partner = await Partner.findOne({_id: req.session.partner._id}).select({vehicle_detail:1}).lean()
        if(!partner){
            return res.json({success: false, message: req.__(admin_messages.error_remove_vehicle_failed) });
        }
        let vehicle_index = partner.vehicle_detail.findIndex(vehicle => (vehicle._id).toString() == vehicle_id);

        if(vehicle_index == -1){
            return res.json({success: false, message: req.__(admin_messages.error_remove_vehicle_failed) });
        }
        let running_trips = await Trip.count({assigned_vehicle_id: vehicle_id})
        if(running_trips != 0){
            return res.json({success: false, message: req.__(admin_messages.error_trip_running) });
        }

        let trips_to_assign_data = await Trip_history.count({
            assigned_vehicle_id: vehicle_id, 
            "assigned_vehicle_details.vehicle_plate_no": {$exists: false}
        })
        if(trips_to_assign_data > 0){
            const vehicle = partner.vehicle_detail[vehicle_index]
            const vehicle_model_details = []
            const vehicle_service_details = []
            const vehicle_capacity_details = []
            const service_type = await Citytype.findOne({_id: vehicle.service_type}).select({_id:1, typename:1}).lean()
    
            if(vehicle.selected_model_id.length > 0){
                const vehicle_model = await Type_Models.find({ _id: {$in: vehicle.selected_model_id} }).lean(); 
                if(vehicle_model && vehicle_model.length > 0){
                    vehicle_model.forEach((model) => {
                        let vehicle_model_data = {
                            vehicle_model_id : model._id,
                            vehicle_model_name : model.model_name
                        }
                        vehicle_model_details.push(vehicle_model_data)
                    })
                }   
            }   
    
            if(vehicle.selected_services_id.length > 0){
                const vehicle_services = await Type_Services.find({ _id: {$in: vehicle.selected_services_id} }).lean(); 
                if(vehicle_services && vehicle_services.length > 0){
                    vehicle_services.forEach((service) => {
                        let vehicle_service_data = {
                            vehicle_service_id : service._id,
                            vehicle_service_name : service.service_name
                        }
                        vehicle_service_details.push(vehicle_service_data)
                    })
                }   
            }   
    
            if(vehicle.selected_capacity_id.length > 0){
                const vehicle_capacity = await Type_Capacity.find({ _id: {$in: vehicle.selected_capacity_id} }).lean(); 
                if(vehicle_capacity && vehicle_capacity.length > 0){
                    vehicle_capacity.forEach((capacity) => {
                        let vehicle_capacity_data = {
                            vehicle_capacity_id : capacity._id,
                            vehicle_capacity_name : capacity.capacity_name
                        }
                        vehicle_capacity_details.push(vehicle_capacity_data)
                    })
                }   
            }   
    
            const vehicle_data = {
                vehicle_model_details : vehicle_model_details,
                vehicle_capacity_details : vehicle_capacity_details,
                vehicle_service_details : vehicle_service_details,
                vehicle_truck_type_id : service_type._id,
                vehicle_truck_type_name : service_type.typename,
                vehicle_plate_no: vehicle.plate_no
            }
            const updateCount = await Trip_history.updateMany({                
                assigned_vehicle_id: vehicle_id, 
                "assigned_vehicle_details.vehicle_plate_no": {$exists: false}
            }, {assigned_vehicle_details: vehicle_data })

            if (updateCount.modifiedCount == 0){
                return res.json({success: false, message: req.__(admin_messages.error_remove_vehicle_failed) });
            }
        }
        await Provider.updateMany({"vehicle_detail._id": Schema(vehicle_id)}, {$pull: {"vehicle_detail": {_id: Schema(vehicle_id)} } })
        await Partner.updateOne({"vehicle_detail._id": Schema(vehicle_id)}, {$pull: {"vehicle_detail": {_id: Schema(vehicle_id)} } })
        await Partner_Vehicle_Document.deleteMany({vehicle_id: vehicle_id});
        return res.json({success: true, message: req.__(admin_messages.error_remove_vehicle_success) });

    } catch (e) {
        console.log(e)
        return res.json({success: false, message: req.__(admin_messages.error_remove_vehicle_failed) });
    }
};


exports.partner_add_trip_expense = async function (req, res) {
    try {
        let search_query = {_id:req.body.trip_id, provider_type_id: req.session.partner._id}
        let trip = await Trip_history.findOne(search_query).select({provider_service_fees:1}).lean()
        if(!trip){
            return res.json({success:false})
        }
        const expense_data = req.body.expense_data     
        const viaticos = expense_data.viaticos || 0
        const gasoil = expense_data.gasoil || 0
        const chofer = expense_data.chofer || 0
        const caletero = expense_data.caletero || 0
        const otros = expense_data.otros || 0
        const partner_profit = trip.provider_service_fees
        let profit_after_expense =  (partner_profit - viaticos - gasoil - chofer - caletero - otros).toFixed(2)
        let profit_percent = ((profit_after_expense * 100)/partner_profit).toFixed(2) 

        let update_data = {
            viaticos: +viaticos,
            gasoil: +gasoil,
            chofer: +chofer,
            caletero: +caletero,
            otros: +otros,
            profit_after_expense: +profit_after_expense,
            profit_percent: +profit_percent
        };
                
        await Trip_history.updateOne(search_query, {expense_data: update_data})
        res.json({success:true, expense_data: update_data})
    } catch (e) {
        console.log(e)
        res.json({success:false})
    }
}

exports.partner_statistics = async function (req, res) {    
    try {    
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }
        const current_date = moment().tz("America/Caracas");
        const start_of_day = current_date.startOf('day').toDate();
        const firstDateCurrentMonth = current_date.startOf('month').toDate();
        const firstDateOfPreviousMonth = current_date.clone().subtract(1, 'months').startOf('month').toDate();
        const lastDateOfPreviousMonth = current_date.clone().subtract(1, 'months').endOf('month').toDate();
        const start_of_year = current_date.startOf('year').toDate();
        const array = [];

        let partner = req.session.partner
        
        const country = await Country.findOne({
            _id: partner.country_id,
        })
        
        const total_trips = Trip.aggregate([
            {
                $match:{
                    provider_type_id: {$eq: Schema(req.session.partner._id)},
                    country_id: {$eq: Schema(country._id)}
                }
            },
            {
                $group: {
                    _id: null,
                    running_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, 1, 0]}},
                    amount_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, "$provider_service_fees", 0]}},
                    distance_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, "$estimated_distance", 0]}},

                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    total: { $sum: 1 },
                    
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$provider_service_fees", 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$provider_service_fees", 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$provider_service_fees", 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$provider_service_fees", 0]}},
                    amount_total: { $sum: "$provider_service_fees" },
                    
                    distance_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$estimated_distance", 0]}},
                    distance_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$estimated_distance", 0]}},
                    distance_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$estimated_distance", 0]}},
                    distance_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$estimated_distance", 0]}},
                    distance_total: { $sum: "$estimated_distance" }
                }
            }
        ])

        const total_trip_histories = Trip_history.aggregate([
            {
                $match:{
                    provider_type_id: {$eq: Schema(req.session.partner._id)},
                    country_id: {$eq: Schema(country._id)}
                }
            },
            {
                $match: {
                    is_provider_status : {$eq: 9} 
                }
            },
            {
                $group: {
                    _id: null,
                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    total: { $sum: 1 },
                    
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$provider_service_fees", 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$provider_service_fees", 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$provider_service_fees", 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$provider_service_fees", 0]}},
                    amount_total: { $sum: "$provider_service_fees" },
                    
                    distance_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$estimated_distance", 0]}},
                    distance_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$estimated_distance", 0]}},
                    distance_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$estimated_distance", 0]}},
                    distance_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$estimated_distance", 0]}},
                    distance_total: { $sum: "$estimated_distance" }
                }
            }
        ])

        const [totalTrips, totalTripHistories] = await Promise.all([
            total_trips,
            total_trip_histories
        ])

        const emptyDataObject = {
            today: 0,
            current_month: 0,
            previous_month: 0,
            current_year: 0,
            total: 0,
            amount_today: 0,
            amount_current_month: 0,
            amount_previous_month: 0,
            amount_current_year: 0,
            amount_total: 0,
            distance_today: 0,
            distance_current_month: 0,
            distance_previous_month: 0,
            distance_current_year: 0,
            distance_total: 0,
        };
        
        const no_data_history = { ...emptyDataObject };
        const no_data = {
            ...emptyDataObject,
            running_trips: 0,
            amount_trips: 0,
            distance_trips: 0,
        };
        array['running_trips'] = totalTrips[0] || no_data;
        array['trip_histories'] = totalTripHistories[0] || no_data_history;
        const templateName = process.env.INTEGRATION_NEW_TRAVEL === 'true' ? "partner_statistics" : "partner_statistics_old";
        
        return res.render(templateName, { 
            detail: array,
            new_statistics: process.env.NEW_STATISTICS
        });

    } catch (e) {
        console.log(e)
        return res.render(templateName, { 
            detail: array,
            new_statistics: process.env.NEW_STATISTICS
        });
    }
}

exports.check_plate_no_available = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }
        let plate_no = (req.body.plate_no).trim();
        if(plate_no != ""){
            plate_no = plate_no.replace(/^0+/, '');
        }
        
        let query = {};
        query['vehicle_detail.plate_no'] = plate_no;
        Partner.count(query).then((vehicle) => { 
            if (vehicle == 0) {
                res.json({success: true});
            } else {
                res.json({success: false});
            }
        });
    } catch (e) {
        console.log(e)
        res.json({success: false});
    }
};

exports.partnerDropTrip = async (req, res) => {
    try {
        let trip_id = req.body.trip_id
        let trip = await Trip.findOne({_id: trip_id, provider_type_id: req.session.partner._id, is_trip_cancelled: 0, is_trip_completed: 0, is_provider_status: {$lte: 9}, model_type: MODEL_TRUCK_TYPE.CABEZAL})
        if(!trip){
            return res.json({success:false})
        }
        let corporate = null;
        if(trip.user_type_id){
            corporate = await Corporate.findOne({_id: trip.user_type_id},{name: 1, company_name: 1, email: 1}).lean()
        }
        const user = await User.findOne({_id: trip.user_id},{first_name: 1, last_name: 1, email: 1}).lean()


        trip.provider_first_name = ""
        trip.provider_last_name = ""
        trip.provider_id = null
        trip.confirmed_provider = null
        trip.current_provider = null
        trip.assigned_provider_id = null;
        trip.assigned_provider_details = null
        trip.assigned_vehicle_id = null
        trip.assigned_vehicle_id_2 = null
        trip.assigned_vehicle_details = null
        trip.assigned_vehicle_details_2 = null
        trip.is_provider_confirm_trip = 0;
        trip.assigned_partner_name = "";
        trip.helpers_list = [];
        trip.drop_trip_status = CONTAINER_DROP_STATUS.DROPPED
        let updateCount = await Trip.updateOne({'_id':trip._id}, trip.getChanges())
        if (updateCount.modifiedCount != 0 ) { 
            let extraParam = {
                email: corporate?.email || user.email,
                user_name: corporate ? corporate.name : user.first_name + user.last_name,
                name: corporate ? corporate.name : user.first_name + user.last_name
            }
            allemails.sendEmailPartnerCorporate(req, extraParam, 29);
            utils.remove_dates_driver_vehicle(trip._id,  trip.model_type)
        }
        return res.json({success: true, message: req.__(admin_messages.success_message_drop_trip_success)});
    } catch (e) {
        console.log(e) 
    }
}
       
exports.get_available_driver_vehicle_for_partner = async function (req, res) {
    try {
        if (typeof req.session.partner == 'undefined') {
            res.redirect('/partner_login');
            return;
        }

        utils.check_request_params(req.body, [{ name: 'trip_id', type: 'string' }], function (response) {
            if (!response.success) {
                return res.json({ success: false});
            }
        });
    
        const id = Schema(req.body.trip_id);
        const partner_id = Schema(req.session.partner._id)
        const trip = await Trip.findOne({_id: id, provider_type_id:partner_id, assigned_provider_id: {$ne:null}}).lean()
        const change_type = req.body.change_type;
        if(trip){
            Citytype.findOne({_id: trip.service_type_id}).then((city_type_data) => { 
                Partner.findOne({_id:Schema(req.session.partner._id)}).then(async (partner) => {

                    let trip_date_tag = utils.getTripDateTag(trip, new Date());
                    let check_trip_date_start = new Date(trip_date_tag.getTime() - 30 * 60 * 1000);
                    let check_trip_date_end = new Date(trip_date_tag.getTime() + 30 * 60 * 1000);  
                    let partner_vehicles = partner.vehicle_detail
                    
                    let available_vehicles = []
                    let available_trailers = []
                    let available_drivers = []
                    if(change_type == "vehicle"){

                    const {
                        [MODEL_TRUCK_TYPE.CHUTO]: chuto_type,
                        [MODEL_TRUCK_TYPE.TRAILER]: trailer_type,
                        [MODEL_TRUCK_TYPE.CHASIS]: chasis_type,
                        [MODEL_TRUCK_TYPE.CABEZAL]: cabezal_type,
                        [MODEL_TRUCK_TYPE.TORONTO]: toronto_type
                    } = await getTruckTypes();

                        partner_vehicles.forEach((vehicle) => {
                            let truck_type = true
                            let a = -1
                            let service = 0
                            let capacity = 0
                            let model = 0
                            let not_repeat = true
                            if(trip.assigned_vehicle_id.toString() == vehicle._id.toString()){
                                not_repeat = false
                            }

                            if(vehicle.admin_type_id.toString() != trip.type_id.toString()){
                                truck_type = false
                            }

                            if((trip.model_type == MODEL_TRUCK_TYPE.GANDOLA && vehicle.admin_type_id.toString() == trailer_type?._id?.toString()) || (trip.model_type == MODEL_TRUCK_TYPE.CABEZAL && vehicle.admin_type_id.toString() == chasis_type?._id?.toString())){
                                truck_type = true
                            }
                            if(vehicle.vehicle_book_dates && vehicle.vehicle_book_dates.length > 0){
                                a = vehicle.vehicle_book_dates.findIndex(x => 
                                    x.trip_date >= check_trip_date_start && x.trip_date <= check_trip_date_end
                                );
                            }

                            if(trip.capacity_details && vehicle.selected_capacity_id.length == 0){
                                capacity = -1
                            } else if(trip.capacity_details && vehicle.selected_capacity_id && vehicle.selected_capacity_id.length > 0){
                                capacity = vehicle.selected_capacity_id.findIndex(x => x.toString() == trip.capacity_details._id.toString());
                            }


                            if(trip.service_details && vehicle.selected_services_id.length == 0){
                                service = -1
                            } else if(trip.service_details && vehicle.selected_services_id && vehicle.selected_services_id.length > 0){
                                service = vehicle.selected_services_id.findIndex(x => x.toString() == trip.service_details._id.toString());
                            }

                            if(trip.model_details && vehicle.selected_model_id.length == 0){
                                model = -1
                            } else if(trip.model_details && vehicle.selected_model_id && vehicle.selected_model_id.length > 0){
                                model = vehicle.selected_model_id.findIndex(x => x.toString() == trip.model_details._id.toString());
                            }                        
                            if(trip.model_type == MODEL_TRUCK_TYPE.GANDOLA && vehicle.admin_type_id.toString() == chuto_type?._id?.toString()){
                                truck_type = true
                                model = 1
                            }else if (trip.model_type == MODEL_TRUCK_TYPE.CABEZAL && vehicle.admin_type_id.toString() == cabezal_type?._id?.toString()){
                                truck_type = true
                                model = 1
                            }
                            if(trip.model_type == MODEL_TRUCK_TYPE.CAMION750 && vehicle.admin_type_id.toString() == toronto_type?._id?.toString()){
                                truck_type = true
                                model = 1
                            }

                            if(not_repeat && a == -1 && service > -1 && capacity > -1 && model > -1 && truck_type && vehicle.state == 1 && vehicle.is_approved_by_admin == 1 && (vehicle.admin_type_id.toString() != trailer_type?._id?.toString() && vehicle.admin_type_id.toString() != chasis_type?._id?.toString())){
                                available_vehicles.push(vehicle)
                            }
                            if(not_repeat && a == -1 && service > -1 && capacity > -1 && model > -1 && truck_type && vehicle.state == 1 && vehicle.is_approved_by_admin == 1 && (vehicle.admin_type_id.toString() == trailer_type?._id?.toString() || vehicle.admin_type_id.toString() == chasis_type?._id?.toString())){
                                available_trailers.push(vehicle)
                            }


                        })
                    }else{
                        let response = await Provider.find({
                            _id: {$ne: trip.assigned_provider_id},
                            "partner_ids": {
                                $elemMatch: {
                                    partner_id: Schema(req.session.partner._id),
                                    status: 1
                                }
                            },
                            $or: [
                                { "provider_trip_dates.trip_date": { $exists: false } },  
                                {
                                    "provider_trip_dates": {
                                        $not: {
                                            $elemMatch: {
                                                "trip_date": { 
                                                    $gte: check_trip_date_start,
                                                    $lte: check_trip_date_end
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        });
                        available_drivers = response
                    }

                    res.json({success: true, available_vehicles: available_vehicles,  available_trailers, available_drivers: available_drivers, trip_details:trip, city_type:city_type_data, timezone_for_display_date: setting_detail.timezone_for_display_date});
                })
            })
        }
    } catch (e) {
        console.log(e)
    }
};

exports.partner_change_driver = async function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        utils.check_request_params(req.body, [{ name: 'change_driver_trip_id', type: 'string' },
        { name: 'change_driver_reason', type: 'string' }], async function (response) {
        if (!response.success) {
            return res.json({ success: false});
        }
        let body = req.body
        const trip_id = Schema(body.change_driver_trip_id);
        const new_provider_id = Schema(body.change_driver_id);
        const reason = body.change_driver_reason;
        const vehicle_id = Schema(body.change_vehicle_id) || null;
        let new_provider = null
        let vehicle1_type = ''
        let vehicle1_model = ''
        let vehicle2_type = ''
        let vehicle2_model = ''
        let vehicle_id_2 = null;
        let old_vehicle_id = null;
        let old_vehicle_id_2 = null;
        let is_vehicle_changed = false
        let is_vehicle_2_changed = false
        const change_type = body.change_type
        const isChangeVehicle = change_type == "vehicle"
        const isChangeProvider = change_type == "provider"
        if(!reason || reason == ""){
            return res.json({success: false});
        }
        const partner_id = Schema(req.session.partner._id)
        let trip = await Trip.findOne({$and:[{_id: trip_id}, {provider_type_id: partner_id}]})
        if(!trip){
            return res.json({success:false, message: admin_messages.error_message_trip_already_booked});
        }
        const trip_date_tag = utils.getTripDateTag(trip, new Date());
        const check_trip_date_start = new Date(trip_date_tag.getTime() - 30 * 60 * 1000);
        const check_trip_date_end = new Date(trip_date_tag.getTime() + 30 * 60 * 1000);  
        
        let partner_condition = {_id: partner_id}
        let partner = await Partner.findOne(partner_condition) 
        if(!partner){
            return res.json({success:false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
        let change_driver_reason = trip.change_driver_reason || []
        change_driver_reason.push({
            partner_id: Schema(partner._id),
            reason: reason
        })
        if(isChangeProvider){
            new_provider = await Provider.findOne({
                _id: new_provider_id,
                "partner_ids": {
                    $elemMatch: {
                        partner_id: Schema(req.session.partner._id),
                        status: 1
                    }
                },
                $or: [
                    { "provider_trip_dates.trip_date": { $exists: false } },  
                    {
                        "provider_trip_dates": {
                            $not: {
                                $elemMatch: {
                                    "trip_date": { 
                                        $gte: check_trip_date_start,
                                        $lte: check_trip_date_end
                                    }
                                }
                            }
                        }
                    }
                ]
            });
            
            if(!new_provider){
                console.log("HHHH")
                return res.json({success:false , error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
            }
        }

        if(isChangeVehicle && body.change_vehicle_list_2 != "" && trip.model_type && (trip.model_type == MODEL_TRUCK_TYPE.GANDOLA|| trip.model_type == MODEL_TRUCK_TYPE.CHUTO || trip.model_type == MODEL_TRUCK_TYPE.CABEZAL)){
            vehicle_id_2 = body.change_vehicle_id_2 || null;
            if(vehicle_id_2){
                vehicle_id_2 = Schema(vehicle_id_2)
            }
        }
        if(isChangeVehicle && vehicle_id){
            let vehicle_index = partner.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id.toString());
            let vehicle = partner.vehicle_detail[vehicle_index]
            var service_type = await Citytype.findOne({_id: vehicle.service_type})
            let plate_no = ""
            if(vehicle){
                plate_no = vehicle.plate_no
                vehicle1_model = service_type.typename;
                // console.log(vehicle)
                if(vehicle.selected_model_id.length > 0){
                    var vehicle_model = await Type_Models.find({ _id: {$in: vehicle.selected_model_id} }).lean(); 
                }   
    
                if(vehicle.selected_services_id.length > 0){
                    var vehicle_services = await Type_Services.find({ _id: {$in: vehicle.selected_services_id} }).lean(); 
                }   
    
                if(vehicle.selected_capacity_id.length > 0){
                    var vehicle_capacity = await Type_Capacity.find({ _id: {$in: vehicle.selected_capacity_id} }).lean(); 
                }   
    
                let vehicle_model_details = []
                if(vehicle_model && vehicle_model.length > 0){
                    vehicle_model.forEach((model) => {
                        let vehicle_model_data = {
                            vehicle_model_id : model._id,
                            vehicle_model_name : model.model_name
                        }
                        vehicle1_type = model.model_name;
                        vehicle_model_details.push(vehicle_model_data)
                    })
                }   
    
                let vehicle_service_details = []
                if(vehicle_services && vehicle_services.length > 0){
                    vehicle_services.forEach((service) => {
                        let vehicle_service_data = {
                            vehicle_service_id : service._id,
                            vehicle_service_name : service.service_name
                        }
                        vehicle_service_details.push(vehicle_service_data)
                    })
                }   
    
                let vehicle_capacity_details = []
                if(vehicle_capacity && vehicle_capacity.length > 0){
                    vehicle_capacity.forEach((capacity) => {
                        let vehicle_capacity_data = {
                            vehicle_capacity_id : capacity._id,
                            vehicle_capacity_name : capacity.capacity_name
                        }
                        vehicle_capacity_details.push(vehicle_capacity_data)
                    })
                }   
    
                trip.assigned_vehicle_details = {
                    vehicle_model_details : vehicle_model_details,
                    vehicle_capacity_details : vehicle_capacity_details,
                    vehicle_service_details : vehicle_service_details,
                    vehicle_truck_type_id : service_type._id,
                    vehicle_truck_type_name : service_type.typename,
                    vehicle_plate_no: plate_no 
                }
                old_vehicle_id = trip.assigned_vehicle_id
                trip.assigned_vehicle_id = vehicle_id
                is_vehicle_changed = true
            }
        }

        if(isChangeVehicle && body.change_vehicle_id_2 != "" && trip.model_type && (trip.model_type == MODEL_TRUCK_TYPE.GANDOLA || trip.model_type == MODEL_TRUCK_TYPE.CHUTO ||  trip.model_type == MODEL_TRUCK_TYPE.CABEZAL)){
            let vehicle2_index = partner.vehicle_detail.map(v => v._id.toString()).indexOf(vehicle_id_2.toString());
            var vehicle_2 = partner.vehicle_detail[vehicle2_index]
            let plate_no_2 = ""
            if(vehicle_2){
                let service_type_trailer = await Citytype.findOne({_id: vehicle_2.service_type})

                plate_no_2 = vehicle_2.plate_no
                vehicle2_model = service_type_trailer.typename
                if(vehicle_2.selected_model_id.length > 0){
                    var vehicle_model_2 = await Type_Models.find({ _id: {$in: vehicle_2.selected_model_id} }).lean(); 
                }   
    
                if(vehicle_2.selected_services_id.length > 0){
                    var vehicle_services_2 = await Type_Services.find({ _id: {$in: vehicle_2.selected_services_id} }).lean(); 
                }   
    
                if(vehicle_2.selected_capacity_id.length > 0){
                    var vehicle_capacity_2 = await Type_Capacity.find({ _id: {$in: vehicle_2.selected_capacity_id} }).lean(); 
                }   
    
                let vehicle_model_details_2 = []
                if(vehicle_model_2 && vehicle_model_2.length > 0){
                    vehicle_model_2.forEach((model) => {
                        let vehicle_model_data_2 = {
                            vehicle_model_id : model._id,
                            vehicle_model_name : model.model_name
                        }
                        vehicle2_type = model.model_name
                        vehicle_model_details_2.push(vehicle_model_data_2)
                    })
                }   
    
                let vehicle_service_details_2 = []
                if(vehicle_services_2 && vehicle_services_2.length > 0){
                    vehicle_services_2.forEach((service) => {
                        let vehicle_service_data_2 = {
                            vehicle_service_id : service._id,
                            vehicle_service_name : service.service_name
                        }
                        vehicle_service_details_2.push(vehicle_service_data_2)
                    })
                }   
    
                let vehicle_capacity_details_2 = []
                if(vehicle_capacity_2 && vehicle_capacity_2.length > 0){
                    vehicle_capacity_2.forEach((capacity) => {
                        let vehicle_capacity_data_2 = {
                            vehicle_capacity_id : capacity._id,
                            vehicle_capacity_name : capacity.capacity_name
                        }
                        vehicle_capacity_details_2.push(vehicle_capacity_data_2)
                    })
                }   
                trip.assigned_vehicle_details_2 = {
                    vehicle_model_details : vehicle_model_details_2,
                    vehicle_service_details : vehicle_service_details_2,
                    vehicle_capacity_details : vehicle_capacity_details_2,
                    vehicle_truck_type_id : service_type_trailer._id,
                    vehicle_truck_type_name : service_type_trailer.typename,
                    vehicle_plate_no: plate_no_2
                }

            }
            old_vehicle_id_2 = trip.assigned_vehicle_id_2
            trip.assigned_vehicle_id_2 = vehicle_id_2
            is_vehicle_2_changed = true
        }


        trip.change_driver_reason = change_driver_reason
        if(new_provider){
            await Provider.updateOne(
                { 'provider_trip_dates.trip_id': Schema(trip_id) },
                { $pull: { provider_trip_dates: { trip_id: Schema(trip_id) } } }
            )
            if(trip.is_provider_status > 0){
                await Provider.updateOne({_id: trip.assigned_provider_id, is_trip: trip_id},{is_trip: [], is_available: 1 })    
                trip.provider_id = new_provider_id
                trip.confirm_provider_id = new_provider_id
                trip.current_provider = new_provider_id
                trip.provider_first_name = new_provider.first_name
                trip.provider_last_name = new_provider.last_name
                trip.provider_app_version = new_provider.app_version
                trip.provider_device_type = new_provider.device_type
            }
            trip.assigned_provider_id = new_provider._id;
            if(trip.is_provider_accepted > 0){
                if(new_provider.is_trip.length != 0){
                    return res.json({success:false , error_code: error_message.ERROR_CODE_BUSY_DRIVER_WITH_OTHER_TRIP});
                }
                await Provider.updateOne({ _id: new_provider._id },{$push: {is_trip: trip._id},$set: {is_available: 0}})
                trip.provider_first_name = new_provider.first_name
                trip.provider_last_name = new_provider.last_name
                trip.provider_id =  new_provider._id
                trip.confirmed_provider =  new_provider._id
                trip.current_provider =  new_provider._id
            }
            
            trip.assigned_provider_details = {
                _id: new_provider._id,
                name: new_provider.first_name +' '+ new_provider.last_name,
                email: new_provider.email,
                phone: new_provider.phone,
                country_phone_code: new_provider.country_phone_code,
                unique_id: new_provider.unique_id
            }
        }
        trip.save().then(async ()=>{
            let provider_trip_date_tag = {
                trip_id: trip._id,
                trip_date: trip_date_tag
            }
            if(isChangeVehicle){
                if(is_vehicle_changed){
                    await Partner.updateOne(
                        { 'vehicle_detail.vehicle_book_dates.trip_id': Schema(trip_id) },
                        {
                            $pull: {
                                'vehicle_detail.$[].vehicle_book_dates': {
                                    trip_id: Schema(trip_id),
                                },
                            },
                        }
                    )
                    await Partner.updateOne({"vehicle_detail._id": vehicle_id},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })
                }
                if(is_vehicle_2_changed && body.change_vehicle_id_2 != "" && trip.model_type && (trip.model_type == MODEL_TRUCK_TYPE.GANDOLA|| trip.model_type == MODEL_TRUCK_TYPE.CHUTO ||  trip.model_type == MODEL_TRUCK_TYPE.CABEZAL )){  
                    await Partner.updateOne({"vehicle_detail._id": vehicle_id_2},{$push: { "vehicle_detail.$.vehicle_book_dates": provider_trip_date_tag } })    
                }
            }
            if(new_provider){
                await Provider.updateOne({ _id: new_provider_id }, { $push: { provider_trip_dates: provider_trip_date_tag } })
                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, new_provider.device_type, new_provider.device_token, push_messages.PUSH_CODE_FOR_PROVIDER_ASSIGNED_TRIP, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
            }
            return res.json({ success: true, message : admin_messages.success_message_trip_booked_successfully});        
        })
        });
    } else {
        res.redirect('/partner_login');
    }
}


function partnerListSearchQueries(full_name, item, value) {
    let search = [];
    let query1 = {};
    let query2 = {};
    let query = {};

    if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {
        query1[item] = new RegExp(value, 'i');
        query2['last_name'] = new RegExp(value, 'i');
        search.push(query1);
        search.push(query2);
        return search;
    }

    query[item] = new RegExp(full_name[0], 'i');
    query['last_name'] = new RegExp(full_name[1], 'i');
    search.push(query);
    return search;
}

async function filterTripsByVehicles(trips, vehicles) {
    const chuto_model = await Type_Models.findOne({ $or: [{model_name: "Chuto"}, {model_type: MODEL_TRUCK_TYPE.CHUTO}] },{ _id: 1 }).lean();
    const cabezal_model = await Type_Models.findOne({ $or: [{model_name: "Cabezal", model_type: MODEL_TRUCK_TYPE.CABEZAL}] },{ _id: 1 }).lean();
    const toronto_type = await Type.findOne({ model_type: MODEL_TRUCK_TYPE.TORONTO },{ _id: 1 }).lean();
  
    return trips.filter(trip => {
        const typeMatch = vehicle => vehicle.admin_type_id?.toString() === trip.type_id?.toString();
        const modelMatch = vehicle => {
            if (!trip.model_details?._id) return true;
            return vehicle.selected_model_id?.some(
                m => m.toString() === trip.model_details._id.toString()
            );
        };
        const serviceMatch = vehicle => {
            if (!trip.service_details?._id) return true;
            return vehicle.selected_services_id?.some(
                s => s.toString() === trip.service_details._id.toString()
            );
        };
        const isToronto = vehicle => vehicle.admin_type_id.toString() == toronto_type?._id?.toString()
        if (trip.model_type === MODEL_TRUCK_TYPE.GANDOLA) {
            const isChutoOrCabezalModel =
            trip.model_details?._id?.toString() === chuto_model?._id?.toString() ||
            trip.model_details?._id?.toString() === cabezal_model?._id?.toString();          
            if (!isChutoOrCabezalModel) {
                const anyVehicleHasModel = vehicles.some(vehicle => modelMatch(vehicle));
                if (!anyVehicleHasModel) return false;
            }
            return vehicles.some(vehicle => serviceMatch(vehicle));
        }
        if (trip.model_type === MODEL_TRUCK_TYPE.CABEZAL) {
            return vehicles.some(vehicle => typeMatch(vehicle) && serviceMatch(vehicle));
        }
        
        if (trip.model_type === MODEL_TRUCK_TYPE.CAMION750) {
            return vehicles.some(vehicle => (isToronto(vehicle) || modelMatch(vehicle)) && serviceMatch(vehicle));
        }

        return vehicles.some(vehicle => typeMatch(vehicle) && modelMatch(vehicle) && serviceMatch(vehicle));
    });
  }
  
async function getTruckTypes() {
    const modelTypes = [
        MODEL_TRUCK_TYPE.CHUTO,
        MODEL_TRUCK_TYPE.TRAILER,
        MODEL_TRUCK_TYPE.CHASIS,
        MODEL_TRUCK_TYPE.CABEZAL,
        MODEL_TRUCK_TYPE.TORONTO
    ];
 
    const types = await Type.find({ model_type: { $in: modelTypes } }, { _id: 1, model_type: 1 }).lean();
    const typeMap = Object.fromEntries(types.map(type => [type.model_type, type]));

    return modelTypes.reduce((acc, type) => {
        acc[type] = typeMap[type] || null;
        return acc;
    }, {});
}

async function getServiceTypeArray(vehicle_list) {
    const vehicles = vehicle_list.filter(vehicle => vehicle.state == 1);

    function toObjectId(value) {
        return Schema(value);
    }
    const getUniqueIds = (arr, key) => [
        ...new Set(arr.flatMap(item => item[key].map(id => id.toString())))
    ].map(toObjectId);
    
    const services_array = getUniqueIds(vehicles, 'selected_services_id');
    const service_type_array = [...new Set(vehicles.map(v => v.admin_type_id))].map(toObjectId);

    const requiredTypes = [MODEL_TRUCK_TYPE.CHUTO, MODEL_TRUCK_TYPE.TRAILER, MODEL_TRUCK_TYPE.GANDOLA, MODEL_TRUCK_TYPE.TORONTO, MODEL_TRUCK_TYPE.CAMION750];
    const types = await Type.find({ $or: [{ _id: { $in: service_type_array } }, { model_type: { $in: requiredTypes } }] }).lean();

    const typeMap = Object.fromEntries(types.map(type => [type.model_type, type]));

    if (service_type_array.some(id => types.some(type => type._id.equals(id) && [MODEL_TRUCK_TYPE.CHUTO, MODEL_TRUCK_TYPE.TRAILER].includes(type.model_type)))) {
        if (typeMap[MODEL_TRUCK_TYPE.GANDOLA]) {
            service_type_array.push(typeMap[MODEL_TRUCK_TYPE.GANDOLA]._id);
        }
    }

    if (service_type_array.some(id => types.some(type => type._id.equals(id) && type.model_type === MODEL_TRUCK_TYPE.TORONTO))) {
        if (typeMap[MODEL_TRUCK_TYPE.CAMION750]) {
            service_type_array.push(typeMap[MODEL_TRUCK_TYPE.CAMION750]._id);
        }
    }

    return {
        service_type_array,
        services_array
    };
}