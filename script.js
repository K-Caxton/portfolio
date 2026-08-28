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

// Rotating headline word
const words = ['Decisions', 'Insights', 'Solutions'];
let wordIndex = 0;
const rotatingEl = document.getElementById('rotatingWord');

if (rotatingEl) {
    setInterval(() => {
        wordIndex = (wordIndex + 1) % words.length;
        rotatingEl.textContent = words[wordIndex];
    }, 1500);
}

// Stat counters
function animateCounters() {
    document.querySelectorAll('.counter').forEach(el => {
        if (el.id === 'project-count') return;
        const target = +el.dataset.target;
        const duration = 1600;
        const start = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        requestAnimationFrame(tick);
    });
}

function animateProjectCount(count) {
    const el = document.getElementById('project-count');
    if (!el) return;
    el.dataset.target = count;
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * count);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = count;
    }
    requestAnimationFrame(tick);
}

setTimeout(animateCounters, 800);

// Scroll reveal
const revealObserver = new IntersectionObserver(
    entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const sectionObserver = new IntersectionObserver(
    entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            navAnchors.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
            });
        }
    }),
    { threshold: 0.35 }
);

sections.forEach(s => sectionObserver.observe(s));

// ── Auto-load projects from GitHub ──
const PROJECTS_CONFIG = {
    username: 'K-Caxton',
    exclude: ['portfolio', 'k-caxton.github.io', 'kcaxton.github.io'],
};

function formatTitle(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function filterRepos(repos) {
    const exclude = new Set(PROJECTS_CONFIG.exclude.map(r => r.toLowerCase()));
    return repos
        .filter(r => !r.private && !r.fork && !exclude.has(r.name.toLowerCase()))
        .map(r => ({
            name: r.name,
            title: formatTitle(r.name),
            description: r.description || 'A project hosted on GitHub.',
            url: r.html_url,
            tags: [...new Set([r.language, ...(r.topics || [])].filter(Boolean))].slice(0, 5),
            updated: r.updated_at,
        }))
        .sort((a, b) => new Date(b.updated) - new Date(a.updated));
}

async function fetchLiveProjects() {
    const res = await fetch(
        `https://api.github.com/users/${PROJECTS_CONFIG.username}/repos?sort=updated&per_page=100`
    );
    if (!res.ok) throw new Error('GitHub API unavailable');
    return filterRepos(await res.json());
}

async function fetchCachedProjects() {
    const res = await fetch('projects.json');
    if (!res.ok) throw new Error('projects.json not found');
    const data = await res.json();
    return data.projects || [];
}

function renderProjects(projects) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    if (!projects.length) {
        grid.innerHTML = '<p class="projects-empty">No projects found yet. Check back soon.</p>';
        return;
    }

    grid.innerHTML = projects.map((p, i) => `
        <article class="project-card reveal-item" style="--i:${i}">
            <div class="project-meta">
                ${(p.tags || []).map(t => `<span class="project-tag">${t}</span>`).join('')}
            </div>
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <a href="${p.url}" target="_blank" rel="noopener" class="project-link">
                View on GitHub
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
        </article>
    `).join('');

    updateProjectCount(projects.length);
}

function updateProjectCount(count) {
    animateProjectCount(count);
}

async function loadProjects() {
    const grid = document.getElementById('projects-grid');
    let projects = [];

    try {
        projects = await fetchLiveProjects();
    } catch {
        try {
            projects = await fetchCachedProjects();
        } catch {
            if (grid) {
                grid.innerHTML = '<p class="projects-empty">Unable to load projects. Please try again later.</p>';
            }
            return;
        }
    }

    renderProjects(projects);
}

loadProjects();
