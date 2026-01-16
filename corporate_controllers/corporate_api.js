const Corporate = require('../models/corporate');
const RequestUserCorporate = require('../models/request_user_corporate');
const Country = require('../models/country');
const crypto = require('crypto');
const utils = require('../controllers/utils');
const admin_messages = require('../../admin_panel_message.json');

exports.corporate_edit_profile = async function (req, res) {
    try {
        if (typeof req.session.corporate === 'undefined') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const id = req.session.corporate._id;
        
        // Check if phone already exists
        const existingUser = await Corporate.findOne({
            phone: req.body.phone, 
            _id: {$ne: id}
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: admin_messages.error_message_mobile_no_already_used
            });
        }

        const corporate_detail = await Corporate.findById(id);
        
        if (!corporate_detail) {
            return res.status(404).json({
                success: false,
                message: 'Corporate not found'
            });
        }

        // Handle password update
        if (req.body.password && req.body.password !== '') {
            req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');
        } else {
            delete req.body.password;
        }

        // Handle RIF
        if (req.body.rif0 && req.body.rif1) {
            req.body.rif = req.body.rif0 + '-' + req.body.rif1;
        }

        // Handle file uploads
        console.log('Files array length:', req.files ? req.files.length : 0);
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file_data = req.files[i];
                const file_id = file_data.fieldname;
                console.log('Processing file:', file_id, file_data.originalname);

                if (file_id === 'pictureData') {
                    utils.deleteImageFromFolder(corporate_detail.picture, 13);
                    const image_name = corporate_detail._id + utils.tokenGenerator(5);
                    const url = utils.getImageFolderPath(req, 13) + image_name + '.png';
                    req.body.picture = url;
                    utils.saveImageFromBrowser(file_data.path, image_name + '.png', 13);
                    console.log('Picture saved:', url);
                }
            }
        }

        // Handle country update
        if (req.body.country) {
            const country = await Country.findOne({_id: req.body.country});
            if (country) {
                req.body.country_name = country.countryname;
                req.body.country_id = country._id;
            }
        }

        // Update corporate profile
        const updatedCorporate = await Corporate.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true }
        );

        req.session.corporate = updatedCorporate;

        return res.status(200).json({
            success: true,
            message: admin_messages.success_message_profile_update,
            data: updatedCorporate
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

//details of corporate profile
exports.corporate_profile = async function (req, res) {
    try {
        if (typeof req.session.corporate === 'undefined') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const main_corporate_id = req.session.corporate.corporate_type_id ? 
            req.session.corporate.corporate_type_id : req.session.corporate._id;
        const is_main_corporate = req.session.corporate.corporate_type_id ? false : true;
        
        const response = await Corporate.findById(main_corporate_id);
        
        if (!response) {
            return res.status(404).json({
                success: false,
                message: 'Corporate not found'
            });
        }

        let rif = [];
        if (response.rif) {
            rif = response.rif.split(/-(.+)/).slice(0, 2);
        }

        if (is_main_corporate) {
            req.session.corporate = response;
        }

        const countries = await Country.find({ isBusiness: 1 });
        const corporate_country = countries.find(country => 
            country._id.toString() == response.country_id.toString()
        );

        return res.status(200).json({
            success: true,
            data: {
                corporate: response,
                rif: rif,
                isMasterCorp: response?.corporate_type_id === undefined,
                activeApi: response?.active_api,
                apiKey: response?.api_key,
                countries: countries,
                corporateCountry: corporate_country
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


// Get corporate requests
exports.get_corporate_requests = async function (req, res) {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const filter = status ? { status } : {};
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { created_at: -1 }
        };

        const requests = await RequestUserCorporate.paginate(filter, options);

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Helper function to update request status
const updateRequestStatus = async (id, status) => {
    return await RequestUserCorporate.findByIdAndUpdate(
        id,
        { status, updated_at: new Date() },
        { new: true }
    );
};


// Update request status
exports.update_request_status = async function (req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedRequest = await RequestUserCorporate.findByIdAndUpdate(
            id,
            { status, updated_at: new Date() },
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // If approved, create corporate record
        if (status === 'approved') {
            try {
                const existingCorporate = await Corporate.findOne({ email: updatedRequest.email });
                console.log('Existing corporate check:', existingCorporate ? 'Found' : 'Not found');
                
                if (!existingCorporate) {
                    console.log('Creating new corporate with data:', {
                        email: updatedRequest.email,
                        name: updatedRequest.name
                    });
                    
                    const newCorporate = await Corporate.create({
                        company_name: updatedRequest.name,
                        name: updatedRequest.name,
                        email: updatedRequest.email,
                        phone: updatedRequest.phone,
                        country_phone_code: updatedRequest.countryCode,
                        address: updatedRequest.address,
                        password: updatedRequest.password,
                        is_approved: 1
                    });
                    
                    console.log('Corporate created successfully with ID:', newCorporate._id);
                } else {
                    console.log('Corporate already exists, skipping creation');
                }
            } catch (corporateError) {
                console.error('Error creating corporate:', corporateError);
            }
        }

        return res.status(200).json({
            success: true,
            message: status === 'approved' ? 'Solicitud aprobada y usuario corporativo creado exitosamente' : 'Estado actualizado correctamente',
            data: updatedRequest
        });

    } catch (error) {
        console.error('Error in update_request_status:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
// Render corporate requests list view
exports.corporate_requests_list = async function (req, res) {
    try {
        const { status, search, page = 1 } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const options = {
            page: parseInt(page),
            limit: 10,
            sort: { created_at: -1 }
        };

        const requests = await RequestUserCorporate.paginate(filter, options);

        return res.render('corporate_requests_list', {
            requests,
            status,
            search,
            moment: require('moment')
        });

    } catch (error) {
        return res.status(500).render('errorPage', {
            message: 'Error interno del servidor'
        });
    }
};

// Get document (logo or document)
exports.get_request_document = async function (req, res) {
    try {
        const { id, type } = req.params;
        
        const request = await RequestUserCorporate.findById(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        const document = type === 'logo' ? request.logo : request.document;
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Documento no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: document.toString('base64')
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Delete request
exports.delete_request = async function (req, res) {
    try {
        const { id } = req.params;

        const deletedRequest = await RequestUserCorporate.findByIdAndDelete(id);
        if (!deletedRequest) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Solicitud eliminada correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Export to Excel
exports.export_requests_excel = async function (req, res) {
    try {
        const { status, search } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const requests = await RequestUserCorporate.find(filter).sort({ created_at: -1 });
        
        const xl = require('excel4node');
        const fs = require('fs');
        
        const date = new Date();
        const time = date.getTime();
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet('Solicitudes Corporativas');
        let col = 1;

        // Headers
        ws.cell(1, col++).string('Nombre');
        ws.cell(1, col++).string('Email');
        ws.cell(1, col++).string('Teléfono');
        ws.cell(1, col++).string('País');
        ws.cell(1, col++).string('Ciudad');
        ws.cell(1, col++).string('Dirección');
        ws.cell(1, col++).string('Estado');
        ws.cell(1, col++).string('Fecha Registro');

        // Data rows
        requests.forEach(function (request, index) {
            col = 1;
            ws.cell(index + 2, col++).string(request.name || '');
            ws.cell(index + 2, col++).string(request.email || '');
            ws.cell(index + 2, col++).string(`${request.countryCode}${request.phone}`);
            ws.cell(index + 2, col++).string(request.country || '');
            ws.cell(index + 2, col++).string(request.city || '');
            ws.cell(index + 2, col++).string(request.address || '');
            
            const statusText = request.status === 'pending' ? 'Pendiente' : 
                              request.status === 'approved' ? 'Aprobado' : 'Rechazado';
            ws.cell(index + 2, col++).string(statusText);
            
            const dateText = new Date(request.created_at).toLocaleDateString('es-ES');
            ws.cell(index + 2, col++).string(dateText);

            if (index === requests.length - 1) {
                wb.write('data/xlsheet/' + time + '_solicitudes_corporativas.xlsx', function (err) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ success: false, message: 'Error generando Excel' });
                    } else {
                        const url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_solicitudes_corporativas.xlsx";
                        res.json(url);
                        setTimeout(function () {
                            fs.unlink('data/xlsheet/' + time + '_solicitudes_corporativas.xlsx', function () {});
                        }, 10000);
                    }
                });
            }
        });

        if (requests.length === 0) {
            wb.write('data/xlsheet/' + time + '_solicitudes_corporativas.xlsx', function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: 'Error generando Excel' });
                } else {
                    const url = req.protocol + "://" + req.get('host') + "/xlsheet/" + time + "_solicitudes_corporativas.xlsx";
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_solicitudes_corporativas.xlsx', function () {});
                    }, 10000);
                }
            });
        }

    } catch (error) {
        console.error('Error in export_requests_excel:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};