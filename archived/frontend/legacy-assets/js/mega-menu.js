(() => {
  const megaMenu = document.querySelector("#megaMenu");
  const shopTrigger = document.querySelector(".shop-trigger");
  const mobileToggle = document.querySelector(".mobile-toggle");
  const menuRow = document.querySelector(".menu-row");

  if (!megaMenu || !shopTrigger) return;

  let closeTimeout;
  const isCompact = () => window.matchMedia("(max-width: 920px), (hover: none)").matches;
  const canHover = () => window.matchMedia("(min-width: 921px) and (hover: hover)").matches;

  shopTrigger.setAttribute("aria-haspopup", "true");
  shopTrigger.setAttribute("aria-controls", "megaMenu");
  shopTrigger.setAttribute("aria-expanded", "false");
  megaMenu.setAttribute("aria-hidden", "true");

  const setOpen = (open) => {
    clearTimeout(closeTimeout);
    megaMenu.classList.toggle("show", open);
    shopTrigger.setAttribute("aria-expanded", String(open));
    megaMenu.setAttribute("aria-hidden", String(!open));
  };

  const scheduleClose = () => {
    clearTimeout(closeTimeout);
    closeTimeout = window.setTimeout(() => setOpen(false), 220);
  };

  shopTrigger.addEventListener("mouseenter", () => {
    if (canHover()) setOpen(true);
  });
  shopTrigger.addEventListener("mouseleave", () => {
    if (canHover()) scheduleClose();
  });
  megaMenu.addEventListener("mouseenter", () => {
    if (canHover()) setOpen(true);
  });
  megaMenu.addEventListener("mouseleave", () => {
    if (canHover()) scheduleClose();
  });

  shopTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    setOpen(isCompact() ? !megaMenu.classList.contains("show") : true);
    if (isCompact()) menuRow?.classList.remove("open");
  });

  megaMenu.addEventListener("focusin", () => setOpen(true));
  megaMenu.addEventListener("focusout", (event) => {
    if (!megaMenu.contains(event.relatedTarget) && event.relatedTarget !== shopTrigger) {
      scheduleClose();
    }
  });

  document.addEventListener("click", (event) => {
    if (!megaMenu.classList.contains("show")) return;
    if (megaMenu.contains(event.target) || shopTrigger.contains(event.target)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !megaMenu.classList.contains("show")) return;
    setOpen(false);
    shopTrigger.focus();
  });

  if (mobileToggle) {
    const setMobileOpen = (open) => {
      menuRow?.classList.toggle("open", open);
      mobileToggle.setAttribute("aria-expanded", String(open));
      mobileToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };
    setMobileOpen(false);
    mobileToggle.addEventListener("click", () => {
      if (megaMenu.classList.contains("show")) {
        setOpen(false);
        setMobileOpen(false);
        return;
      }
      setMobileOpen(!menuRow?.classList.contains("open"));
    });
    shopTrigger.addEventListener("click", () => {
      if (isCompact()) setMobileOpen(false);
    });
  }

  window.addEventListener("resize", () => {
    if (megaMenu.classList.contains("show")) setOpen(false);
  });
})();
