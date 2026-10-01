# BioRoLa lab website
Static site for biorola.me.ntu.edu.tw, migrating from hand-written HTML on a Synology NAS to Eleventy + GitHub Pages.

## Rules
- Preserve every existing URL (root pages, english/*.html, membersinfo/*.html, ChunKaiHuang/). Old links point to them.
- Members, publications, and news live in `_data/*.yml`. Edit data, not HTML.
- The site has Chinese pages at the root and English pages in english/. Keep both languages.
- Never commit secrets, server software, or large media (see .gitignore). Videos go on YouTube.
- Preview: `npm start`. Commit each logical step separately.
