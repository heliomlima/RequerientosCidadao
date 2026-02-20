import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface AllCategoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AllCategoriesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AllCategoriesData, undefined>;
  operationName: string;
}
export const allCategoriesRef: AllCategoriesRef;

export function allCategories(): QueryPromise<AllCategoriesData, undefined>;
export function allCategories(dc: DataConnect): QueryPromise<AllCategoriesData, undefined>;

interface UserRequirementsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UserRequirementsVariables): QueryRef<UserRequirementsData, UserRequirementsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UserRequirementsVariables): QueryRef<UserRequirementsData, UserRequirementsVariables>;
  operationName: string;
}
export const userRequirementsRef: UserRequirementsRef;

export function userRequirements(vars: UserRequirementsVariables): QueryPromise<UserRequirementsData, UserRequirementsVariables>;
export function userRequirements(dc: DataConnect, vars: UserRequirementsVariables): QueryPromise<UserRequirementsData, UserRequirementsVariables>;

interface CreateNewRequirementRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewRequirementVariables): MutationRef<CreateNewRequirementData, CreateNewRequirementVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewRequirementVariables): MutationRef<CreateNewRequirementData, CreateNewRequirementVariables>;
  operationName: string;
}
export const createNewRequirementRef: CreateNewRequirementRef;

export function createNewRequirement(vars: CreateNewRequirementVariables): MutationPromise<CreateNewRequirementData, CreateNewRequirementVariables>;
export function createNewRequirement(dc: DataConnect, vars: CreateNewRequirementVariables): MutationPromise<CreateNewRequirementData, CreateNewRequirementVariables>;

interface UpdateRequirementStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRequirementStatusVariables): MutationRef<UpdateRequirementStatusData, UpdateRequirementStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateRequirementStatusVariables): MutationRef<UpdateRequirementStatusData, UpdateRequirementStatusVariables>;
  operationName: string;
}
export const updateRequirementStatusRef: UpdateRequirementStatusRef;

export function updateRequirementStatus(vars: UpdateRequirementStatusVariables): MutationPromise<UpdateRequirementStatusData, UpdateRequirementStatusVariables>;
export function updateRequirementStatus(dc: DataConnect, vars: UpdateRequirementStatusVariables): MutationPromise<UpdateRequirementStatusData, UpdateRequirementStatusVariables>;

