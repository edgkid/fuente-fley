var type_services = require('../admin_controllers/type_services');

module.exports = function(app){

	app.route('/type_services').get(type_services.type_service_list);
	app.route('/type_services').post(type_services.type_service_list);
	app.route('/add_type_service_form').post(type_services.add_type_service_form);
	app.route('/add_type_service').post(type_services.add_type_service);
	app.route('/edit_type_service').post(type_services.edit);
	app.route('/update_type_service').post(type_services.update);
    app.route('/type_service_toggle').post(type_services.act);

}