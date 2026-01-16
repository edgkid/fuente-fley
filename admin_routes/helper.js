var helper = require('../admin_controllers/helper');

module.exports = function (app) {

    app.route('/partner_add_helper').get(helper.add);
    app.route('/partner_add_helper').post(helper.create_helper);
    app.route('/partner_helper_edit').post(helper.edit);
    app.route('/partner_helper_update').post(helper.update);
    app.route('/partner_helpers').get(helper.list);
    app.route('/partner_helpers').post(helper.list);
}