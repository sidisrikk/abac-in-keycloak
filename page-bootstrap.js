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
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= (sectionTop - 120)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });
}
