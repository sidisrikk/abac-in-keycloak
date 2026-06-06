# Alternative Approaches to Embedding Permissions in Keycloak Tokens

> [!NOTE]
> This analysis is based on your current ABAC tutorial setup where the token contains raw user attributes (`department`, `clearance_level`) and Keycloak's PDP evaluates policies at request time.

---

## Your Current Token (Reference)

```json
{
  "exp": 1780731595,
  "iat": 1780731295,
  "iss": "http://localhost:8080/realms/abac-realm",
  "aud": "account",
  "sub": "fb487434-affa-4244-961b-50f742faedca",
  "typ": "Bearer",
  "azp": "document-service-api",
  "scope": "profile email",
  "email_verified": true,
  "clearance_level": "1",
  "name": "Bob Jones",
  "preferred_username": "bob",
  "department": "eng",
  "email": "bob@example.com",
  "realm_access": {
    "roles": ["default-roles-abac-realm", "offline_access", "uma_authorization"]
  },
  "resource_access": {
    "account": {
      "roles": ["manage-account", "manage-account-links", "view-profile"]
    }
  }
}
```

---

## 1. 🏷️ Raw User Attributes (ABAC Claims) — Your Current Approach

```json
"clearance_level": "1",
"department": "eng"
```

**How it works:** User attributes are mapped into the access token via protocol mappers. The resource server (or Keycloak PDP) evaluates policies at request time.

| Pros                                               | Cons                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| Flexible — policy changes don't require new tokens | Token doesn't tell you _what_ the user can do, only _who they are_   |
| Centralized policy management                      | Resource server must know the policy rules to enforce them           |
| Small, stable token size                           | Requires a PDP call or local policy engine for every access decision |

> [!TIP]
> **Verdict: ✅ Great for complex, dynamic policies. This is the "proper ABAC" approach.**

---

## 2. 👤 Roles in Token (RBAC Claims)

```json
"realm_access": { "roles": ["manager", "hr-viewer"] },
"resource_access": { "document-service-api": { "roles": ["doc-editor"] } }
```

**How it works:** You already have this partially — `realm_access` and `resource_access` carry Keycloak roles. You can assign fine-grained client roles like `hr-doc-reader`, `eng-doc-writer`, etc.

| Pros                                                  | Cons                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| Simple to check — `token.roles.includes("hr-viewer")` | **Role explosion** — `us-hr-manager-l3`, `eu-eng-viewer-l2`... |
| No external PDP call needed                           | Static — changing a policy means reassigning roles to users    |
| Well-understood pattern                               | Can't encode contextual rules (time, network, etc.)            |

> [!WARNING]
> **Verdict: ⚠️ Good for simple cases, but doesn't scale. This is exactly why ABAC exists.**

---

## 3. 🎫 Permissions / Entitlements in Token (RPT — Requesting Party Token)

This is **built into Keycloak** and is the approach the tutorial's Step 9 uses, but you can go further:

```json
"authorization": {
  "permissions": [
    {
      "rsid": "a1b2c3d4",
      "rsname": "Secret HR Report",
      "scopes": ["read"]
    }
  ]
}
```

**How it works:** Instead of using `response_mode=decision` (which returns `true/false`), you request a full **RPT** (Requesting Party Token). Keycloak evaluates ALL policies and embeds the granted permissions directly into a new token.

```bash
# Request an RPT instead of a decision
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
     -d "grant_type=urn:ietf:params:oauth:grant-type:uma-ticket" \
     -d "audience=document-service-api" \
     # no response_mode=decision → returns full RPT
     -X POST http://localhost:8080/realms/abac-realm/protocol/openid-connect/token
```

| Pros                                                                    | Cons                                         |
| ----------------------------------------------------------------------- | -------------------------------------------- |
| Token explicitly says "you CAN access Secret HR Report with scope read" | Token bloat — grows with number of resources |
| Resource server just checks the RPT, no policy evaluation needed        | Must re-request RPT when permissions change  |
| Combines ABAC policy evaluation + explicit grants                       | Added round-trip to Keycloak to get the RPT  |
| UMA 2.0 standard-compliant                                              | More complex token lifecycle management      |

> [!TIP]
> **Verdict: ✅ Arguably the best hybrid — ABAC policies decide, but the result is a portable permission list. Your setup already supports this!**

---

## 4. 🔒 OAuth2 Scopes as Permissions

```json
"scope": "profile email documents:read documents:write reports:read"
```

**How it works:** Use OAuth2 scopes to represent fine-grained permissions. The client requests specific scopes, and Keycloak's consent/policy engine decides which to grant.

| Pros                                               | Cons                                                  |
| -------------------------------------------------- | ----------------------------------------------------- |
| Standard OAuth2 — works with any resource server   | Scopes are coarse, not resource-specific              |
| Easy to check — `scope.includes("documents:read")` | Can't distinguish "read HR docs" from "read Eng docs" |
| No custom claims needed                            | Scope explosion similar to role explosion             |

> [!WARNING]
> **Verdict: ⚠️ Better suited for API-level access control, not resource-level ABAC.**

---

## 5. 🧩 Custom Permission Claims via Script Mapper

```json
"permissions": {
  "documents": ["read", "write"],
  "reports": ["read"],
  "admin-panel": []
}
```

**How it works:** Use a Keycloak **Script Mapper** (or a custom SPI) that runs at token-generation time. The script evaluates the user's attributes, roles, and external data to compute a permission map and injects it as a custom claim.

| Pros                                             | Cons                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| Token is self-contained — no PDP call at runtime | Permissions are frozen at token-issue time                             |
| Resource server has zero policy knowledge needed | Script runs on every token issuance → performance cost                 |
| Fully customizable output format                 | Can't encode dynamic context (time/network) — those change per-request |
| Compact compared to RPT                          | Must refresh token to get updated permissions                          |

> [!WARNING]
> **Verdict: ⚠️ Pragmatic for semi-static permissions, but loses ABAC's dynamic nature.**

---

## 6. 🌐 External Authorization (No Permissions in Token at All)

```
Token: just identity (sub, name, email)
↓
Request hits your API
↓
API calls external PDP (OPA, Cedar, Keycloak, etc.) with {user, resource, action, context}
↓
PDP returns allow/deny
```

**How it works:** The token carries only identity. Every access decision is delegated to an external Policy Decision Point at request time. Tools include **Open Policy Agent (OPA)**, **AWS Cedar**, **Google Zanzibar (SpiceDB)**, or Keycloak's own token endpoint.

| Pros                                            | Cons                                                  |
| ----------------------------------------------- | ----------------------------------------------------- |
| Token stays small and simple                    | Every request requires a PDP round-trip (latency)     |
| Permissions are always real-time, never stale   | PDP becomes a critical dependency (availability risk) |
| Full context available (time, IP, device, etc.) | More infrastructure to manage                         |
| Clean separation of concerns                    | Harder to debug — decision logic is externalized      |

> [!TIP]
> **Verdict: ✅ Best for high-security, dynamic environments. This is what the current Keycloak UMA flow already does when using `response_mode=decision`.**

---

## Summary Comparison

| Approach                             | Token Size | Real-time?       | Complexity | Best For                           |
| ------------------------------------ | ---------- | ---------------- | ---------- | ---------------------------------- |
| **ABAC attributes (current)**        | Small      | Policy-dependent | Medium     | Dynamic, attribute-driven rules    |
| **Roles (RBAC)**                     | Small      | No               | Low        | Simple permission models           |
| **RPT (Permissions in token)**       | Large      | At issuance      | Medium     | Portable, pre-evaluated grants     |
| **OAuth2 Scopes**                    | Small      | No               | Low        | API-level gates                    |
| **Custom Permission Claims**         | Medium     | No               | Medium     | Semi-static computed permissions   |
| **External PDP (no perms in token)** | Minimal    | Yes              | High       | High-security, real-time decisions |

---

## Recommendation

> [!IMPORTANT]
> Your current setup is **very well designed**. It uses a hybrid of:
>
> 1. **Attributes in the token** (`department`, `clearance_level`) — so the PDP has user context
> 2. **Keycloak PDP evaluation** (`response_mode=decision`) — so policies are centralized and dynamic
> 3. **Runtime claims** (`claim_token` with `network_location`) — so environment context flows in
>
> The most natural evolution would be to **switch from `response_mode=decision` to full RPT tokens** (Approach #3). That way your resource server gets a self-contained token with explicit permissions, eliminating the per-request PDP call while still benefiting from ABAC policy evaluation.
