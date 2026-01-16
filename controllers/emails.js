var utils = require('./utils');
var fs = require("fs");
var City = require('mongoose').model('City');
var moment = require('moment');
var Email = require('mongoose').model('email_detail');
var myEmail = require('./emails');
var Settings = require('mongoose').model('Settings');
var utils = require('./utils');
const Country = require('mongoose').model('Country');

exports.sendEmail = function (req, provider, user, emailID, extraParam) {

    var name = "";
    var email = "";
    if (provider != null) {
        name = provider.first_name + " " + provider.last_name;
        email = provider.email;
    } else if(user != null) {
        name = user.first_name + " " + user.last_name;
        email = user.email;
    }
    if (emailID == 9){
        const countryId = String(extraParam.country_id || '');
        extraParam = extraParam.unique_id
        const emailListConfig = setting_detail.email_list_trip_notifiy;
        const matched = emailListConfig.find(({ country_id }) => String(country_id) === countryId);
        email = matched?.email_list || setting_detail.email_list_trip_notifiy[0].email_list;
        name = "Admin FLETY"

    }

    var test = new Date(Date.now());
    var d = moment(test);
    var date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);
    var ejs = require("ejs");
    try {
        if (email != "") {
            Email.findOne({emailUniqueId: emailID}).then((email_data) => {

                var title = email_data.emailTitle;
                var emailContent = email_data.emailContent;
                var emailAdminInfo = email_data.emailAdminInfo;
                if (emailID == 1 || emailID == 13 || emailID == 4 || emailID == 31 || emailID == 21 || emailID == 14 || emailID == 8 || emailID == 9 || emailID == 10) {
                    emailContent = emailContent.replace("XXXXXX", extraParam);
                }

                var template = process.cwd() + '/app/views/email/email.html';
                fs.readFile(template, 'utf8', function (err, file) {
                    if (err) {

                        return res.send('ERROR!');
                    } else {
                        var compiledTmpl = ejs.compile(file, {filename: template});
                        var mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
                        var context = {
                            title: title,
                            name: name,
                            emailContent: emailContent,
                            emailAdminInfo: emailAdminInfo,
                            mail_title_image_url: mail_title_image_url,
                            date: date
                        };
                        var htmls = compiledTmpl(context);
                        htmls = htmls.replace(/&lt;/g, "<");
                        htmls = htmls.replace(/&gt;/g, ">");
                        htmls = htmls.replace(/&#34;/g, '"');
                        utils.mail_notification(email, email_data.emailTitle, "", htmls);
                    }
                });
            });

        }
    } catch (error) {
        console.log('ERROR!');
    }


};
exports.sendEmailCron = function (req, provider, user, emailID, extraParam, filePath="") {

    var name = "";
    var email = "";
    if (provider != null) {
        name = provider.first_name + " " + provider.last_name;
        email = provider.email;
    } else {
        name = user.first_name + " " + user.last_name;
        email = user.email;
    }

    var test = new Date(Date.now());
    var d = moment(test);
    var date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);
    var ejs = require("ejs");
    try {
        if (email != "") {
            Email.findOne({emailUniqueId: emailID}).then((email_data) => {

                var title = email_data.emailTitle;
                var emailContent = email_data.emailContent;
                var emailAdminInfo = email_data.emailAdminInfo;
                if (emailID == 1 || 13 || 4 || 31 || 21 || 14 || emailID == 20) {
                    emailContent = emailContent.replace("XXXXXX", extraParam);
                }


                var template = process.cwd() + '/app/views/email/email.html';
                fs.readFile(template, 'utf8', function (err, file) {
                    if (err) {
                        return res.send('ERROR!');
                    } else {
                        var compiledTmpl = ejs.compile(file, {filename: template});
                        var mail_title_image_url = "https://flety.io/web_images/mail_title_image.png";
                        var context = {
                            title: title,
                            name: name,
                            emailContent: emailContent,
                            emailAdminInfo: emailAdminInfo,
                            mail_title_image_url: mail_title_image_url,
                            date: date
                        };
                        var htmls = compiledTmpl(context);
                        htmls = htmls.replace(/&lt;/g, "<");
                        htmls = htmls.replace(/&gt;/g, ">");
                        htmls = htmls.replace(/&#34;/g, '"');
                        utils.mail_notification(email, email_data.emailTitle, "", htmls, filePath);
                    }
                });
            });

        }
    } catch (error) {
        console.log('ERROR!');
    }


};


exports.sendEmailPartnerDispatcher = function (req, partner, dispatcher, emailID, extraParam) {

    var name = "";
    var email = "";
    if (partner != null) {
        name = partner.first_name + " " + partner.last_name;
        email = partner.email;
    } else {
        name = dispatcher.first_name + " " + dispatcher.last_name;
        email = dispatcher.email;
    }

    var test = new Date(Date.now());
    var d = moment(test);
    var date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);
    var ejs = require("ejs");

    try {
        if (email != "") {


            Email.findOne({emailUniqueId: emailID}).then((email_data) => {

                // var appName = "FLETY TAXI";
                var title = email_data.emailTitle;
                var emailContent = email_data.emailContent;
                var emailAdminInfo = email_data.emailAdminInfo;
                if (emailID == 18 || emailID == 21 || emailID == 31 || emailID == 51) {
                    emailContent = emailContent.replace("XXXXXX", extraParam);
                }


                var template = process.cwd() + '/app/views/email/email.html';
                fs.readFile(template, 'utf8', function (err, file) {
                    if (err) {

                        return res.send('ERROR!');
                    } else {
                        var compiledTmpl = ejs.compile(file, {filename: template});
                        var mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
                        var context = {
                            title: title,
                            name: name,
                            mail_title_image_url: mail_title_image_url,
                            emailContent: emailContent,
                            emailAdminInfo: emailAdminInfo,
                            date: date
                        };
                        var htmls = compiledTmpl(context);
                        utils.mail_notification(email, email_data.emailTitle, "", htmls);
                    }
                });
            });
        }
    } catch (error) {
        console.log('ERROR!');
    }


};


exports.sendEmailHotel = function (req, hotel, emailID, extraParam) {

    var name = "";
    var email = "";
    if (hotel != null) {
        name = hotel.hotel_name;
        email = hotel.email;
    }


    var test = new Date(Date.now());
    var d = moment(test);
    var date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);
    var ejs = require("ejs");

    try {
        if (email != "") {
            Email.findOne({emailUniqueId: emailID}).then((email_data) => {
                var title = email_data.emailTitle;
                var emailContent = email_data.emailContent;
                var emailAdminInfo = email_data.emailAdminInfo;
                if (emailID == 41) {
                    emailContent = emailContent.replace("XXXXXX", extraParam);
                }


                var template = process.cwd() + '/app/views/email/email.html';
                fs.readFile(template, 'utf8', function (err, file) {
                    if (err) {

                        return res.send('ERROR!');
                    } else {
                        var compiledTmpl = ejs.compile(file, {filename: template});
                        var mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
                        var context = {
                            title: title,
                            name: name,
                            mail_title_image_url: mail_title_image_url,
                            emailContent: emailContent,
                            emailAdminInfo: emailAdminInfo,
                            date: date
                        };
                        var htmls = compiledTmpl(context);
                        utils.mail_notification(email, email_data.emailTitle, "", htmls);
                    }
                });
            });

        }

    } catch (error) {
        console.log('ERROR!');
    }


};


///////////////////  ADD HOTEL  ////////////////////////

exports.sendAddHotelEmail = function (req, hotel, name) {
    try {
        myEmail.sendEmailHotel(req, hotel, 41, name);
    } catch (error) {
        console.log('ERROR!');
    }

};


//////////////////// PARTNER REGISTER/////////////////////////


exports.sendCorporateRegisterEmail = function (email, country_id) {
    try {
        myEmail.sendWelcomeRegistrationEmail(email, country_id,  51);
    } catch (error) {
        console.log('ERROR!');
    }

};

exports.sendPartnerRegisterEmail = function (email, country_id) {
    try {
        myEmail.sendWelcomeRegistrationEmail(email,country_id, 21);
    } catch (error) {
        console.log('ERROR!');
    }

};


//////////////////// PARTNER DECLINE/////////////////////////
exports.sendPartnerDeclineEmail = function (req, partner) {
    try {
        myEmail.sendEmailPartnerDispatcher(req, partner, null, 22, "");
    } catch (error) {
        console.log('ERROR!');
    }

};

//////////////////// PARTNER APPROVED/////////////////////////
exports.sendPartnerApprovedEmail = function (req, partner) {
    try {
        myEmail.sendEmailPartnerDispatcher(req, partner, null, 23, "");
    } catch (error) {
        console.log('ERROR!');
    }

};
/////////////////// PARTNER VEHICLE DOCUMENT EXPIRE ///////////////////////
exports.sendPartnerVehicleDocumentExpiredEmail = function (req, partner, plate_no) {
    try {
        myEmail.sendEmailCron(req, partner, null, 17, plate_no);
    } catch (error) {
        console.log('ERROR!');
    }

};

//-----------------PARTNER NOTIFY TO UPLOAD DOCUMENT----------------//
exports.sendPartnerVehicleDocumentNotUploadedEmail = function (req, partner, plate_no) {
    try {
        myEmail.sendEmailCron(req, partner, null, 19, plate_no);
    } catch (error) {
        console.log('ERROR!');
    }

};

/////////////////// NOTIFY PARTNER FOR NEW TRIP
exports.sendPartnerNewTripEmail = function (req, partner) {
    try {
        myEmail.sendEmailPartnerDispatcher(req, partner, null, 18, partner.first_name +' '+ partner.last_name);
    } catch (error) {
        console.log('ERROR!');
    }

};

//////////////////// DISPATCHER REGISTER/////////////////////////

exports.sendDispatcherRegisterEmail = function (req, dispatcher, name) {
    try {
        myEmail.sendEmailPartnerDispatcher(req, null, dispatcher, 31, name);
    } catch (error) {
        console.log('ERROR!');
    }

};

///////////////////// PROVIDER REGISTER /////

exports.sendProviderRegisterEmail = function (email, country_id) {
    try {
        myEmail.sendWelcomeRegistrationEmail(email, country_id, 14);
    } catch (error) {
        console.log('ERROR!');
    }

};


//////////////////// USER REGISTER/////////////////////////

exports.sendUserRegisterEmail = async function (email, country) {
    try {
        let country_id = null
        let country_data = await Country.findOne({countryname: country})
        if(country_data){
            country_id =  country_data._id
        }
        myEmail.sendWelcomeRegistrationEmail(email, country_id, 4);
    } catch (error) {
        console.log('ERROR!');
    }

};

//////////////////// USER PAYMENT PENDING/////////////////////////
exports.sendUserPendingPaymentEmail = function (req, user, amount) {
    try {
        myEmail.sendEmail(req, null, user, 5, amount);
    } catch (error) {
        console.log('ERROR!');
    }

};

//////// USER FORGOTPASSWORD //////////
exports.userForgotPassword = function (req, user, new_password) {
    try {
        myEmail.sendEmail(req, null, user, 1, new_password);
    } catch (error) {
        console.log('ERROR!');
    }

};


//////////////////// USER DECLINE/////////////////////////
exports.sendUserDeclineEmail = function (req, user) {
    try {
        myEmail.sendEmail(req, null, user, 3, "");
    } catch (error) {
        console.log('ERROR!');
    }

};

exports.sendUserDocumentExpiredEmail = function (req, user) {
    try {
        myEmail.sendEmailCron(req, null, user, 16, "");
    } catch (error) {
        console.log('ERROR!');
    }

};

//////////////////// USER APPROVED/////////////////////////
exports.sendUserApprovedEmail = function (req, user) {
    try {
        myEmail.sendEmail(req, null, user, 6, "");
    } catch (error) {
        console.log('ERROR!');
    }

};

//////////////////// PROVIDER DECLINE/////////////////////////
exports.sendProviderDocumentExpiredEmail = function (req, provider) {
    try {
        myEmail.sendEmailCron(req, provider, null, 15, "");
    } catch (error) {
        console.log('ERROR!');
    }

};

exports.sendProviderDeclineEmail = function (req, provider) {
    try {
        myEmail.sendEmail(req, provider, null, 11, "");
    } catch (error) {
        console.log('ERROR!');
    }

};

//////////////////// PROVIDER APPROVED/////////////////////////
exports.sendProviderApprovedEmail = function (req, provider) {
    try {
        myEmail.sendEmail(req, provider, null, 12, "");
    } catch (error) {
        console.log('ERROR!');
    }

};

//////// PROVIDER FORGOTPASSWORD //////////
exports.providerForgotPassword = function (req, provider, new_password) {
    try {
        myEmail.sendEmail(req, provider, null, 13, new_password);
    } catch (error) {
        console.log('ERROR!');
    }

};


/// OTP VERIFICATION EMAIL ///
exports.emailForOTPVerification = function (req, email, otpForEmail, emailID) {
    var email = req.body.email;
    try {
        if (email != "") {
            Email.findOne({emailUniqueId: emailID}).then((email_data) => {
                var title = email_data.emailTitle;
                var emailContent = email_data.emailContent;
                var emailAdminInfo = email_data.emailAdminInfo;
                emailContent = emailContent.replace("XXXXXX", otpForEmail);
                var ejs = require("ejs");
                var template = process.cwd() + '/app/views/email/otpverification.html';
                fs.readFile(template, 'utf8', function (err, file) {
                    if (err) {
                        console.log('ERROR!');
                        return res.send('ERROR!');
                    } else {
                        var compiledTmpl = ejs.compile(file, {filename: template});
                        var mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
                        var context = {
                            title: title,
                            emailContent: emailContent,
                            emailAdminInfo: emailAdminInfo,
                            mail_title_image_url: mail_title_image_url
                        };
                        var htmls = compiledTmpl(context);
                        utils.mail_notification(email, email_data.emailTitle, "", htmls);
                    }
                });
            });

        }

    } catch (error) {
        console.log('ERROR!');
    }

};

//////////////////// USER INVOICE/////////////////////////
exports.sendUserInvoiceEmail = function (req, user, provider, trip, tripservice) {

    var provider_name = provider.first_name + " " + provider.last_name;
    var provider_email = provider.email;
    var provider_picture = req.protocol + '://' + req.get('host') + '/' + provider.picture;
    var provider_phone = provider.country_phone_code + provider.phone;

    var user_name = user.first_name + " " + user.last_name;

    var user_email = user.email;
    var title = "User Invoice";
    var pattern = "User Invoice";
    var test = new Date(Date.now());
    var d = moment(test);
    var date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);

    var ejs = require("ejs");

    var template = process.cwd() + '/app/views/email/userinvoice.html';


    var start = trip.sourceLocation;
    var end = trip.destinationLocation;
    var stops = trip.actual_destination_addresses;
    var start_source_location = start[0] + "," + start[1];
    var map = "";
    var path = "color:0x0000ff|weight:5";


    var pickup_small_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/pickup.png";
    var desination_small_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/destination.png";
    var stop_small_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/stop_pin_url.png";


    var support = req.protocol + '://' + req.get('host') + "/map_pin/support.png";
    var hour_icon = req.protocol + '://' + req.get('host') + "/map_pin/hour_icon.png";
    var km_icon = req.protocol + '://' + req.get('host') + "/map_pin/km_icon.png";
    var credit_card = req.protocol + '://' + req.get('host') + "/map_pin/credit_card.png";


    var pickup_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/pickup2x.png";
    var desination_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/destination2x.png";
    var stop_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/stop_pin_url.png";
    var size_scale = "size=512x512&scale=4";


    var key =setting_detail.web_app_google_key;

    if (end[0] != 0 || end[1] != 0) {
        var end_source_location = end[0] + "," + end[1];
    
        map = "https://maps-api-ssl.google.com/maps/api/staticmap?key=" + key + "&&" + size_scale +
            "&markers=shadow:true|scale:2|icon:" + pickup_pin_url + "|" + start_source_location;
        stops.forEach(stop=>{
            if (stop.address != ''){
                map += "&markers=shadow:false|scale:2|icon:" + stop_pin_url + "|" + stop.location[0] + "," + stop.location[1]     
            }
        })
        map += "&markers=shadow:false|scale:2|icon:" + desination_pin_url + "|" + end_source_location + "&path=" + path;


    } else {
        map = "https://maps-api-ssl.google.com/maps/api/staticmap?key=" + key + "&&" + size_scale +
            "&markers=shadow:true|scale:2|icon:" + pickup_pin_url + "|" + start_source_location;
        stops.forEach(stop=>{
            if (stop.address != ''){
                map += "&markers=shadow:false|scale:2|icon:" + stop_pin_url + "|" + stop.location[0] + "," + stop.location[1]     
            }
        })
        map += "|&path=" + path;

    }

    try {
        if (user_email != "") {

            fs.readFile(template, 'utf8', function (err, file) {
                if (err) {
                    console.log('ERROR!');
                    return err;
                } else {
                    Settings.findOne({}, function (err, settingData) {

                        City.findById(provider.cityid).then((city_data) => {

                            var distance_unit = city_data.unit

                            if (distance_unit == 1) {
                                distance_unit = req.__('unit_km');
                            } else {
                                distance_unit = req.__('unit_mile');
                            }


                            var is_public_demo = settingData.is_public_demo;
                            var compiledTmpl = ejs.compile(file, {filename: template});
                            var mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
                            var context = {
                                title: setting_detail.app_name, date: date,
                                total: trip.total,
                                source_address: trip.source_address, destination_address: trip.destination_address,
                                total_distance: trip.total_distance,
                                distance_unit: distance_unit,
                                total_time: trip.total_time,
                                card_payment: trip.card_payment, currency: trip.currency,
                                referral_payment: trip.referral_payment,
                                promo_payment: trip.promo_payment,
                                distance_cost: trip.distance_cost,
                                time_cost: trip.time_cost,
                                waiting_time_cost: trip.waiting_time_cost,
                                tax_fee: trip.tax_fee,
                                user_tax_fee: trip.user_tax_fee,
                                user_miscellaneous_fee: trip.user_miscellaneous_fee,
                                actual_destination_addresses: trip.actual_destination_addresses ? trip.actual_destination_addresses : [],
                                is_fixed_fare: trip.is_fixed_fare,
                                fixed_price: trip.fixed_price,
                                surge_fee: trip.surge_fee,
                                base_price: tripservice.base_price,
                                price_per_unit_distance: tripservice.price_per_unit_distance,
                                price_for_total_time: tripservice.price_for_total_time,
                                price_for_waiting_time: tripservice.price_for_waiting_time,
                                price_for_waiting_time_multiple_stops: tripservice.price_for_waiting_time_multiple_stops ?
                                    tripservice.price_for_waiting_time_multiple_stops : 0,
                                service_type_name: tripservice.service_type_name,
                                provider_name: provider_name,
                                provider_email: provider_email,
                                provider_phone: provider_phone,
                                provider_picture: provider_picture,
                                user_name: user_name,
                                map_url: map,
                                toll: trip.toll_amount,
                                tip: trip.tip_amount,
                                pickup_small_pin_url: pickup_small_pin_url,
                                desination_small_pin_url: desination_small_pin_url,
                                stop_small_pin_url: stop_small_pin_url,
                                mail_title_image_url: mail_title_image_url,
                                is_public_demo: is_public_demo,
                                support: support,
                                hour_icon: hour_icon,
                                km_icon: km_icon,
                                credit_card: credit_card,
                                detail: trip
                            };
                            var htmls = compiledTmpl(context);
                            utils.mail_notification(user_email, title, pattern, htmls);
                        });

                    });
                }
            });

        }

    } catch (error) {
        console.error('ERROR!');
    }


};


//////////////////// PROVIDER INVOICE/////////////////////////

exports.sendProviderInvoiceEmail = function (req, provider, trip, tripservice, user) {

    var provider_name = provider.first_name + " " + provider.last_name;
    var provider_email = provider.email;
    var provider_picture = req.protocol + '://' + req.get('host') + '/' + provider.picture;
    var provider_phone = provider.country_phone_code + provider.phone;

    var title = "Provider Invoice";
    var pattern = "Provider Invoice";
    var test = new Date(Date.now());
    var d = moment(test);
    var date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);

    var ejs = require("ejs");

    var template = process.cwd() + '/app/views/email/providerinvoice.html';
    var start = trip.sourceLocation;
    var end = trip.destinationLocation;
    var stops = trip.actual_destination_addresses;
    var start_source_location = start[0] + "," + start[1];
    var map = "";
    var path = "color:0x0000ff|weight:5";

    var mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
    var pickup_small_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/pickup.png";
    var desination_small_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/destination.png";
    var stop_small_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/stop_pin_url.png";

    var pickup_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/pickup2x.png";
    var desination_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/destination2x.png";
    var stop_pin_url = req.protocol + '://' + req.get('host') + "/map_pin/stop_pin_url.png";
    var size_scale = "size=512x512&scale=4";

    var support = req.protocol + '://' + req.get('host') + "/map_pin/support.png";
    var hour_icon = req.protocol + '://' + req.get('host') + "/map_pin/hour_icon.png";
    var km_icon = req.protocol + '://' + req.get('host') + "/map_pin/km_icon.png";
    var credit_card = req.protocol + '://' + req.get('host') + "/map_pin/credit_card.png";


    var key =setting_detail.web_app_google_key;

    if (end[0] != 0 || end[1] != 0) {
        var end_source_location = end[0] + "," + end[1];

        map = "https://maps-api-ssl.google.com/maps/api/staticmap?key=" + key + "&&" + size_scale +
            "&markers=shadow:true|scale:2|icon:" + pickup_pin_url + "|" + start_source_location;
        stops.forEach(stop => {
            if (stop.address != '') {
                map += "&markers=shadow:false|scale:1|icon:" + stop_pin_url + "|" + stop.location[0] + "," + stop.location[1]
            }
        })
        map += "&markers=shadow:false|scale:2|icon:" + desination_pin_url + "|" + end_source_location + "&path=" + path;


    } else {
        map = "https://maps-api-ssl.google.com/maps/api/staticmap?key=" + key + "&&" + size_scale +
            "&markers=shadow:true|scale:2|icon:" + pickup_pin_url + "|" + start_source_location;
        stops.forEach(stop => {
            if (stop.address != '') {
                map += "&markers=shadow:false|scale:1|icon:" + stop_pin_url + "|" + stop.location[0] + "," + stop.location[1]
            }
        })
        map += "|&path=" + path;

    }
    try {
        if (provider_email != "") {
            fs.readFile(template, 'utf8', function (err, file) {
                if (err) {
                    console.log('ERROR!');
                    return err;
                } else {

                    City.findById(provider.cityid).then((city_data) => {

                        var distance_unit = city_data.unit

                        if (distance_unit == 1) {
                            distance_unit = req.__('unit_km');
                        } else {
                            distance_unit = req.__('unit_mile');
                        }
                        Settings.findOne({}, function (err, settingData) {
                            var is_public_demo = settingData.is_public_demo;
                            var compiledTmpl = ejs.compile(file, {filename: template});
                            var mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";

                            var provider_name = user.first_name + " " + user.last_name;
                            var provider_email = user.email;
                            var provider_picture = req.protocol + '://' + req.get('host') + '/' + user.picture;
                            var provider_phone = user.country_phone_code + user.phone;

                            var context = {
                                title: setting_detail.app_name, date: date,
                                total: trip.total,
                                source_address: trip.source_address, destination_address: trip.destination_address,
                                total_distance: trip.total_distance,
                                distance_unit: distance_unit,
                                total_time: trip.total_time,
                                card_payment: trip.card_payment, currency: trip.currency,
                                referral_payment: trip.referral_payment,
                                promo_payment: trip.promo_payment,
                                distance_cost: trip.distance_cost,
                                time_cost: trip.time_cost,
                                waiting_time_cost: trip.waiting_time_cost,
                                tax_fee: trip.tax_fee,
                                user_tax_fee: trip.user_tax_fee,
                                user_miscellaneous_fee: trip.user_miscellaneous_fee,
                                actual_destination_addresses: trip.actual_destination_addresses ? trip.actual_destination_addresses : [],
                                is_fixed_fare: trip.is_fixed_fare,
                                fixed_price: trip.fixed_price,
                                surge_fee: trip.surge_fee,
                                toll: trip.toll_amount,
                                tip: trip.tip_amount,
                                base_price: tripservice.base_price,
                                price_per_unit_distance: tripservice.price_per_unit_distance,
                                price_for_total_time: tripservice.price_for_total_time,
                                price_for_waiting_time: tripservice.price_for_waiting_time,
                                price_for_waiting_time_multiple_stops: tripservice.price_for_waiting_time_multiple_stops ?
                                    tripservice.price_for_waiting_time_multiple_stops : 0,
                                service_type_name: tripservice.service_type_name,
                                provider_name: provider_name,
                                provider_email: provider_email,
                                provider_phone: provider_phone,
                                provider_picture: provider_picture,
                                map_url: map,
                                pickup_small_pin_url: pickup_small_pin_url,
                                desination_small_pin_url: desination_small_pin_url,
                                stop_small_pin_url: stop_small_pin_url,
                                mail_title_image_url: mail_title_image_url,
                                is_public_demo: is_public_demo,
                                support: support,
                                hour_icon: hour_icon,
                                km_icon: km_icon,
                                detail: trip,
                                credit_card: credit_card

                            };


                            var htmls = compiledTmpl(context);
                            utils.mail_notification(provider_email, title, pattern, htmls);
                        });
                    });
                }
            });

        }
    } catch (error) {
        console.error('ERROR!');
    }

};


//////////////////// PROVIDER DAILY REPORT /////////////////////////
exports.sendProviderDailyReportEmail = function (req, provider) {
    var provider_name = provider.first_name + " " + provider.last_name;
    var provider_email = provider.email;
    var title = "DailyReport";
    var pattern = "DailyReport";
    var test = new Date(Date.now());
    var d = moment(test);
    var date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);
    var ejs = require("ejs");

    try {
        if (provider_email != "") {
            var template = process.cwd() + '/app/views/email/dailyreport.html';
            fs.readFile(template, 'utf8', function (err, file) {
                if (err) {
                    console.log('ERROR!');
                    return res.send('ERROR!');
                } else {
                    var compiledTmpl = ejs.compile(file, {filename: template});
                    var mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
                    var context = {
                        title: setting_detail.app_name,
                        provider_name: provider_name,
                        date: date,
                        mail_title_image_url: mail_title_image_url
                    };
                    var htmls = compiledTmpl(context);
                    utils.mail_notification(provider_email, title, pattern, htmls);
                }
            });
        }
    } catch (error) {
    }
};

//////////////////// PROVIDER WEEKLY REPORT /////////////////////////
exports.sendProviderWeeklyReportEmail = function (req, provider) {
    var provider_name = provider.first_name + " " + provider.last_name;
    var provider_email = provider.email;
    var title = "WEEKLY REPORT";
    var pattern = "WEEKLY REPORT";
    var test = new Date(Date.now());
    var d = moment(test);
    var date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);
    var ejs = require("ejs");
    try {
        if (provider_email != "") {
            var template = process.cwd() + '/app/views/email/weeklyreport.html';
            fs.readFile(template, 'utf8', function (err, file) {
                if (err) {
                    console.log('ERROR!');
                    return res.send('ERROR!');
                } else {
                    var compiledTmpl = ejs.compile(file, {filename: template});
                    var mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
                    var context = {
                        title: setting_detail.app_name,
                        provider_name: provider_name,
                        date: date,
                        mail_title_image_url: mail_title_image_url
                    };
                    var htmls = compiledTmpl(context);
                    utils.mail_notification(provider_email, title, pattern, htmls);
                }
            });
        }
    } catch (error) {
    }
};

exports.sendAdminAssignPartnerRequest = function (req, partner, name) {
    try {
        myEmail.sendEmail(req, null, partner, 8, name);
    } catch (error) {
        console.log('ERROR!');
    }
};

exports.sendAdminNewRequest = function (req, trip_unique_id, country_id) {
    try {
        let extraParam = {
            unique_id: trip_unique_id,
            country_id: country_id
        }
        myEmail.sendEmail(req, null, null, 9, extraParam);
    } catch (error) {
        console.log('ERROR!');
    }
};

exports.sendAdminUnassignPartnerRequest = function (req, partner, trip_unique_id) {
    try {
        myEmail.sendEmail(req, partner, null, 10, trip_unique_id);
    } catch (error) {
        console.log('ERROR!');
    }
};

exports.sendUserDailyRegistration = function (filePath, DateString) {
    try {
        let adminDetail = {
            first_name : "Flety",
            last_name : "",
            email : setting_detail.emails_notify_registration_data   
        }
        myEmail.sendEmailCron(null, null, adminDetail, 20, DateString, filePath);
    } catch (error) {
        console.log(error);
    }
};

exports.sendWelcomeRegistrationEmail = async function (email, country_id=null, emailID) {
    try {
        if (email == "") {
            return;
        }
        let query = {countryName:"Venezuela", emailUniqueId: emailID}
        if(country_id){
            query = {countryId:country_id, emailUniqueId: emailID}
        }
        let email_data = await Email.findOne(query)        
        const title = email_data.emailTitle;
        const emailContent = email_data.emailContent;
        const emailAdminInfo = email_data.emailAdminInfo;
        const ejs = require("ejs");
        const template = process.cwd() + '/app/views/email/registration.html';
        fs.readFile(template, 'utf8', function (err, file) {
            if (err) {
                console.log(err);
                return res.send('ERROR!');
            } else {
                const compiledTmpl = ejs.compile(file, {filename: template});
                const mail_title_image_url = "https://flety.io/web_images/FLETY_LOGOAZUL.png";
                
                const context = {
                    title: title,
                    emailContent: emailContent,
                    emailAdminInfo: emailAdminInfo,
                    mail_title_image_url: mail_title_image_url
                };
                var htmls = compiledTmpl(context);
                htmls = htmls.replace(/&lt;/g, "<");
                htmls = htmls.replace(/&gt;/g, ">");
                htmls = htmls.replace(/&#34;/g, '"');
                utils.mail_notification(email, email_data.emailTitle, "", htmls);
            }
        });

    } catch (error) {
        console.log(error);
    }
};


exports.sendEmailUserNotifyEmptyTrailerLoad = async function (req, user, provider_name, plate_no, emailID ) {

    let name = "";
    let email = "";
    if (user != null) {
        name = user.name;
        email = user.email;
    } 
    let test = new Date(Date.now());
    let d = moment(test);
    let date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);
    let ejs = require("ejs");

    try {
        if (email != "") {
            let email_data = await Email.findOne({emailUniqueId: emailID})
            const title = email_data.emailTitle;
            let emailContent = email_data.emailContent;
            const emailAdminInfo = email_data.emailAdminInfo;
            emailContent = emailContent.replace("PROVIDER_NAME", provider_name);
            emailContent = emailContent.replace("PLATE_NO", plate_no);
            const template = process.cwd() + '/app/views/email/email.html';
            fs.readFile(template, 'utf8', function (err, file) {
                if (err) {

                    return res.send('ERROR!');
                } else {
                    const compiledTmpl = ejs.compile(file, {filename: template});
                    const mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
                    const context = {
                        title: title,
                        name: name,
                        mail_title_image_url: mail_title_image_url,
                        emailContent: emailContent,
                        emailAdminInfo: emailAdminInfo,
                        date: date
                    };
                    const htmls = compiledTmpl(context);
                    utils.mail_notification(email, email_data.emailTitle, "", htmls);
                }
            });
        }
    } catch (error) {
        console.log('ERROR!');
    }
};

exports.sendEmailPartnerCorporate = async function (req, extra_param = null , emailID ) {

    let test = new Date(Date.now());
    let d = moment(test);
    let date = d.format(constant_json.DATE_FORMAT_MMM_D_YYYY);
    let ejs = require("ejs");
    const { email= "", trip_id = "", user_name = "", partner_name = "", provider_name = "",corporate_name = "", plate_no="", name="" } = extra_param;
    try {
        if (email != "") {
            let email_data = await Email.findOne({emailUniqueId: emailID})
            const title = email_data.emailTitle;
            let emailContent = email_data.emailContent;
            const emailAdminInfo = email_data.emailAdminInfo;
            emailContent = emailContent.replace("TRIP_ID", trip_id);
            emailContent = emailContent.replace("PARTNER_NAME", partner_name);
            emailContent = emailContent.replace("CORPORATE_NAME", corporate_name);
            emailContent = emailContent.replace("USER_NAME", user_name);
            emailContent = emailContent.replace("DRIVER_NAME", provider_name);
            emailContent = emailContent.replace("PLATE_NO", plate_no);
            const template = process.cwd() + '/app/views/email/email.html';
            fs.readFile(template, 'utf8', function (err, file) {
                if (err) {

                    return res.send('ERROR!');
                } else {
                    const compiledTmpl = ejs.compile(file, {filename: template});
                    const mail_title_image_url = req.protocol + '://' + req.get('host') + "/web_images/mail_title_image.png";
                    const context = {
                        title: title,
                        name: name,
                        mail_title_image_url: mail_title_image_url,
                        emailContent: emailContent,
                        emailAdminInfo: emailAdminInfo,
                        date: date
                    };
                    const htmls = compiledTmpl(context);
                    utils.mail_notification(email, email_data.emailTitle, "", htmls);
                }
            });
        }
    } catch (error) {
        console.log({error});
        console.log('ERROR!');
    }
};
