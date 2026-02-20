import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface AllCategoriesData {
  categories: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    createdAt: TimestampString;
  } & Category_Key)[];
}

export interface Assignment_Key {
  id: UUIDString;
  __typename?: 'Assignment_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface CreateNewRequirementData {
  requirement_insert: Requirement_Key;
}

export interface CreateNewRequirementVariables {
  title: string;
  description: string;
  categoryId: UUIDString;
}

export interface Requirement_Key {
  id: UUIDString;
  __typename?: 'Requirement_Key';
}

export interface UpdateRequirementStatusData {
  requirement_update?: Requirement_Key | null;
}

export interface UpdateRequirementStatusVariables {
  id: UUIDString;
  newStatus: string;
}

export interface Update_Key {
  id: UUIDString;
  __typename?: 'Update_Key';
}

export interface UserRequirementsData {
  requirements: ({
    id: UUIDString;
    title: string;
    description: string;
    status: string;
    priority?: string | null;
    createdAt: TimestampString;
    lastUpdatedAt?: TimestampString | null;
    category?: {
      name: string;
    };
  } & Requirement_Key)[];
}

export interface UserRequirementsVariables {
  citizenId: UUIDString;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'AllCategories' Query. Allow users to execute without passing in DataConnect. */
export function allCategories(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<AllCategoriesData>>;
/** Generated Node Admin SDK operation action function for the 'AllCategories' Query. Allow users to pass in custom DataConnect instances. */
export function allCategories(options?: OperationOptions): Promise<ExecuteOperationResponse<AllCategoriesData>>;

/** Generated Node Admin SDK operation action function for the 'UserRequirements' Query. Allow users to execute without passing in DataConnect. */
export function userRequirements(dc: DataConnect, vars: UserRequirementsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UserRequirementsData>>;
/** Generated Node Admin SDK operation action function for the 'UserRequirements' Query. Allow users to pass in custom DataConnect instances. */
export function userRequirements(vars: UserRequirementsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UserRequirementsData>>;

/** Generated Node Admin SDK operation action function for the 'CreateNewRequirement' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewRequirement(dc: DataConnect, vars: CreateNewRequirementVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewRequirementData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewRequirement' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewRequirement(vars: CreateNewRequirementVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewRequirementData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateRequirementStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateRequirementStatus(dc: DataConnect, vars: UpdateRequirementStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateRequirementStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateRequirementStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateRequirementStatus(vars: UpdateRequirementStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateRequirementStatusData>>;

