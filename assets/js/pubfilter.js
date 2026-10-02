// Year and keyword filter for publication lists grouped by year (by_year.njk).
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-pubfilter]");
  if (!form) return;
  const year = form.querySelector("[data-year]");
  const query = form.querySelector("[data-query]");
  const count = form.querySelector(".pubfilter__count");
  const none = document.querySelector(".pubfilter__none");
  const sections = [...document.querySelectorAll(".pubyear")];
  const total = sections.reduce((n, s) => n + s.querySelectorAll("li").length, 0);
  const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

  const update = () => {
    const words = norm(query.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const section of sections) {
      const yearOk = !year.value || section.dataset.year === year.value;
      let visible = 0;
      for (const li of section.querySelectorAll("li")) {
        const text = norm(li.textContent);
        const ok = yearOk && words.every((w) => text.includes(w));
        li.hidden = !ok;
        if (ok) visible++;
      }
      section.hidden = visible === 0;
      shown += visible;
    }
    count.textContent = form.dataset.count.replace("{n}", shown).replace("{m}", total);
    none.hidden = shown !== 0;
  };

  year.addEventListener("change", update);
  query.addEventListener("input", update);
  form.hidden = false;
  update();
});
