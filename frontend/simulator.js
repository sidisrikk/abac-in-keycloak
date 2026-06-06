/**
 * Keycloak ABAC Interactive Simulator - Core Logic
 */

window.initAbacSimulator = (() => {
    let initialized = false;

    return function initAbacSimulator() {
        if (initialized || !document.getElementById('simulator-root')) {
            return;
        }

        if (!document.getElementById('sub-role')) {
            return;
        }

        initialized = true;

    // Simulator State
    const state = {
        subject: {
            role: 'employee',
            department: 'hr',
            clearance: 2
        },
        resource: {
            type: 'document',
            department: 'hr',
            classification: 2
        },
        environment: {
            network: 'office',
            time: 'working'
        },
        rules: {
            deptMatch: true,
            clearanceCheck: true,
            networkL3Constraint: true,
            timeConstraint: true
        }
    };

    // Initialize Simulator
    init();

    function init() {
        setupEventListeners();
        evaluateAccess();
    }

    function setupEventListeners() {
        // Subject Inputs
        document.getElementById('sub-role').addEventListener('change', (e) => {
            state.subject.role = e.target.value;
            evaluateAccess();
        });
        document.getElementById('sub-dept').addEventListener('change', (e) => {
            state.subject.department = e.target.value;
            evaluateAccess();
        });
        document.getElementById('sub-clearance').addEventListener('change', (e) => {
            state.subject.clearance = parseInt(e.target.value, 10);
            evaluateAccess();
        });

        // Resource Inputs
        document.getElementById('res-type').addEventListener('change', (e) => {
            state.resource.type = e.target.value;
            evaluateAccess();
        });
        document.getElementById('res-dept').addEventListener('change', (e) => {
            state.resource.department = e.target.value;
            evaluateAccess();
        });
        document.getElementById('res-classification').addEventListener('change', (e) => {
            state.resource.classification = parseInt(e.target.value, 10);
            evaluateAccess();
        });

        // Environment Inputs
        document.getElementById('env-network').addEventListener('change', (e) => {
            state.environment.network = e.target.value;
            evaluateAccess();
        });
        document.getElementById('env-time').addEventListener('change', (e) => {
            state.environment.time = e.target.value;
            evaluateAccess();
        });

        // Policy rule switches
        document.getElementById('rule-dept').addEventListener('change', (e) => {
            state.rules.deptMatch = e.target.checked;
            evaluateAccess();
        });
        document.getElementById('rule-clearance').addEventListener('change', (e) => {
            state.rules.clearanceCheck = e.target.checked;
            evaluateAccess();
        });
        document.getElementById('rule-network').addEventListener('change', (e) => {
            state.rules.networkL3Constraint = e.target.checked;
            evaluateAccess();
        });
        document.getElementById('rule-time').addEventListener('change', (e) => {
            state.rules.timeConstraint = e.target.checked;
            evaluateAccess();
        });

        // Manual trigger button
        document.getElementById('btn-evaluate').addEventListener('click', () => {
            evaluateAccess();
        });
    }

    function evaluateAccess() {
        const logs = [];
        const ruleResults = {
            deptMatch: { status: 'disabled', message: 'Rule disabled' },
            clearanceCheck: { status: 'disabled', message: 'Rule disabled' },
            networkL3Constraint: { status: 'disabled', message: 'Rule disabled' },
            timeConstraint: { status: 'disabled', message: 'Rule disabled' }
        };

        logs.push(`[PEP] Intercepted access request: Subject(Role=${state.subject.role.toUpperCase()}, Dept=${state.subject.department.toUpperCase()}) -> Resource(Type=${state.resource.type.toUpperCase()}, Classification=L${state.resource.classification})`);
        logs.push(`[PEP] Forwarding context parameters to PDP (Keycloak Authorization Service)...`);
        logs.push(`[PDP] Policy evaluation initiated.`);

        // Rule 1: Department Match
        if (state.rules.deptMatch) {
            const match = state.subject.department === state.resource.department;
            ruleResults.deptMatch = {
                status: match ? 'passed' : 'failed',
                message: match 
                    ? `Departments match (${state.subject.department.toUpperCase()})` 
                    : `Department mismatch! User: ${state.subject.department.toUpperCase()}, Resource: ${state.resource.department.toUpperCase()}`
            };
            logs.push(`[PDP] [Rule: Dept Match] ${ruleResults.deptMatch.message}`);
        }

        // Rule 2: Clearance Check
        if (state.rules.clearanceCheck) {
            const passed = state.subject.clearance >= state.resource.classification;
            ruleResults.clearanceCheck = {
                status: passed ? 'passed' : 'failed',
                message: passed
                    ? `User clearance (L${state.subject.clearance}) >= Resource classification (L${state.resource.classification})`
                    : `Insufficient clearance! User: L${state.subject.clearance}, Resource: L${state.resource.classification}`
            };
            logs.push(`[PDP] [Rule: Clearance] ${ruleResults.clearanceCheck.message}`);
        }

        // Rule 3: Network L3 Constraint
        if (state.rules.networkL3Constraint) {
            if (state.resource.classification >= 3) {
                const isOffice = state.environment.network === 'office';
                ruleResults.networkL3Constraint = {
                    status: isOffice ? 'passed' : 'failed',
                    message: isOffice
                        ? `L3 Resource accessed from allowed network (Office)`
                        : `Access Denied: L3 Confidential resource requires Office Network (Current: ${state.environment.network.toUpperCase()})`
                };
            } else {
                ruleResults.networkL3Constraint = {
                    status: 'passed',
                    message: `Resource is L${state.resource.classification} (Network constraint only applies to L3)`
                };
            }
            logs.push(`[PDP] [Rule: Network Constraint] ${ruleResults.networkL3Constraint.message}`);
        }

        // Rule 4: Time of Day Constraint
        if (state.rules.timeConstraint) {
            if (state.environment.time === 'offhours') {
                const isManager = state.subject.role === 'manager';
                ruleResults.timeConstraint = {
                    status: isManager ? 'passed' : 'failed',
                    message: isManager
                        ? `Off-hours access allowed for role MANAGER`
                        : `Access Denied: Role EMPLOYEE cannot access during off-hours`
                };
            } else {
                ruleResults.timeConstraint = {
                    status: 'passed',
                    message: `Access during standard working hours is allowed for all roles`
                };
            }
            logs.push(`[PDP] [Rule: Time Constraint] ${ruleResults.timeConstraint.message}`);
        }

        // Calculate Overall Decision
        let overallGrant = true;
        for (const key in ruleResults) {
            if (state.rules[key] && ruleResults[key].status === 'failed') {
                overallGrant = false;
            }
        }

        const decision = overallGrant ? 'GRANT' : 'DENY';
        logs.push(`[PDP] Final authorization decision: ${decision}`);
        logs.push(`[PEP] Enforcing decision. Status code: ${overallGrant ? '200 OK' : '403 Forbidden'}`);

        updateSimulatorUI(decision, ruleResults, logs);
    }

    function updateSimulatorUI(decision, ruleResults, logs) {
        // Update decision card
        const card = document.getElementById('decision-card');
        const text = document.getElementById('decision-text');
        const desc = document.getElementById('decision-desc');

        if (decision === 'GRANT') {
            card.className = 'decision-box grant';
            text.textContent = 'ACCESS GRANTED';
            desc.textContent = 'All enabled security attribute checks successfully passed.';
        } else {
            card.className = 'decision-box deny';
            text.textContent = 'ACCESS DENIED';
            desc.textContent = 'One or more attribute constraints failed verification.';
        }

        // Update rule checklist badges
        updateRuleBadge('badge-dept', ruleResults.deptMatch);
        updateRuleBadge('badge-clearance', ruleResults.clearanceCheck);
        updateRuleBadge('badge-network', ruleResults.networkL3Constraint);
        updateRuleBadge('badge-time', ruleResults.timeConstraint);

        // Update evaluation log console
        const consoleEl = document.getElementById('simulator-console');
        consoleEl.innerHTML = '';
        logs.forEach((log) => {
            const line = document.createElement('div');
            line.className = 'console-line';
            if (log.includes('GRANT') || log.includes('passed') || log.includes('200 OK')) {
                line.classList.add('c-grant');
            } else if (log.includes('DENY') || log.includes('failed') || log.includes('403 Forbidden') || log.includes('Denied')) {
                line.classList.add('c-deny');
            } else if (log.includes('[PEP]')) {
                line.classList.add('c-pep');
            } else {
                line.classList.add('c-pdp');
            }
            line.textContent = log;
            consoleEl.appendChild(line);
        });

        // Trigger visual workflow path animations
        animateSVGWorkflow(decision);
    }

    function updateRuleBadge(id, result) {
        const badge = document.getElementById(id);
        badge.className = 'rule-badge ' + result.status;
        badge.textContent = result.status.toUpperCase();
    }

    function animateSVGWorkflow(decision) {
        // Reset all active classes on arrows
        const paths = document.querySelectorAll('.flow-path');
        paths.forEach(p => {
            p.classList.remove('active', 'success', 'fail');
        });

        // We run a sequence animation
        runAnimationSequence(decision);
    }

    function runAnimationSequence(decision) {
        const isSuccess = decision === 'GRANT';
        const delay = 400; // ms between steps

        // Steps mapping
        const p1 = document.getElementById('path-pep-pdp');  // Request
        const p2 = document.getElementById('path-pdp-pip');  // PIP request
        const p3 = document.getElementById('path-pip-pdp');  // PIP return attributes
        const p4 = document.getElementById('path-pdp-pap');  // PAP policy pull
        const p5 = document.getElementById('path-pap-pdp');  // PAP policy logic
        const p6 = document.getElementById('path-pdp-pep');  // Decision response

        // Step 1: PEP -> PDP
        setTimeout(() => {
            p1.classList.add('active');
            highlightNode('node-pep');
        }, 0);

        // Step 2: PDP -> PIP (Fetch Attributes)
        setTimeout(() => {
            p2.classList.add('active');
            highlightNode('node-pdp');
        }, delay);

        // Step 3: PIP -> PDP (Return Attributes)
        setTimeout(() => {
            p3.classList.add('active');
            highlightNode('node-pip');
        }, delay * 2);

        // Step 4: PDP -> PAP (Get Policies)
        setTimeout(() => {
            p4.classList.add('active');
        }, delay * 3);

        // Step 5: PAP -> PDP (Return Policies)
        setTimeout(() => {
            p5.classList.add('active');
            highlightNode('node-pap');
        }, delay * 4);

        // Step 6: PDP -> PEP (Decision)
        setTimeout(() => {
            p6.classList.add('active', isSuccess ? 'success' : 'fail');
            highlightNode('node-pdp');
            // Flash PEP decision
            const pepNode = document.getElementById('node-pep');
            pepNode.classList.add(isSuccess ? 'success-flash' : 'fail-flash');
            setTimeout(() => {
                pepNode.classList.remove('success-flash', 'fail-flash');
            }, 1000);
        }, delay * 5);
    }

    function highlightNode(id) {
        const node = document.getElementById(id);
        node.classList.add('highlight');
        setTimeout(() => {
            node.classList.remove('highlight');
        }, 500);
    }

    };
})();
