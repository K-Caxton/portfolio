// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CV_DATA_URL = "./cv-data.json";
const PROJECTS_DATA_URL = "./projects.json";

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
        return ["http:", "https:", "mailto:"].includes(protocol) ? String(url) : "";
    } catch {
        return "";
    }
};

// Returns an <a> tag, or "" if the URL is missing or unsafe.
const link = (url, label) => {
    const href = safeURL(url);
    if (!href || !label) return "";
    const external = !href.startsWith("mailto:");
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
// Renderers
// ---------------------------------------------------------------------------
function renderProfile(profile) {
    const contact = [
        escapeHTML(profile.location),
        link(profile.email && `mailto:${profile.email}`, profile.email),
        link(profile.github, "GitHub"),
        link(profile.portfolio, "Portfolio"),
        link(profile.linkedin, "LinkedIn")
    ].filter(Boolean).join(' <span aria-hidden="true">•</span> ');

    return `
        <section class="cv-profile">
            ${tag("h1", profile.name)}
            ${tag("p", profile.headline, "cv-headline")}
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
                ${tag("p", project.description)}
                ${project.language
                    ? `<p><strong>Technology:</strong> ${escapeHTML(project.language)}</p>`
                    : ""}
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
        render: (item) => `
            <article class="cv-item">
                ${tag("h3", item.title)}
                ${tag("p", item.organization)}
                ${tag("p", range(item.startDate, item.endDate))}
                ${tag("p", item.description)}
            </article>
        `
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
        const [cv, projectData] = await Promise.all([
            fetchJSON(CV_DATA_URL),
            fetchJSON(PROJECTS_DATA_URL)
        ]);

        const projects = Array.isArray(projectData)
            ? projectData
            : projectData.projects || [];

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