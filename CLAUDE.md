# BioRoLa lab website
Static site for biorola.me.ntu.edu.tw, migrating from hand-written HTML on a Synology NAS to Eleventy + GitHub Pages.

## Rules
- Preserve every existing URL (root pages, english/*.html, membersinfo/*.html, ChunKaiHuang/). Old links point to them. `npm run check` fails if a URL in `scripts/live-urls.txt` is missing.
- Exception: orphaned drafts that nothing links to may be deleted. Remove their lines from `scripts/live-urls.txt` in the same commit.
- Members, publications, and news live in `_data/*.yml`. Edit data, not HTML.
- Converted pages are `pages/zh/<name>.njk` (served at `/<name>.html`) and `pages/en/<name>.njk` (served at `/english/<name>.html`); delete the legacy `<name>.html` in the same commit. Menu and hexagon sidebar come from `_data/nav.yml`.
- The site has Chinese pages at the root and English pages in english/. Keep both languages.
- Never commit secrets, server software, or large media (see .gitignore). Videos go on YouTube.
- Preview: `npm start`. Commit each logical step separately.
