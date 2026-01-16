const TypeModelsModel = require('mongoose').model('type_model');
const mongoose = require('mongoose');
const { Types } = mongoose

async function getModelsCars(req, res) {
	if (!req.body.modelsTypesIds || !req.body.modelsTypesIds.length) {
			return res.status(400).json({
					status: false,
					message: 'No models types',
			});
	}

	const { modelsTypesIds } = req.body;
	const ids = modelsTypesIds.map((id) => new Types.ObjectId(id));

	try {
			const modelsTypes = await TypeModelsModel
					.find({
							_id: { $in: ids },
					})
					.select({
							_id: 1,
							model_name: 1,
							model_image_url: 1,
							type_service_list: 1,
					})
					.lean();

			return res.status(200).json({
					status: true,
					items: modelsTypes,
			});
	} catch (error) {
			return res.status(400).json({
					status: false,
					message: 'No models types found',
					error_code: error_message.ERROR_CODE_MODEL_NOT_AVAILABLE,
			});
	}
}

module.exports = getModelsCars;