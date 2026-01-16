const users = require('../../users');

const getFareEstimate = async (req, res) => {
    try {
        
        return users.getfareestimate(req, res);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = getFareEstimate;