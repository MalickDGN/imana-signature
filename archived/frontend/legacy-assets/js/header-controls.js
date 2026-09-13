(() => {
  const closeSearch = (button, search) => {
    search.classList.remove("is-mobile-open");
    button.setAttribute("aria-expanded", "false");
  };

  document.querySelectorAll(".mobile-search-toggle").forEach((button) => {
    const tools = button.closest(".right-tools");
    const search = tools?.querySelector(".search-box");
    const input = search?.querySelector("input");
    if (!search || !input) return;

    button.addEventListener("click", () => {
      const willOpen = !search.classList.contains("is-mobile-open");
      document.querySelectorAll(".search-box.is-mobile-open").forEach((openSearch) => {
        openSearch.classList.remove("is-mobile-open");
      });
      search.classList.toggle("is-mobile-open", willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) input.focus();
    });

    document.addEventListener("click", (event) => {
      if (!search.classList.contains("is-mobile-open") || tools.contains(event.target)) return;
      closeSearch(button, search);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && search.classList.contains("is-mobile-open")) {
        closeSearch(button, search);
        button.focus();
      }
    });
  });
})();
