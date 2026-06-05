/**
 * Keycloak JavaScript Authorization Policy for Attribute-Based Access Control (ABAC)
 * 
 * Rules:
 * 1. User's department MUST match the Resource's department.
 * 2. User's clearance level MUST be greater than or equal to the Resource's classification level.
 * 3. Level 3 (Confidential) resources can only be accessed from the "Office Network" (Environment constraint).
 */

// 1. Get the evaluation context and resource info
var context = $evaluation.getContext();
var identity = context.getIdentity();
var permission = $evaluation.getPermission();
var resource = permission.getResource();

// 2. Retrieve User (Subject) Attributes
var userAttributes = identity.getAttributes();
var userDept = userAttributes.getValue('department');
var userClearanceStr = userAttributes.getValue('clearance_level'); // e.g., "1", "2", "3"

// 3. Retrieve Resource Attributes
var resourceAttributes = resource.getAttributes();
var resourceDept = resourceAttributes.getValue('department');
var resourceClassStr = resourceAttributes.getValue('classification_level'); // e.g., "1", "2", "3"

// 4. Retrieve Environment Attributes
var contextAttributes = context.getAttributes();
var clientIp = contextAttributes.getValue('kc.client.network.ip_address'); // Default Keycloak attribute
var networkType = contextAttributes.getValue('network_location');

// Helper to convert attribute value to string and parse as integer
function parseLevel(val, defaultVal) {
    if (!val) return defaultVal;
    var str = val.asString();
    return parseInt(str, 10) || defaultVal;
}

var uLevel = parseLevel(userClearanceStr, 0);
var rLevel = parseLevel(resourceClassStr, 1);

// Debug logging (will show up in Keycloak server console logs)
print("Evaluating ABAC Policy for User: " + identity.getId());
print("User Dept: " + (userDept ? userDept.asString() : "None") + ", Clearance: " + uLevel);
print("Resource Dept: " + (resourceDept ? resourceDept.asString() : "None") + ", Classification: " + rLevel);
print("Network Location Parameter: " + (networkType ? networkType.asString() : "None"));
print("Client IP Address: " + (clientIp ? clientIp.asString() : "None"));

// 5. Evaluate Rules
var departmentMatches = false;
if (userDept && resourceDept) {
    departmentMatches = userDept.asString().equals(resourceDept.asString());
}

var clearanceIsSufficient = (uLevel >= rLevel);

var environmentConstraintMet = true;
// Rule: If resource is Level 3 (highly confidential), force office network or local host access
if (rLevel >= 3) {
    var isSecureNetwork = false;
    
    // Check if network_location was parsed as "office"
    if (networkType && networkType.asString().equals("office")) {
        isSecureNetwork = true;
    }
    // Fallback: Check if client IP is localhost or docker subnet (always true for local compose lab)
    else if (clientIp) {
        var ip = clientIp.asString();
        if (ip.equals("127.0.0.1") || ip.startsWith("172.") || ip.startsWith("192.")) {
            isSecureNetwork = true;
            print("Local IP access fallback: treating " + ip + " as secure Office Network");
        }
    }
    
    if (!isSecureNetwork) {
        environmentConstraintMet = false;
        print("Access denied: Level 3 resource requires Office Network, current network is insecure");
    }
}

// 6. Grant or Deny Access
if (departmentMatches && clearanceIsSufficient && environmentConstraintMet) {
    print("ABAC Evaluation: GRANT");
    $evaluation.grant();
} else {
    print("ABAC Evaluation: DENY");
}
