document.addEventListener('DOMContentLoaded', () => {
    injectSimulatorTemplate();
    initializeMermaid();
    initializeActiveNav();

    if (typeof window.initAbacSimulator === 'function') {
        window.initAbacSimulator();
    }
});

function injectSimulatorTemplate() {
    const simulatorRoot = document.getElementById('simulator-root');
    if (!simulatorRoot || typeof window.simulatorTemplate !== 'string') {
        return;
    }

    simulatorRoot.innerHTML = window.simulatorTemplate;
}

function initializeMermaid() {
    if (typeof mermaid === 'undefined') {
        return;
    }

    mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        themeVariables: {
            background: '#090d16',
            primaryColor: '#6366f1',
            primaryTextColor: '#fff',
            lineColor: '#374151',
            secondaryColor: '#1e293b'
        }
    });
}

function initializeActiveNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const path = window.location.pathname;
    let page = path.substring(path.lastIndexOf('/') + 1);
    
    if (!page || page === '/') {
        page = 'index.html';
    }

    navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
