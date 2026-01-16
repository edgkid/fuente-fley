const ferry = require('../admin_controllers/ferry_ticket');
module.exports = function (app) {

    app.route('/admin_ferry_tickets').get(ferry.ferry_tickets);
    app.route('/admin_ferry_tickets').post(ferry.ferry_tickets);
    app.route('/admin_upload_ferry_ticket').post(ferry.upload_ferry_ticket);
};