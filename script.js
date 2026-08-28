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

const GITHUB_USERNAME = 'K-Caxton';

const PORTFOLIO_TOPIC = 'portfolio-project';

const githubProjectsContainer =
    document.getElementById('projects-grid');


// Load GitHub projects
async function loadGitHubProjects() {

    if (!githubProjectsContainer) {
        return;
    }

    try {

        const url =
            `https://api.github.com/search/repositories` +
            `?q=user:${GITHUB_USERNAME}+topic:${PORTFOLIO_TOPIC}` +
            `&sort=updated` +
            `&order=desc` +
            `&per_page=100`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github+json'
            }
        });

        if (!response.ok) {

            throw new Error(
                `GitHub API returned ${response.status}`
            );

        }

        const data = await response.json();

        const repositories = data.items || [];

        // Remove loading message
        githubProjectsContainer.innerHTML = '';

        // No projects found
        if (repositories.length === 0) {

            githubProjectsContainer.innerHTML = `
                <div class="github-status">
                    No portfolio projects found yet.
                </div>
            `;

            return;
        }

        // Create project cards
        repositories.forEach((repo, index) => {

            const card = createProjectCard(repo);

            githubProjectsContainer.appendChild(card);

            // Small staggered reveal
            setTimeout(() => {
                card.classList.add('visible');
            }, 100 + (index * 100));

        });

    } catch (error) {

        console.error('GitHub project loading error:', error);

        githubProjectsContainer.innerHTML = `
            <div class="github-status error">
                Unable to load GitHub projects right now.
            </div>
        `;

    }

}


// Create one project card
function createProjectCard(repo) {

    const card = document.createElement('article');

    card.className = 'github-project-card';


    // ─────────────────────────────────────────
    // Project tags
    // ─────────────────────────────────────────

    const tags = [];

    // Main programming language
    if (repo.language) {
        tags.push(repo.language);
    }

    // GitHub topics
    if (Array.isArray(repo.topics)) {

        repo.topics
            .filter(topic => topic !== PORTFOLIO_TOPIC)
            .slice(0, 4)
            .forEach(topic => tags.push(topic));

    }


    const tagsHTML = tags.length > 0

        ? tags
            .map(tag => `
                <span class="project-tag">
                    ${escapeHTML(tag)}
                </span>
            `)
            .join('')

        : `
            <span class="project-tag">
                Project
            </span>
        `;


    // ─────────────────────────────────────────
    // Description
    // ─────────────────────────────────────────

    const description =
        repo.description ||
        'A project developed by Caxton Kiptoo.';


    // ─────────────────────────────────────────
    // Updated date
    // ─────────────────────────────────────────

    const updatedDate =
        formatDate(repo.updated_at);


    // ─────────────────────────────────────────
    // Live demo button
    // ─────────────────────────────────────────

    const liveDemoHTML = repo.homepage

        ? `
            <a href="${escapeAttribute(repo.homepage)}"
               target="_blank"
               rel="noopener">

                Live Demo

                <svg width="14"
                     height="14"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2">

                    <path d="M14 3h7v7"/>
                    <path d="M10 14L21 3"/>
                    <path d="M21 14v7H3V3h7"/>

                </svg>

            </a>
        `

        : '';


    // ─────────────────────────────────────────
    // Build card
    // ─────────────────────────────────────────

    card.innerHTML = `

        <div class="github-project-meta">
            ${tagsHTML}
        </div>

        <h4>
            ${escapeHTML(repo.name)}
        </h4>

        <p class="github-project-description">
            ${escapeHTML(description)}
        </p>

        <div class="github-project-footer">

            <span class="github-project-updated">
                Updated ${updatedDate}
            </span>

            <div class="github-project-links">

                ${liveDemoHTML}

                <a href="${escapeAttribute(repo.html_url)}"
                   target="_blank"
                   rel="noopener">

                    GitHub

                    <svg width="14"
                         height="14"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2">

                        <path d="M5 12h14"/>
                        <path d="M12 5l7 7-7 7"/>

                    </svg>

                </a>

            </div>

        </div>
    `;


    return card;
}


// ─────────────────────────────────────────────
// Format GitHub date
// ─────────────────────────────────────────────

function formatDate(dateString) {

    if (!dateString) {
        return 'recently';
    }

    const date = new Date(dateString);

    return date.toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

}


// ─────────────────────────────────────────────
// Basic HTML escaping
// Prevents GitHub text from being interpreted
// as HTML inside the page.
// ─────────────────────────────────────────────

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


// ─────────────────────────────────────────────
// Start GitHub automation
// ─────────────────────────────────────────────

loadGitHubProjects();
console.log("GitHub loader started");
