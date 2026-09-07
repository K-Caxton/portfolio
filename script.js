const header = document.getElementById('header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navAnchors = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');

    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
});

navAnchors.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});


// ─────────────────────────────────────────────
// Rotating headline word
// ─────────────────────────────────────────────

const words = ['Decisions', 'Insights', 'Solutions'];

let wordIndex = 0;

const rotatingEl = document.getElementById('rotatingWord');

if (rotatingEl) {

    setInterval(() => {

        wordIndex = (wordIndex + 1) % words.length;

        rotatingEl.textContent = words[wordIndex];

    }, 1500);

}


// ─────────────────────────────────────────────
// Stat counters
// ─────────────────────────────────────────────

function animateCounters() {

    document.querySelectorAll('.counter').forEach(el => {

        const target = +el.dataset.target;

        const duration = 1600;

        const start = performance.now();

        function tick(now) {

            const progress = Math.min(
                (now - start) / duration,
                1
            );

            const eased = 1 - Math.pow(1 - progress, 3);

            el.textContent = Math.floor(eased * target);

            if (progress < 1) {

                requestAnimationFrame(tick);

            } else {

                el.textContent = target;

            }

        }

        requestAnimationFrame(tick);

    });

}

setTimeout(animateCounters, 800);


// ─────────────────────────────────────────────
// Scroll reveal
// ─────────────────────────────────────────────

const revealObserver = new IntersectionObserver(

    entries => entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add('visible');

            revealObserver.unobserve(entry.target);

        }

    }),

    {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    }

);

document
    .querySelectorAll('.reveal')
    .forEach(el => revealObserver.observe(el));


// ─────────────────────────────────────────────
// Active navigation section
// ─────────────────────────────────────────────

const sectionObserver = new IntersectionObserver(

    entries => entries.forEach(entry => {

        if (entry.isIntersecting) {

            const id = entry.target.id;

            navAnchors.forEach(a => {

                a.classList.toggle(
                    'active',
                    a.getAttribute('href') === `#${id}`
                );

            });

        }

    }),

    {
        threshold: 0.35
    }

);

sections.forEach(s => sectionObserver.observe(s));


// ─────────────────────────────────────────────
// GitHub Portfolio Automation
// ─────────────────────────────────────────────

const githubProjectsContainer =
    document.getElementById('projects-grid');

async function loadGitHubProjects() {
    if (!githubProjectsContainer) {
        return;
    }

    try {
        const response = await fetch('projects.json');

        if (!response.ok) {
            throw new Error(`projects.json returned ${response.status}`);
        }

        const data = await response.json();
        const projects = data.projects || [];

        githubProjectsContainer.innerHTML = '';

        if (projects.length === 0) {
            githubProjectsContainer.innerHTML = `
                <div class="github-status">
                    No projects found yet.
                </div>
            `;
            return;
        }

        projects.forEach((project, index) => {
            const card = createProjectCard(project);

            githubProjectsContainer.appendChild(card);

            setTimeout(() => {
                card.classList.add('visible');
            }, 100 + (index * 100));
        });

    } catch (error) {
        console.error('Project loading error:', error);

        githubProjectsContainer.innerHTML = `
            <div class="github-status error">
                Unable to load projects right now.
            </div>
        `;
    }
}


function createProjectCard(project) {
    const card = document.createElement('article');

    card.className = 'github-project-card';

    const tags = (project.tags || [])
        .map(tag => `<span class="project-tag">${tag}</span>`)
        .join('');

    card.innerHTML = `
        <div class="github-project-meta">
            ${project.language ? `<span>${project.language}</span>` : ''}
        </div>

        <h3>${project.title}</h3>

        <p class="github-project-description">
            ${project.description}
        </p>

        <div class="github-project-tags">
            ${tags}
        </div>

        <div class="github-project-footer">
            <div class="github-project-links">
                <a
                    href="${project.url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="project-link"
                >
                    View on GitHub
                    <span>↗</span>
                </a>
            </div>
        </div>
    `;

    return card;
}

loadGitHubProjects();
console.log("GitHub loader started");
