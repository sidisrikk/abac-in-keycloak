ACCESS_TOKEN="access_token"

CLAIM_TOKEN=$(printf '%s' '{"network_location":["office"]}' | base64 -w0)
curl -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -d "grant_type=urn:ietf:params:oauth:grant-type:uma-ticket" \
     -d "audience=document-service-api" \
     -d "response_mode=decision" \
     -d "permission=Secret HR Report" \
     -d "claim_token=${CLAIM_TOKEN}" \
     -d "claim_token_format=urn:ietf:params:oauth:token-type:jwt" \
     -X POST http://localhost:8080/realms/abac-realm/protocol/openid-connect/token
