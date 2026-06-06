USERNAME="bob"
PASSWORD="password"

# Get Access Token
curl -d "client_id=document-service-api" \
     -d "username=${USERNAME}" \
     -d "password=${PASSWORD}" \
     -d "grant_type=password" \
     -d "client_secret=<CLIENT_SECRET>" \
     -X POST http://localhost:8080/realms/abac-realm/protocol/openid-connect/token