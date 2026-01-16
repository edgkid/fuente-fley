var type_models = require('../admin_controllers/type_models');

module.exports = function(app){

	app.route('/type_models').get(type_models.type_model_list);
	app.route('/type_models').post(type_models.type_model_list);
	app.route('/add_type_model_form').post(type_models.add_type_model_form);
	app.route('/add_type_model').post(type_models.add_type_model);
	app.route('/edit_type_model').post(type_models.edit);
	app.route('/update_type_model').post(type_models.update);
    app.route('/type_model_toggle').post(type_models.act);

}