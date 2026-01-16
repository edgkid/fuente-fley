const users = require('../../users');

const needFerry = async (req, res) => {
    try {
        
        return users.need_ferry(req, res);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = needFerry;