/**
 * Keycloak JavaScript Authorization Policy for Attribute-Based Access Control (ABAC)
 * 
 * Rules:
 * 1. User's department MUST match the Resource's department.
 * 2. User's clearance level MUST be greater than or equal to the Resource's classification level.
 * 3. Level 3 (Confidential) resources can only be accessed from the "Office Network" (Environment constraint).
 */

// Helper to convert attribute values from Keycloak attribute entries or Java collections to simple JS strings.
function getSingleValue(attr) {
    if (!attr) return null;

    // Keycloak attribute entries may expose either asString() or asString(index).
    if (typeof attr.asString === 'function') {
        try {
            return attr.asString();
        } catch (e) {
            return attr.asString(0);
        }
    }

    // Resource attributes are commonly java.util.List values.
    if (typeof attr.get === 'function' && typeof attr.isEmpty === 'function') {
        return attr.isEmpty() ? null : attr.get(0);
    }

    // Fallback for JS arrays.
    if (Array.isArray(attr) && attr.length > 0) {
        return attr[0];
    }

    // Final fallback for plain scalar-like objects.
    return attr.toString();
}

function normalizeText(val) {
    if (val === null || val === undefined) return null;
    return val.toString().trim().toLowerCase();
}

function safeToString(value) {
    if (value === null || value === undefined) return "None";
    try {
        return value.toString();
    } catch (e) {
        return "[unprintable]";
    }
}

function listAttributeKeys(attrs) {
    if (!attrs) return "[none]";

    try {
        if (typeof attrs.keySet === 'function') {
            return attrs.keySet().toString();
        }
    } catch (e) {}

    try {
        if (typeof attrs.getAttributes === 'function') {
            return attrs.getAttributes().keySet().toString();
        }
    } catch (e) {}

    try {
        return Object.keys(attrs).join(', ');
    } catch (e) {
        return "[unknown]";
    }
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
var normalizedUserDept = normalizeText(userDept);
var normalizedResourceDept = normalizeText(resourceDept);
var normalizedNetworkType = normalizeText(networkType);

// Debug logging (will show up in Keycloak server console logs)
print("Evaluating ABAC Policy for User: " + identity.getId());
print("User Attribute Keys: " + listAttributeKeys(userAttributes));
print("Context Attribute Keys: " + listAttributeKeys(contextAttributes));
print("User Dept: " + safeToString(userDept) + " (normalized: " + safeToString(normalizedUserDept) + "), Clearance: " + uLevel);
print("Resource Dept: " + safeToString(resourceDept) + " (normalized: " + safeToString(normalizedResourceDept) + "), Classification: " + rLevel);
print("Network Location Parameter: " + safeToString(networkType) + " (normalized: " + safeToString(normalizedNetworkType) + ")");

// 5. Evaluate Rules
var departmentMatches = false;
if (normalizedUserDept && normalizedResourceDept) {
    departmentMatches = (normalizedUserDept === normalizedResourceDept);
}

var clearanceIsSufficient = (uLevel >= rLevel);

var environmentConstraintMet = true;
// Rule: If resource is Level 3 (highly confidential), force office network
if (rLevel >= 3) {
    if (normalizedNetworkType !== "office") {
        environmentConstraintMet = false;
        print("Access denied: Level 3 resource requires Office Network, current network is: " + safeToString(networkType));
    }
}

// 6. Grant or Deny Access
if (departmentMatches && clearanceIsSufficient && environmentConstraintMet) {
    print("ABAC Evaluation: GRANT");
    $evaluation.grant();
} else {
    print("ABAC Evaluation: DENY");
}
