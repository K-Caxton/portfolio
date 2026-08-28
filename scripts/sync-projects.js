const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.json');
const outputPath = path.join(__dirname, '..', 'projects.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = process.env.GITHUB_TOKEN;

async function fetchAllRepos(username) {
    const repos = [];
    let page = 1;

    while (true) {
        const url = `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`;
        const headers = {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'portfolio-sync',
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);

        const batch = await res.json();
        if (!batch.length) break;

        repos.push(...batch);
        if (batch.length < 100) break;
        page += 1;
    }

    return repos;
}

function formatTitle(name) {
    return name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function buildTags(repo) {
    const tags = new Set();
    if (repo.language) tags.add(repo.language);
    (repo.topics || []).forEach(t => tags.add(t));
    return [...tags].slice(0, 5);
}

function filterRepos(repos) {
    const exclude = new Set(config.excludeRepos.map(r => r.toLowerCase()));

    return repos
        .filter(repo => {
            if (repo.private || repo.fork) return false;
            if (exclude.has(repo.name.toLowerCase())) return false;
            if (config.requireTopic && !(repo.topics || []).includes(config.requireTopic)) return false;
            return true;
        })
        .map(repo => ({
            name: repo.name,
            title: formatTitle(repo.name),
            description: repo.description || 'A project hosted on GitHub.',
            url: repo.html_url,
            language: repo.language,
            tags: buildTags(repo),
            updated: repo.updated_at,
            stars: repo.stargazers_count,
        }))
        .sort((a, b) => new Date(b.updated) - new Date(a.updated));
}

async function main() {
    console.log(`Syncing repos for ${config.githubUsername}...`);
    const repos = await fetchAllRepos(config.githubUsername);
    const projects = filterRepos(repos);

    const output = {
        generatedAt: new Date().toISOString(),
        githubUsername: config.githubUsername,
        count: projects.length,
        projects,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
    console.log(`Saved ${projects.length} project(s) to projects.json`);
    projects.forEach(p => console.log(`  - ${p.title}`));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
