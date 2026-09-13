(() => {
  if (location.protocol !== "file:") return;

  const products = [
    { id: 1, name: "Nuit de Dakar", family: "Oriental épicé", category: "oriental", gender: "homme", brand: "imana", seasons: ["automne", "hiver"], occasions: ["soiree", "speciale"], collection: "Héritage", price: 59900, format: 100, badge: "Best-seller", notes: "Poivre rose · Jasmin · Ambre", image: "assets/images/optimized/imana-product-1.webp" },
    { id: 2, name: "Ébène Royal", family: "Oriental boisé", category: "oriental", gender: "homme", brand: "tom-ford", seasons: ["automne", "hiver"], occasions: ["soiree", "speciale"], collection: "Prestige", price: 69900, format: 100, badge: "Prestige", notes: "Safran · Oud · Vanille", image: "assets/images/optimized/imana-product-2.webp" },
    { id: 3, name: "Savannah Gold", family: "Floral ambré", category: "floral", gender: "femme", brand: "dior", seasons: ["printemps", "ete"], occasions: ["quotidien", "speciale"], collection: "Évasion", price: 54900, format: 100, badge: "Nouveauté", notes: "Fleur d’oranger · Rose · Ambre", image: "assets/images/optimized/imana-product-3.webp" },
    { id: 4, name: "Baobab Noir", family: "Boisé aromatique", category: "boise", gender: "homme", brand: "chanel", seasons: ["automne"], occasions: ["bureau", "quotidien"], collection: "Signature", price: 64900, format: 100, badge: "Signature", notes: "Cèdre · Vétiver · Musc", image: "assets/images/optimized/imana-signature-flacon.webp" },
    { id: 5, name: "Sahara Velvet", family: "Oriental gourmand", category: "oriental", gender: "femme", brand: "xerjoff", seasons: ["hiver"], occasions: ["soiree"], collection: "Prestige", price: 74900, format: 100, badge: "Édition limitée", notes: "Datte · Encens · Tonka", image: "assets/images/optimized/imana-product-1.webp" },
    { id: 6, name: "Lagune Claire", family: "Frais aquatique", category: "frais", gender: "enfant", brand: "mfk", seasons: ["printemps", "ete"], occasions: ["quotidien", "voyage"], collection: "Évasion", price: 47900, format: 100, badge: "Évasion", notes: "Bergamote · Sel marin · Musc", image: "assets/images/optimized/imana-product-3.webp" },
    { id: 7, name: "Orchidée Divine", family: "Floral sensuel", category: "floral", gender: "femme", brand: "initio", seasons: ["printemps"], occasions: ["soiree", "speciale"], collection: "Édition limitée", price: 89900, format: 100, badge: "Rare", notes: "Orchidée · Iris · Santal", image: "assets/images/optimized/imana-product-2.webp" },
    { id: 8, name: "Coffret Découverte", family: "Cinq eaux de parfum", category: "accessoire", accessoryType: "coffrets", collection: "Coffrets", price: 29900, format: 5, badge: "Idée cadeau", notes: "Cinq univers olfactifs", image: "assets/images/optimized/imana-product-4.webp" },
    { id: 9, name: "Coffret Rituel Signature", family: "Coffret parfumé", category: "accessoire", accessoryType: "coffrets", collection: "Art d’offrir", price: 39900, format: 1, badge: "Cadeau", notes: "Écrin · Vaporisateur · Carte", image: "assets/images/optimized/prestige.webp" },
    { id: 10, name: "Vaporisateur Nomade", family: "Accessoire de voyage", category: "accessoire", accessoryType: "voyage", collection: "Essentiels", price: 14900, format: 10, badge: "Nomade", notes: "Métal doré · Rechargeable · Étui", image: "assets/images/optimized/evasion.webp" },
    { id: 11, name: "Bougie Ambre Ivoire", family: "Objet parfumé", category: "accessoire", accessoryType: "maison", collection: "Maison", price: 24900, format: 220, badge: "Maison", notes: "Ambre · Cèdre · Cire végétale", image: "assets/images/optimized/heritage.webp" },
  ];

  const formatPrice = (price) => `${new Intl.NumberFormat("fr-FR").format(price)} FCFA`;
  const cartAddIcon = `<svg class="cart-add-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l2.2 9h9.1l1.7-6H9"/><path d="M13 3v6M10 6h6"/><circle cx="10" cy="18.5" r="1"/><circle cx="17" cy="18.5" r="1"/></svg>`;
  const card = (product) => `<article class="product-card" data-product-id="${product.id}">
    <div class="product-visual">
      <span class="badge ${product.collection === "Prestige" ? "collection" : ""}">${product.badge}</span>
      <img src="${product.image}" alt="${product.name}" width="900" height="1125" loading="lazy">
      <button class="fav" type="button" data-local-favorite aria-label="Ajouter ${product.name} aux favoris" aria-pressed="false">♡</button>
      <button class="btn add-hover" type="button" data-local-add="${product.id}">Ajouter au panier</button>
    </div>
    <div class="product-info">
      <div class="product-meta">${product.family} · ${product.format} ml</div>
      <h3 class="product-name">${product.name}</h3>
      <p class="product-note">${product.notes}</p>
      <div class="product-bottom"><strong class="price">${formatPrice(product.price)}</strong>
      <button class="plus" type="button" data-local-add="${product.id}" aria-label="Ajouter ${product.name} au panier">${cartAddIcon}</button></div>
    </div>
  </article>`;

  document.querySelectorAll("[data-product-section]").forEach((grid) => {
    const selection = grid.dataset.productSection === "accessoires" ? products.slice(4) : products.slice(0, 4);
    grid.innerHTML = selection.map(card).join("");
  });

  const catalogGrid = document.querySelector("#catalogGrid");
  if (catalogGrid) {
    let activeFilter = new URLSearchParams(location.search).get("univers") === "accessoires" ? "accessoires" : "parfums";
    let activeQuery = "";
    let activeSort = "featured";
    const activeFacets = {
      gender: new Set(), family: new Set(), brand: new Set(), collection: new Set(), price: new Set(),
      season: new Set(), occasion: new Set(),
    };
    const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const renderCatalog = () => {
      const query = normalize(activeQuery);
      const matchesFilter = (product) =>
        (activeFilter === "parfums" && product.category !== "accessoire") ||
        (activeFilter === "accessoires" && product.category === "accessoire") ||
        (activeFilter === "women" && product.gender === "femme") ||
        (activeFilter === "men" && product.gender === "homme") ||
        (activeFilter === "children" && product.gender === "enfant") ||
        (activeFilter === "niche" && ["Prestige", "Édition limitée"].includes(product.collection)) ||
        (activeFilter === "best" && product.badge === "Best-seller") ||
        (activeFilter === "fresh" && ["frais", "boise"].includes(product.category)) ||
        (activeFilter === "floral" && product.category === "floral") ||
        (activeFilter === "intense" && product.category === "oriental") ||
        (activeFilter === "collection" && product.category !== "accessoire") ||
        (["coffrets", "voyage", "maison"].includes(activeFilter) && product.accessoryType === activeFilter);
      const filtered = products.filter((product) => {
        const familyMatch = !activeFacets.family.size || activeFacets.family.has(product.category);
        const genderMatch = !activeFacets.gender.size || activeFacets.gender.has(product.gender);
        const brandMatch = !activeFacets.brand.size || activeFacets.brand.has(product.brand);
        const collection = normalize(product.collection);
        const collectionMatch = !activeFacets.collection.size || [...activeFacets.collection].some((value) =>
          value === "edition" ? collection.includes("edition") : collection.includes(value));
        const priceMatch = !activeFacets.price.size || [...activeFacets.price].some((value) =>
          (value === "under-50" && product.price < 50000) ||
          (value === "50-70" && product.price >= 50000 && product.price <= 70000) ||
          (value === "over-70" && product.price > 70000));
        const seasonMatch = !activeFacets.season.size || [...activeFacets.season].some((value) => product.seasons?.includes(value));
        const occasionMatch = !activeFacets.occasion.size || [...activeFacets.occasion].some((value) => product.occasions?.includes(value));
        return matchesFilter(product) && genderMatch && familyMatch && brandMatch && collectionMatch && priceMatch && seasonMatch && occasionMatch &&
          (!query || normalize(`${product.name} ${product.family} ${product.notes}`).includes(query));
      });
      if (activeSort === "price-asc") filtered.sort((a, b) => a.price - b.price);
      if (activeSort === "price-desc") filtered.sort((a, b) => b.price - a.price);
      if (activeSort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "fr"));
      catalogGrid.innerHTML = filtered.map(card).join("");
      const count = document.querySelector("#productCount");
      if (count) count.textContent = `${filtered.length} article${filtered.length > 1 ? "s" : ""}`;
      const empty = document.querySelector("#catalogEmpty");
      if (empty) empty.hidden = filtered.length > 0;
    };
    const selectUniverse = (universe) => {
      activeFilter = universe === "accessoires" ? "accessoires" : "parfums";
      document.querySelectorAll("[data-universe]").forEach((button) => {
        const selected = button.dataset.universe === universe;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", String(selected));
      });
      document.querySelectorAll("[data-universe-filters]").forEach((bar) => {
        bar.hidden = bar.dataset.universeFilters !== universe;
      });
      document.querySelectorAll(".filter-btn").forEach((button) => {
        button.classList.toggle("active", button.dataset.filter === activeFilter);
      });
      renderCatalog();
    };
    document.querySelector("#shopUniverses")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-universe]");
      if (button) selectUniverse(button.dataset.universe);
    });
    document.querySelector("#shopFilters")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      activeFilter = button.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((item) => item.classList.toggle("active", item === button));
      renderCatalog();
    });
    document.querySelector("#catalogSearch")?.addEventListener("input", (event) => {
      activeQuery = event.target.value;
      renderCatalog();
    });
    document.querySelector("#catalogSort")?.addEventListener("change", (event) => {
      activeSort = event.target.value;
      renderCatalog();
    });
    document.querySelector("#catalogReset")?.addEventListener("click", () => {
      activeQuery = "";
      activeSort = "featured";
      const search = document.querySelector("#catalogSearch");
      const sort = document.querySelector("#catalogSort");
      if (search) search.value = "";
      if (sort) sort.value = "featured";
      Object.values(activeFacets).forEach((values) => values.clear());
      document.querySelectorAll("[data-facet]").forEach((input) => { input.checked = false; });
      selectUniverse("parfums");
    });
    document.querySelector("#catalogFacets")?.addEventListener("change", (event) => {
      const input = event.target.closest("[data-facet]");
      if (!input) return;
      const values = activeFacets[input.dataset.facet];
      if (input.checked) values.add(input.value);
      else values.delete(input.value);
      renderCatalog();
    });
    document.querySelector("#facetReset")?.addEventListener("click", () => {
      Object.values(activeFacets).forEach((values) => values.clear());
      document.querySelectorAll("[data-facet]").forEach((input) => { input.checked = false; });
      renderCatalog();
    });
    const facetPanel = document.querySelector("#catalogFacets");
    const facetOverlay = document.querySelector("#catalogFacetOverlay");
    const facetToggle = document.querySelector("#catalogFilterToggle");
    const setFacetPanel = (open) => {
      facetPanel?.classList.toggle("is-open", open);
      if (facetOverlay) facetOverlay.hidden = !open;
      facetToggle?.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("has-catalog-filters", open);
    };
    facetToggle?.addEventListener("click", () => setFacetPanel(true));
    document.querySelector("#catalogFacetClose")?.addEventListener("click", () => setFacetPanel(false));
    facetOverlay?.addEventListener("click", () => setFacetPanel(false));
    selectUniverse(activeFilter);
  }

  const diagnosticForm = document.querySelector("#olfactoryForm");
  const diagnosticResult = document.querySelector("#olfactoryResult");
  const diagnosticSteps = [...document.querySelectorAll("[data-quiz-step]")];
  const diagnosticIndicators = [...document.querySelectorAll("[data-step-indicator]")];
  const diagnosticStepLabel = document.querySelector("#diagnosticStepLabel");
  const diagnosticBack = document.querySelector("#diagnosticBack");
  const diagnosticNext = document.querySelector("#diagnosticNext");
  const diagnosticReset = document.querySelector("#diagnosticReset");
  const diagnosticSubmit = document.querySelector(".diagnostic-submit");
  let currentDiagnosticStep = 0;

  const showDiagnosticStep = (index, moveFocus = true) => {
    if (!diagnosticSteps.length) return;
    currentDiagnosticStep = Math.max(0, Math.min(index, diagnosticSteps.length - 1));
    diagnosticSteps.forEach((step, stepIndex) => { step.hidden = stepIndex !== currentDiagnosticStep; });
    diagnosticIndicators.forEach((indicator, stepIndex) => {
      indicator.classList.toggle("is-active", stepIndex === currentDiagnosticStep);
      indicator.classList.toggle("is-complete", stepIndex < currentDiagnosticStep);
    });
    if (diagnosticStepLabel) {
      diagnosticStepLabel.textContent = `Étape ${currentDiagnosticStep + 1} sur ${diagnosticSteps.length}`;
    }
    if (diagnosticBack) diagnosticBack.hidden = currentDiagnosticStep === 0;
    const lastStep = currentDiagnosticStep === diagnosticSteps.length - 1;
    const selected = Boolean(diagnosticSteps[currentDiagnosticStep].querySelector("input:checked"));
    if (diagnosticNext) {
      diagnosticNext.hidden = lastStep;
      diagnosticNext.disabled = !selected;
    }
    if (diagnosticSubmit) {
      diagnosticSubmit.hidden = !lastStep;
      diagnosticSubmit.disabled = !selected;
    }
    if (moveFocus) {
      const legend = diagnosticSteps[currentDiagnosticStep].querySelector("legend");
      legend?.setAttribute("tabindex", "-1");
      legend?.focus({ preventScroll: true });
    }
  };

  diagnosticForm?.addEventListener("change", (event) => {
    const selectedStep = event.target.closest("[data-quiz-step]");
    if (diagnosticSteps.indexOf(selectedStep) !== currentDiagnosticStep) return;
    if (diagnosticNext && currentDiagnosticStep < diagnosticSteps.length - 1) diagnosticNext.disabled = false;
    if (diagnosticSubmit && currentDiagnosticStep === diagnosticSteps.length - 1) diagnosticSubmit.disabled = false;
  });
  diagnosticNext?.addEventListener("click", () => {
    if (!diagnosticSteps[currentDiagnosticStep]?.querySelector("input:checked")) return;
    showDiagnosticStep(currentDiagnosticStep + 1);
  });
  diagnosticBack?.addEventListener("click", () => showDiagnosticStep(currentDiagnosticStep - 1));
  diagnosticReset?.addEventListener("click", () => {
    diagnosticForm?.reset();
    if (diagnosticResult) {
      diagnosticResult.hidden = true;
      diagnosticResult.replaceChildren();
    }
    showDiagnosticStep(0);
  });
  diagnosticForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = Object.fromEntries(new FormData(diagnosticForm));
    const familyRecommendations = { floral: 3, boise: 4, frais: 1, oriental: 2 };
    let recommendationId = familyRecommendations[answers.family] || 1;
    if (answers.intensity === "intense") recommendationId = 2;
    if (answers.occasion === "voyage") recommendationId = 1;
    const recommendation = products.find((product) => product.id === recommendationId) || products[0];
    const familyLabels = { floral: "florale", boise: "boisée", frais: "fraîche", oriental: "orientale" };
    const intensityLabels = { subtile: "un sillage subtil", equilibree: "une présence équilibrée", intense: "un sillage intense" };
    const occasionLabels = { quotidien: "le quotidien", soiree: "vos soirées", voyage: "vos voyages" };
    const matchScore = answers.intensity === "equilibree" ? 96 : 92;
    diagnosticIndicators.forEach((indicator) => {
      indicator.classList.remove("is-active");
      indicator.classList.add("is-complete");
    });
    if (diagnosticStepLabel) diagnosticStepLabel.textContent = "Diagnostic terminé";
    diagnosticResult.hidden = false;
    diagnosticResult.innerHTML = `<img src="${recommendation.image}" alt="${recommendation.name}" width="900" height="1125">
      <div><p class="eyebrow">Votre signature</p><h3>${recommendation.name}</h3>
      <p>${recommendation.notes}</p>
      <p class="diagnostic-match"><span>${matchScore}% de correspondance</span> Cette sélection relie votre sensibilité ${familyLabels[answers.family]}, ${intensityLabels[answers.intensity]} et une signature pensée pour ${occasionLabels[answers.occasion]}.</p>
      <strong>${formatPrice(recommendation.price)}</strong>
      <div class="olfactory-result__actions"><button class="btn solid" type="button" data-local-add="${recommendation.id}">Ajouter au panier</button>
      <a class="btn" href="catalogue.html?univers=parfums">Voir la sélection</a></div></div>`;
    diagnosticResult.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  showDiagnosticStep(0, false);

  let count = 0;
  const localCart = [];
  let localCartOverlay = null;

  const renderLocalCart = () => {
    if (!localCartOverlay) return;
    const content = localCartOverlay.querySelector("#localCartContent");
    const lines = localCart.map((id) => products.find((product) => product.id === id)).filter(Boolean);
    const total = lines.reduce((sum, product) => sum + product.price, 0);
    content.innerHTML = `<h2>Votre panier.</h2>${lines.length
      ? lines.map((product, index) => `<div class="cart-line">
          <img src="${product.image}" alt="">
          <div><strong>${product.name}</strong><small>${formatPrice(product.price)}</small></div>
          <button type="button" data-local-remove="${index}" aria-label="Retirer ${product.name}">×</button>
        </div>`).join("")
      : "<p>Votre panier est vide.</p>"}
      <div class="cart-total"><span>Total</span><span>${formatPrice(total)}</span></div>
      <a class="btn solid" href="catalogue.html">Continuer mes achats</a>`;
    localCartOverlay.classList.add("open");
    localCartOverlay.querySelector(".overlay-close")?.focus();
  };

  if (window.location.protocol === "file:") {
    document.querySelectorAll(".cart-dot").forEach((dot) => { dot.textContent = "0"; });
    localCartOverlay = document.createElement("div");
    localCartOverlay.className = "shop-overlay";
    localCartOverlay.innerHTML = `<aside class="shop-panel" role="dialog" aria-modal="true" aria-label="Votre panier">
      <button class="overlay-close" type="button" aria-label="Fermer le panier">×</button>
      <div id="localCartContent"></div>
    </aside>`;
    document.body.append(localCartOverlay);
    document.querySelectorAll(".cart-trigger").forEach((button) => button.addEventListener("click", renderLocalCart));
    localCartOverlay.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-local-remove]");
      if (remove) {
        localCart.splice(Number(remove.dataset.localRemove), 1);
        count = localCart.length;
        document.querySelectorAll(".cart-dot").forEach((dot) => { dot.textContent = String(count); });
        renderLocalCart();
        return;
      }
      if (event.target === localCartOverlay || event.target.closest(".overlay-close")) {
        localCartOverlay.classList.remove("open");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") localCartOverlay?.classList.remove("open");
    });
  }

  document.addEventListener("click", (event) => {
    const favorite = event.target.closest("[data-local-favorite]");
    if (favorite) {
      const active = favorite.getAttribute("aria-pressed") !== "true";
      favorite.setAttribute("aria-pressed", String(active));
      favorite.textContent = active ? "♥" : "♡";
      return;
    }
    const addButton = event.target.closest("[data-local-add], .hero-product-card [data-add]");
    if (!addButton) return;
    const productId = Number(addButton.dataset.localAdd || addButton.dataset.add);
    if (window.location.protocol === "file:" && Number.isFinite(productId)) localCart.push(productId);
    count += 1;
    document.querySelectorAll(".cart-dot").forEach((dot) => { dot.textContent = String(count); });
  });
})();
