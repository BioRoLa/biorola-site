// Menu for touch screens and keyboards: the ☰ button opens the menu on narrow
// screens, and each ▾ button opens its submenu. Without this script every menu
// link still works (sections link to their first page).
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu");
  if (!menu) return;

  const toggle = menu.querySelector(".menu__toggle");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  });

  const closeAll = (except) => {
    for (const item of menu.querySelectorAll(".menu__item.is-open")) {
      if (item === except) continue;
      item.classList.remove("is-open");
      item.querySelector(".menu__expand")?.setAttribute("aria-expanded", "false");
    }
  };

  for (const button of menu.querySelectorAll(".menu__expand")) {
    button.addEventListener("click", () => {
      const item = button.closest(".menu__item");
      const open = !item.classList.contains("is-open");
      closeAll(item);
      item.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    });
  }

  // Close open submenus on Escape or a click outside the menu.
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
  document.addEventListener("click", (e) => { if (!menu.contains(e.target)) closeAll(); });
});
