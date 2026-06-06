/**
 * Keycloak JavaScript Authorization Policy for Attribute-Based Access Control (ABAC)
 * 
 * Rules:
 * 1. User's department MUST match the Resource's department.
 * 2. User's clearance level MUST be greater than or equal to the Resource's classification level.
 * 3. Level 3 (Confidential) resources can only be accessed from the "Office Network" (Environment constraint).
 */

// Helper to convert attribute values from either Keycloak Entry objects or Java Lists/Maps to simple JS strings
function getSingleValue(attr) {
    if (!attr) return null;
    // Check if it's an Entry object from identity/context attributes (has .asString)
    if (typeof attr.asString === 'function') {
        return attr.asString();
    }
    // Check if it's a Java List (from resource.getAttributes().get(...))
    if (typeof attr.get === 'function' && typeof attr.isEmpty === 'function') {
        return attr.isEmpty() ? null : attr.get(0);
    }
    // Check if it's a JS array
    if (Array.isArray(attr) && attr.length > 0) {
        return attr[0];
    }
    // Otherwise convert to string directly
    return attr.toString();
}

// 1. Get the evaluation context and resource info
var context = $evaluation.getContext();
var identity = context.getIdentity();
var permission = $evaluation.getPermission();
var resource = permission.getResource();

// 2. Retrieve User (Subject) Attributes
var userAttributes = identity.getAttributes();
var userDept = getSingleValue(userAttributes.getValue('department'));
var userClearanceStr = getSingleValue(userAttributes.getValue('clearance_level')); // e.g., "1", "2", "3"

// 3. Retrieve Resource Attributes (resource.getAttributes() returns a Map<String, List<String>>)
var resourceAttributes = resource.getAttributes();
var resourceDept = getSingleValue(resourceAttributes.get('department'));
var resourceClassStr = getSingleValue(resourceAttributes.get('classification_level')); // e.g., "1", "2", "3"

// 4. Retrieve Environment Attributes
var contextAttributes = context.getAttributes();
var networkType = getSingleValue(contextAttributes.getValue('network_location'));

// Helper to parse string level as integer
function parseLevel(valStr, defaultVal) {
    if (!valStr) return defaultVal;
    return parseInt(valStr, 10) || defaultVal;
}

var uLevel = parseLevel(userClearanceStr, 0);
var rLevel = parseLevel(resourceClassStr, 1);

// Debug logging (will show up in Keycloak server console logs)
print("Evaluating ABAC Policy for User: " + identity.getId());
print("User Dept: " + (userDept ? userDept : "None") + ", Clearance: " + uLevel);
print("Resource Dept: " + (resourceDept ? resourceDept : "None") + ", Classification: " + rLevel);
print("Network Location Parameter: " + (networkType ? networkType : "None"));

// 5. Evaluate Rules
var departmentMatches = false;
if (userDept && resourceDept) {
    departmentMatches = (userDept === resourceDept);
}

var clearanceIsSufficient = (uLevel >= rLevel);

var environmentConstraintMet = true;
// Rule: If resource is Level 3 (highly confidential), force office network
if (rLevel >= 3) {
    if (networkType !== "office") {
        environmentConstraintMet = false;
        print("Access denied: Level 3 resource requires Office Network, current network is: " + (networkType ? networkType : "None"));
    }
}

// 6. Grant or Deny Access
if (departmentMatches && clearanceIsSufficient && environmentConstraintMet) {
    print("ABAC Evaluation: GRANT");
    $evaluation.grant();
} else {
    print("ABAC Evaluation: DENY");
}
