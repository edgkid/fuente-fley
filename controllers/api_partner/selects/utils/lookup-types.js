const mongoose = require('mongoose');
const { Types } = mongoose

function getLookUpTypesByTypeId({ typeId }) {
	const lookup = {
		$lookup: {
			from: 'types', // Nombre de la colección de 'types'
			let: { typeid: { $toObjectId: '$typeid' } },
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{
									$eq: [
										'$_id',
										new Types.ObjectId(typeId),
									],
								},
								{ $eq: ['$_id', '$$typeid'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 1,
						typename: 1,
						type_model_list: 1,
						type_capacity_list: 1,
						type_service_list: 1,
						courier_type: 1,
					},
				},
			],
			as: 'typeInfo',
		},
	};

	return lookup;
}

module.exports = {
	getLookUpTypesByTypeId,
};