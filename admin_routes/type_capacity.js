var type_capacity = require('../admin_controllers/type_capacity');

module.exports = function(app){

	app.route('/type_capacity').get(type_capacity.type_capacity_list);
	app.route('/type_capacity').post(type_capacity.type_capacity_list);
	app.route('/add_type_capacity_form').post(type_capacity.add_type_capacity_form);
	app.route('/add_type_capacity').post(type_capacity.add_type_capacity);
	app.route('/edit_type_capacity').post(type_capacity.edit);
	app.route('/update_type_capacity').post(type_capacity.update);
    app.route('/type_capacity_toggle').post(type_capacity.act);

}