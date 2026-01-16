var service_specifications = require('../admin_controllers/service_specifications');

module.exports = function(app){

	app.route('/service_specifications').get(service_specifications.service_specification_list);
	app.route('/service_specifications').post(service_specifications.service_specification_list);
	app.route('/add_service_specification_form').post(service_specifications.add_service_specification_form);
	app.route('/add_service_specification').post(service_specifications.add_service_specification);
	app.route('/edit_service_specification').post(service_specifications.edit);
	app.route('/update_service_specification').post(service_specifications.update);
    app.route('/service_specification_toggle').post(service_specifications.act);

}