import { execFileSync } from "node:child_process";
import path from "node:path";
import yaml from "js-yaml";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { honeycomb, langUrl } from "./_includes/nav.js";

// Not part of the legacy site: repo tooling, and sources for the new pages.
const NOT_LEGACY = [
  /^\./,
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

  // The legacy site is copied through untouched. Only git-tracked files are
  // published, so ignored server software and secrets (.ssh/, phpMyAdmin/)
  // can never end up in _site even though they sit in the working tree.
  const tracked = execFileSync("git", ["ls-files", "-z"])
    .toString()
    .split("\0")
    .filter((f) => f && !NOT_LEGACY.some((re) => re.test(f)));
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

  return {
    // Legacy .html is passthrough, not a template, so Liquid never touches it.
    // New pages are written in Nunjucks or Markdown.
    templateFormats: ["njk", "md"],
    dir: { input: ".", output: "_site", includes: "_includes", data: "_data" },
  };
}
