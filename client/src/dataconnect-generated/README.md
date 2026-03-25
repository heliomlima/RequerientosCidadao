# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*AllCategories*](#allcategories)
  - [*UserRequirements*](#userrequirements)
- [**Mutations**](#mutations)
  - [*CreateNewRequirement*](#createnewrequirement)
  - [*UpdateRequirementStatus*](#updaterequirementstatus)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## AllCategories
You can execute the `AllCategories` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
allCategories(): QueryPromise<AllCategoriesData, undefined>;

interface AllCategoriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AllCategoriesData, undefined>;
}
export const allCategoriesRef: AllCategoriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
allCategories(dc: DataConnect): QueryPromise<AllCategoriesData, undefined>;

interface AllCategoriesRef {
  ...
  (dc: DataConnect): QueryRef<AllCategoriesData, undefined>;
}
export const allCategoriesRef: AllCategoriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the allCategoriesRef:
```typescript
const name = allCategoriesRef.operationName;
console.log(name);
```

### Variables
The `AllCategories` query has no variables.
### Return Type
Recall that executing the `AllCategories` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AllCategoriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AllCategoriesData {
  categories: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    createdAt: TimestampString;
  } & Category_Key)[];
}
```
### Using `AllCategories`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, allCategories } from '@dataconnect/generated';


// Call the `allCategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await allCategories();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await allCategories(dataConnect);

console.log(data.categories);

// Or, you can use the `Promise` API.
allCategories().then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

### Using `AllCategories`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, allCategoriesRef } from '@dataconnect/generated';


// Call the `allCategoriesRef()` function to get a reference to the query.
const ref = allCategoriesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = allCategoriesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.categories);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

## UserRequirements
You can execute the `UserRequirements` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
userRequirements(vars: UserRequirementsVariables): QueryPromise<UserRequirementsData, UserRequirementsVariables>;

interface UserRequirementsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UserRequirementsVariables): QueryRef<UserRequirementsData, UserRequirementsVariables>;
}
export const userRequirementsRef: UserRequirementsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
userRequirements(dc: DataConnect, vars: UserRequirementsVariables): QueryPromise<UserRequirementsData, UserRequirementsVariables>;

interface UserRequirementsRef {
  ...
  (dc: DataConnect, vars: UserRequirementsVariables): QueryRef<UserRequirementsData, UserRequirementsVariables>;
}
export const userRequirementsRef: UserRequirementsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the userRequirementsRef:
```typescript
const name = userRequirementsRef.operationName;
console.log(name);
```

### Variables
The `UserRequirements` query requires an argument of type `UserRequirementsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UserRequirementsVariables {
  citizenId: UUIDString;
}
```
### Return Type
Recall that executing the `UserRequirements` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UserRequirementsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `UserRequirements`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, userRequirements, UserRequirementsVariables } from '@dataconnect/generated';

// The `UserRequirements` query requires an argument of type `UserRequirementsVariables`:
const userRequirementsVars: UserRequirementsVariables = {
  citizenId: ..., 
};

// Call the `userRequirements()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await userRequirements(userRequirementsVars);
// Variables can be defined inline as well.
const { data } = await userRequirements({ citizenId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await userRequirements(dataConnect, userRequirementsVars);

console.log(data.requirements);

// Or, you can use the `Promise` API.
userRequirements(userRequirementsVars).then((response) => {
  const data = response.data;
  console.log(data.requirements);
});
```

### Using `UserRequirements`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, userRequirementsRef, UserRequirementsVariables } from '@dataconnect/generated';

// The `UserRequirements` query requires an argument of type `UserRequirementsVariables`:
const userRequirementsVars: UserRequirementsVariables = {
  citizenId: ..., 
};

// Call the `userRequirementsRef()` function to get a reference to the query.
const ref = userRequirementsRef(userRequirementsVars);
// Variables can be defined inline as well.
const ref = userRequirementsRef({ citizenId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = userRequirementsRef(dataConnect, userRequirementsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.requirements);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.requirements);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewRequirement
You can execute the `CreateNewRequirement` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewRequirement(vars: CreateNewRequirementVariables): MutationPromise<CreateNewRequirementData, CreateNewRequirementVariables>;

interface CreateNewRequirementRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewRequirementVariables): MutationRef<CreateNewRequirementData, CreateNewRequirementVariables>;
}
export const createNewRequirementRef: CreateNewRequirementRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewRequirement(dc: DataConnect, vars: CreateNewRequirementVariables): MutationPromise<CreateNewRequirementData, CreateNewRequirementVariables>;

interface CreateNewRequirementRef {
  ...
  (dc: DataConnect, vars: CreateNewRequirementVariables): MutationRef<CreateNewRequirementData, CreateNewRequirementVariables>;
}
export const createNewRequirementRef: CreateNewRequirementRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewRequirementRef:
```typescript
const name = createNewRequirementRef.operationName;
console.log(name);
```

### Variables
The `CreateNewRequirement` mutation requires an argument of type `CreateNewRequirementVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateNewRequirementVariables {
  title: string;
  description: string;
  categoryId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateNewRequirement` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewRequirementData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewRequirementData {
  requirement_insert: Requirement_Key;
}
```
### Using `CreateNewRequirement`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewRequirement, CreateNewRequirementVariables } from '@dataconnect/generated';

// The `CreateNewRequirement` mutation requires an argument of type `CreateNewRequirementVariables`:
const createNewRequirementVars: CreateNewRequirementVariables = {
  title: ..., 
  description: ..., 
  categoryId: ..., 
};

// Call the `createNewRequirement()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewRequirement(createNewRequirementVars);
// Variables can be defined inline as well.
const { data } = await createNewRequirement({ title: ..., description: ..., categoryId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewRequirement(dataConnect, createNewRequirementVars);

console.log(data.requirement_insert);

// Or, you can use the `Promise` API.
createNewRequirement(createNewRequirementVars).then((response) => {
  const data = response.data;
  console.log(data.requirement_insert);
});
```

### Using `CreateNewRequirement`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewRequirementRef, CreateNewRequirementVariables } from '@dataconnect/generated';

// The `CreateNewRequirement` mutation requires an argument of type `CreateNewRequirementVariables`:
const createNewRequirementVars: CreateNewRequirementVariables = {
  title: ..., 
  description: ..., 
  categoryId: ..., 
};

// Call the `createNewRequirementRef()` function to get a reference to the mutation.
const ref = createNewRequirementRef(createNewRequirementVars);
// Variables can be defined inline as well.
const ref = createNewRequirementRef({ title: ..., description: ..., categoryId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewRequirementRef(dataConnect, createNewRequirementVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.requirement_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.requirement_insert);
});
```

## UpdateRequirementStatus
You can execute the `UpdateRequirementStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateRequirementStatus(vars: UpdateRequirementStatusVariables): MutationPromise<UpdateRequirementStatusData, UpdateRequirementStatusVariables>;

interface UpdateRequirementStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRequirementStatusVariables): MutationRef<UpdateRequirementStatusData, UpdateRequirementStatusVariables>;
}
export const updateRequirementStatusRef: UpdateRequirementStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateRequirementStatus(dc: DataConnect, vars: UpdateRequirementStatusVariables): MutationPromise<UpdateRequirementStatusData, UpdateRequirementStatusVariables>;

interface UpdateRequirementStatusRef {
  ...
  (dc: DataConnect, vars: UpdateRequirementStatusVariables): MutationRef<UpdateRequirementStatusData, UpdateRequirementStatusVariables>;
}
export const updateRequirementStatusRef: UpdateRequirementStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateRequirementStatusRef:
```typescript
const name = updateRequirementStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateRequirementStatus` mutation requires an argument of type `UpdateRequirementStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateRequirementStatusVariables {
  id: UUIDString;
  newStatus: string;
}
```
### Return Type
Recall that executing the `UpdateRequirementStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateRequirementStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateRequirementStatusData {
  requirement_update?: Requirement_Key | null;
}
```
### Using `UpdateRequirementStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateRequirementStatus, UpdateRequirementStatusVariables } from '@dataconnect/generated';

// The `UpdateRequirementStatus` mutation requires an argument of type `UpdateRequirementStatusVariables`:
const updateRequirementStatusVars: UpdateRequirementStatusVariables = {
  id: ..., 
  newStatus: ..., 
};

// Call the `updateRequirementStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateRequirementStatus(updateRequirementStatusVars);
// Variables can be defined inline as well.
const { data } = await updateRequirementStatus({ id: ..., newStatus: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateRequirementStatus(dataConnect, updateRequirementStatusVars);

console.log(data.requirement_update);

// Or, you can use the `Promise` API.
updateRequirementStatus(updateRequirementStatusVars).then((response) => {
  const data = response.data;
  console.log(data.requirement_update);
});
```

### Using `UpdateRequirementStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateRequirementStatusRef, UpdateRequirementStatusVariables } from '@dataconnect/generated';

// The `UpdateRequirementStatus` mutation requires an argument of type `UpdateRequirementStatusVariables`:
const updateRequirementStatusVars: UpdateRequirementStatusVariables = {
  id: ..., 
  newStatus: ..., 
};

// Call the `updateRequirementStatusRef()` function to get a reference to the mutation.
const ref = updateRequirementStatusRef(updateRequirementStatusVars);
// Variables can be defined inline as well.
const ref = updateRequirementStatusRef({ id: ..., newStatus: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateRequirementStatusRef(dataConnect, updateRequirementStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.requirement_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.requirement_update);
});
```

