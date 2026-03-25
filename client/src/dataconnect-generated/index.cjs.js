const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'prjpleitodapopulacao',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const allCategoriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AllCategories');
}
allCategoriesRef.operationName = 'AllCategories';
exports.allCategoriesRef = allCategoriesRef;

exports.allCategories = function allCategories(dc) {
  return executeQuery(allCategoriesRef(dc));
};

const userRequirementsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'UserRequirements', inputVars);
}
userRequirementsRef.operationName = 'UserRequirements';
exports.userRequirementsRef = userRequirementsRef;

exports.userRequirements = function userRequirements(dcOrVars, vars) {
  return executeQuery(userRequirementsRef(dcOrVars, vars));
};

const createNewRequirementRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewRequirement', inputVars);
}
createNewRequirementRef.operationName = 'CreateNewRequirement';
exports.createNewRequirementRef = createNewRequirementRef;

exports.createNewRequirement = function createNewRequirement(dcOrVars, vars) {
  return executeMutation(createNewRequirementRef(dcOrVars, vars));
};

const updateRequirementStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateRequirementStatus', inputVars);
}
updateRequirementStatusRef.operationName = 'UpdateRequirementStatus';
exports.updateRequirementStatusRef = updateRequirementStatusRef;

exports.updateRequirementStatus = function updateRequirementStatus(dcOrVars, vars) {
  return executeMutation(updateRequirementStatusRef(dcOrVars, vars));
};
