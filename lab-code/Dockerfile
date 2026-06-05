# Multi-stage build to bundle the JS policy provider
FROM alpine:latest AS builder
RUN apk add --no-cache zip
WORKDIR /build
COPY abac-policy.js .
COPY META-INF ./META-INF
RUN zip -r abac-policy-provider.jar abac-policy.js META-INF

# Main Keycloak image
FROM quay.io/keycloak/keycloak:26.6.2
COPY --from=builder /build/abac-policy-provider.jar /opt/keycloak/providers/

# Enable scripts feature and trigger auto-build
ENV KC_FEATURES=scripts
RUN /opt/keycloak/bin/kc.sh build
