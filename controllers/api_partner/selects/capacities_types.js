const TypeCapacity  = require('mongoose').model('type_capacity');



async function getTypeCapacitiesByTypeId({typeId}) {
    try {
        const projectsTypes = {
            $project: {
                "type_capacities._id": 1,
                "type_capacities.capacity_name": 1,
                "type_capacities.state": 1,
                "type_capacities.unit": 1,
                "type_capacities.value": 1
            }
        }
        const results = await Types.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(typeId) } },
            { $unwind: "$type_capacity_list" },
            {
                $lookup: {
                    from: "type_capacities",
                    localField: "type_capacity_list",
                    foreignField: "_id",
                    as: "type_capacities"
                }
            },
            { $unwind: "$type_capacities" },
            projectsTypes,
            {
                $group: {
                    _id: "$_id",
                    type_capacities: { $push: "$type_capacities" }
                }
            }
        ]);

        if (results.length === 0) {
            throw new Error('No Type found with the given id');
        }

        return results[0].type_capacities;
    } catch (error) {
        console.error("Error fetching TypeModels:", error);
        throw error;
    }
}


const getCapacitiesTypes = async (req, res) => {
    try {
        const {typeCapacityList} = req.body;

        const capacitiesTypes = await TypeCapacity.find({
            _id: { $in: typeCapacityList }
        })
        .select({ _id: 1, capacity_name: 1, state: 1, unit: 1, value: 1 })
        .lean();

        return res.status(200).json({ success: true, items: capacitiesTypes });
    }catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = getCapacitiesTypes;