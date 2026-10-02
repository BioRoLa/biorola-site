# BioRoLa lab website
Static site for biorola.me.ntu.edu.tw, built with Eleventy and deployed to GitHub Pages on every push to main (preview: https://biorola.github.io/biorola-site/). Migrated from hand-written HTML on a Synology NAS; only ChunKaiHuang/ and membersinfo/*_welcome.html are still legacy HTML.

## Rules
- Preserve every existing URL (root pages, english/*.html, membersinfo/*.html, ChunKaiHuang/). Old links point to them. `npm run check` fails if a URL in `scripts/live-urls.txt` is missing.
- Exception: orphaned drafts that nothing links to may be deleted. Remove their lines from `scripts/live-urls.txt` in the same commit.
- Content lives in `_data/*.yml` (members, news, publications, honors, research, albums, ...). Edit data, not HTML; each file's header says how.
- Pages are `pages/zh/<name>.njk` (served at `/<name>.html`) and `pages/en/<name>.njk` (served at `/english/<name>.html`), mostly one-line includes of `_includes/` templates shared by both languages. Menu and hexagon sidebar come from `_data/nav.yml`.
- The site has Chinese pages at the root and English pages in english/. Keep both languages.
- Never commit secrets, server software, or large media (see .gitignore). Videos go on YouTube.
- Images in generated pages are resized to WebP automatically (`@11ty/eleventy-img`); give each `<img>` a `sizes` hint. Add photos as normal files; don't commit pre-resized copies.
- Layout breakpoints: desktop >= 1024px (hexagon sidebar), tablet 640-1023px, phone < 640px; the menu collapses below 900px. Content colours are CSS variables with a dark-mode palette in `assets/css/site.css`.
- `npm run check` builds, then fails on a missing live URL, a published secret, or a broken internal link or image. CI runs it on every push.
- Preview: `npm start`. Commit each logical step separately.
