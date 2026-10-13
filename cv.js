// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CV_DATA_URL = "./cv-data.json";
const PROJECTS_DATA_URL = "./projects.json"; // used only as a fallback

// Live GitHub projects
const MAX_PROJECTS = 8;               // how many repos to show
const GITHUB_CACHE_MINUTES = 10;      // avoids GitHub's rate limit on repeat visits
const EXCLUDED_REPOS = ["portfolio"]; // repo names to hide (add your CV/portfolio repo here)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

// Allow only http(s) and mailto links; anything else (e.g. javascript:) is dropped.
const safeURL = (url) => {
    if (!url) return "";
    try {
        const { protocol } = new URL(url, window.location.href);
        return ["http:", "https:", "mailto:", "tel:"].includes(protocol) ? String(url) : "";
    } catch {
        return "";
    }
};

// Returns an <a> tag, or "" if the URL is missing or unsafe.
const link = (url, label) => {
    const href = safeURL(url);
    if (!href || !label) return "";
    const external = /^https?:/.test(href);
    return `<a href="${escapeHTML(href)}"${
        external ? ' target="_blank" rel="noopener noreferrer"' : ""
    }>${escapeHTML(label)}</a>`;
};

// Returns <tag class="...">escaped value</tag>, or "" if the value is empty.
const tag = (name, value, className) =>
    value
        ? `<${name}${className ? ` class="${className}"` : ""}>${escapeHTML(value)}</${name}>`
        : "";

// Joins non-empty plain-text parts with a bullet, escaping each one.
const meta = (...parts) =>
    parts.filter(Boolean).map(escapeHTML).join(" • ");

// "2022 – 2024", "2022", or "" depending on what exists.
const range = (start, end) => [start, end].filter(Boolean).join(" – ");

// "programmingLanguages" -> "Programming Languages", "AI" stays "AI".
const humanize = (key) =>
    key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());

// Works for both plain strings and objects like { title: "..." }.
const textOf = (item, key) =>
    typeof item === "string" ? item : item?.[key] ?? "";

const section = (id, title, content) =>
    content
        ? `<section class="cv-section" id="${id}"><h2>${title}</h2>${content}</section>`
        : "";

async function fetchJSON(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
        throw new Error(`Could not load ${url} (${response.status})`);
    }
    return response.json();
}

// ---------------------------------------------------------------------------
// Projects: live from GitHub, falling back to projects.json
// ---------------------------------------------------------------------------
const usernameFrom = (githubURL) => {
    try {
        return new URL(githubURL).pathname.split("/").filter(Boolean)[0] || "";
    } catch {
        return "";
    }
};

// "customer-churn-prediction" -> "Customer churn prediction"
const prettifyRepoName = (name) =>
    name.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase());

async function fetchGitHubProjects(username) {
    const cacheKey = `gh-repos:${username}`;

    try {
        const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
        if (cached && Date.now() - cached.time < GITHUB_CACHE_MINUTES * 60000) {
            return cached.projects;
        }
    } catch {
        // storage unavailable or corrupted: just fetch fresh
    }

    const repos = await fetchJSON(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=100`
    );

    const projects = repos
        .filter((repo) => !repo.fork && !repo.archived && !EXCLUDED_REPOS.includes(repo.name))
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, MAX_PROJECTS)
        .map((repo) => ({
            title: prettifyRepoName(repo.name),
            url: repo.html_url
        }));

    try {
        localStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), projects }));
    } catch {
        // ignore: caching is optional
    }

    return projects;
}

async function loadProjects(profile) {
    const username = usernameFrom(profile.github);

    if (username) {
        try {
            const live = await fetchGitHubProjects(username);
            if (live.length) return live;
        } catch (error) {
            console.warn("GitHub fetch failed, using projects.json instead:", error);
        }
    }

    try {
        const data = await fetchJSON(PROJECTS_DATA_URL);
        return Array.isArray(data) ? data : data.projects || [];
    } catch (error) {
        console.warn("Could not load projects.json:", error);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------
// "https://github.com/K-Caxton/" -> "github.com/K-Caxton" (easy to read and type)
const displayURL = (url) =>
    String(url ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");

// "GitHub: github.com/K-Caxton", linked, so the URL is visible when printed.
const contactItem = (label, url, text) => {
    const anchor = link(url, text);
    return anchor
        ? `<span class="cv-contact-item"><strong>${label}:</strong> ${anchor}</span>`
        : "";
};

function renderProfile(profile) {
    const contact = [
        profile.location
            ? `<span class="cv-contact-item">${escapeHTML(profile.location)}</span>`
            : "",
        contactItem("Email", profile.email && `mailto:${profile.email}`, profile.email),
        contactItem("Phone", profile.phone && `tel:${String(profile.phone).replace(/[^\d+]/g, "")}`, profile.phone),
        contactItem("GitHub", profile.github, displayURL(profile.github)),
        contactItem("Portfolio", profile.portfolio, displayURL(profile.portfolio)),
        contactItem("LinkedIn", profile.linkedin, displayURL(profile.linkedin))
    ].filter(Boolean).join("");

    return `
        <section class="cv-profile">
            ${tag("h1", profile.name)}
            ${tag("p", profile.headline, "cv-headline")}
            ${tag("p", profile.subtitle, "cv-subtitle")}
            ${tag("p", profile.summary)}
            ${tag("p", profile.tagline, "cv-tagline")}
            ${contact ? `<p class="cv-contact">${contact}</p>` : ""}
        </section>
    `;
}

function renderEducation(education) {
    const items = education.map((item) => {
        const details = meta(
            range(item.startYear, item.endYear),
            item.status,
            item.grade && `Grade: ${item.grade}`
        );
        const coursework = item.relevantCoursework?.length
            ? `<p><strong>Relevant coursework:</strong> ${item.relevantCoursework
                  .map(escapeHTML)
                  .join(", ")}</p>`
            : "";

        return `
            <article class="cv-item">
                ${tag("h3", item.institution)}
                ${item.qualification ? `<p><strong>${escapeHTML(item.qualification)}</strong></p>` : ""}
                ${details ? `<p>${details}</p>` : ""}
                ${coursework}
            </article>
        `;
    });

    return section("education", "Education", items.join(""));
}

function renderSkills(skills) {
    const rows = Object.entries(skills)
        .filter(([, values]) => Array.isArray(values) && values.length)
        .map(([category, values]) => `
            <p>
                <strong>${escapeHTML(humanize(category))}:</strong>
                ${values.map(escapeHTML).join(", ")}
            </p>
        `);

    return section("skills", "Technical Skills", rows.join(""));
}

function renderProjects(projects) {
    const items = projects.map((project) => {
        const title = project.title || project.name || "";
        const heading = link(project.url, title) || escapeHTML(title);

        return `
            <article class="cv-item">
                ${heading ? `<h3>${heading}</h3>` : ""}
            </article>
        `;
    });

    return section("projects", "Projects", items.join(""));
}

// Optional sections: rendered only if the data exists and the preference isn't false.
const OPTIONAL_SECTIONS = [
    {
        id: "experience",
        title: "Experience",
        preference: "showExperience",
        render: (raw) => {
            const item = typeof raw === "string" ? { description: raw } : raw;
            return `
                <article class="cv-item">
                    ${tag("h3", item.title)}
                    ${tag("p", item.organization)}
                    ${tag("p", range(item.startDate, item.endDate))}
                    ${tag("p", item.description)}
                </article>
            `;
        }
    },
    {
        id: "volunteering",
        title: "Community Service",
        preference: "showVolunteering",
        render: (item) => `
            <article class="cv-item">
                ${tag("h3", item.title)}
                ${tag("p", item.organization)}
                ${tag("p", item.description)}
            </article>
        `
    },
    {
        id: "achievements",
        title: "Achievements",
        preference: "showAchievements",
        render: (item) => tag("p", textOf(item, "title"))
    },
    {
        id: "certifications",
        title: "Certifications",
        preference: "showCertifications",
        render: (item) => tag("p", textOf(item, "name"))
    },
    {
        id: "licenses",
        title: "Licenses",
        preference: "showLicenses",
        render: (item) => tag("p", textOf(item, "name"))
    },
    {
        id: "additionalActivities",
        title: "Additional Activities",
        preference: "showAdditionalActivities",
        render: (item) => tag("p", textOf(item, "title"))
    }
];

function renderOptionalSections(cv) {
    return OPTIONAL_SECTIONS.map(({ id, title, preference, render }) => {
        const items = cv[id];
        if (cv.preferences?.[preference] === false) return "";
        if (!Array.isArray(items) || !items.length) return "";
        return section(id, title, items.map(render).join(""));
    }).join("");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function loadCV() {
    const container = document.getElementById("cv-content");
    if (!container) return;

    // Wired up first so printing still works even if loading fails.
    document.getElementById("download-cv")?.addEventListener("click", () => {
        window.print();
    });

    try {
        const cv = await fetchJSON(CV_DATA_URL);
        const projects = await loadProjects(cv.profile || {});

        container.innerHTML = [
            renderProfile(cv.profile || {}),
            renderEducation(cv.education || []),
            renderSkills(cv.skills || {}),
            renderProjects(projects),
            renderOptionalSections(cv)
        ].join("");
    } catch (error) {
        console.error("CV loading error:", error);
        container.textContent =
            "Your CV could not be loaded. Check the browser console for details.";
    }
}

loadCV();
