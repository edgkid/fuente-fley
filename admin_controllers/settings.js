var utils = require('../controllers/utils');
var Settings = require('mongoose').model('Settings');
var Card = require('mongoose').model('Card');
var Country = require('mongoose').model('Country')
var console = require('../controllers/console');
const CountryService = require("../services/country.service")
const mongoose = require('mongoose');
const Schema = mongoose.Types.ObjectId;

require('../controllers/constant');

exports.installation_settings = async function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Settings.findOne({}).then(async (setting) => { 
            if (setting)
            {
                let selected_country_id = req.body.selected_country_id || null
                const admin = req.session.admin
                if(!admin.super_admin){
                    selected_country_id = Schema(admin.country_id)
                }
                
                const countries = await CountryService.getCountries(selected_country_id)        
                if(!selected_country_id){
                    selected_country_id = countries[0]._id
                }

                app_name = setting_detail.app_name;
                partner_panel_name = setting_detail.partner_panel_name;
                dispatcher_panel_name = setting_detail.dispatcher_panel_name;
                hotel_panel_name = setting_detail.hotel_panel_name;
                
                let flety_user_ads_url = "";
                let flety_driver_ads_url = ""; 
                let flety_corporate_ads_url = ""; 
                let flety_partner_ads_url = ""; 
                let advertise_data = setting.advertise_urls.find(obj => obj.country_id.toString() === selected_country_id.toString());                
                if(advertise_data){
                    flety_user_ads_url= advertise_data.flety_user_ads_url,
                    flety_driver_ads_url= advertise_data.flety_driver_ads_url
                    flety_corporate_ads_url= advertise_data.flety_corporate_ads_url
                    flety_partner_ads_url= advertise_data.flety_partner_ads_url
                }
                         
                res.render('admin_installation_settings', {
                    setting: setting,
                    PAYMENT_GATEWAY: PAYMENT_GATEWAY,
                    'app_name': app_name,
                    'partner_panel_name': partner_panel_name,
                    'dispatcher_panel_name': dispatcher_panel_name,
                    'hotel_panel_name': hotel_panel_name,
                    'flety_user_ads_url': flety_user_ads_url, 
                    'flety_driver_ads_url': flety_driver_ads_url,
                    'flety_corporate_ads_url': flety_corporate_ads_url,
                    'flety_partner_ads_url': flety_partner_ads_url,
                    countries,
                    selected_country_id
                });
             delete message;
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.terms_and_privacy_setting = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Settings.findOne({}).then((setting) => { 
            if (setting)
            {
                res.render('terms_and_privacy_setting', {
                    setting: setting
                });
                delete message;
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_provider_terms_and_condition = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Settings.findOne({}).then((setting) => { 
            if (setting)
            {
                setting.provider_terms_and_condition = req.body.provider_terms_and_condition;
                setting.save();
                setting_detail = setting;
                message = admin_messages.success_message_update;
                res.redirect('terms_and_privacy_setting');
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_provider_privacy_policy = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Settings.findOne({}).then((setting) => { 
            if (setting)
            {
                setting.provider_privacy_policy = req.body.provider_privacy_policy;
                setting.save();
                setting_detail = setting;
                message = admin_messages.success_message_update;
                res.redirect('terms_and_privacy_setting');
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_user_terms_and_condition = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Settings.findOne({}).then((setting) => { 
            if (setting)
            {
                setting.user_terms_and_condition = req.body.user_terms_and_condition;
                setting.save();
                setting_detail = setting;
                message = admin_messages.success_message_update;
                res.redirect('terms_and_privacy_setting');
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_user_privacy_policy = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Settings.findOne({}).then((setting) => { 
            if (setting)
            {
                setting.user_privacy_policy = req.body.user_privacy_policy;
                setting.save();
                setting_detail = setting;
                message = admin_messages.success_message_update;
                res.redirect('terms_and_privacy_setting');
            }
        });
    } else {
        res.redirect('/admin');
    }
};

////// APP key 

exports.update_app_key = function (req, res) {
    Settings.findOne({}).then((setting) => { 

        setting.hotline_app_id = (req.body.hotline_app_id).trim();
        setting.hotline_app_key = (req.body.hotline_app_key).trim();
        setting.save();
        setting_detail = setting;
        message = admin_messages.success_message_update;
        res.redirect('installation_settings');
    });
};


exports.twilio_settings_update = function (req, res) {
    Settings.findOne({}).then((setting) => { 
        setting.twilio_account_sid = (req.body.twilio_account_sid).trim();
        setting.twilio_auth_token = (req.body.twilio_auth_token).trim();
        setting.twilio_number = req.body.twilio_number;
        setting.twiml_url = req.body.twiml_url;
        setting.save();
        setting_detail = setting;
    });
    message = " update successfully";
    res.redirect('installation_settings');
};


////// THEME SETTING IMAGES
exports.upload_logo_images = function (req, res) {

    if (typeof req.session.userid != "undefined") {

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

                if (file_id == 'logo_image') {
                    file_name = constant_json.LOGO_IMAGE_NAME;
                } else if (file_id == 'title_image') {
                    file_name = constant_json.TITLE_IMAGE_NAME;
                } else if (file_id == 'mail_title_image') {
                    file_name = constant_json.MAIL_TITLE_IMAGE_NAME;
                } else if (file_id == 'authorised_image') {
                    file_name = constant_json.AUTHORISED_IMAGE_NAME;
                } else if (file_id == 'user_logo') {
                    file_name = constant_json.USER_LOGO;
                }

                if (file_name != '') {
                    utils.saveImageFromBrowser(req.files[0].path, file_name, 6);

                }

            }


        }
        message = " update successfully";
        res.redirect('/settings');

    } else {
        res.redirect('/admin');
    }
};


/////// IOS CERTIFICATE UPLOAD ////////
exports.upload_ios_push_certificate = function (req, res) {
    Settings.findOne({}).then((setting) => { 
        setting.team_id = (req.body.team_id).trim();
        setting.key_id = (req.body.key_id).trim();
        setting.provider_bundle_id = (req.body.provider_bundle_id).trim();
        setting.user_bundle_id = (req.body.user_bundle_id).trim();
        setting.ios_certificate_mode = (req.body.ios_certificate_mode).trim();
        setting.save();
        setting_detail = setting;
    });

    if (typeof req.session.userid != "undefined") {
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
                file_name = ''

                if (file_id == 'ios_user_cert_file') {
                    file_name = constant_json.IOS_USER_CERT_FILE_NAME;
                } else if (file_id == 'ios_user_key_file') {
                    file_name = constant_json.IOS_USER_KEY_FILE_NAME;
                } else if (file_id == 'ios_provider_cert_file') {
                    file_name = constant_json.IOS_PROVIDER_CERT_FILE_NAME;
                } else if (file_id == 'ios_provider_key_file') {
                    file_name = constant_json.IOS_PROVIDER_KEY_FILE_NAME;
                } else if (file_id == 'push_p8_file') {
                    file_name = constant_json.IOS_CERT_FILE_NAME;
                }

                if (file_name != '') {
                    utils.saveIosCertiFromBrowser(file_data.path, file_name, 1);
                }
            }
        }

        message = " update successfully";
        res.redirect('/settings');

    } else {
        res.redirect('/admin');
    }
};


////////// GOOGLE KEY////////
exports.google_api_key_settings_update = function (req, res) {
    Settings.findOne({}).then((setting) => { 
        setting.android_user_app_google_key = (req.body.android_user_app_google_key).trim();
        setting.android_provider_app_google_key = (req.body.android_provider_app_google_key).trim();
        setting.ios_user_app_google_key = (req.body.ios_user_app_google_key).trim();
        setting.ios_provider_app_google_key = (req.body.ios_provider_app_google_key).trim();
        setting.web_app_google_key = (req.body.web_app_google_key).trim();
        setting.road_api_google_key = (req.body.road_api_google_key).trim();
        setting.android_places_autocomplete_key = (req.body.android_places_autocomplete_key).trim();
        setting.ios_places_autocomplete_key = (req.body.ios_places_autocomplete_key).trim();
        setting.save();
        setting_detail = setting;
    });
    message = admin_messages.success_message_update;
    res.redirect('installation_settings');

};




////////// GCM KEY////////
exports.gcm_api_key_settings_update = function (req, res) {


    Settings.findOne({}).then((setting) => { 

        setting.android_user_app_gcm_key = (req.body.android_user_app_gcm_key).trim();
        setting.android_provider_app_gcm_key = (req.body.android_provider_app_gcm_key).trim();
        setting.save();
        setting_detail = setting;
    });
    message = admin_messages.success_message_update;
    res.redirect('installation_settings');
};




////////// ANDROID API URL////////
exports.android_app_url_settings_update = function (req, res) {
    Settings.findOne({}).then((setting) => { 
        setting.android_client_app_url = (req.body.android_client_app_url).trim();
        setting.android_driver_app_url = (req.body.android_driver_app_url).trim();
        setting.save();
        setting_detail = setting;
        message = " update successfully";
        res.redirect('installation_settings');
    });
};


//////// IOS API URL ///


exports.ios_app_url_settings_update = function (req, res) {
    Settings.findOne({}).then((setting) => { 
        setting.ios_client_app_url = (req.body.ios_client_app_url).trim();
        setting.ios_driver_app_url = (req.body.ios_driver_app_url).trim();
        setting.save();
        setting_detail = setting;
        message = " update successfully";
        res.redirect('installation_settings');
    });
};






/////////// PAYMENT GATEWAY - STRIPE//////////
exports.payment_gate_way_settings_update = function (req, res) {

    Settings.findOne({}).then((setting) => { 
        if (setting.stripe_secret_key != req.body.stripe_secret_key || setting.stripe_publishable_key != req.body.stripe_publishable_key) {
            
            Card.remove({}, function () {
            });
        }
        setting.stripe_secret_key = (req.body.stripe_secret_key).trim();
        setting.stripe_publishable_key = (req.body.stripe_publishable_key).trim();
        setting.paystack_secret_key = (req.body.paystack_secret_key).trim();
        setting.paystack_publishable_key = (req.body.paystack_publishable_key).trim();
        setting.payment_gateway_type = req.body.payment_gateway_type;
        setting.payu_key = req.body.payu_key;
        setting.payu_salt = req.body.payu_salt;
        setting.save();
        setting_detail = setting;
    });
    message = "update successfully";
    res.redirect('installation_settings');

};
////////////////////////////////////

exports.email_settings_update = function (req, res) {
    console.log(req.body)
    Settings.findOne({}).then((setting) => { 
        setting.email = (req.body.u_email).trim();
        setting.password = (req.body.email_psw).trim();
        setting.domain = req.body.domain;
        setting.smtp_host = (req.body.smtp_host).trim();
        setting.smtp_port = (req.body.smtp_port).trim();
        setting.save();
        setting_detail = setting;
    });
    message = " update successfully";
    res.redirect('installation_settings');

};

exports.settings = async function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        let country_list = await Country.find({ isBussiness: 1})
        let timezone_list = [];
        let i;
        country_list.forEach(country => {
            if (country.timezones) {
                country.timezones.forEach(timezone => {
                    i = timezone_list.findIndex(i => i == timezone)
                    if (i == -1) {
                        timezone_list.push(timezone)
                    }
                })
            }
        })
        let array = [];

        Settings.count({}).then((set) => {
            if (set == 0) {
                res.render('admin_settings', { detail: array, country: country_list });
                delete message;
            } else {
                Settings.find({}).then((settings) => {
                    res.render('admin_settings', { detail: settings, timezoneList: timezone_list, country: country_list });
                    delete message;
                })
            }
        });
    } else {
        res.redirect('/admin');
    }
};


exports.admin_settings_update = function (req, res) {

    if (typeof req.session.userid != "undefined") {
        var query = {};
        query['_id'] = req.body.id;
        Settings.findByIdAndUpdate(query, req.body, {new: true}).then((setting) => { 

            var countryname = "";
            if (req.body.countryname != "") {
                countryname = req.body.countryname.replace(/'/g, '');
            }
            setting.countryname = countryname;
            setting.location = [req.body.latitude, req.body.longitude];
            setting.save();
            setting_detail = setting;
            message = " update successfully";
            res.redirect('/settings');

        });
    } else {
        res.redirect('admin');
    }
};

exports.trip_settings_update = function (req, res) {

    if (typeof req.session.userid != "undefined") {
        var query = {};
        query['_id'] = req.body.id;

        if (typeof req.body.is_receive_new_request_near_destination == 'undefined') {
            req.body.is_receive_new_request_near_destination = 'false';
        }
        if (typeof req.body.is_driver_go_home == 'undefined') {
            req.body.is_driver_go_home = 'false';
        }
        if (typeof req.body.is_split_payment == 'undefined') {
            req.body.is_split_payment = 'false';
        }
        if (typeof req.body.is_driver_go_home_change_address == 'undefined') {
            req.body.is_driver_go_home_change_address = 'false';
        }
        if (typeof req.body.is_allow_multiple_stop == 'undefined') {
            req.body.is_allow_multiple_stop = 'false';
        }
        if (typeof req.body.is_multiple_stop_waiting_free_on_each_stop == 'undefined') {
            req.body.is_multiple_stop_waiting_free_on_each_stop = 'false';
        }
        if (typeof req.body.is_allow_ride_share == 'undefined') {
            req.body.is_allow_ride_share = 'false';
        }
        Settings.findByIdAndUpdate(query, req.body, { new: true }).then((setting) => {
            setting_detail = setting;
            message = "update successfully";
            res.redirect('/settings');
        });
    } else {
        res.redirect('admin');
    }
};

exports.update_notification_setting = async function (req, res) {
    if (typeof req.session.userid == "undefined") {
        return res.redirect('admin');
    }
    var query = {};
    query['_id'] = req.body.id;
    if (typeof req.body.sms_notification == 'undefined') {
        req.body.sms_notification = 'false';
    }
    if (typeof req.body.email_notification == 'undefined') {
        req.body.email_notification = 'false';
    }
    if (typeof req.body.userPath == 'undefined') {
        req.body.userPath = 'false';
    }
    if (typeof req.body.providerPath == 'undefined') {
        req.body.providerPath = 'false';
    }
    if (typeof req.body.get_referral_profit_on_card_payment == 'undefined') {
        req.body.get_referral_profit_on_card_payment = 'false';
    }
    if (typeof req.body.get_referral_profit_on_cash_payment == 'undefined') {
        req.body.get_referral_profit_on_cash_payment = 'false';
    }
    if (typeof req.body.userEmailVerification == 'undefined') {
        req.body.userEmailVerification = 'false';
    }
    if (typeof req.body.providerEmailVerification == 'undefined') {
        req.body.providerEmailVerification = 'false';
    }
    if (typeof req.body.userSms == 'undefined') {
        req.body.userSms = 'false';
    }
    if (typeof req.body.providerSms == 'undefined') {
        req.body.providerSms = 'false';
    }
    if (typeof req.body.is_tip == 'undefined') {
        req.body.is_tip = 'false';
    }
    if (typeof req.body.is_toll == 'undefined') {
        req.body.is_toll = 'false';
    }
    if (typeof req.body.twilio_call_masking == 'undefined') {
        req.body.twilio_call_masking = 'false';
    }
    if (typeof req.body.is_split_payment == 'undefined') {
        req.body.is_split_payment = 'false';
    }

    if (typeof req.body.android_user_app_force_update == 'undefined') {
        req.body.android_user_app_force_update = 'false';
    }
    if (typeof req.body.android_provider_app_force_update == 'undefined') {
        req.body.android_provider_app_force_update = 'false';
    }

    if (typeof req.body.ios_user_app_force_update == 'undefined') {
        req.body.ios_user_app_force_update = 'false';
    }
    if (typeof req.body.ios_provider_app_force_update == 'undefined') {
        req.body.ios_provider_app_force_update = 'false';
    }
    if (typeof req.body.is_provider_initiate_trip == 'undefined') {
        req.body.is_provider_initiate_trip = 'false';
    }

    if (typeof req.body.is_show_estimation_in_provider_app == 'undefined') {
        req.body.is_show_estimation_in_provider_app = 'false';
    }
    if (typeof req.body.is_show_estimation_in_user_app == 'undefined') {
        req.body.is_show_estimation_in_user_app = 'false';
    }
    if (typeof req.body.is_user_social_login == 'undefined') {
        req.body.is_user_social_login = 'false';
    }
    if (typeof req.body.is_provider_social_login == 'undefined') {
        req.body.is_provider_social_login = 'false';
    }
    if (typeof req.body.is_otp_verification_start_trip == 'undefined') {
        req.body.is_otp_verification_start_trip = 'false';
    }
    if (typeof req.body.is_guest_token == 'undefined') {
        req.body.is_guest_token = 'false';
    }
    if (typeof req.body.tracking_link_sms == 'undefined') {
        req.body.tracking_link_sms = 'false';
    }

    let setting = await Settings.findByIdAndUpdate(query, req.body, { new: true });
    message = "update successfully";
    setting_detail = setting;
    return res.redirect('/settings');
};


////////// UPDATE APP NAME///

////////// UPDATE APP NAME///

exports.update_app_name = function (req, res) {
    Settings.findOne({}).then((setting) => { 

        setting.app_name = req.body.app_name;
        setting.partner_panel_name = req.body.partner_panel_name;
        setting.dispatcher_panel_name = req.body.dispatcher_panel_name;
        setting.hotel_panel_name = req.body.hotel_panel_name;
        setting.corporate_panel_name = req.body.corporate_panel_name;
        setting.save();
        
        setting_detail = setting;
        message = success_messages.success_message_update;
        res.redirect('installation_settings');
    });
};


//////////  update_app_version////////
exports.update_app_version = function (req, res) {
    Settings.findOne({}).then((setting) => { 
        setting.android_user_app_version_code = (req.body.android_user_app_version_code).trim();
        setting.android_provider_app_version_code = (req.body.android_provider_app_version_code).trim();
        setting.ios_user_app_version_code = (req.body.ios_user_app_version_code).trim();
        setting.ios_provider_app_version_code = (req.body.ios_provider_app_version_code).trim();
        setting.save();
        setting_detail = setting;
        message = success_messages.success_message_update;
        res.redirect('installation_settings');
    });
};





exports.update_firebase_key = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Settings.findOne({}, function (err, setting) {
            if (setting)
            {
                setting.firebase_apiKey = (req.body.firebase_apiKey).trim();
                setting.firebase_authDomain = (req.body.firebase_authDomain).trim();
                setting.firebase_databaseURL = (req.body.firebase_databaseURL).trim();
                setting.firebase_projectId = (req.body.firebase_projectId).trim();
                setting.firebase_storageBucket = (req.body.firebase_storageBucket).trim();
                setting.firebase_messagingSenderId = (req.body.firebase_messagingSenderId).trim();
                setting.save();
                res.redirect('installation_settings');
            }
        });
    } else {
        res.redirect('/admin');
    }
};


exports.update_firebase_remote_config = async function (req, res) {
    try {
        if (typeof req.session.userid == 'undefined') {
            res.redirect('/admin');
            return
        }
        const selected_country_id = req.body.country_id || null
        if(!selected_country_id){
            res.redirect('/installation_settings')
            return;
        }
        const is_valid_image = await utils.check_valid_images(req.files[0], FILE_TYPE.OBJECT)
        if(req.files.length < 1 || !is_valid_image){
            res.redirect('/installation_settings')
            return
        }
        let settings = await Settings.findOne({})

        const type = Number(req.body.user_type);
        let remote_param = ""
        let remote_url = ""
        let advertise_data = null
        advertise_data = settings.advertise_urls.find(obj => obj.country_id.toString() === selected_country_id);
        
        if(!advertise_data){
            advertise_data = {
                country_id: Schema(selected_country_id),
                flety_user_ads_url: "",
                flety_driver_ads_url: "",
                flety_corporate_ads_url: "",
                flety_partner_ads_url: ""
            }
        }
        switch (type) {
            case Number(constant_json.USER_UNIQUE_NUMBER):
                remote_param = 'flety_user_ads_url';
                remote_url = advertise_data?.flety_user_ads_url || ""
                break;
            case Number(constant_json.PROVIDER_UNIQUE_NUMBER):
                remote_param = 'flety_driver_ads_url';
                remote_url = advertise_data?.flety_driver_ads_url || ""
                break;
            case Number(constant_json.CORPORATE_UNIQUE_NUMBER):
                remote_param = 'flety_corporate_ads_url';
                remote_url = advertise_data?.flety_corporate_ads_url || ""
                break;
            case Number(constant_json.PARTNER_UNIQUE_NUMBER):
                remote_param = 'flety_partner_ads_url';
                remote_url = advertise_data?.flety_partner_ads_url || ""
                break;
        }            

        if (remote_url != "") {
            const fileName = remote_url.substring(remote_url.lastIndexOf('/') + 1);
            utils.deleteImageFromFolder(utils.saveImageFolderPath(17) + fileName, 17);
        }
        const image_name = utils.tokenGenerator(32);
        let url = utils.getImageFolderPath(req, 17) + image_name + '.jpg';
        utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 17);
        advertise_data[remote_param] = url
        let advertise_urls = settings.advertise_urls.some(obj => obj.country_id.toString() === selected_country_id.toString())
        ? settings.advertise_urls.map(obj => 
            obj.country_id.toString() === selected_country_id.toString() ? advertise_data : obj
          )
        : [...settings.advertise_urls, advertise_data];

        const updateCount =  await Settings.updateOne(
            { _id: settings._id },
            { $set: { advertise_urls: advertise_urls } }
        );
        if (updateCount.modifiedCount > 0){
            setting_detail = await Settings.findOne()
        }

        message = admin_messages.success_message_advertise_update_success;
        res.redirect('/installation_settings')
        return
    } catch (e) {
        console.log(e) 
        message = admin_messages.error_message_advertise_update_failed;
        res.redirect('/installation_settings')
    }
}

exports.remove_remote_config_advertise = async function (req, res) { 
    try {
        let remote_param = ""
        let remote_url = ""
        const type = Number(req.body.user_type);
        const selected_country_id = req.body.country_id || null
        if(!selected_country_id){
            message = admin_messages.error_message_advertise_update_failed;
            res.json({success:false})
            return;
        }
        
        let advertise_data = null
        let settings = await Settings.findOne({})
        advertise_data = settings.advertise_urls.find(obj => obj.country_id.toString() === selected_country_id);

        switch (type) {
            case Number(constant_json.USER_UNIQUE_NUMBER):
                remote_param = 'flety_user_ads_url';
                remote_url = advertise_data?.flety_user_ads_url || ""
                break;
            case Number(constant_json.PROVIDER_UNIQUE_NUMBER):
                remote_param = 'flety_driver_ads_url';
                remote_url = advertise_data?.flety_driver_ads_url || ""
                break;
            case Number(constant_json.CORPORATE_UNIQUE_NUMBER):
                remote_param = 'flety_corporate_ads_url';
                remote_url = advertise_data?.flety_corporate_ads_url || ""
                break;
            case Number(constant_json.PARTNER_UNIQUE_NUMBER):
                remote_param = 'flety_partner_ads_url';
                remote_url = advertise_data?.flety_partner_ads_url || ""
                break;
        }            
        advertise_data[remote_param] = ""
        if (remote_url != "") {
            const fileName = remote_url.substring(remote_url.lastIndexOf('/') + 1);
            utils.deleteImageFromFolder(utils.saveImageFolderPath(17) + fileName, 17);
        }

        let advertise_urls = settings.advertise_urls.some(obj => obj.country_id.toString() === selected_country_id.toString())
        ? settings.advertise_urls.map(obj => 
            obj.country_id.toString() === selected_country_id.toString() ? advertise_data : obj
          )
        : [...settings.advertise_urls, advertise_data];

        await Settings.updateOne(
            { _id: settings._id },
            { $set: { advertise_urls: advertise_urls } }
        );
        
        message = admin_messages.success_message_advertise_update_success;
        res.json({success:true})
    } catch (e) {
        console.log(e)
        message = admin_messages.error_message_advertise_update_failed;
        res.json({success:false})
    }
}

exports.connectium_settings_update = function (req, res) {
    Settings.findOne({}).then((setting) => { 
        setting.connectium_key = (req.body.connectium_key).trim();
        setting.connectium_base_url = (req.body.connectium_base_url).trim();
        setting.connectium_short_code = req.body.connectium_short_code;
        setting.connectium_dlr = req.body.connectium_dlr;
        setting.connectium_dlr_level = req.body.connectium_dlr_level;
        setting.connectium_dlr_webhook_url = req.body.connectium_dlr_webhook_url;
        setting.save();
        setting_detail = setting;
    });
    message = " update successfully";
    res.redirect('installation_settings');
};

exports.update_app_redict_url = function (req, res) {
    if (typeof req.session.userid == "undefined") {
        res.redirect('/admin');
        return;
    }
    Settings.findOne({}).then((setting) => { 
        setting.user_app_insta_ad_url = req.body.user_app_insta_ad_url;
        setting.driver_app_insta_ad_url = req.body.driver_app_insta_ad_url;
        setting.save();
        setting_detail = setting;
        message = success_messages.success_message_update;
        res.redirect('installation_settings');
    });
};


exports.get_advertisement_urls = async function (req, res) {
    try {
        if (typeof req.session.userid == "undefined") {
            res.redirect('/admin');
            return;
        }
        const admin = req.session.admin
        let flety_user_ads_url = "";
        let flety_driver_ads_url = ""; 
        let flety_corporate_ads_url = ""; 
        let flety_partner_ads_url = ""; 

        if(!admin.super_admin){
            res.redirect('installation_settings');
            return;
        }

        let selected_country_id = req.body.country_id || null
        if(!selected_country_id){
            res.redirect('installation_settings');
            return;
        }
        let settings = await Settings.findOne({})
        let advertise_data = null
        advertise_data = settings.advertise_urls.find(obj => obj.country_id.toString() === selected_country_id);
        if(advertise_data){
            flety_user_ads_url = advertise_data?.flety_user_ads_url || "" ;
            flety_driver_ads_url = advertise_data?.flety_driver_ads_url || "" ;
            flety_corporate_ads_url = advertise_data?.flety_corporate_ads_url || "" ;
            flety_partner_ads_url = advertise_data?.flety_partner_ads_url || "" ;
        }
        res.json({
            success: true, 
            flety_user_ads_url,
            flety_driver_ads_url,
            flety_corporate_ads_url,
            flety_partner_ads_url
        })
        return;
    } catch (e) {
        console.log(e)
        res.json({success: false })

    }
}