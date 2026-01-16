const mongoose = require('mongoose');

const apiPartnerSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
}, {
  timestamps: true,
});

// Agregamos un índice único para el token para mejorar el rendimiento en búsquedas
apiPartnerSchema.index({ token: 1 }, { unique: true });

const ApiPartner = mongoose.model('api_partners', apiPartnerSchema);

module.exports = ApiPartner;