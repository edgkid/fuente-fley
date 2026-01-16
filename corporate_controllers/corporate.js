const utils = require('../controllers/utils');
const allemails = require('../controllers/emails');
const User = require('mongoose').model('User');
const Corporate = require('mongoose').model('Corporate');
const fs = require('fs');
const console = require('../controllers/console');
const Country = require('mongoose').model('Country');
const Settings = require('mongoose').model('Settings');
const crypto = require('crypto');
const moment = require("moment");
const mongoose = require('mongoose');
const Schema = mongoose.Types.ObjectId;
const Trip = require('mongoose').model('Trip');
const Trip_Location = require('mongoose').model('trip_location');
const Trip_history = require('mongoose').model('Trip_history');
const City = require('mongoose').model('City');
const Trip_Service = require('mongoose').model('trip_service');
const Provider_Document = require('mongoose').model('Provider_Document');
const Provider = require('mongoose').model('Provider');
const Reviews = require('mongoose').model('Reviews');
const Partner_Vehicle_Document = require('mongoose').model('Partner_Vehicle_Document');
const Document = require('mongoose').model('Document');
const filterService = require('../services/filter.service')
const CountryService = require('../services/country.service')
const axios = require("axios").default
const Type = require('mongoose').model('Type');
const Partner = require('mongoose').model('Partner');  
const Ferry_ticket = require('mongoose').model('Ferry_ticket');
const Citytype = require('mongoose').model('city_type');

require('dotenv').config();

const URL_ARRAY = [
    {value: 'corporate_create_trip', label: 'Crear Solicitud'},
    {value: 'corporate_request', label: 'Solicitudes Activas'},
    {value: 'corporate_history', label: 'Solicitudes Completadas'},
    {value: 'corporate_future_request', label: 'Solicitudes Futuras'},
    {value: 'corporate_statistics_facturado', label: 'Statistics Facturado'},
    {value: 'corporate_map_view', label: 'Map View'},
];

var xl = require('excel4node');

exports.register = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
    	Country.find({
            isBusiness: constant_json.YES
        }).sort({_id: -1}).then((country) => { 
            res.render("corporate_register", {country: country});
            delete message;
        });
    } else {
		res.redirect('/corporate_profile');
        delete message;
    }
};

exports.corporate_create = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {        
        let phone = req.body.phone
    	Corporate.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((response) => { 

            if (response) {
                message = admin_messages.error_message_email_already_used;
                res.redirect('/corporate_register');
            } else {
                Corporate.findOne({phone: phone}).then((response) => { 
                    if (response) {
                        message = admin_messages.error_message_mobile_no_already_used;
                        res.redirect('/corporate_register');
                    } else {
                        var password = req.body.password;
                        var hash = crypto.createHash('md5').update(password).digest('hex');

                        var referral_code = utils.tokenGenerator(6);

                        var name = req.body.name;
                        name = name.charAt(0).toUpperCase() + name.slice(1);
                        var token = utils.tokenGenerator(32);

                        var code = req.body.country_phone_code;
                        var code_name = code.split(' ');
                        var country_code = code_name[0];
                        var country_name = "";

                        for (i = 1; i <= (code_name.length) - 1; i++) {

                            country_name = country_name + " " + code_name[i];
                        }

                        country_name = country_name.substr(1);

                        Country.findOne({countryname:country_name}).then(country=>{
                            var corporate = new Corporate({
                                name: name,
                                email: ((req.body.email).trim()).toLowerCase(),
                                country_phone_code: country_code,
                                country_name: country_name,
                                phone: phone,
                                password: hash,
                                country_id: country._id,
                                wallet_currency_code: req.body.wallet_currency_code,
                                is_approved: 0,
                                wallet: 0,
                                token: token,
                                referral_code: referral_code
                            });
                            corporate.save().then(async (corporate) => { 
        
                                create_corporate_user(corporate)
                                if (corporate?.email) {
                                    allemails.sendCorporateRegisterEmail(corporate.email, corporate.country_id);
                                }
                                message = admin_messages.success_message_registration;
                                res.redirect('/corporate_login');
                            }, (err) => {
                                console.log(err)
                                utils.error_response(err, res)
                            });
                        }) 
                        
                    }
                });
            }

        });

    } else {
    	res.redirect('/corporate_profile');
    }
};

exports.corporate_forgot_password = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
    	res.render('corporate_forgot_password');
        delete message;
    } else {
    	res.redirect('/corporate_profile');
    }
};

exports.corporate_forgot_password_email = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {

    	Corporate.findOne({email: req.body.email}).then((response) => { 
            if (response) {
                var token = utils.tokenGenerator(32);
                var id = response.id;
                var link = 'Hola!, Haz click en el enlace y cambia la clave de tu panel corporativo, de igual forma si necesitas ayuda por favor contáctanos al numero de WhatsApp 04120159876 \n\n' + req.protocol + '://' + req.get('host') + '/corporate_newpassword?id=' + id + '&&token=' + token;
                utils.mail_notification(response.email, req.__('reset_password'), link, '');
                Corporate.findOneAndUpdate({_id: id}, {token: token}).then(() => { 
                    message = admin_messages.success_message_send_link;
                    res.redirect("/corporate_login");
                });

            } else {
                message = admin_messages.error_message_email_not_registered;
                res.redirect('/corporate_forgot_password');
            }
        });
    } else {
    	res.redirect('/corporate_profile');
    }
};

exports.login = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
    	res.render('corporate_login');
        delete message;
    } else {
    	res.redirect('/corporate_statistics');
        delete message;
    }
};

exports.corporate_login = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {

    	var crypto = require('crypto');
        var password = req.body.password;
        var hash = crypto.createHash('md5').update(password).digest('hex');
        // for remove case sencitive 
        var email = req.body.email.toLowerCase();
;
        Corporate.findOne({email: email}).then( async (corporate) => { 
            if (!corporate) {
                message = admin_messages.error_message_email_not_registered;
                res.redirect("/corporate_login");
            } else {
                if (corporate.password == hash) {
                    if (corporate.is_approved == 1) {
                        
                        req.session.corporate = corporate;

                        if(corporate.corporate_type_id){

                            const main_corporate = await Corporate.findOne({
                                _id: corporate.corporate_type_id
                            }).select({
                                picture:1,
                            }).lean()  

                            req.session.corporate.picture = main_corporate ? main_corporate.picture : req.session.corporate.picture
                        }
                    	var token = utils.tokenGenerator(32);
                        corporate.token = token;
                        // if(req.body.device_type == "web" && req.body.webpush_config && Object.keys(req.body.webpush_config).length > 0 ){
                        //     corporate.webpush_config = JSON.parse(req.body.webpush_config)
                        // }
                        corporate.save().then(() => { 
                                message = admin_messages.success_message_login;
                                res.redirect('/corporate_statistics');
                        }, (err) => {
                            utils.error_response(err, res)
                        });
                    } else {
                        message = admin_messages.error_message_admin_not_approved
                        res.redirect("corporate_login");;
                    }
                } else {
                    message = admin_messages.error_message_password_wrong;
                    res.redirect('/corporate_login');
                }
            }
        });
    } else {
    	res.redirect('/corporate_create_trip');
    }
};

exports.edit_psw = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
    	var id = req.query.id;
        var token = req.query.token;
        res.render('corporate_new_password', {'id': id, 'token': token});
    } else {
    	res.redirect('/corporate_profile');

    }
};

exports.update_psw = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
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

        Corporate.findOneAndUpdate(query, {password: hash, token: token}).then((response) => { 
            if (!response) {
                res.redirect('corporate_forgot_password');
            } else {
                res.redirect('corporate_login');
            }
        });
    } else {
    	res.redirect('/corporate_profile');
    }
};




exports.corporate_profile = async function (req, res) {

    if (typeof req.session.corporate !== 'undefined') {
        const main_corporate_id = req.session.corporate.corporate_type_id ? 
            req.session.corporate.corporate_type_id : req.session.corporate._id
        const is_main_corporate = req.session.corporate.corporate_type_id ? false : true
        let response = await Corporate.findById(main_corporate_id)
        let rif = []
            
        if(response){
            let str = response.rif;
            rif = str.split(/-(.+)/).slice(0, 2);
        }

        if(is_main_corporate){
            req.session.corporate = response;
        }

        const countries = await Country.find({
            isBusiness: 1
        })
        const corporate_country = countries.find(country => country._id.toString() == response.country_id.toString());
        delete message;
        
        const templateName = process.env.INTEGRATION_NEW_TRAVEL === 'true' ? "corporate_profile" : "corporate_profile_old";
        
        return res.render(templateName, {
            phone_number_min_length: setting_detail.minimum_phone_number_length, 
            phone_number_length: setting_detail.maximum_phone_number_length, 
            login1: response, 
            rif: rif,
            isMasterCorp: response?.corporate_type_id === undefined,
            activeApi: response?.active_api,
            key: response?.api_key,
            countries,
            corporate_country,
            new_profile: process.env.NEW_COORPARTE_PROFILE,
        });
    } else {
    	res.redirect('/corporate_login')
    }
};

exports.corporate_edit_profile = async function (req, res) {
    if (typeof req.session.corporate !== 'undefined') {

    	var id = req.body.id
        Corporate.findOne({phone: req.body.phone, _id: {$ne: id}}).then(async (user) => { 
            if (user)
            {
                message = admin_messages.error_message_mobile_no_already_used;
                res.redirect('/corporate_profile')
            } else
            {
                let corporate_detail = await Corporate.findById(id) 

                if(req.body.password != ''){
                    req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');
                } else {
                    delete req.body.password;
                }
                if(req.body.rif0 != '' && req.body.rif1){
                    req.body.rif = req.body.rif0+'-'+req.body.rif1
                }

                var file_list_size = 0;
                var files_details = req.files;

                if (files_details != null || files_details != 'undefined') {
                    file_list_size = files_details.length;

                    var file_data;
                    var file_id;

                    for (i = 0; i < file_list_size; i++) {

                        file_data = files_details[i];
                        file_id = file_data.fieldname;

                        if (file_id == 'pictureData') {
                            utils.deleteImageFromFolder(corporate_detail.picture, 13);
                            let image_name = corporate_detail._id + utils.tokenGenerator(5);
                            let url = utils.getImageFolderPath(req, 13) + image_name + '.jpg';
                            req.body.picture = url;
                            utils.saveImageFromBrowser(req.files[i].path, image_name + '.jpg', 13);
                        }

                        if (file_id == 'rif_url' && (!corporate_detail.rif_url || corporate_detail.rif_url == "")) {
                            utils.deleteImageFromFolder(corporate_detail.rif_url, 14);

                            let mime_type = req.files[i].mimetype.split('/')[1]
                            let file_name = corporate_detail._id + utils.tokenGenerator(5);
                            let url = utils.getImageFolderPath(req, 14) + file_name + '.' + mime_type;

                            req.body.rif_url = url;
                            utils.saveImageFromBrowser(req.files[i].path, file_name + '.' + mime_type, 14);
                        }

                        if (file_id == 'document_2' && (!corporate_detail.document_2 || corporate_detail.document_2 == "")) {
                            utils.deleteImageFromFolder(corporate_detail.document_2, 14);

                            var image_name = corporate_detail._id + utils.tokenGenerator(5);

                            var url = utils.getImageFolderPath(req, 14) + image_name + '.pdf';
                            req.body.document_2 = url;
                            utils.saveImageFromBrowser(req.files[i].path, image_name + '.pdf', 14);
                        }
                    }
                }

                const country = await Country.findOne({_id: req.body.country})                

                req.body.country_name = country.countryname
                req.body.country_id = country._id

                Corporate.findByIdAndUpdate(id, 
                        req.body, 
                        {
                            new : true
                        }).then((corporate) => { 
                    req.session.corporate = corporate;
                    message = admin_messages.success_message_profile_update;
                    res.redirect('corporate_profile');
                });
            }
        });

    } else {
    	res.redirect('/corporate_login')

    }
};


exports.corporate_sign_out = function (req, res) {
    if (typeof req.session.corporate !== 'undefined') {
        req.session.destroy(function () {
            const redirectUrl = process.env.INTEGRATION_NEW_TRAVEL === 'true' 
                ? process.env.NEW_LOGIN 
                : '/corporate_login';
            res.redirect(redirectUrl);
        });
    } else {
    	res.redirect('/corporate_login')

    }
};


exports.corporate_users = function (req, res, next) {
    if (typeof req.session.corporate != 'undefined') {
        var query = {};
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        var array = [];
        
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var filter_start_date;
        var filter_end_date;

        // console.log(req.body)

        if (req.body.page == undefined) {
            user_type = req.path.split('/')[1];

            search_item = 'email';
            search_value = '';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_date = '';
        } else {
            user_type = req.body.user_type;

            var item = req.body.search_item;
            var value = req.body.search_value;

            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
        }
        if(!req.body.search_value){
            req.body.search_value = undefined;
        }

        if(req.body.search_value){
            query['is_approved'] = 1;
            query['country_phone_code'] = req.session.corporate.country_phone_code;
            query[search_item] = req.body.search_value;
        }
        query['user_type_id'] = req.session.corporate._id;

        // console.log(query)
        User.count(query, function (err, userscount) {


            if (userscount != 0) {
                if (req.body.page == undefined) {
                    page = 1;
                    next = parseInt(page) + 1;
                    pre = page - 1;

                    var options = {
                        sort: {unique_id: -1},
                        page: page,
                        limit: 10
                    };
                } else {
                    page = req.body.page;
                    next = parseInt(req.body.page) + 1;
                    pre = req.body.page - 1;
                    var sort = {};
                    sort['unique_id'] = -1

                    var options = {
                        sort: sort,
                        page: page,
                        limit: 10
                    };

                }


                User.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, options, function (err, users) {

                    Settings.findOne({}, function (err, settingData) {
                        var is_public_demo = settingData.is_public_demo;
                        var timezone_for_display_date = settingData.timezone_for_display_date;


                        if (users.docs.length <= 0) {
                            res.render('corporate_customers_list', { is_public_demo: is_public_demo, corporate_id: req.session.corporate._id, timezone_for_display_date: timezone_for_display_date, detail: [], pages: users.pages, currentpage: users.page, next: next, pre: pre, search_item, search_value, filter_start_date, filter_end_date });
                            delete message;
                        } else {
                            var j = 1;
                            users.docs.forEach(function (user_data) {

                                var id = user_data.referred_by;
                                query = {};
                                query['_id'] = id;
                                if (id != undefined) {
                                    User.findOne(query, function (err, user_val) {

                                        var user_name = "";
                                        if (user_val != null) {
                                            user_name = user_val.first_name + ' ' + user_val.last_name;
                                        }

                                        if (j == users.docs.length) {
                                            user_data.referred_by = user_name;
                                            res.render('corporate_customers_list', { moment: moment, corporate_id: req.session.corporate._id, is_public_demo: is_public_demo, timezone_for_display_date: timezone_for_display_date, detail: users.docs, pages: users.pages, currentpage: users.page, next: next, pre: pre, search_item, search_value, filter_start_date, filter_end_date });
                                            delete message;
                                        } else {
                                            user_data.referred_by = user_name;
                                            j = j + 1;
                                        }
                                    });
                                } else {
                                    if (j == users.docs.length) {
                                        user_data.referred_by = "";

                                        res.render('corporate_customers_list', { moment: moment, corporate_id: req.session.corporate._id, is_public_demo: is_public_demo, timezone_for_display_date: timezone_for_display_date, detail: users.docs, pages: users.pages, next: next, currentpage: users.page, pre: pre, search_item, search_value, filter_start_date, filter_end_date });
                                        delete message;
                                    } else {
                                        user_data.referred_by = "";
                                        j = j + 1;
                                    }
                                }
                            });
                        }
                    });
                });
            } else {
                res.render('corporate_customers_list', { moment: moment, corporate_id: req.session.corporate._id, detail: array, currentpage: '', pages: '', next: '', pre: '', search_item, search_value, filter_start_date, filter_end_date });
                delete message;
            }
        });
    } else {
        res.redirect('/corporate_login');
    }
};

exports.corporate_remove_user = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        }
        // code 
        let user_id = req.body.id
        let user_detail = await User.findById(user_id)
        if (!user_detail) {
            res.redirect('/corporate_users');
            return
        }

        
        let index = user_detail.corporate_ids.findIndex((x)=> x._id == req.session.corporate._id);
        user_detail.corporate_ids.splice(index, 1);
        user_detail.user_type_id = null;
        user_detail.corporate_wallet_limit = 0;
        let sub_corporate = await Corporate.findOne({corporate_type_userid: user_detail._id}).select({_id:1}).lean()
        if(sub_corporate){
            await Trip_history.updateMany({sub_corporate_id: sub_corporate._id}, {sub_corporate_id: null});
            await Trip.updateMany({sub_corporate_id: sub_corporate._id}, {sub_corporate_id: null});
            await Corporate.deleteOne({_id: sub_corporate._id});
        }
        user_detail.save().then(()=>{
            message = admin_messages.success_message_user_removed_successfully;
            res.redirect('/corporate_users');
        });
        
    } catch (error) {
        console.log(error)
        res.redirect('/corporate_login');
    }

};



exports.corporate_create_trip = async function (req, res) {
    if (typeof req.session.corporate != 'undefined') {

        var server_date = new Date(Date.now());
        let address_restrict = ""
        const main_corporate_id = req.session.corporate.corporate_type_id 
            ? req.session.corporate.corporate_type_id : req.session.corporate._id

        const main_corporate = req.session.corporate.corporate_type_id ? false : true
        const user_type_condition = main_corporate ? {
            $match:{}
        } : {
            $match: {
                _id: Schema(req.session.corporate.corporate_type_userid)
            }
        }

        var condition = {
            $match: {
                $and: [
                {
                    'country_phone_code': req.session.corporate.country_phone_code
                }, 
                {
                'is_approved': 1
                }
                ]
            }
        }

        var unwind = {'$unwind': '$corporate_ids'}
        const corporate_condition = {$match: {$and: [{'corporate_ids.corporate_id': Schema(main_corporate_id)}, 
                {'corporate_ids.status': Number(constant_json.CORPORATE_REQUEST_ACCEPTED)} ]}}
        User.aggregate([condition, unwind, corporate_condition, user_type_condition]).then((user_list)=>{
            Country.findOne({_id: req.session.corporate.country_id}).then(async (country_data) => { 
                address_restrict = country_data.countryname.slice(0,2)
                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places"
                let trip = null
                if(req.body.id){
                    trip = await Trip.findById(req.body.id)
                    if(!trip){
                        trip = await Trip_history.findById(req.body.id)
                    }
                }

                const countryCorporate = await Country.findOne({
                    _id: req.session.corporate.country_id
                })                
                
                let running_trip_list = await Trip.find({
                    user_type_id: req.session.corporate._id, 
                    is_trip_completed: 0, 
                    is_trip_end:0, is_provider_status:{
                        $gte: PROVIDER_STATUS.COMING
                    } 
                }).select({
                    assigned_vehicle_details:1, 
                    providerLocation:1, assigned_provider_details:1
                }).lean()

                const templateName = process.env.INTEGRATION_NEW_TRAVEL === 'true' ? 'corporate_create_trip' : 'corporate_create_trip_old';
                
                res.render(templateName, {
                    'moment': moment,
                    server_date: server_date, 
                    scheduled_request_pre_start_minute: setting_detail.scheduled_request_pre_start_minute,
                    country_code: country_data.countrycode,
                    phone_number_min_length: setting_detail.minimum_phone_number_length,
                    phone_number_length: setting_detail.maximum_phone_number_length,
                    user_list: user_list, 
                    corporates: req.session.corporate, 
                    map_key: url, 
                    country: country_data.countryname,
                    trip_data:trip, 
                    trip_list: running_trip_list, 
                    latitude: countryCorporate.coordinates.latitude,
                    longitude: countryCorporate.coordinates.longitude,
                    country_phone_code: country_data.countryphonecode,
                    address_restrict,
                    new_trip_url: process.env.NEW_TRIP_URL
                });
                delete message;
            });
        });

    } else {
        res.redirect('/corporate_login');
        delete message;
    }

};

exports.corporate_request = async function (req, res) {
     if (typeof req.session.corporate == 'undefined') {

        res.redirect('/corporate_login');

    } else {
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var sort_order;
        var sort_field;
        var filter_start_date;
        var filter_end_date;
        let corporate_id_field = req.session.corporate.corporate_type_id ? "sub_corporate_id" : "user_type_id"        
        let corporate_id = req.session.corporate._id

        if(req.session.corporate?.is_subcorporate_admin == 1){
            corporate_id_field = "user_type_id"
            corporate_id = req.session.corporate.corporate_type_id
        }
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

        var Table = Trip_history
        if (request == 'corporate_request') {
            Table = Trip;
        }

        if ((req.body.start_date == '' || req.body.end_date == '') && (!req.body.weeks || req.body.weeks.length === 0)) {
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
                        localField: "assigned_provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };
        var lookup2 = {
            $lookup:
                    {
                        from: "types",
                        localField: "type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        var unwind2 = {$unwind: "$type_detail"};
        
        var lookup3 = {
            $lookup:
                    {
                        from: "helpers",
                        localField: "helpers_list",
                        foreignField: "_id",
                        as: "helper_details"
                    }
        };
        let subcorporate_lookup = {
            $lookup:
                    {
                        from: "corporates",
                        localField: "sub_corporate_id",
                        foreignField: "_id",
                        as: "sub_corporate_detail"
                    }
        };

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        let search = filterService.handleSearch(search_item, value, constant_json.CORPORATE_UNIQUE_NUMBER);
        let filter = {"$match": {}};

        const search_start_day = parseInt(req.body.search_start_day); 
        const search_end_day = parseInt(req.body.search_end_day); 
        const selectedWeeks = req.body.search_weeks; 
        const countries = await CountryService.getCountries()

        if (selectedWeeks && selectedWeeks.length > 0) {

            const weeks = calculateWeeks(start_date, end_date, search_start_day, search_end_day);
            var orConditions = selectedWeeks.map(weekNumber => {
                const weekIndex = parseInt(weekNumber) - 1;  
                const week = weeks[weekIndex]; 
                return {
                    created_at: {
                        $gte: week.start,
                        $lt: new Date(week.end.getTime() + 86400000)
                    }
                };
            });
            filter["$match"]['$or'] = orConditions;
        } else {
            filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
        }
        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = { $group: { _id: null, total: { $sum: 1 } } };

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        const condition = {$match: {[corporate_id_field]: {$eq: Schema(corporate_id)}}};
        Table.aggregate([filter, condition, lookup, unwind, lookup1, lookup2, unwind2, lookup3, search, count]).then((array) => {
            if (array.length == 0) {
                 res.render('corporate_request_list', { detail: array, timezone_for_display_date: setting_detail.timezone_for_display_date, request: request, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, corporate: req.session.corporate, search_start_day: '', search_end_day: '', countries });
                delete message;
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Table.aggregate([filter, condition, lookup, unwind, lookup1,  lookup2, unwind2, lookup3, search, sort, skip, limit, subcorporate_lookup]).then((array) => {
                    res.render('corporate_request_list', { detail: array, timezone_for_display_date: setting_detail.timezone_for_display_date, request: request, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, corporate: req.session.corporate, search_start_day: '', search_end_day: '', countries });
                    delete message;
                });
            }
        });
    }
};

exports.corporate_future_request = async function (req, res) {

    if (typeof req.session.corporate == 'undefined') {

        res.redirect('/corporate_login');

    } else {
        var page;
        var next;
        var pre;
        var search_item;
        var search_value;
        var sort_order;
        var sort_field;
        var filter_start_date;
        var filter_end_date;
        let corporate_id_field = req.session.corporate.corporate_type_id ? "sub_corporate_id" : "user_type_id"        
        let corporate_id = req.session.corporate._id

        if(req.session.corporate?.is_subcorporate_admin == 1){
            corporate_id_field = "user_type_id"
            corporate_id = req.session.corporate.corporate_type_id
        }

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

        var number_of_rec = 10;
        const countries = await CountryService.getCountries()

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
        
        const lookup_provider = {
            $lookup:
                    {
                        from: "providers",
                        localField: "assigned_provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };
        const lookup_citytype = {
            $lookup:
                    {
                        from: "city_types",
                        localField: "service_type_id",
                        foreignField: "_id",
                        as: "city_type_detail"
                    }
        };

        const citytype_unwind = {$unwind: "$city_type_detail"};

        const lookup_type_detail = {
            $lookup:
                    {
                        from: "types",
                        localField: "city_type_detail.typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        const unwind2 = {$unwind: "$type_detail"};
        
        const helper_lookup = {
            $lookup:
                    {
                        from: "helpers",
                        localField: "helpers_list",
                        foreignField: "_id",
                        as: "helper_details"
                    }
        };

        let subcorporate_lookup = {
            $lookup:
                    {
                        from: "corporates",
                        localField: "sub_corporate_id",
                        foreignField: "_id",
                        as: "sub_corporate_detail"
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
            var query1 = {};
            if (value != "") {
                value = Number(value)
                query1[search_item] = { $eq: value };
                search = { "$match": query1 };
            } else {
                search = { $match: {} };
            }
        }

        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;

        const condition = {$match: {'is_schedule_trip': {$eq: true}}};
        const condition1 = {$match: {'is_trip_cancelled': {$eq: 0}}};
        const condition2 = {$match: {'is_trip_completed': {$eq: 0}}};
        const condition3 = {$match: {'is_trip_end': {$eq: 0}}};
        const condition4 = {$match: {'provider_id': {$eq: null}}};
        const corporate_type_condition = {$match: {[corporate_id_field]: {$eq: Schema(corporate_id)}}};

        Country.findOne({_id: req.session.corporate.country_id}).then((country_data) => { 

            Trip.aggregate([corporate_type_condition, condition, condition1, condition2, condition3, condition4,lookup, unwind, search, filter, count]).then((array) => { 
                if (array.length == 0) {
                    res.render('corporate_future_request_list', { detail: array, timezone: country_data.countrytimezone, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, timezone_for_display_date: setting_detail.timezone_for_display_date, countries, corporate: req.session.corporate });
                } else {
                    var pages = Math.ceil(array[0].total / number_of_rec);
                    Trip.aggregate([corporate_type_condition, condition, condition1, condition2, condition3, condition4, lookup, unwind, lookup_provider, lookup_citytype, citytype_unwind, lookup_type_detail, unwind2, helper_lookup, search, filter, subcorporate_lookup, sort, skip, limit]).then((array) => { 
                        res.render('corporate_future_request_list', { detail: array, timezone: country_data.countrytimezone, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, timezone_for_display_date: setting_detail.timezone_for_display_date , countries,corporate: req.session.corporate });
                    }, (err) => {
                    utils.error_response(err, res)
                    });
                }
            }, (err) => {
                utils.error_response(err, res)
            });
        })
    }
}

exports.corporate_trip_map = async function (req, res) {
     if (typeof req.session.corporate == 'undefined') {

        res.redirect('/corporate_login');
    } else {
        var id = req.body.id;
        var user_name = req.body.u_name;
        var provider_name = req.body.pr_name;
        var query = {};
        query['tripID'] = id;

        Trip.findById(id).then(async (trips) => {  
              
            if(!trips){
            trips = await Trip_history.findById(id)
                if (!trips) {
                    res.redirect('/corporate_request');
                    return;
                }
 
             } 
 
     if (trips?.assigned_vehicle_id) {
        const partner = await Partner.findOne(
            { "vehicle_detail._id": trips.assigned_vehicle_id },
            { "vehicle_detail.$": 1 }
        );

        if (partner?.vehicle_detail?.length) {
            const vehicle = partner.vehicle_detail[0];
            trips.assigned_vehicle_details = {
                ...trips.assigned_vehicle_details,
                hasDevicesTemperature: vehicle?.hasDevicesTemperature || false
            };
        } else {
            console.log("⚠ No se encontró vehículo con ese ID en partners");
        }
    } else {
        console.log("⏳ No tiene assigned_vehicle_id, esperando...");
    }
            Trip_Location.findOne(query).then((locations) => { 
                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places&callback=initialize"
                if (!locations) {
                    res.render('corporate_trip_map', {'data': trips, 'url': url, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});

                } else {
                    res.render('corporate_trip_map', {'data': trips, 'url': url, 'trip_path_data': locations, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});
                }
            });
        });
    }
};

exports.corporate_add_limit = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {

        res.redirect('/corporate_login');
    } else {
        User.findOne({_id: req.body.user_id}, function(error, user){
            if(!user.corporate_wallet_limit){
                user.corporate_wallet_limit = 0;
            }
            user.corporate_wallet_limit = +user.corporate_wallet_limit + +req.body.wallet;
            user.save(function(){
                res.json({ success: true, message: admin_messages.success_message_add_limit, wallet: user.corporate_wallet_limit });
            });
        })
    }
}


exports.genetare_request_excel = async function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
        res.redirect('/corporate_login');
    } else {
        let page;
        let next;
        let pre;
        let search_item;
        let search_value;
        let sort_order;
        let sort_field;
        let filter_start_date;
        let filter_end_date;
        let corporate_id_field = req.session.corporate.corporate_type_id ? "sub_corporate_id" : "user_type_id"        
        let corporate_id = req.session.corporate._id

        if(req.session.corporate?.is_subcorporate_admin == 1){
            corporate_id_field = "user_type_id"
            corporate_id = req.session.corporate.corporate_type_id
        }

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

        let Table = Trip_history
        if (request == 'corporate_request') {
            Table = Trip;
        }

        if ((req.body.start_date == '' || req.body.end_date == '') && (!req.body.weeks || req.body.weeks.length === 0)) {
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
        
        const timeDiff = end_date - start_date;
        const max3Months = 1000 * 60 * 60 * 24 * 93;
        if (timeDiff > max3Months) {
            return res.json({success: false, message: req.__('error_message_export_date_range_exceeded')})
        }

        let number_of_rec = 10;
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
                    { $match: 
                        { $expr: 
                            { $and: 
                                [
                                    { $in: [  "$_id", "$$helpers" ] }
                                ] 
                            }
                        }
                    },
                    {
                    $project: { name: 1, cedula: 1 }
                    }
                ],
                as: "helper_detail"
            }
        };

        const subcorporate_lookup = {
            $lookup:
                    {
                        from: "corporates",
                        localField: "sub_corporate_id",
                        foreignField: "_id",
                        as: "sub_corporate_detail"
                    }
        };

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        let search = filterService.handleSearch(search_item, value, constant_json.CORPORATE_UNIQUE_NUMBER);

        let filter = {"$match": {}};

        const search_start_day = parseInt(req.body.search_start_day); 
        const search_end_day = parseInt(req.body.search_end_day); 
        const selectedWeeks = req.body.search_weeks; 
        
        if (selectedWeeks && selectedWeeks.length > 0) {

            const weeks = calculateWeeks(start_date, end_date, search_start_day, search_end_day);
            var orConditions = selectedWeeks.map(weekNumber => {
                const weekIndex = parseInt(weekNumber) - 1;  
                const week = weeks[weekIndex]; 
                return {
                    created_at: {
                        $gte: week.start,
                        $lt: new Date(week.end.getTime() + 86400000)
                    }
                };
            });
            filter["$match"]['$or'] = orConditions;
        } else {
            filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };
        }

        let sort = { "$sort": {} };
        sort["$sort"][sort_field] = parseInt(sort_order);


        let skip = {};
        skip["$skip"] = page * number_of_rec;

        let limit = {};
        limit["$limit"] = number_of_rec;
        const mongoose = require('mongoose');
        const Schema = mongoose.Types.ObjectId;
        const condition = {$match: {[corporate_id_field]: {$eq: Schema(corporate_id)}}};
        let corporate_data = await Corporate.findOne({_id: corporate_id},{preliquidation:1}).lean()

        Table.aggregate([filter, condition, lookup, unwind, lookup1, search, sort, type_lookup, type_unwind, cedula_lookup, helper_lookup, subcorporate_lookup]).then((array) => {
            if(!array.length){
                res.json({success:false})
                return;
            } 
            // console.log(array);
            let date = new Date()
            let time = date.getTime()

            let wb = new xl.Workbook();
            let ws = wb.addWorksheet('sheet1');
            let col = 1;
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
            
            if(req.body.request == "corporate_history"){
                ws.cell(1, col++).string(req.__('title_paid'));
            }
            if(corporate_data.preliquidation){
                ws.cell(1, col++).string(req.__('title_preliquidation'));
            }

            
            array.forEach(function (data, index) {
                console.log(JSON.stringify(data, null, 2));
                col = 1;
                ws.cell(index + 2, col++).string(String(data.unique_id));
                ws.cell(index + 2, col++).string(String(data.sub_corporate_detail.length > 0 ? data.sub_corporate_detail[0].name : data.user_detail.first_name +' '+ data.user_detail.last_name));
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
                ws.cell(index + 2, col++).string(String(data.fixed_price - data.promo_payment));
                if(req.body.request == "corporate_history"){
                    ws.cell(index + 2, col++).string(String(data.paid_client == 1 ? req.__('title_yes') : req.__('title_no')));
                }

                
                if(corporate_data.preliquidation){
                    ws.cell(index + 2, col++).string(String(data.preliquidation == 1 ? req.__('title_yes') : req.__('title_no')));
                }
                data?.corporate_notes?.forEach((note) => {
                    ws.cell(index + 2, col++).string(String(note));
                })
                note_count = data?.corporate_notes?.length > note_count ? data.corporate_notes.length :  note_count
                
                if (index == array.length - 1) {
                    for(let i = 1; i <= note_count; i ++ ){
                        ws.cell(1, col++).string(req.__('title_note') + " " + String(i));
                    }
                    wb.write('data/xlsheet/' + time + '_corporate_request.xlsx', function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            let url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_corporate_request.xlsx";
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_corporate_request.xlsx', function () {
                                });
                            }, 10000)
                        }
                    });
                }
            })
        });
    }
};

exports.genetare_future_request_excel = function (req, res) {

    if (typeof req.session.corporate == 'undefined') {

        res.redirect('/corporate_login');

    } else {
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
            var query1 = {};
            if (value != "") {
                value = Number(value)
                query1[search_item] = { $eq: value };
                search = { "$match": query1 };
            } else {
                search = { $match: {} };
            }
        }

        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);


        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;

        var condition = {$match: {'is_schedule_trip': {$eq: true}}};
        var condition1 = {$match: {'is_trip_cancelled': {$eq: 0}}};
        var condition2 = {$match: {'is_trip_completed': {$eq: 0}}};
        var condition3 = {$match: {'is_trip_end': {$eq: 0}}};
        var condition4 = {$match: {'provider_id': {$eq: null}}};
        var corporate_type_condition = {$match: {'user_type_id': {$eq: Schema(req.session.corporate._id)}}};
        const subcorporate_lookup = {
            $lookup:
                    {
                        from: "corporates",
                        localField: "sub_corporate_id",
                        foreignField: "_id",
                        as: "sub_corporate_detail"
                    }
        };

        Country.findOne({_id: req.session.corporate.country_id}).then(() => { 
            Trip.aggregate([corporate_type_condition, condition, condition1, condition2, condition3, condition4, lookup, unwind, search, filter, subcorporate_lookup]).then((array) => { 
                var date = new Date();
                var time = date.getTime();
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet('sheet1');
                var col = 1;

                ws.cell(1, col++).string("ID");
                ws.cell(1, col++).string("USER");
                ws.cell(1, col++).string("PICKUP ADDRESS");
                ws.cell(1, col++).string("DESTINATION ADDRESS");
                ws.cell(1, col++).string("TIME ZONE");
                ws.cell(1, col++).string("REQUEST CREATION TIME");
                ws.cell(1, col++).string("STATUS");
                ws.cell(1, col++).string("PAYMENT");

                array.forEach(function (data, index) {
                    col = 1;
                    ws.cell(index + 2, col++).number(data.unique_id);
                    ws.cell(index + 2, col++).string(String(data.sub_corporate_detail.length > 0 ? data.sub_corporate_detail[0].name : data.user_detail.first_name +' '+ data.user_detail.last_name));
                    ws.cell(index + 2, col++).string(data.source_address);
                    ws.cell(index + 2, col++).string(data.destination_address);
                    ws.cell(index + 2, col++).string(data.timezone);
                    ws.cell(index + 2, col++).string(moment(data.created_at).format("DD MMM 'YY") + ' ' + moment(data.created_at).format("hh:mm a"));

                    if (data.is_trip_created == 1) {
                        ws.cell(index + 2, col++).string("Created");
                    } else {
                        ws.cell(index + 2, col++).string("Pending");
                    }

                    if (data.payment_mode == 1) {
                        ws.cell(index + 2, col++).string(req.__('title_pay_by_cash'));
                    } else {
                        ws.cell(index + 2, col++).string(req.__('title_pay_by_card'));
                    }

                    if (index == array.length - 1) {
                        wb.write('data/xlsheet/' + time + '_corporate_future_request.xlsx', function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                var url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_corporate_future_request.xlsx";
                                res.json(url);
                                setTimeout(function () {
                                    fs.unlink('data/xlsheet/' + time + '_corporate_future_request.xlsx', function () {
                                    });
                                }, 10000)
                            }
                        });
                    }
                })
            }, (err) => {
                utils.error_response(err, res)
            });
        })
    }
}

exports.user_details_edit = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        } 
        let id = req.body.id;
        let user = await User.findById(id).select({company_details: 1,country:1, city:1, corporate_ids:1}).lean()
        if (!user) {
            res.render('corporate_customers_list')
            return;
        }
        let city_list = await City.find({"countryname": user.country}).lean()
        res.render('corporate_customer_detail_edit', {city_list:city_list, detail: user, corporate_id: req.session.corporate._id});
        delete message;
    } catch (e) {
        console.log(e)   
    }
}
exports.update = async function (req, res, next) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        } 
        var id = req.body.id;
        let company_details = {
            branch: req.body.branch,
            notes: req.body.notes
        }

        let user_detail = await User.findOne({_id: id, "corporate_ids.corporate_id": Schema(req.session.corporate._id)})
        if(!user_detail){
            res.redirect('/corporate_users');
            return;    
        }
        user_detail.city = req.body.city
        user_detail.company_details = company_details
        await User.findByIdAndUpdate(id, user_detail.getChanges())
        message = admin_messages.success_message_user_update;
        res.redirect('/corporate_users');
    } catch (e) {
        console.log(e)   
    }    
};
    
exports.corporate_upload_trip_doc = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        } 

        const id = req.body.id
        let Table = Trip
        let trip = await Trip.findById(id)    
        if(!trip){
            Table = Trip_history
            trip = await Table.findById(id)
        }
        if(!trip){
            return res.json({success: false, error_code: error_message.ERROR_CODE_NO_TRIP_FOUND});
        }

        const corporate = await Corporate.findById(req.session.corporate._id) 
        if (!corporate){
            res.redirect('/corporate_login');
            return;    
        }
        let file_list_size = 0;
        const files_details = req.files;

        if (files_details == null || files_details == 'undefined') {
            message = admin_messages.error_message_doc_upload_failed;
            res.redirect('corporate_request');   
            return;
        }
        file_list_size = files_details.length;

        var file_data;
        var file_id;

        if(trip.corporate_doc && trip.corporate_doc.length > 0){
            trip.corporate_doc.forEach((doc) => {
                utils.deleteImageFromFolder(doc, 15);
            })
        } 
        let image_array = []
        for (i = 0; i < file_list_size; i++) {

            file_data = files_details[i];
            file_id = file_data.fieldname;

            if (file_id == 'pictureData') { 
                let mime_type = req.files[i].mimetype.split('/')[1]
                let file_name = trip._id + utils.tokenGenerator(5);
                let url = utils.getImageFolderPath(req, 15) + file_name + '.' + mime_type;

                image_array.push(url);
                utils.saveImageFromBrowser(req.files[i].path, file_name + '.' + mime_type, 15);                
            }
        }
        trip.corporate_doc = image_array
        let updateCount = await Table.updateOne({_id:id}, trip.getChanges())
        if(updateCount.modifiedCount == 0){
            message = admin_messages.error_message_doc_upload_failed;
            res.redirect('corporate_request');   
            return;
        }
        
        message = admin_messages.success_message_doc_uploaded_successfully;
        if(trip.assigned_provider_id){
            let provider_details = {
                device_type: 1,
                device_token: 1,
            }
            let provider = await Provider.findById(trip.assigned_provider_id).select(provider_details).lean()
            utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, push_messages.PUSH_CODE_FOR_CORPORATE_SEND_DOC, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
        }
        res.redirect('corporate_request');   
        return;
    } catch (e) {
        console.log(e);
    }
};

exports.corporate_get_provider_documents = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        } 
        let trip = await Trip.findById(req.body.trip_id).select({
            assigned_provider_id:1, 
            assigned_vehicle_id:1, model_type:1, 
            assigned_vehicle_id_2:1, assigned_vehicle_details:1, 
            assigned_vehicle_details_2:1, country_id:1}).lean();
        if (!trip) {
            trip = await Trip_history.findById(req.body.trip_id).select({
                assigned_provider_id:1, 
                assigned_vehicle_id:1, model_type:1, 
                assigned_vehicle_id_2:1, assigned_vehicle_details:1, 
                assigned_vehicle_details_2:1, country_id:1}).lean();
            }
        if (!trip) {
            res.json({success:false, cedula: ""})   
            return;
        }
        let Table, query, query1
        let doc2 = null
        let select = {unique_code:1, document_picture:1}
        const document = await Document.findOne({document_for: Number(req.body.type), countryid: trip.country_id }).select({_id:1}).lean()
        if (!document) {
            res.json({success:false})   
            return;
        }
        switch (Number(req.body.type)) {
            case DOCUMENT_FOR.PROVIDER_CEDULA:
                Table = Provider_Document
                query = {provider_id: trip.assigned_provider_id, document_id: document._id}
                break; 
            case DOCUMENT_FOR.VEHICLE_PLATE:
                Table = Partner_Vehicle_Document
                const otherDocs = await Document.find({document_for: {$in: 
                    Number(DOCUMENT_FOR.CARGO_INSURANCE,DOCUMENT_FOR.THIRD_PARTY_INSURANCE)}, 
                    countryid: trip.country_id}
                ).select({_id:1}).lean()

                const doc_array = [document._id, ...otherDocs.map(d => d._id)];
                query = {vehicle_id: trip.assigned_vehicle_id, document_id: {$in: doc_array}}
                if(trip.model_type == MODEL_TRUCK_TYPE.GANDOLA && trip.assigned_vehicle_id_2){
                    query1 = {vehicle_id: trip.assigned_vehicle_id_2, document_id: {$in: doc_array}}
                }
                break;
            case DOCUMENT_FOR.VEHICLE_FRONT_IMAGE:
                Table = Partner_Vehicle_Document
                query = {vehicle_id: trip.assigned_vehicle_id, document_id: document._id}
                const document2 = await Document.findOne({document_for: Number(DOCUMENT_FOR.VEHICLE_LATERAL_IMAGE), countryid: trip.country_id}).select({_id:1}).lean()
                query1 = {vehicle_id: trip.assigned_vehicle_id, document_id: document2._id}
                break;
    
        }        
        let doc = await Table.find(query).select(select).lean()
        if(query1){
            doc2 = await Table.find(query1).select(select).lean()
        }
        if(!doc && !doc2){
            res.json({success:false})
            return;
        }
        res.json({success:true, doc, doc2, trip})
    } catch (e) {
        console.log(e)
        res.json({success:false, cedula: ""})   
    }    
}

exports.corporate_driver_rating = async function (req, res) {
    try{    
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        } 

        let trip = await Trip.findOne({_id: req.body.trip_id, is_trip_end: 1, payment_status: PAYMENT_STATUS.COMPLETED})
        let Table = Trip
        if(!trip){
            Table = Trip_history
            trip = await Trip_history.findOne({_id: req.body.trip_id, is_trip_end: 1, payment_status: PAYMENT_STATUS.COMPLETED})    
        }
        if (!trip) {
            return res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_IS_NOT_END});
        }

        let user = await User.findOne({_id: req.body.user_id})
        if (!user) {
            return res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
        }
        let provider = await Provider.findOne({ _id: trip.provider_id })                        
        if(trip.is_user_invoice_show == 0){
            trip.is_user_invoice_show = 1;
            let tripservice = await Trip_Service.findOne({ _id: trip.trip_service_city_type_id })
            var email_notification = setting_detail.email_notification;
            if (email_notification == true) {
                allemails.sendUserInvoiceEmail(req, user, provider, trip, tripservice);
            }
        }

        if (trip.is_trip_end != 1) {
            return res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_IS_NOT_END});
        }
        req.body.rating = Number(req.body.rating)/2
        
        const rating = Number(req.body.rating) > 5 ? 5 : Number(req.body.rating) ;
        const old_rate = provider.rate;
        const old_rate_count = provider.rate_count;
        const new_rate_counter = (old_rate_count + 1);
        const new_rate = ((old_rate * old_rate_count) + rating) / new_rate_counter;
        provider.rate = new_rate;
        provider.rate_count++;
        await Provider.updateOne({'_id':provider._id}, provider.getChanges())
        let review = await Reviews.findOne({trip_id: trip._id})

        if (!review) {
            var reviews = new Reviews({
                trip_id: trip._id,
                trip_unique_id: trip.unique_id,
                userRating: rating,
                userReview: req.body.review,
                userName: user.first_name + " " + user.last_name,
                providerRating: 0,
                providerReview: "",
                provider_id: trip.confirmed_provider,
                user_id: trip.user_id
            });
            await reviews.save();
        } else {
            review.userRating = rating;
            review.userReview = req.body.review;
            await review.save();
        }
        user.completed_request = user.completed_request + 1;
        await User.updateOne({'_id':user._id}, user.getChanges())

        trip.is_provider_rated = 1;
        await Table.updateOne({'_id':trip._id}, trip.getChanges())

        let deleted_trip = await Trip.findOneAndRemove({ _id: req.body.trip_id })
        if (deleted_trip) {
            let trip_history_data = new Trip_history(JSON.parse(JSON.stringify(deleted_trip)));
            trip_history_data.split_payment_users = deleted_trip.split_payment_users;
            await trip_history_data.save()
        }        
        res.redirect('/corporate_history');

    }catch(e){
        console.log(e)
		res.redirect('/corporate_history');
    }
};

exports.add = function (req, res) {
    try {
        if (typeof req.session.corporate != 'undefined') {
            const url_array_list = URL_ARRAY
            res.render("add_sub_corporate", {country_phone_code: req.session.corporate.country_phone_code, url_array_list});
            delete message;
        } else {
            res.redirect('/corporate_login');
        }
    } catch (error) {
        console.log(e)      
    }
};


exports.add_subcorporate_detail = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        }
        req.body.is_trip_approve = req.body.is_trip_approve || 0;
        req.body.is_subcorporate_admin = req.body.is_subcorporate_admin || 0;
        req.body.is_hide_amount = req.body.is_hide_amount || 0;
        const phone = req.body.phone
        let phone_with_zero = phone.charAt(0) === '0' ? phone : '0' + phone;
        let phone_without_zero = phone.charAt(0) === '0' ? phone.substring(1) : phone;
    
        let query = { email: (req.body.email.trim()).toLowerCase() };

        if (req.body.phone && req.body.phone.trim() !== '') {
            query = {
                $or: [
                    { email: (req.body.email.trim()).toLowerCase() },
                    { phone: { $in: [phone_with_zero, phone_without_zero] }, country_phone_code: req.session.corporate.country_phone_code }
                ]
            };
        }
        
        const corporate_data = await Corporate.findOne(query)
            .select({ email: 1, phone: 1, corporate_type_userid: 1 })
            .lean();
        if(corporate_data){
            const message = corporate_data.email === ((req.body.email).trim()).toLowerCase()
            ? admin_messages.error_message_email_already_used_corporate_subuser
            : corporate_data.phone === req.body.phone
            ? admin_messages.error_message_mobile_no_already_used_corporate_subuser
            : admin_messages.error_message_another_corporate_already_associated_with_this_user;
            res.json({success: false, message: req.__(message)});
            return;
        }

        const password = req.body.password;
        const hash = crypto.createHash('md5').update(password).digest('hex');
        const referral_code = utils.tokenGenerator(6);

        let name = req.body.name;
        name = name.charAt(0).toUpperCase() + name.slice(1);
        const token = utils.tokenGenerator(32);
        const corporate = new Corporate({
            name: name,
            email: ((req.body.email).trim()).toLowerCase(),
            country_phone_code: req.session.corporate.country_phone_code,
            country_name: req.session.corporate.country_name,
            phone: req.body.phone,
            password: hash,
            country_id: req.session.corporate.country_id,
            wallet_currency_code: req.session.corporate.wallet_currency_code,
            is_approved: 1,
            wallet: 0,
            token: token,
            url_array: req.body.url_array,
            corporate_type_id: Schema(req.session.corporate._id),
            corporate_type_userid: Schema(req.body.user_id),
            is_own_service_type: req.session.corporate.is_own_service_type,
            is_trip_approve: req.body.is_trip_approve,
            is_hide_amount: req.body.is_hide_amount,
            referral_code: referral_code
        });
        await corporate.save()
        let message = admin_messages.success_message_sub_user_added_successfully
        res.json({success: true, message: req.__(message)});
    } catch (e) {
        let message = admin_messages.error_message_sub_user_added_failed
        res.json({success: false, message: req.__(message)});
    }
};

exports.sub_corporate_detail = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login')
            return;
        }
        let corporatesWithCount = await Corporate.aggregate([
            { 
                $match: { corporate_type_id: Schema(req.session.corporate._id) }
            },
            {
                $group: {
                    _id: "$corporate_type_userid",  
                    count: { $sum: 1 }  
                }
            },
            {
                $match: { count: { $gt: 49 } }  
            }
        ]);
        let userIds = corporatesWithCount.map(corp => corp._id);
        
        let users = await User.find({
            user_type_id: req.session.corporate._id,
            $or: [
                { _id: { $nin: userIds } }    
            ]
        });
        const response = await Corporate.findOne({_id: req.body.id, corporate_type_id: req.session.corporate._id}).lean()
        const url_array_list = URL_ARRAY
        res.render("add_sub_corporate", {country_phone_code: req.session.corporate.country_phone_code, url_array_list, corporate_type_userid: req.body.id, data:response, users});
        delete message;
        return;
    } catch (e) { 
        console.log(e)
    }
};

exports.update_subcorporate = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/admin');
            return;
        }
        const id = req.body.id;
        let data = req.body;
        req.body.is_trip_approve = req.body.is_trip_approve || 0;
        req.body.is_subcorporate_admin = req.body.is_subcorporate_admin || 0;
        req.body.is_hide_amount = req.body.is_hide_amount || 0;

        if (data.password != "") {
            const password = req.body.password;
            const hash = crypto.createHash('md5').update(password).digest('hex');
            data.password = hash;
        } else {
            delete data.password;
        }
        const or = [
            req.body.email?.trim() && { email: req.body.email.trim().toLowerCase() },
            req.body.phone?.trim() && { phone: req.body.phone.trim() }
          ].filter(Boolean);
          
        const corporate_data = or.length
        ? await Corporate.findOne({ $or: or, _id: { $ne: id } })
            .select({ email: 1, phone: 1 })
            .lean()
        : null;
        if(corporate_data){
            message = corporate_data.email == ((req.body.email).trim()).toLowerCase() ? admin_messages.error_message_email_already_used: admin_messages.error_message_mobile_no_already_used
            res.redirect('/corporate_users');
            return;
        }
    
        await Corporate.findOneAndUpdate({_id: id, corporate_type_id: req.session.corporate._id}, data) 
        message = admin_messages.success_message_corporate_update;
        res.redirect("/corporate_users");
    } catch (e) {
        console.log(e)
    }
};

exports.corporate_trip_approve = function (req, res) {
    if (typeof req.session.corporate != 'undefined') {
        const id = req.body.id;
        Trip.findOneAndUpdate({_id: id, user_type_id: req.session.corporate._id}, {trip_approved: 1}).then(() => { 
            res.redirect("/corporate_request");
        });
    } else {
        res.redirect('/admin');
    }
};

exports.create_bulk_trips = async function(req, res) {
    if (typeof req.session.corporate == 'undefined') {
        res.redirect('/corporate_login')
        return;
    }

    var server_date = new Date(Date.now());
    const main_corporate_id = req.session.corporate.corporate_type_id ? req.session.corporate.corporate_type_id : req.session.corporate._id
    const main_corporate = req.session.corporate.corporate_type_id ? false : true
    const user_type_condition = main_corporate ? {$match:{}} : {$match:{_id: Schema(req.session.corporate.corporate_type_userid)}}
    var condition = {$match: {$and: [{'country_phone_code': req.session.corporate.country_phone_code}, {'is_approved': 1}]}}
    var unwind = {'$unwind': '$corporate_ids'}
    
    const corporate_condition = {$match: {$and: [{'corporate_ids.corporate_id': Schema(main_corporate_id)}, 
                {'corporate_ids.status': Number(constant_json.CORPORATE_REQUEST_ACCEPTED)} ]}}
    User.aggregate([condition, unwind, corporate_condition, user_type_condition]).then((user_list)=>{
        Country.findOne({_id: req.session.corporate.country_id}).then(async (country_data) => { 

                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places"
                let trip = null

                if(req.body.id){
                    trip = await Trip.findById(req.body.id)
                    if(!trip){
                        trip = await Trip_history.findById(req.body.id)
                    }
                }

                let running_trip_list = await Trip.find({
                    user_type_id: req.session.corporate._id, 
                    is_trip_completed: 0, 
                    is_trip_end:0, 
                    is_provider_status: {$gte: PROVIDER_STATUS.COMING} 
                }).select({
                    assigned_vehicle_details: 1, 
                    providerLocation: 1, 
                    assigned_provider_details: 1
                }).lean()

                res.render("corporate_create_bulk_trip", {
                    'moment': moment,
                    server_date: server_date, 
                    scheduled_request_pre_start_minute: setting_detail.scheduled_request_pre_start_minute,
                    country_code: country_data.countrycode,
                    phone_number_min_length: setting_detail.minimum_phone_number_length,
                    phone_number_length: setting_detail.maximum_phone_number_length,
                    user_list: user_list, 
                    corporates: req.session.corporate, 
                    map_key: url, 
                    country: country_data.countryname,
                    trip_data:trip, 
                    trip_list: running_trip_list
                });

                delete message;
        });
    });
}

exports.generate_bulk_fare_estimate = async function(req, res) {

}

exports.create_bulk_trips = async function(req, res) {
    
}

exports.corporate_remove_subcorporate_user = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        }
        
        let sub_corporate = await Corporate.findOne({_id: req.body.id}).select({_id:1}).lean()
        if(!sub_corporate){
            res.redirect('/corporate_users');
            return
        }
        await Trip_history.updateMany({sub_corporate_id: sub_corporate._id}, {sub_corporate_id: null});
        await Trip.updateMany({sub_corporate_id: sub_corporate._id}, {sub_corporate_id: null});
        await Corporate.deleteOne({_id: sub_corporate._id});
        message = admin_messages.success_message_user_removed_successfully;
    } catch (error) {
        console.log(error)
        res.redirect('/corporate_users');
    }

};

exports.corporate_statistics = async function (req, res) {    
    try {    
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        }
        const main_corporate_id = req.session.corporate.corporate_type_id ? 
        req.session.corporate.corporate_type_id : req.session.corporate._id
        
        const user_type_query = {user_type_id: {$eq: Schema(main_corporate_id)}}
        const ferry_user_type_query = {corporate_id: {$eq: Schema(main_corporate_id)}}
        const current_date = moment().tz("America/Caracas");
        const start_of_day = current_date.startOf('day').toDate();
        const firstDateCurrentMonth = current_date.startOf('month').toDate();
        const firstDateOfPreviousMonth = current_date.clone().subtract(1, 'months').startOf('month').toDate();
        const lastDateOfPreviousMonth = current_date.clone().subtract(1, 'months').endOf('month').toDate();
        const start_of_year = current_date.startOf('year').toDate();

        const array = [];

        const total_trips = Trip.aggregate([
            {
                $match: user_type_query
            },
            {
                $group: {
                    _id: null,
                    running_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, 1, 0]}},
                    amount_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    distance_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, "$estimated_distance", 0]}},

                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    total: { $sum: 1 },
                    
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_total: { $sum: { $subtract: ["$fixed_price", "$promo_payment"] } },
                    
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
                $match: user_type_query
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
                    
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_total: { $sum: { $subtract: ["$fixed_price", "$promo_payment"] } },
                    
                    distance_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$estimated_distance", 0]}},
                    distance_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$estimated_distance", 0]}},
                    distance_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$estimated_distance", 0]}},
                    distance_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$estimated_distance", 0]}},
                    distance_total: { $sum: "$estimated_distance" }
                }
            }])
            const ferry_tickets = Ferry_ticket.aggregate([
                {
                    $match: ferry_user_type_query
                },
                    {
                    $group: {
                        _id: null,
                        amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, "$amount", 0]}},
                        amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, "$amount", 0]}},
                        amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, "$amount", 0]}},
                        amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, "$amount", 0]}},
                        amount_total: { $sum: "$amount" }
                    }
                }
            ])
    
            const [totalTrips, totalTripHistories, ferryTickets] = await Promise.all([
                total_trips,
                total_trip_histories,
                ferry_tickets
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
            array['ferry'] = ferryTickets[0] || no_data_history;

            if(req.session.corporate.corporate_type_id && req.session.corporate.url_array.indexOf('corporate_statistics_facturado') == -1){
                array['trip_histories'].amount_today =  0
                array['trip_histories'].amount_current_month =  0
                array['trip_histories'].amount_previous_month =  0
                array['trip_histories'].amount_current_year =  0
                array['trip_histories'].amount_total =  0
    
                array['running_trips'].amount_trips = 0
                array['running_trips'].amount_today = 0
                array['running_trips'].amount_current_month = 0
                array['running_trips'].amount_previous_month = 0
                array['running_trips'].amount_current_year = 0
                array['running_trips'].amount_total = 0

                array['ferry'].amount_today = 0
                array['ferry'].amount_current_month = 0
                array['ferry'].amount_previous_month = 0
                array['ferry'].amount_current_year = 0
                array['ferry'].amount_total = 0
    
            }
        const templateName = process.env.INTEGRATION_NEW_TRAVEL === 'true' ? 'corporate_statistics' : 'corporate_statistics_old';
    
        return res.render(templateName, { 
            detail: array,
            new_statistics: process.env.NEW_STATISTICS
        });

    } catch (e) {
        console.log(e)
        const templateName = process.env.INTEGRATION_NEW_TRAVEL === 'true' ? 'corporate_statistics' : 'corporate_statistics_old';
        
        return res.render(templateName, { 
            detail: array,
            new_statistics: process.env.NEW_STATISTICS
        });
    }
}

exports.corporate_map_view = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            if(req.body.get_new_data){
                res.json({success:false})
                return;
            }
            res.redirect('/corporate_login');
            return;
        }
        const current_date = moment().tz("America/Caracas");
        const start_of_day = current_date.startOf('day').toDate();
        const firstDateCurrentMonth = current_date.startOf('month').toDate();
        const profile_pic = req.session.corporate.picture || ""
        let running_trip_list = Trip.aggregate([
            {
                $match: {
                    user_type_id: {$eq: Schema(req.session.corporate._id)},
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

        const total_trips = Trip.aggregate([
            {
                $match: {
                    user_type_id: {$eq: Schema(req.session.corporate._id)},
                }
            },
            {
                $group: {
                    _id: null,
                    scheduled_trips: {$sum: {$cond: [{$and: [{$eq: ["$is_provider_accepted", 0]}]}, 1, 0]}},
                    running_trips: {$sum: {$cond: [ {$gte: [{$gte: ["$is_provider_status", 1]}, {$lt: ["$is_provider_status", 9]}]} , 1, 0]}},
                    completed_trips: {$sum: {$cond: [ {$and: [{$eq: ["$is_provider_status", 9]}, {$gte: ["$provider_trip_end_time", start_of_day]}]} , 1, 0]}},
                }
            }])
        const total_trips_history  = Trip_history.aggregate([
            {
                $match: {
                    user_type_id: {$eq: Schema(req.session.corporate._id)},
                }
            },
            {
                $group: {
                    _id: null,
                    completed_today: {$sum: {$cond: [ {$and: [{$eq: ["$is_provider_status", 9]}, {$gte: ["$provider_trip_end_time", start_of_day]}]} , 1, 0]}},
                    completed_month: {$sum: {$cond: [ {$and: [{$eq: ["$is_provider_status", 9]}, {$gte: ["$provider_trip_end_time", firstDateCurrentMonth]}]} , 1, 0]}},
                }
            }])

            
        const [trip_list, totalTrips, totalTripHistories] = await Promise.all([
            running_trip_list,
            total_trips,
            total_trips_history
        ])
        if(totalTrips.length == 0){
            totalTrips.push({
                scheduled_trips : 0,
                running_trips : 0,
                completed_trips : 0,
            })
        }
        if(totalTripHistories.length == 0){
            totalTripHistories.push({
                completed_today : 0,
                completed_month : 0,
            })
        }

        let corporate = req.session.corporate
        const country = await Country.findOne({
            _id: corporate.country_id,
        })
        const url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key 
        if(req.body.get_new_data){
            res.json({success:true, trip_list, totalTrips, totalTripHistories, 
                latitude: country.coordinates.latitude,
                longitude: country.coordinates.longitude
            })
            return;
        }

        res.render('corporate_map_view', {trip_list, totalTrips, totalTripHistories, profile_pic, map_url: url,
            latitude: country.coordinates.latitude,
            longitude: country.coordinates.longitude
        });
    } catch (e) {
        console.log(e)
    }
};

exports.corporate_map_get_provider_data = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
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

exports.corporate_send_request = async function (req, res) {
    try {    
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login')
            return;
        }
        let corporate_id = req.session.corporate._id
        let user_detail = {
            _id: 1,
            phone: 1,
            device_type: 1,
            device_token: 1,
            email:1,
            corporate_ids:1,
            user_type_id:1
        }

        let condition = { $or:[{email: req.body.user_search_value}, {country_phone_code: req.session.corporate.country_phone_code, phone: req.body.user_search_value}]};
        let user = await User.findOne(condition).select(user_detail).lean();
        if (!user) {
            return res.json({ success: false, error_message: "No User found" });
        }
        const user_exists = user.corporate_ids.find(u => u.corporate_id.equals(corporate_id));
        if(user_exists?.corporate_id && user.user_type_id == corporate_id){
            return res.json({ success: false, error_message: "User already added" });
        }

        if(user_exists && user_exists.status == Number(constant_json.CORPORATE_REQUEST_WAITING)){
            return res.json({ success: false, error_message: "Request already sent" });
        }
        if(!user_exists && user.user_type_id) {
            return res.json({ success: false, error_message: "User already added by another corporate." });
        }
        let = corp_obj = {
            corporate_id: Schema(corporate_id),
            status: Number(constant_json.CORPORATE_REQUEST_WAITING)
        }
        await User.updateOne({_id: user._id},{$push: {corporate_ids: corp_obj}})
        user.corporate_ids.push({
            corporate_id: Schema(req.session.corporate._id),
            status: Number(constant_json.CORPORATE_REQUEST_WAITING)
        });
        let corporate_detail = req.session.corporate
        utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user_detail.device_type, user_detail.device_token, push_messages.PUSH_CODE_FOR_NEW_CORPORATE_REQUEST, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, {name: corporate_detail.name,
            phone: corporate_detail.phone,
            _id: corporate_detail._id,
            country_phone_code: corporate_detail.country_phone_code,
            status: Number(constant_json.CORPORATE_REQUEST_WAITING)
        });
        return res.json({ success: true, message: "Request Sent Succesfully!!" });
    } catch (error) {
        console.log({error})
        return res.json({ success: false, error_message: "No User found" });
    }
}


exports.sub_corporate_users = async function (req, res) {
    try {
        if (typeof req.session.corporate != 'undefined') {
            let page;
            let next;
            let pre;
            let search_item;
            let search_value;
            let sort_order;
            let sort_field;
            const timezone_for_display_date = setting_detail.timezone_for_display_date;

            let main_corporate_condition = {};
            if (req.body.page == undefined) {
                page = 0;
                next = 1;
                pre = 0;
            } else {
                page = Number(req.body.page);
                next = parseInt(req.body.page) + 1;
                pre = Number(req.body.page) - 1;
            }
            if (req.body.search_item == undefined) {
                search_item = 'unique_id';
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
    
    

            main_corporate_condition["corporate_type_id"] = { $eq: Schema(req.session.corporate._id) };
            let count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

            let sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_order);
    
            let number_of_rec = 10;

            let skip = {};
            skip["$skip"] = page == 0 ? page * number_of_rec : (page - 1) * number_of_rec
            console.log(skip)
    
            let limit = {};
            limit["$limit"] = number_of_rec
            
            value = search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
    
            let search = {$match: {}};
                let query1 = {};
                if (value != "") {
                    value = value
                    query1[search_item] = { $eq: value };
                    console.log({query1})
                    search = { "$match": query1 };
                } else {
                    search = { $match: {} };
                }
    
            Corporate.aggregate([
                {
                    $match: main_corporate_condition
                },
                search,
                              count]).then((corporatelist) => { 
                                console.log({corporatelist})
                if (!corporatelist || corporatelist.length == 0)
                {
                    corporatelist = [];
                    res.render('sub_corporate_users', { detail: corporatelist, currentpage: req.body.page || 1,
                        pages: Math.ceil(corporatelist.length / 10),
                        next: next,
                        pre: pre,
                        sort_field,
                        sort_order,
                        search_item,
                        search_value,
                        moment,
                        timezone_for_display_date
                });
                } else
                {
                    let pages = Math.ceil(corporatelist[0].total / 10);
    
                    Corporate.aggregate([
                    {
                        $match: main_corporate_condition
                    },
                    {
                        $lookup: {
                            from: "users", 
                            localField: "corporate_type_userid", 
                            foreignField: "_id", 
                            as: "user_details" 
                        }
                    },
                    search, sort, skip, limit]).then(corporatelist => {
                        if (corporatelist.length <= 0) {
                            res.render('sub_corporate_users', {
                                detail: [],
                                currentpage: req.body.page || 1,
                                pages,
                                next: next,
                                pre: pre,
                                sort_field,
                                sort_order,
                                search_item,
                                search_value,
                                moment,
                                timezone_for_display_date
                            });
                        } else {
                            res.render('sub_corporate_users', {
                                detail: corporatelist,
                                currentpage: req.body.page || 1,
                                pages,
                                page,
                                next: next,
                                pre: pre,
                                sort_field,
                                sort_order,
                                search_item,
                                search_value,
                                moment,
                                timezone_for_display_date
                            });
                        }
                    }).catch(err => {
                        console.log(err);
                        res.status(500).send('Error in fetching corporate users');
                    });
                }
            })
        } else {
            res.redirect('/corporate_login');
        }
    } catch (e) {
        console.log(e);
        res.status(500).send('Error in processing request');
    }
};

exports.add_corporate_note = async function (req, res) {
    try {
        const corporateId = req.session.corporate._id
        const tripId = req.body.tripId
        const note = req.body.note
        const condition = {_id: tripId, user_type_id: corporateId, "corporate_notes.4": {$exists: false}}
        const select = {_id:1, corporate_notes:1}
        let Table = Trip
        let trip = await Table.findOne(condition, select).lean()
        if(!trip){
            Table = Trip_history
            trip = await Table.findOne(condition, select).lean()
        }
        if(!trip || !note){
            res.json({success: false})
            return;
        }

        let updateCount = await Table.updateOne(condition, {$push: { corporate_notes: note } })
        if (updateCount.modifiedCount == 0) {
            res.json({success: false})
            return;    
        }
        res.json({success: true})
        return;
    } catch (e) {
        console.log(e) 
        res.json({success: false})       
    }
}

exports.delete_corporate_note = async function (req, res) {
    try {
        const corporateId = req.session.corporate._id
        const tripId = Schema(req.body.tripId)
        const noteIndex = req.body.noteIndex
        const condition = {_id: tripId, user_type_id: corporateId}
        const select = {_id:1, corporate_notes:1}
        
        let Table = Trip
        let trip = await Table.findOne(condition, select).lean()
        if(!trip){
            Table = Trip_history
            trip = await Table.findOne(condition, select).lean()
        }
        if(!trip || !noteIndex){
            res.json({success: false})
            return;
        }
        const unsetIndex = {
            $unset: { [`corporate_notes.${noteIndex}`]: "" }
          };
      
        await Table.updateOne({ _id: tripId }, unsetIndex);
        const updateCount = await Table.updateOne(
            { _id: tripId },
            { $pull: { corporate_notes: null } }  
        );

        if (updateCount.modifiedCount == 0) {
            res.json({success: false})
            return;    
        }
        res.json({success: true})
        return;
    } catch (e) {
        console.log(e) 
        res.json({success: false})       
    }
}

exports.corporate_user_statistics = async function (req, res) {    
    try {    
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        }
        const main_corporate_id = req.session.corporate.corporate_type_id ? 
        req.session.corporate.corporate_type_id : req.session.corporate._id
        const user_id = Schema(req.body.user_id)
        
        const current_date = moment().tz("America/Caracas");
        const start_of_day = current_date.startOf('day').toDate();
        const firstDateCurrentMonth = current_date.startOf('month').toDate();
        const firstDateOfPreviousMonth = current_date.clone().subtract(1, 'months').startOf('month').toDate();
        const lastDateOfPreviousMonth = current_date.clone().subtract(1, 'months').endOf('month').toDate();
        const start_of_year = current_date.startOf('year').toDate();

        const array = [];

        const total_trips = Trip.aggregate([
            {
                $match:{
                    user_type_id: {$eq: Schema(main_corporate_id)}
                }
            },
            {
                $match:{
                    user_id: {$eq: user_id}
                }
            },
            {
                $group: {
                    _id: null,
                    running_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, 1, 0]}},
                    amount_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    distance_trips: {$sum: {$cond: [ {$gt: ["$is_provider_accepted", 0]}, "$estimated_distance", 0]}},

                    today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, 1, 0]}},
                    current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, 1, 0]}},
                    previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, 1, 0]}},
                    current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, 1, 0]}},
                    total: { $sum: 1 },
                    
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_total: { $sum: { $subtract: ["$fixed_price", "$promo_payment"] } },
                    
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
                    user_type_id: {$eq: Schema(main_corporate_id)}
                }
            },
            {
                $match:{
                    user_id: {$eq: user_id}
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
                    
                    amount_today: {$sum: {$cond: [{$gte: ["$created_at", start_of_day]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_month: {$sum: {$cond: [{$gte: ["$created_at", firstDateCurrentMonth]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_previous_month: {$sum: {$cond: [{$and: [{$gte: ["$created_at", firstDateOfPreviousMonth]}, {$lte: ["$created_at", lastDateOfPreviousMonth]}]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_current_year: {$sum: {$cond: [{$gte: ["$created_at", start_of_year]}, { $subtract: ["$fixed_price", "$promo_payment"] }, 0]}},
                    amount_total: { $sum: { $subtract: ["$fixed_price", "$promo_payment"] } },
                    
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
    
        return res.render('corporate_user_statistics', { 
            detail: array 
        });

    } catch (e) {
        console.log(e)
        return res.render('corporate_user_statistics', { 
            detail: array 
        });
    }
}

exports.corporate_edit_trip = async function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
        res.redirect('/corporate_login');
        return;
    }

    const { id, history } = req.query;
    let trip = null;

    trip = await Trip.findOne({
        unique_id: id,
        user_type_id: {$in: [req.session.corporate._id, req.session.corporate?.corporate_type_id]}
    }).exec();
  

    if(!trip) {
        trip = await Trip_history.findOne({
            unique_id: id,
            user_type_id: {$in: [req.session.corporate._id, req.session.corporate?.corporate_type_id]}
        }).exec();
    }

    if(!trip) {
        res.redirect("/corporate_request")
        return;
    }
    
    const server_date = new Date(Date.now());


    const country = await Country.findOne({_id: trip.country_id}).select({alpha2: 1}).lean()
    return res.render("corporate_edit_trip", {
        server_date,
        moment: moment,
        scheduled_request_pre_start_minute:
        setting_detail.scheduled_request_pre_start_minute,
        map_key: setting_detail.web_app_google_key,
        trip,
        country, 
        trip_id: trip._id,
        user_type_id: trip.user_type,
        tripData: JSON.stringify(trip),
        history
    });
    
};

exports.corporate_update_trip = async function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
        res.redirect('/corporate_login');
        return;
    }
    let body = req.body;
    let Table;
   
    try {
    
        Table = Trip;
        let trip = await Trip.findOne({_id: body.trip_id,
            user_type_id: {$in: [req.session.corporate._id, req.session.corporate?.corporate_type_id]}
        });

        if(!trip) {
            Table = Trip_history;
            trip = await Table.findOne({_id: body.trip_id,
                user_type_id: {$in: [req.session.corporate._id, req.session.corporate?.corporate_type_id]}
            });
        }        
    
        if(!trip) {
            return res.json({
            success: false,
            error_code: "Trip not found",
            error_description: "",
            });
        }
    
        const settings = await Settings.findOne({})

        let {
            estimated_distance,
            source_address,
            destination_address,
            destination_addresses,
            destination_stops,
            dlat,
            dlng,
            longitude,
            latitude,
            optimize_field
        } = body;       


        
        const updateDate = new Date(body.server_date);

        if(
            latitude === trip.sourceLocation[0] ||
            longitude === trip.sourceLocation[1]
        ) {
            source_address  = trip.source_address;
            latitude = trip.sourceLocation[0];
            longitude = trip.sourceLocation[1];
        } 

        if(
            dlat === trip.destinationLocation[0] || 
            dlng === trip.destinationLocation[1]
        ) {
            destination_addresses  = trip.destination_addresses;
            dlat = trip.destinationLocation[0];
            dlng = trip.destinationLocation[1];
        } 

        if(
            estimated_distance < 0 && 
            trip.estimated_distance == estimated_distance
        ) {
            estimated_distance = trip.estimated_distance
        }
        
        if (destination_addresses) {

            destination_addresses = destination_addresses.map(dest => {
                if (!dest.stops_inside) {
                    dest.stops_inside = [];
                }      
        
                dest.stops_inside = dest.stops_inside.map(innerStop => {
                    return {
                        ...innerStop,
                        location: [
                            Number(innerStop.location?.[0] || 0),
                            Number(innerStop.location?.[1] || 0),
                        ],
                    };
                });
        
                return dest;
            });
        } else {
            destination_addresses = [];
        }
            
        let steps = ""
        
        destination_stops = []
        if(destination_addresses?.length > 0) {
            const steps_aux = destination_addresses.map(dest => `|${dest.location[0]},${dest.location[1]}|`)
            steps += steps_aux.join('')
        }
        
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${latitude},${longitude}&destination=${dlat},${dlng}&waypoints=${steps}&key=${settings.backend_google_key}`
        )
    
        const resultApi = response.data
        var distance = 0

        if(resultApi.routes[0].legs.length > 1) {
            for (let index = 0; index < resultApi.routes[0].legs.length; index++) {
                distance += resultApi.routes[0].legs[index].distance.value;                
            }
        } else {
            var distance = resultApi.routes[0].legs[0].distance.value;
        }

        var distanceKmMile = distance != 0 ? distance / 1000 : 0;
        estimated_distance = distanceKmMile
        let set = {
            estimated_distance: Math.round(Number(estimated_distance)),
            source_address,
            destination_address,
            destination_addresses,
            initial_destination_address: destination_address,
            sourceLocation: [
                latitude,
                longitude
            ],
            destinationLocation: [
                dlat,
                dlng
            ],
            destination_stops,
            updated_at: updateDate.toUTCString(),
            optimize_field: optimize_field ?? false,
        };

        let updatecount =  await Table.updateOne({ _id: body.trip_id}, {
            $set: set
        })
        let trip_data = await Table.findOne({_id: body.trip_id})
        sendTrackingLinkSms(trip_data, true)
        return res.json({ 
            success: true,
            body: "Ok"
        })
    } catch (error) {
        console.log(error);
        return res.json({ 
            success: false,
            body: `${error}`
          })
    }
};

exports.corporateNotifyUnload = async function (req, res, next) {
    try {
        const trip_id = req.body.trip_id
        let partner = null;
        let corporate_data = req.session.corporate
        let corporate_id = corporate_data._id
        if(corporate_data?.is_subcorporate_admin == 1){
            corporate_id = corporate_data.corporate_type_id
        }
        let corporate = await Corporate.findOne({_id: corporate_id},{company_name: 1, name: 1, email: 1}).lean()
        if(!corporate){
            res.redirect('/corporate_login')
            return;
        }
        let trip = await Trip.findOne({
            _id: trip_id, 
            is_trip_cancelled: 0, 
            is_trip_completed: 0, 
            corporate_type_id: corporate_id, 
            drop_trip_status: CONTAINER_DROP_STATUS.DROPPED,
            unload_notification_sent: {$ne: 1}
        })
        if(trip.provider_type_id){
            partner = await Partner.findOne({_id: trip.provider_type_id}, {first_name:1, last_name:1, email:1}).lean()
        }
        trip.unload_notification_sent = 1;
        let updateCount = await Trip.updateOne({_id: trip._id}, trip.getChanges())
        if (updateCount.modifiedCount != 0  && partner) { 
            let extraParam = {
                email: partner?.email || "",
                partner_name: partner ? partner.first_name + partner.last_name : "",
                name: partner ? partner.first_name + partner.last_name : "",
                trip_id: trip.unique_id
            }
            allemails.sendEmailPartnerCorporate(req, extraParam, 30);
            res.json({success: true})
            return;
        }
    } catch (e) {
        console.log({e})
        res.json({success:false, trips: []})
        return;
    }
};

async function create_corporate_user(corporate){
    const phone = corporate.phone
    let phone_with_zero = phone.charAt(0) === '0' ? phone : '0' + phone;
    let phone_without_zero = phone.charAt(0) === '0' ? phone.substring(1) : phone;

    let user_data = await User.findOne({$or: [{email: corporate.email}, {phone: {$in: [phone_with_zero, phone_without_zero]}, country_phone_code: corporate.country_phone_code}]})
    if (user_data) {
        return;
    }

    const { first_name, last_name } = splitName(corporate.name);
    const  corporate_ids = [{
        corporate_id: Schema(corporate._id),
        status: Number(constant_json.CORPORATE_REQUEST_ACCEPTED)
    }]

    let user = new User({
        first_name: first_name,
        last_name: last_name,
        email: corporate.email,
        country_phone_code: corporate.country_phone_code,
        phone: phone_without_zero,
        country: corporate.country_name,
        corporate_ids,
        wallet_currency_code: corporate.wallet_currency_code,
        user_type: Number(constant_json.USER_TYPE_CORPORATE),
        user_type_id: corporate._id,
        is_approved: 1,
        password: corporate.password,
    });
    user.save()
}

function splitName(fullName) {    
    const words = fullName.trim().split(/\s+/);
    let first_name = '';
    let last_name = '';
    if (words.length > 1) {
        first_name = words[0];
        last_name = words.slice(1).join(' ');
    } else if (words.length === 1) {
        first_name = words[0];
        last_name = '';
    }
    return { first_name, last_name };
}

function getNextDayOfWeek(date, dayOfWeek) {
    const resultDate = new Date(date);
    const day = resultDate.getDay();
    const diff = (dayOfWeek + 7 - day) % 7;
    resultDate.setDate(resultDate.getDate() + diff);
    return resultDate;
}

function calculateWeeks(startDate, endDate, weekStartDay, weekEndDay) {
    const firstWeekStart = getNextDayOfWeek(startDate, weekStartDay); 
    const weeks = [];
    let currentWeekStart = firstWeekStart;

    while (currentWeekStart <= endDate) {
        let currentWeekEnd = new Date(currentWeekStart);

        if (weekEndDay < weekStartDay) {
            currentWeekEnd.setDate(currentWeekStart.getDate() + ((7 - weekStartDay) + weekEndDay));
        } else {
            currentWeekEnd.setDate(currentWeekStart.getDate() + (weekEndDay - weekStartDay));
        }

        if (currentWeekEnd > endDate) {
            currentWeekEnd = new Date(endDate);
        }
        weeks.push({
            start: new Date(currentWeekStart),
            end: new Date(currentWeekEnd),
        });
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    return weeks;
}

async function sendTrackingLinkSms(trip, is_edit_trip = null){
    if (setting_detail.tracking_link_sms) {
        let user_name = trip.user_first_name +' ' + trip.user_last_name
        let truck_model = trip.assigned_vehicle_details?.vehicle_model_details[0]?.vehicle_model_name || ""
        let country_phone_code = ""
        if(truck_model == ""){
            let truck_type = await Type.findOne({_id: trip.type_id}).select({typename:1}).lean()
            truck_model = truck_type ? truck_type.typename : truck_model
        }
        if(trip.user_type_id){
            let corporate_data = await Corporate.findOne({_id: trip.user_type_id}).select({company_name:1, name:1, country_phone_code:1}).lean()
            if(corporate_data){
                country_phone_code = corporate_data.country_phone_code
            }
            user_name = corporate_data ? corporate_data?.company_name != "" ?  corporate_data.company_name : corporate_data.name : user_name

        }else{
            let user = await User.findOne({_id: trip.user_id}).select({country_phone_code:1}).lean()
            if(user){
                country_phone_code = user.country_phone_code
            }
        }
        let phone_list = []

        if(!is_edit_trip){
            phone_list = [
                trip?.pickup_details?.[0]?.user_details?.phone != "" ? trip?.pickup_details?.[0]?.user_details?.country_phone_code + trip?.pickup_details?.[0]?.user_details?.phone : "",
                trip?.delivery_details?.[0]?.user_details?.phone != "" ? trip?.delivery_details?.[0]?.user_details?.country_phone_code + trip?.delivery_details?.[0]?.user_details?.phone : "",
            ].filter(phone => phone && phone !== "");
        }
    
            if(trip?.destination_addresses?.length){
                trip.destination_addresses.forEach((stop) => {
                    if(stop?.stop_user_phone?.length && stop?.smsDelivered != 1){
                        let phone_array = stop.stop_user_phone
                        phone_array.forEach((phone) => {
                            let smsSent = "0"
                            if(phone != ""){
                                smsSent = "1"
                                phone_list.push(country_phone_code + phone)
                            }
                            stop.smsDelivered = smsSent
                        })
                    }
                })
            }
        
        trip.markModified('destination_addresses');
        let updateCount = await Trip.updateOne({ _id: trip._id }, trip.getChanges())
        if (updateCount.modifiedCount == 0) {
            await Trip_history.updateOne({ _id: trip._id }, trip.getChanges())
        }
        utils.sendSmsForTrackingLink(phone_list, 9, [user_name, truck_model, trip._id]);
    }
}

exports.corporate_checkhistory_temperature = async (req, res) => {
  const { plateNumber, dataCreatedAt,dataEnd } = req.body;
  const payload = {
    plateno: plateNumber,
    startdate:  dataCreatedAt,
    enddate: dataEnd
  };
    try {
    const response = await axios.post(
      `${process.env.NEW_BACKEND_URL2}flexi/date`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
         }
      }
    );

    const data = response.data?.ForesightFlexAPI?.DATA;
    return res.json(data);
  } catch (error) {
     return res.status(500).json({ message: "Error fetching temperature history" });
  }
};
  exports.corporate_check_temperature_average = async (req, res) => {
  const { plateNumber } = req.body;
   
  try {
    const response = await axios.post(
    `${process.env.NEW_BACKEND_URL2}flexi/plate`,
      { plateno: plateNumber },
      { headers: { "Content-Type": "application/json" } }
    );
     const data = response.data?.ForesightFlexAPI?.DATA?.[0];
    if (!data) {
      return res.status(404).json({ message: "No se encontró información de temperatura" });
    }

    return res.json(data);

  } catch (error) {
     return res.status(500).json({ message: "Error fetching temperature history" });
  }
};

exports.ferry_tickets = async function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
        res.redirect('/corporate_login');
        return;
    }

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


    value = search_value;
    value = value.replace(/^\s+|\s+$/g, '');
    value = value.replace(/ +(?= )/g, '');
    
    
    const corporateid = Schema(req.session.corporate._id);

    const filter = {"$match": {}};
    filter["$match"]['created_at'] = { $gte: start_date, $lt: end_date };

    const sort = {"$sort": {}};
    sort["$sort"][sort_field] = parseInt(sort_order);

    const count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

    const skip = {};
    skip["$skip"] = page * number_of_rec;

    const limit = {};
    limit["$limit"] = number_of_rec;

    const corporate_condition = {$match: {'corporate_id': {$eq: corporateid}}};
    const city = await City.findOne({cityname: "Caracas"}).select({cityname: 1}).lean()
    const ferryprice_condition = {$match: {'ferry_ticket_price': {$gt: 0}}};
    const cityid_condition = {$match: {'cityid': {$eq: Schema(city._id)}}};
    const business_condition = {$match: {'is_business': {$eq: 1}}};
    const user_type_pricing_condition = {$match: {'user_type': {$eq: 0}}}
    const citytype_project = {
        $project: {
            typename: 1,
            ferry_ticket_price: 1,
            unique_id: 1
        }
    }
    let citytypes = await Citytype.aggregate([ferryprice_condition, cityid_condition, business_condition, user_type_pricing_condition, citytype_project])

    Ferry_ticket.aggregate([corporate_condition,  filter, count]).then((array) => { 

        if (!array || array.length == 0) {
            array = [];
            res.render('corporate_ferry_tickets', { detail: array, request: request, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date,timezone_for_display_date: setting_detail.timezone_for_display_date, citytypes });
        } else {
            const pages = Math.ceil(array[0].total / number_of_rec);
            Ferry_ticket.aggregate([corporate_condition, filter, sort, skip, limit, type_lookup, type_unwind]).then((array) => { 
                res.render('corporate_ferry_tickets', { detail: array, request: request, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, sort_field, sort_order, search_item, search_value, filter_start_date, filter_end_date, timezone_for_display_date: setting_detail.timezone_for_display_date, citytypes });
            });
        }
    }, (err) => {
        utils.error_response(err, res)
    });
};

exports.create_ferry_ticket = async function (req, res) {
    try {
        if (typeof req.session.corporate == 'undefined') {
            res.redirect('/corporate_login');
            return;
        }

        let citytype = await Citytype.findOne({_id: req.body.service_type})
        .select({typeid: 1, ferry_ticket_price: 1, ferry_flety_cost: 1}).lean()
        
        const ferry_ticket = new Ferry_ticket({
            type_id: citytype.typeid,
            service_type_id: citytype._id,
            user_type: constant_json.CORPORATE_UNIQUE_NUMBER,
            corporate_id: req.session.corporate._id,
            amount: citytype.ferry_ticket_price,
            ticket_cost: citytype.ferry_flety_cost || 0,
            country_id: Schema(req.session.corporate.country_id),
            status: 0
        });

        await ferry_ticket.save()
        message = "Ticket Created Successfully"
        res.redirect('/corporate_ferry_tickets');
    } catch (e) {
        console.log(e);   
    }
};
