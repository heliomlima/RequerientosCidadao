# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { allCategories, userRequirements, createNewRequirement, updateRequirementStatus } from '@dataconnect/generated';


// Operation AllCategories: 
const { data } = await AllCategories(dataConnect);

// Operation UserRequirements:  For variables, look at type UserRequirementsVars in ../index.d.ts
const { data } = await UserRequirements(dataConnect, userRequirementsVars);

// Operation CreateNewRequirement:  For variables, look at type CreateNewRequirementVars in ../index.d.ts
const { data } = await CreateNewRequirement(dataConnect, createNewRequirementVars);

// Operation UpdateRequirementStatus:  For variables, look at type UpdateRequirementStatusVars in ../index.d.ts
const { data } = await UpdateRequirementStatus(dataConnect, updateRequirementStatusVars);


```