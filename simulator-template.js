window.simulatorTemplate = `
    <div class="simulator-layout">
        <div class="sim-controls">
            <div>
                <div class="sim-section-title">Subject (User) Attributes</div>
                <div class="sim-group" style="margin-bottom: 0.75rem;">
                    <label for="sub-role">Role</label>
                    <select id="sub-role" class="sim-select">
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>
                <div class="sim-group" style="margin-bottom: 0.75rem;">
                    <label for="sub-dept">Department</label>
                    <select id="sub-dept" class="sim-select">
                        <option value="hr">HR</option>
                        <option value="eng">Engineering</option>
                        <option value="finance">Finance</option>
                    </select>
                </div>
                <div class="sim-group">
                    <label for="sub-clearance">Clearance Level</label>
                    <select id="sub-clearance" class="sim-select">
                        <option value="1">L1 (Standard)</option>
                        <option value="2" selected>L2 (Confidential)</option>
                        <option value="3">L3 (Highly Confidential)</option>
                    </select>
                </div>
            </div>

            <div>
                <div class="sim-section-title">Resource Attributes</div>
                <div class="sim-group" style="margin-bottom: 0.75rem;">
                    <label for="res-type">Type</label>
                    <select id="res-type" class="sim-select">
                        <option value="document">Document</option>
                        <option value="server">Server</option>
                    </select>
                </div>
                <div class="sim-group" style="margin-bottom: 0.75rem;">
                    <label for="res-dept">Owner Department</label>
                    <select id="res-dept" class="sim-select">
                        <option value="hr">HR</option>
                        <option value="eng">Engineering</option>
                        <option value="finance">Finance</option>
                    </select>
                </div>
                <div class="sim-group">
                    <label for="res-classification">Required Classification</label>
                    <select id="res-classification" class="sim-select">
                        <option value="1">L1 (Public)</option>
                        <option value="2" selected>L2 (Confidential)</option>
                        <option value="3">L3 (Secret)</option>
                    </select>
                </div>
            </div>

            <div>
                <div class="sim-section-title">Environment Context</div>
                <div class="sim-group" style="margin-bottom: 0.75rem;">
                    <label for="env-network">Network Location</label>
                    <select id="env-network" class="sim-select">
                        <option value="office">Office Network (Secure)</option>
                        <option value="public">Public Internet (Insecure)</option>
                    </select>
                </div>
                <div class="sim-group">
                    <label for="env-time">Time of Access</label>
                    <select id="env-time" class="sim-select">
                        <option value="working">Standard Working Hours</option>
                        <option value="offhours">Off-hours / Weekend</option>
                    </select>
                </div>
            </div>

            <div>
                <div class="sim-section-title">Active Policy Rules</div>
                <div class="rule-toggle-list">
                    <div class="rule-toggle-item">
                        <span>Dept Match Rule</span>
                        <label class="switch">
                            <input type="checkbox" id="rule-dept" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="rule-toggle-item">
                        <span>Clearance Check</span>
                        <label class="switch">
                            <input type="checkbox" id="rule-clearance" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="rule-toggle-item">
                        <span>L3 Office Network</span>
                        <label class="switch">
                            <input type="checkbox" id="rule-network" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="rule-toggle-item">
                        <span>Off-hours Manager</span>
                        <label class="switch">
                            <input type="checkbox" id="rule-time" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <button id="btn-evaluate" class="btn-primary">Re-Run Animation</button>
        </div>

        <div class="sim-canvas">
            <div class="svg-container">
                <svg viewBox="0 0 560 300">
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#374151" />
                        </marker>
                        <marker id="arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                        </marker>
                        <marker id="arrow-success" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                        </marker>
                        <marker id="arrow-fail" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                        </marker>
                    </defs>

                    <path id="path-pep-pdp" d="M 120 110 L 230 110" fill="none" class="flow-path" marker-end="url(#arrow-active)" />
                    <path id="path-pdp-pep" d="M 230 130 L 120 130" fill="none" class="flow-path" marker-end="url(#arrow-active)" />
                    <path id="path-pdp-pip" d="M 270 165 L 270 205" fill="none" class="flow-path" marker-end="url(#arrow-active)" />
                    <path id="path-pip-pdp" d="M 290 205 L 290 165" fill="none" class="flow-path" marker-end="url(#arrow-active)" />
                    <path id="path-pdp-pap" d="M 325 110 L 435 110" fill="none" class="flow-path" marker-end="url(#arrow-active)" />
                    <path id="path-pap-pdp" d="M 435 130 L 325 130" fill="none" class="flow-path" marker-end="url(#arrow-active)" />

                    <g id="node-pep">
                        <circle cx="80" cy="120" r="38" class="node-circle" />
                        <text x="80" y="118" class="node-text">PEP</text>
                        <text x="80" y="132" class="node-subtext">(App / Client)</text>
                    </g>

                    <g id="node-pdp">
                        <circle cx="280" cy="120" r="43" class="node-circle" />
                        <text x="280" y="118" class="node-text">PDP</text>
                        <text x="280" y="132" class="node-subtext">(Keycloak Engine)</text>
                    </g>

                    <g id="node-pap">
                        <circle cx="480" cy="120" r="38" class="node-circle" />
                        <text x="480" y="118" class="node-text">PAP</text>
                        <text x="480" y="132" class="node-subtext">(Admin Policies)</text>
                    </g>

                    <g id="node-pip">
                        <circle cx="280" cy="245" r="38" class="node-circle" />
                        <text x="280" y="243" class="node-text">PIP</text>
                        <text x="280" y="257" class="node-subtext">(User / Resource DB)</text>
                    </g>
                </svg>
            </div>

            <div class="decision-panel">
                <div id="decision-card" class="decision-box grant">
                    <h4>Decision</h4>
                    <span id="decision-text" class="decision-status">GRANT</span>
                    <p id="decision-desc">All attributes matched.</p>
                </div>

                <div class="rule-check-panel">
                    <div class="rule-check-row">
                        <span class="rule-name">Department Matching:</span>
                        <span id="badge-dept" class="rule-badge passed">PASSED</span>
                    </div>
                    <div class="rule-check-row">
                        <span class="rule-name">Clearance Level Suitability:</span>
                        <span id="badge-clearance" class="rule-badge passed">PASSED</span>
                    </div>
                    <div class="rule-check-row">
                        <span class="rule-name">Level-3 Environment Security:</span>
                        <span id="badge-network" class="rule-badge passed">PASSED</span>
                    </div>
                    <div class="rule-check-row">
                        <span class="rule-name">Off-hours Manager Exception:</span>
                        <span id="badge-time" class="rule-badge passed">PASSED</span>
                    </div>
                </div>
            </div>

            <div class="console-panel">
                <div class="console-header">
                    <span>PDP ENGINE EVALUATION CONSOLE</span>
                    <span>LOG_LEVEL: DEBUG</span>
                </div>
                <div id="simulator-console" class="console-body"></div>
            </div>
        </div>
    </div>
`;
