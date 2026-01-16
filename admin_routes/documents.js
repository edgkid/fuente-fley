var documents = require('../admin_controllers/documents');
const { checkAdminSession } = require('../middlewares/sessionMiddleware');

module.exports = function(app) {
	
app.route('/documents').get(checkAdminSession, documents.list);
app.route('/documents').post(checkAdminSession, documents.list);
/////////////////// FOR ADD DOCUMENT //////////////////////

app.route('/generate_document_excel').post(checkAdminSession, documents.generate_document_excel);

app.route('/add_document_form').post(checkAdminSession, documents.add_document_form);
app.route('/add_document_detail').post(checkAdminSession, documents.add_document_detail);

///////////////////////////////////////////////////////////

///////////////// FOR DOCUMENT UPDATE ////////////////////

app.route('/edit_document_form').post(checkAdminSession, documents.edit_document_form);
app.route('/update_document_detail').post(checkAdminSession, documents.update_document_detail);

app.route('/find_document_by_country').post(checkAdminSession, documents.find_document_by_country);

//////////////////////////////////////////////////////////
}