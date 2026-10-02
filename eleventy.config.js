import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { honeycomb, langUrl, navLabel } from "./_includes/nav.js";
import { alumniByYear, currentStudents, formerMembers, listPageFor, staffList } from "./_includes/members.js";

// Not part of the legacy site: repo tooling, and sources for the new pages.
const NOT_LEGACY = [
  /^\./,
  /^node_modules(\/|$)/,
  /^_site(\/|$)/,
  /^CLAUDE\.md$/,
  /^package(-lock)?\.json$/,
  /^eleventy\.config\.js$/,
  /^scripts\//,
  /^_data\//,
  /^_includes\//,
  /^pages\//,
  /^assets\//,
];

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yaml.load(contents));
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Every <img> in a generated page becomes a <picture> with WebP and original-format
  // copies at several widths (originals keep their URLs). Templates give a `sizes`
  // hint so browsers fetch the smallest copy that looks sharp. Legacy pages copied
  // through unchanged aren't touched.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "auto"],
    widths: [160, 320, 640, 960, 1600],
    urlPath: "/img/",
    outputDir: "_site/img/",
    failOnError: true,
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async", sizes: "(max-width: 1200px) 100vw, 1000px" },
    },
  });

  // The legacy site is copied through untouched. Only git-tracked files are
  // published, so ignored server software and secrets (.ssh/, phpMyAdmin/)
  // can never end up in _site even though they sit in the working tree.
  // New files that aren't committed yet are included too (so `npm start` shows
  // them), but anything .gitignore excludes never is.
  const tracked = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--deduplicate"])
    .toString()
    .split("\0")
    .filter((f) => f && existsSync(f) && !NOT_LEGACY.some((re) => re.test(f)));
  // Passthrough keys are globs; old filenames like "RHex (1).jpg" need escaping,
  // and an escaped (glob) source is copied *into* its target, so target its folder.
  for (const f of tracked) {
    const escaped = f.replace(/[()[\]{}*?!+@]/g, "\\$&");
    eleventyConfig.addPassthroughCopy({ [escaped]: escaped === f ? f : path.posix.dirname(f) });
  }
  eleventyConfig.addPassthroughCopy("assets");

  eleventyConfig.ignores.add("CLAUDE.md");

  // {{ "news.html" | langUrl(lang) }} -> /news.html or /english/news.html
  eleventyConfig.addFilter("langUrl", langUrl);
  // {% set hc = nav | honeycomb(navUrl, lang) %}
  eleventyConfig.addFilter("honeycomb", honeycomb);
  // {{ nav | navLabel("news.html", lang) }}
  eleventyConfig.addFilter("navLabel", navLabel);

  // Member lists, from _data/members.yml
  eleventyConfig.addFilter("currentStudents", currentStudents);
  eleventyConfig.addFilter("alumniByYear", alumniByYear);
  eleventyConfig.addFilter("staffList", staffList);
  eleventyConfig.addFilter("formerMembers", formerMembers);
  eleventyConfig.addFilter("listPageFor", listPageFor);
  // Inline Markdown for data text (news items, citations). HTML is allowed for <u>.
  const md = new MarkdownIt({ html: true, linkify: false });
  eleventyConfig.addFilter("mdInline", (text) => md.renderInline(String(text ?? "")));
  eleventyConfig.addFilter("md", (text) => md.render(String(text ?? "")));

  // {{ value | localize(lang, translations) }}: {en, zh} objects pick the page
  // language; plain text is swapped for its entry in _data/translations.yml
  // when that entry suits the page language better (by share of CJK characters).
  const cjkShare = (s) => {
    const cjk = (s.match(/[\u4e00-\u9fff]/g) ?? []).length;
    const latin = (s.match(/[A-Za-z]/g) ?? []).length;
    return cjk + latin ? cjk / (cjk + latin / 2) : 0;
  };
  eleventyConfig.addFilter("localize", (value, lang, dict = {}) => {
    if (value == null) return value;
    if (typeof value === "object" && !Array.isArray(value)) return value[lang] ?? value.en ?? value.zh;
    const text = String(value);
    const other = dict[text];
    if (other == null) return text;
    const better = lang === "zh" ? cjkShare(other) > cjkShare(text) : cjkShare(other) < cjkShare(text);
    return better ? other : text;
  });

  // Staff periods: "2023.Mar. -present" -> "2023.03 - 至今" on Chinese pages.
  const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  eleventyConfig.addFilter("period", (text, lang) => {
    if (lang !== "zh") return text;
    return String(text)
      .replace(/(\d{4})\.\s*([A-Za-z]+)\.?/g, (m, y, mon) => {
        const i = MONTHS.indexOf(mon.slice(0, 3).toLowerCase());
        return i === -1 ? m : `${y}.${String(i + 1).padStart(2, "0")}`;
      })
      .replace(/\s*-\s*/g, " - ")
      .replace(/present/i, "至今");
  });

  // {{ list | findBy("id", "research") }}: first item whose field equals the value.
  eleventyConfig.addFilter("findBy", (list, field, value) => (list ?? []).find((x) => x?.[field] === value));

  // First sentence of a Markdown description, for cards.
  eleventyConfig.addFilter("excerpt", (text, max = 140) => {
    const plain = String(text ?? "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
    const sentence = plain.match(/^.+?[.。!?！？](?=\s|$)/)?.[0] ?? plain;
    return sentence.length > max ? sentence.slice(0, max - 1).trimEnd() + "…" : sentence;
  });

  // Newest news items across sections: announcements first, then by date
  // ("2025.08.01" before an undated-in-year "2025").
  eleventyConfig.addFilter("latestNews", (news, n = 3) => {
    const key = (d) => {
      const [y = 0, m = 0, day = 0] = String(d ?? "").split(".").map(Number);
      return y * 10000 + (m || 0) * 100 + (day || 0) - (m ? 0 : 0.5);
    };
    const dated = [...(news.welcomes ?? []), ...(news.honors ?? [])].sort((a, b) => key(b.date) - key(a.date));
    return [...(news.announcements ?? []), ...dated].slice(0, n);
  });

  // Data fields may be a string or a list of strings.
  eleventyConfig.addFilter("asList", (v) => (v == null ? [] : Array.isArray(v) ? v : [v]));

  return {
    // Legacy .html is passthrough, not a template, so Liquid never touches it.
    // New pages are written in Nunjucks or Markdown.
    templateFormats: ["njk", "md"],
    dir: { input: ".", output: "_site", includes: "_includes", data: "_data" },
  };
}
