const TypeServices = require('mongoose').model('type_services');

const getServicesTypes = async (req, res) => {
	try {
    const { typeServiceList } = req.body;
    const services = await TypeServices.find(
      { _id: { $in: typeServiceList } },
    ).select(
      {
        _id: 1,
        service_name: 1,
        state: 1,
        courier_type: 1
      }
    ).lean();

  	return res.status(200).json({
			status: true,
			items: services,
    });
  } catch (error) {
    console.error('Error in getServiceTypes', error);
    return res.status(400).json({
      status: false,
      message: 'Error in get service types',
    });
  }
}

module.exports = getServicesTypes;