const mongoose = require('mongoose');
const Types = require('mongoose').model('Type');


async function getTypeModelsByTypeId({typeId}) {
    try {
        const projectsTypes = {
            $project: {
                "type_models._id": 1,
                "type_models.model_name": 1,
                "type_models.model_image_url": 1,
                "type_models.state": 1,
                "type_models.value": 1,
                "type_models.type_service_list": 1
            }
        }
        const results = await Types.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(typeId) } },
            { $unwind: "$type_model_list" },
            {
                $lookup: {
                    from: "type_models",
                    localField: "type_model_list",
                    foreignField: "_id",
                    as: "type_models"
                }
            },
            { $unwind: "$type_models" },
            projectsTypes,
            {
                $group: {
                    _id: "$_id",
                    type_models: { $push: "$type_models" }
                }
            }
        ]);

        return results[0]?.type_models ?? [];
    } catch (error) {
        console.error("Error fetching TypeModels:", error);
        throw error;
    }
}

const getModelsType = async (req, res) => {
    try{
        const types = await getTypeModelsByTypeId({
            typeId: req.body.typeid
        });
        if(!types){
            return res.status(404).json({ message: 'Type not found' });
        };

        return res.status(200).json({ success: true, items: types})
    }catch(error){
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = getModelsType;