const User = require('mongoose').model('User');


const getInfo = async (req, res) => {
    try{
        const { phone } = req.params;
        if (!phone) return res.status(400).json({ message: 'PHONE_NEEDED' });

        const user = await User.findOne({ phone }).select('-device_token -created_at -updated_at -device_type -__v');

        return res.status(200).json({ status: true, data: user });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', status: false });
    }
}

module.exports = getInfo;