const ServicesTypes = require('mongoose').model('type_services');

const getServicesTypes = async (req, res) => {
    try {
        const types = await ServicesTypes.find(
            {
                _id: {$in: req.body.servicesTypes}
            },
            '_id service_name state courier_type'
        );
        
        return res.status(200).json({ success: true, items: types });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = getServicesTypes;