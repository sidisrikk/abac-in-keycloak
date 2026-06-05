# Get Access Token for Alice
curl -d "client_id=document-service-api" \
     -d "username=alice" \
     -d "password=password" \
     -d "grant_type=password" \
     -d "client_secret=Gaj5t2EVy2jZQ12OTxX0kAeTWeeqzIKN" \
     -X POST http://localhost:8080/realms/abac-realm/protocol/openid-connect/token