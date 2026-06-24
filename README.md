# Caxton Kiptoo — Portfolio

Personal portfolio site for Caxton Kiptoo, Data Analyst & Developer.

## Live Site

Once deployed, the site will be available at:

**https://kcaxton.github.io/portfolio/**

(or **https://kcaxton.github.io** if you use a `kcaxton.github.io` repository)

## Auto-Deploy on Push

This repo uses **GitHub Pages** with a GitHub Actions workflow. Every time you push to the `main` branch, the live site updates automatically within 1–2 minutes.

### First-time setup

1. Create a new repository on GitHub named `portfolio` (or `kcaxton.github.io` for a cleaner URL).

2. From this folder, run:

```bash
git init
git add .
git commit -m "Initial portfolio commit"
git branch -M main
git remote add origin https://github.com/kcaxton/portfolio.git
git push -u origin main
```

3. On GitHub, go to **Settings → Pages**:
   - Under **Build and deployment**, set **Source** to **GitHub Actions**.

4. Push any change — the workflow in `.github/workflows/deploy.yml` handles the rest.

### Updating the site

Edit your files locally, then:

```bash
git add .
git commit -m "Update portfolio"
git push
```

The live site updates automatically. No manual upload needed.

## Local Preview

Open `index.html` in your browser, or use a local server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.
