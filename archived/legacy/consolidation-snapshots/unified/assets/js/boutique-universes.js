(() => {
  const boutiqueUniverses = [
    {
      id: "parfums",
      title: "Parfums",
      priority: 1,
      children: [
        {
          id: "parfums-femme",
          title: "Parfums Femme",
          description: "Éclats floraux et signatures sensuelles",
          image: { src: "assets/images/optimized/prestige.webp", alt: "Univers des parfums féminins IMANA" },
          href: "catalogue.html?univers=parfums",
          itemCount: 7,
          priority: 1,
          rotationDirection: "left",
          isActive: true
        },
        {
          id: "parfums-homme",
          title: "Parfums Homme",
          description: "Boisés modernes et sillages affirmés",
          image: { src: "assets/images/optimized/heritage.webp", alt: "Univers des parfums masculins IMANA" },
          href: "catalogue.html?univers=parfums&filter=fresh",
          itemCount: 6,
          priority: 2,
          rotationDirection: "right",
          isActive: true
        },
        {
          id: "parfums-niche",
          title: "Parfums de niche",
          description: "Compositions rares et partis pris singuliers",
          image: { src: "assets/images/optimized/product-dark.webp", alt: "Matières premières d'une parfumerie de niche" },
          href: "catalogue.html?univers=parfums&filter=intense",
          badge: "Exclusivité",
          priority: 3,
          rotationDirection: "left",
          isActive: true
        }
      ]
    },
    {
      id: "coffrets",
      title: "Coffrets cadeaux",
      description: "L'art d'offrir, composé avec attention",
      image: { src: "assets/images/optimized/imana-product-4.webp", alt: "Coffret cadeau de parfumerie IMANA" },
      href: "catalogue.html?univers=accessoires&filter=coffrets",
      itemCount: 2,
      priority: 4,
      rotationDirection: "right",
      isActive: true
    },
    {
      id: "accessoires",
      title: "Accessoires",
      description: "Objets parfumés et essentiels nomades",
      image: { src: "assets/images/optimized/evasion.webp", alt: "Accessoires et essentiels lifestyle IMANA" },
      href: "catalogue.html?univers=accessoires",
      itemCount: 4,
      priority: 5,
      rotationDirection: "left",
      isActive: true
    }
  ];

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const entries = boutiqueUniverses
    .flatMap((universe) => universe.children?.length ? universe.children : [universe])
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  document.querySelectorAll("[data-boutique-universes]").forEach((grid) => {
    grid.innerHTML = entries.map((entry) => {
      const disabled = entry.isDisabled || entry.isActive === false;
      const count = Number.isFinite(entry.itemCount)
        ? `<span class="boutique-card__count">${entry.itemCount} création${entry.itemCount > 1 ? "s" : ""}</span>`
        : "";
      const badge = entry.badge
        ? `<span class="boutique-card__badge">${escapeHtml(entry.badge)}</span>`
        : "";

      return `
        <li>
          <a class="boutique-card"
            href="${disabled ? "#" : escapeHtml(entry.href)}"
            data-rotation="${escapeHtml(entry.rotationDirection || "left")}"
            ${disabled ? 'aria-disabled="true" tabindex="-1"' : ""}>
            <img class="boutique-card__image"
              src="${escapeHtml(entry.image.src)}"
              alt="${escapeHtml(entry.image.alt)}"
              width="900" height="1125" loading="lazy" decoding="async">
            ${badge}
            <span class="boutique-card__content">
              ${count}
              <strong>${escapeHtml(entry.title)}</strong>
              <small>${escapeHtml(entry.description || "")}</small>
              <span class="boutique-card__cta">Découvrir <span aria-hidden="true">→</span></span>
            </span>
          </a>
        </li>
      `;
    }).join("");
    grid.setAttribute("aria-busy", "false");

    const carousel = grid.closest(".universe-carousel");
    if (!carousel) return;
    const previous = carousel.querySelector(".universe-carousel__control--prev");
    const next = carousel.querySelector(".universe-carousel__control--next");
    const status = carousel.querySelector(".universe-carousel__status");
    const cards = [...grid.children];

    const getStep = () => {
      const firstCard = cards[0];
      const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
      return (firstCard?.getBoundingClientRect().width || grid.clientWidth) + gap;
    };

    const updateControls = () => {
      const maximum = Math.max(0, grid.scrollWidth - grid.clientWidth);
      const edgeTolerance = 8;
      previous.disabled = grid.scrollLeft <= edgeTolerance;
      next.disabled = grid.scrollLeft >= maximum - edgeTolerance;
      const current = Math.min(cards.length, Math.round(grid.scrollLeft / Math.max(getStep(), 1)) + 1);
      status.textContent = `Univers ${current} sur ${cards.length}`;
    };

    const move = (direction) => {
      grid.scrollBy({ left: direction * getStep(), behavior: "smooth" });
    };

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    grid.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    });
    grid.addEventListener("scroll", () => requestAnimationFrame(updateControls), { passive: true });
    window.addEventListener("resize", updateControls, { passive: true });
    requestAnimationFrame(updateControls);
  });
})();
