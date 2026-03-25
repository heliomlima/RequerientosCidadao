import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'prjpleitodapopulacao',
  location: 'us-east4'
};

export const allCategoriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AllCategories');
}
allCategoriesRef.operationName = 'AllCategories';

export function allCategories(dc) {
  return executeQuery(allCategoriesRef(dc));
}

export const userRequirementsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'UserRequirements', inputVars);
}
userRequirementsRef.operationName = 'UserRequirements';

export function userRequirements(dcOrVars, vars) {
  return executeQuery(userRequirementsRef(dcOrVars, vars));
}

export const createNewRequirementRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewRequirement', inputVars);
}
createNewRequirementRef.operationName = 'CreateNewRequirement';

export function createNewRequirement(dcOrVars, vars) {
  return executeMutation(createNewRequirementRef(dcOrVars, vars));
}

export const updateRequirementStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateRequirementStatus', inputVars);
}
updateRequirementStatusRef.operationName = 'UpdateRequirementStatus';

export function updateRequirementStatus(dcOrVars, vars) {
  return executeMutation(updateRequirementStatusRef(dcOrVars, vars));
}

