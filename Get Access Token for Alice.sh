# Get Access Token for Alice
curl -d "client_id=document-service-api" \
     -d "username=alice" \
     -d "password=password" \
     -d "grant_type=password" \
     -d "client_secret=R0kP80MDX6ZrE1gvUoedoW43w7SqHfwn" \
     -X POST http://localhost:8080/realms/abac-realm/protocol/openid-connect/token