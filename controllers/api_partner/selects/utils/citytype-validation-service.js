const ProviderModel = require('mongoose').model('Provider');
const UserModel = require('mongoose').model('User');
const CorporateModel = require('mongoose').model('Corporate');

const clientTypeSpecs = {
	provider_id: { model: ProviderModel },
	user_id: { model: UserModel },
	corporate_id: { model: CorporateModel },
};

const getUserType = async (params) => {
  const { constants, data, model } = params;
  let userType = constants.ADMIN_UNIQUE_NUMBER;

  if (data.user_type_id && data.corporate_ids.length > 0) {
    const corporateData = await model
      .findOne({
        _id: data.user_type_id,
      })
      .select({ is_own_service_type: 1 })
      .lean();
    
    if (corporateData?.is_own_service_type === 1) {
      userType = constants.CORPORATE_UNIQUE_NUMBER;
    }
  }

  return { userType };
};

async function validateClient({ id, token, clientType }) {
  const model = clientTypeSpecs[clientType].model;

  try {
    const clientData = await model.findOne({ _id: id }).lean();

    if (!clientData) {
      return {
        status: false,
        response: {
          status: 400,
          message: 'Client not found',
        },
      };
    }

    if (token !== clientData.token) {
      return {
        status: false,
        response: {
          status: 400,
          message: 'Invalid token',
        },
      };
    }

    const { userType } = await getUserType({
      constants: constant_json,
      data: clientData,
      model: CorporateModel,
    });

    return { status: true, data: clientData, userType };
  } catch (error) {
    console.error('Error validating client:', error);
    return {
      status: false,
      response: {
        status: 500,
        message: 'Error validating client',
      },
    };
  }
}

module.exports = {
	validateClient,
};