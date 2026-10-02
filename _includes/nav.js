// Lookups over _data/nav.yml, shared by eleventy.config.js and page data files.

// Hexagon sidebar height in rows; sections with more items grow past it.
const SIDEBAR_ROWS = 7;

export function findInNav(nav, url) {
  for (const section of nav) {
    for (const [g, group] of (section.groups ?? []).entries()) {
      const p = group.pages.findIndex((page) => page.url === url);
      if (p !== -1) return { section, group, groupIndex: g, page: group.pages[p], pageIndex: p };
    }
  }
  return null;
}

export const langUrl = (url, lang) => (lang === "en" ? "/english/" : "/") + url;

// Groups in the left column, the current group's pages in the right column
// (drawn half a row lower), dark filler hexagons around them.
export function honeycomb(nav, url, lang) {
  const found = findInNav(nav, url);
  if (!found) return null;
  const { section, group, groupIndex } = found;
  const cells = [];
  // A group that is just one page of the same name (News, Links) has no sub-pages.
  const isSolo = (g) => g.pages.length === 1 && g.pages[0].label.en === g.label.en;

  section.groups.forEach((g, i) => {
    const first = g.pages[0].url;
    cells.push({
      col: 0, row: i, color: g.color, current: i === groupIndex,
      label: g.label[lang], href: langUrl(first, lang), isPage: isSolo(g) && first === url,
    });
  });

  const pages = isSolo(group) ? [] : group.pages;
  pages.forEach((p, i) => {
    cells.push({
      col: 1, row: groupIndex + i, color: group.color, current: p.url === url,
      label: p.label[lang], href: langUrl(p.url, lang), isPage: p.url === url,
    });
  });

  const rows = Math.max(SIDEBAR_ROWS, section.groups.length, groupIndex + pages.length);
  for (let col = 0; col < 2; col++) {
    for (let row = 0; row < rows; row++) {
      if (!cells.some((c) => c.col === col && c.row === row)) cells.push({ col, row, filler: true });
    }
  }
  return { cells, rows };
}

// Front-matter defaults for a page whose output file is `url` in language `lang`.
export function pageData(lang) {
  return {
    lang,
    layout: "layouts/page.njk",
    permalink: (data) => langUrl(`${data.page.fileSlug}.html`, lang),
    eleventyComputed: {
      // Path without the language prefix, used to link the other language.
      pageUrl: (data) => `${data.page.fileSlug}.html`,
      // Nav entry to highlight; pages outside the nav (profiles) point at their list.
      navUrl: (data) => `${data.page.fileSlug}.html`,
      // A page's own `title` front matter wins over its nav label.
      pageTitle: (data) => data.title ?? findInNav(data.nav, data.navUrl)?.page.label[lang],
      currentSection: (data) => findInNav(data.nav, data.navUrl)?.section.id,
    },
  };
}
