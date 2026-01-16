const trip = require('../../trip');

const create = async (req, res) => {
    try {
        console.log("🚀 ~ create ~ req:", req.body.user_id)

        return trip.create(req, res);
        // return res.status(200).json({ message: 'Trip created' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = create;