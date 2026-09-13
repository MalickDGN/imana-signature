(() => {
  const campaigns = [
    {
      id: "editions-limitees",
      title: "La rareté, le temps d'une édition.",
      description: "Des créations exclusives proposées en quantité limitée, jusqu'à épuisement de la sélection.",
      image: {
        src: "assets/images/optimized/campaign-limited-edition.webp",
        alt: "Édition limitée d'un parfum IMANA"
      },
      href: "catalogue.html?univers=parfums&filter=collection",
      badge: "Édition limitée",
      eyebrow: "Disponible temporairement",
      ctaLabel: "Découvrir l'édition",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      priority: 1,
      isActive: true
    },
    {
      id: "offres-privees",
      title: "Des attentions réservées à nos membres.",
      description: "Accédez à des avantages exclusifs et à des sélections privées imaginées pour nos clients.",
      image: {
        src: "assets/images/optimized/campaign-private-offer.webp",
        alt: "Sélection d'offres privées IMANA"
      },
      href: "catalogue.html?univers=parfums&filter=best",
      badge: "Offre privée",
      eyebrow: "Espace membres",
      ctaLabel: "Accéder à l'offre",
      startDate: "2026-07-01",
      endDate: "2026-10-31",
      priority: 2,
      isActive: true
    }
  ];

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const now = new Date();
  const visibleCampaigns = campaigns
    .filter((campaign) => {
      if (campaign.isActive === false) return false;
      const startsAt = campaign.startDate ? new Date(`${campaign.startDate}T00:00:00`) : null;
      const endsAt = campaign.endDate ? new Date(`${campaign.endDate}T23:59:59`) : null;
      return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
    })
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  const formatPeriod = (campaign) => {
    if (!campaign.endDate) return "";
    const endDate = new Date(`${campaign.endDate}T12:00:00`);
    const label = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(endDate);
    return `<span class="promo-period">Disponible jusqu'au ${escapeHtml(label)}</span>`;
  };

  document.querySelectorAll("[data-promo-banners]").forEach((grid) => {
    grid.innerHTML = visibleCampaigns.map((campaign) => `
      <article class="promo-card">
        <img src="${escapeHtml(campaign.image.src)}"
          alt="${escapeHtml(campaign.image.alt)}" width="1200" height="800"
          loading="lazy" decoding="async">
        <div class="promo-content">
          <span class="promo-label">${escapeHtml(campaign.badge)}</span>
          <span class="promo-eyebrow">${escapeHtml(campaign.eyebrow || "")}</span>
          <h3>${escapeHtml(campaign.title)}</h3>
          <p>${escapeHtml(campaign.description)}</p>
          ${formatPeriod(campaign)}
          <a class="btn solid" href="${escapeHtml(campaign.href)}">${escapeHtml(campaign.ctaLabel)} <span aria-hidden="true">→</span></a>
        </div>
      </article>
    `).join("");
    grid.setAttribute("aria-busy", "false");

    const cards = [...grid.querySelectorAll(".promo-card")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return;
    }

    grid.classList.add("promo-grid--ready");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18 });

    cards.forEach((card, index) => {
      card.style.setProperty("--promo-delay", `${index * 80}ms`);
      observer.observe(card);
    });
  });
})();
