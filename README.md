# Attribute-Based Access Control (ABAC) in Keycloak

Welcome to the comprehensive, interactive guidebook on Attribute-Based Access Control (ABAC) using Keycloak. This repository serves as a knowledge-sharing resource for the team, demonstrating how to move beyond traditional Role-Based Access Control (RBAC) to build dynamic, fine-grained, context-aware authorization policies.

## 🚀 Repository Structure

*   **`frontend/`**: Contains the interactive HTML/JS guidebook and a live ABAC simulator. Open `frontend/index.html` in your browser to start learning.
*   **`lab-code/`**: Contains the Docker setup (`docker-compose.yml`) to run Keycloak with Postgres locally, alongside sample JavaScript-based policies for ABAC.
*   **`scripts/`**: Bash scripts demonstrating how to interact with Keycloak APIs to fetch tokens and request access based on attributes (e.g., Requesting Party Token - RPT).

## 💡 Top 5 Important Topics Covered

When reviewing this repository, focus on these five core areas to master ABAC in Keycloak:

1.  **Introduction to ABAC (vs RBAC)**: Understand the limitations of RBAC (like "Role Explosion") and learn the standard XACML reference architecture, including PEP (Policy Enforcement Point) and PDP (Policy Decision Point).
2.  **Keycloak Authorization Services (AuthZ)**: Learn how Keycloak acts as your centralized Policy Administration Point (PAP) and Policy Decision Point (PDP) to evaluate user, resource, and environmental attributes.
3.  **Implementing Fine-Grained ABAC Policies**: Discover how to write complex access rules (e.g., using JavaScript policies) based on context, such as allowing access only to specific departments during office hours.
4.  **Live ABAC Simulator**: An interactive UI (in the `frontend/` directory) that allows you to visually tweak attributes and immediately see how policies are evaluated—perfect for understanding the logic before writing code.
5.  **Hands-on Lab & Token Exchange (RPT)**: Spin up the provided Docker Compose environment and use the included bash scripts to simulate real-world API requests, exchanging standard tokens for a Requesting Party Token (RPT) with finalized permissions.

## 🛠️ Getting Started

1.  **Read the Guide**: Open `frontend/index.html` in any web browser.
2.  **Run the Lab**: 
    ```bash
    cd lab-code
    docker-compose up -d
    ```
3.  **Test the APIs**: Use the scripts located in the `scripts/` folder to authenticate and request access dynamically.

---
*Created for team knowledge sharing and deep diving into Keycloak Identity and Access Management.*
