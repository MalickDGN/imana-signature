import { products } from "./data/products.js";
import { APP_CONFIG } from "./config.js";
import { formatCurrency, normalizeSearchValue } from "./utils/formatters.js";
import { readStorage, writeStorage } from "./services/storage.js";
import { apiRequest } from "./services/api.js";

let cart = readStorage(APP_CONFIG.storageKeys.cart, []);
if (!Array.isArray(cart)) cart = [];
let wishlist = readStorage(APP_CONFIG.storageKeys.wishlist, []);
if (!Array.isArray(wishlist)) wishlist = [];
wishlist = [...new Set(wishlist.map(Number).filter(Number.isFinite))];
const productMap = new Map(products.map((product) => [product.id, product]));
const toast = document.createElement("div");
toast.className = "toast-global";
toast.setAttribute("role", "status");
document.body.append(toast);
let toastTimer;
const cartAddIcon = `<svg class="cart-add-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l2.2 9h9.1l1.7-6H9"/><path d="M13 3v6M10 6h6"/><circle cx="10" cy="18.5" r="1"/><circle cx="17" cy="18.5" r="1"/></svg>`;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function persistCart() {
  writeStorage(APP_CONFIG.storageKeys.cart, cart);
  document.querySelectorAll(".cart-dot").forEach((element) => {
    element.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  });
}

function productCard(product) {
  const favorite = wishlist.includes(product.id);
  return `<article class="product-card" data-product-id="${product.id}">
    <div class="product-visual"><span class="badge ${product.collection === "Prestige" ? "collection" : ""}">${product.badge}</span>
      <img src="${product.image}" alt="${product.name}" width="900" height="1125" loading="lazy">
      <button class="fav" type="button" data-favorite="${product.id}" aria-label="${favorite ? "Retirer" : "Ajouter"} ${product.name} ${favorite ? "des" : "aux"} favoris" aria-pressed="${favorite}">${favorite ? "♥" : "♡"}</button>
      <button class="btn add-hover" type="button" data-add="${product.id}">Ajouter au panier</button>
    </div><div class="product-info"><div class="product-meta">${product.family} · ${product.format} ml</div>
      <h3 class="product-name">${product.name}</h3><p class="product-note">${product.notes}</p>
      <div class="product-bottom"><strong class="price">${formatCurrency(product.price)}</strong>
      <button class="plus" type="button" data-add="${product.id}" aria-label="Ajouter ${product.name} au panier">${cartAddIcon}</button></div></div>
  </article>`;
}

document.querySelectorAll("[data-product-section]").forEach((grid) => {
  const kind = grid.dataset.productSection;
  const selection = kind === "accessoires"
    ? products.filter((p) => p.category === "accessoire")
    : kind === "collection" ? products.slice(0, 4) : products.slice(0, 4);
  grid.innerHTML = selection.map(productCard).join("");
});

const catalogGrid = document.querySelector("#catalogGrid");
let activeCatalogFilter = "parfums";
let activeCatalogQuery = "";
let activeCatalogSort = "featured";
const catalogFacets = {
  gender: new Set(),
  family: new Set(),
  brand: new Set(),
  collection: new Set(),
  price: new Set(),
  season: new Set(),
  occasion: new Set(),
};
const facetLabels = {
  homme: "Homme", femme: "Femme", enfant: "Enfant",
  imana: "IMANA Signature", dior: "Dior", chanel: "Chanel", "tom-ford": "Tom Ford",
  xerjoff: "Xerjoff", initio: "Initio", mfk: "Maison Francis Kurkdjian",
  floral: "Floral", frais: "Frais", boise: "Boisé", oriental: "Oriental",
  heritage: "Héritage", prestige: "Prestige", evasion: "Évasion", edition: "Édition limitée",
  "under-50": "Moins de 50 000 FCFA", "50-70": "50 000–70 000 FCFA", "over-70": "Plus de 70 000 FCFA",
  printemps: "Printemps", ete: "Été", automne: "Automne", hiver: "Hiver",
  quotidien: "Quotidien", bureau: "Bureau", soiree: "Soirée", voyage: "Voyage", speciale: "Occasion spéciale",
};
function productMatchesFacets(product) {
  const normalizedCollection = normalizeSearchValue(product.collection);
  const genderMatch = !catalogFacets.gender.size || catalogFacets.gender.has(product.gender);
  const familyMatch = !catalogFacets.family.size || catalogFacets.family.has(product.category);
  const brandMatch = !catalogFacets.brand.size || catalogFacets.brand.has(product.brand);
  const collectionMatch = !catalogFacets.collection.size || [...catalogFacets.collection].some((value) =>
    value === "edition" ? normalizedCollection.includes("edition") : normalizedCollection.includes(value));
  const priceMatch = !catalogFacets.price.size || [...catalogFacets.price].some((value) =>
    (value === "under-50" && product.price < 50000) ||
    (value === "50-70" && product.price >= 50000 && product.price <= 70000) ||
    (value === "over-70" && product.price > 70000));
  const seasonMatch = !catalogFacets.season.size || [...catalogFacets.season].some((value) => product.seasons?.includes(value));
  const occasionMatch = !catalogFacets.occasion.size || [...catalogFacets.occasion].some((value) => product.occasions?.includes(value));
  return genderMatch && familyMatch && brandMatch && collectionMatch && priceMatch && seasonMatch && occasionMatch;
}
function renderActiveFacets() {
  const container = document.querySelector("#activeFilters");
  const count = document.querySelector("#activeFilterCount");
  const active = Object.entries(catalogFacets).flatMap(([group, values]) =>
    [...values].map((value) => ({ group, value })));
  if (count) {
    count.textContent = String(active.length);
    count.hidden = active.length === 0;
  }
  if (container) container.innerHTML = active.map(({ group, value }) =>
    `<span class="active-filter">${facetLabels[value] || value}<button type="button" data-remove-facet="${group}:${value}" aria-label="Retirer le filtre ${facetLabels[value] || value}">×</button></span>`).join("");
}
function renderCatalog(filter = activeCatalogFilter, query = activeCatalogQuery, sort = activeCatalogSort) {
  if (!catalogGrid) return;
  activeCatalogFilter = filter;
  activeCatalogQuery = query;
  activeCatalogSort = sort;
  const normalizedQuery = normalizeSearchValue(query);
  const filtered = products.filter((product) => {
    const matchesQuery = !normalizedQuery || normalizeSearchValue(
      `${product.name} ${product.family} ${product.notes} ${product.collection}`,
    ).includes(normalizedQuery);
    const matchesFilter = filter === "all" ||
      (filter === "parfums" && product.category !== "accessoire") ||
      (filter === "accessoires" && product.category === "accessoire") ||
      (filter === "women" && product.gender === "femme") ||
      (filter === "men" && product.gender === "homme") ||
      (filter === "children" && product.gender === "enfant") ||
      (filter === "niche" && ["Prestige", "Édition limitée"].includes(product.collection)) ||
      (["coffrets", "voyage", "maison"].includes(filter) && product.accessoryType === filter) ||
      (filter === "collection" && ["Héritage", "Prestige", "Évasion"].includes(product.collection)) ||
      (filter === "best" && product.badge === "Best-seller") ||
      (filter === "floral" && product.category === "floral") ||
      (filter === "fresh" && ["frais", "boise"].includes(product.category)) ||
      (filter === "intense" && product.category === "oriental") ||
      ["sensuel", "bureau", "soiree"].includes(filter);
    return matchesQuery && matchesFilter && productMatchesFacets(product);
  });
  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  catalogGrid.innerHTML = filtered.map(productCard).join("");
  const count = document.querySelector("#productCount");
  if (count) count.textContent = `${filtered.length} article${filtered.length > 1 ? "s" : ""}`;
  const empty = document.querySelector("#catalogEmpty");
  if (empty) empty.hidden = filtered.length > 0;
  renderActiveFacets();
}
const shopParams = new URLSearchParams(location.search);
const initialUniverse = shopParams.get("univers") === "accessoires" ? "accessoires" : "parfums";
const requestedFilter = shopParams.get("filter");
const initialFilter = shopParams.get("q") ? "all" : initialUniverse;
renderCatalog(initialFilter, shopParams.get("q") || "");
const catalogSearch = document.querySelector("#catalogSearch");
if (catalogSearch && shopParams.get("q")) catalogSearch.value = shopParams.get("q");

function selectShopUniverse(universe, updateUrl = true) {
  const filter = universe === "accessoires" ? "accessoires" : "parfums";
  document.querySelectorAll("[data-universe]").forEach((button) => {
    const active = button.dataset.universe === universe;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-universe-filters]").forEach((bar) => {
    bar.hidden = bar.dataset.universeFilters !== universe;
  });
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderCatalog(filter);
  if (updateUrl && history.replaceState) history.replaceState(null, "", `${location.pathname}?univers=${universe}`);
}

document.querySelector("#shopUniverses")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-universe]");
  if (button) selectShopUniverse(button.dataset.universe);
});
selectShopUniverse(initialUniverse, false);
const allowedInitialFilters = initialUniverse === "accessoires"
  ? ["accessoires", "coffrets", "voyage", "maison"]
  : ["parfums", "women", "men", "children", "niche"];
if (requestedFilter && allowedInitialFilters.includes(requestedFilter)) {
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === requestedFilter);
  });
  renderCatalog(requestedFilter);
}

document.querySelector("#shopFilters")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  document.querySelectorAll(".filter-btn").forEach((item) => item.classList.toggle("active", item === button));
  renderCatalog(button.dataset.filter);
});

catalogSearch?.addEventListener("input", () => renderCatalog(activeCatalogFilter, catalogSearch.value));
document.querySelector("#catalogSort")?.addEventListener("change", (event) => {
  renderCatalog(activeCatalogFilter, activeCatalogQuery, event.target.value);
});
document.querySelector("#catalogReset")?.addEventListener("click", () => {
  const universe = document.querySelector("[data-universe].active")?.dataset.universe || "parfums";
  const filter = universe === "accessoires" ? "accessoires" : "parfums";
  if (catalogSearch) catalogSearch.value = "";
  const sort = document.querySelector("#catalogSort");
  if (sort) sort.value = "featured";
  Object.values(catalogFacets).forEach((values) => values.clear());
  document.querySelectorAll("[data-facet]").forEach((input) => { input.checked = false; });
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderCatalog(filter, "", "featured");
});

document.querySelector("#catalogFacets")?.addEventListener("change", (event) => {
  const input = event.target.closest("[data-facet]");
  if (!input) return;
  const values = catalogFacets[input.dataset.facet];
  if (input.checked) values.add(input.value);
  else values.delete(input.value);
  renderCatalog();
});
document.querySelector("#activeFilters")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-facet]");
  if (!button) return;
  const [group, value] = button.dataset.removeFacet.split(":");
  catalogFacets[group]?.delete(value);
  const input = document.querySelector(`[data-facet="${group}"][value="${value}"]`);
  if (input) input.checked = false;
  renderCatalog();
});
document.querySelector("#facetReset")?.addEventListener("click", () => {
  Object.values(catalogFacets).forEach((values) => values.clear());
  document.querySelectorAll("[data-facet]").forEach((input) => { input.checked = false; });
  renderCatalog();
});
const facetPanel = document.querySelector("#catalogFacets");
const facetOverlay = document.querySelector("#catalogFacetOverlay");
const facetToggle = document.querySelector("#catalogFilterToggle");
function setFacetPanel(open) {
  facetPanel?.classList.toggle("is-open", open);
  if (facetOverlay) facetOverlay.hidden = !open;
  facetToggle?.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("has-catalog-filters", open);
  if (open) facetPanel?.querySelector("input, button")?.focus();
  else facetToggle?.focus();
}
facetToggle?.addEventListener("click", () => setFacetPanel(true));
document.querySelector("#catalogFacetClose")?.addEventListener("click", () => setFacetPanel(false));
facetOverlay?.addEventListener("click", () => setFacetPanel(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && facetPanel?.classList.contains("is-open")) setFacetPanel(false);
});

document.querySelectorAll("[data-filter-link]").forEach((link) => {
  link.addEventListener("click", () => {
    sessionStorage.setItem("imana_filter", link.dataset.filterLink);
  });
});

if (catalogGrid) {
  const savedFilter = sessionStorage.getItem("imana_filter");
  if (savedFilter) {
    const savedButton = document.querySelector(`[data-filter="${savedFilter}"]`);
    if (savedButton) {
      document.querySelectorAll(".filter-btn").forEach((item) =>
        item.classList.toggle("active", item === savedButton));
      renderCatalog(savedFilter);
    }
    sessionStorage.removeItem("imana_filter");
  }
}

document.addEventListener("click", (event) => {
  const favorite = event.target.closest("[data-favorite]");
  if (favorite) {
    const id = Number(favorite.dataset.favorite);
    const active = !wishlist.includes(id);
    wishlist = active ? [...wishlist, id] : wishlist.filter((item) => item !== id);
    writeStorage(APP_CONFIG.storageKeys.wishlist, wishlist);
    document.querySelectorAll(`[data-favorite="${id}"]`).forEach((button) => {
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "♥" : "♡";
      const product = products.find((item) => item.id === id);
      button.setAttribute("aria-label", `${active ? "Retirer" : "Ajouter"} ${product?.name || "ce produit"} ${active ? "des" : "aux"} favoris`);
    });
    notify(active ? "Ajouté aux favoris." : "Retiré des favoris.");
    return;
  }
  const add = event.target.closest("[data-add]");
  if (!add) return;
  const id = Number(add.dataset.add);
  const current = cart.find((item) => item.id === id);
  if (current) current.quantity = Math.min(10, current.quantity + 1);
  else cart.push({ id, quantity: 1 });
  persistCart();
  notify(`${productMap.get(id)?.name} ajouté au panier.`);
});

const olfactoryForm = document.querySelector("#olfactoryForm");
const olfactoryResult = document.querySelector("#olfactoryResult");
const quizSteps = [...document.querySelectorAll("[data-quiz-step]")];
const diagnosticIndicators = [...document.querySelectorAll("[data-step-indicator]")];
const diagnosticStepLabel = document.querySelector("#diagnosticStepLabel");
const diagnosticBack = document.querySelector("#diagnosticBack");
const diagnosticNext = document.querySelector("#diagnosticNext");
const diagnosticReset = document.querySelector("#diagnosticReset");
const diagnosticSubmit = document.querySelector(".diagnostic-submit");
let currentQuizStep = 0;

function showQuizStep(index, moveFocus = true) {
  if (!quizSteps.length) return;
  currentQuizStep = Math.max(0, Math.min(index, quizSteps.length - 1));
  quizSteps.forEach((step, stepIndex) => { step.hidden = stepIndex !== currentQuizStep; });
  diagnosticIndicators.forEach((indicator, stepIndex) => {
    indicator.classList.toggle("is-active", stepIndex === currentQuizStep);
    indicator.classList.toggle("is-complete", stepIndex < currentQuizStep);
  });
  if (diagnosticStepLabel) diagnosticStepLabel.textContent = `Étape ${currentQuizStep + 1} sur ${quizSteps.length}`;
  if (diagnosticBack) diagnosticBack.hidden = currentQuizStep === 0;
  const isLastStep = currentQuizStep === quizSteps.length - 1;
  const hasSelection = Boolean(quizSteps[currentQuizStep].querySelector("input:checked"));
  if (diagnosticNext) {
    diagnosticNext.hidden = isLastStep;
    diagnosticNext.disabled = !hasSelection;
  }
  if (diagnosticSubmit) {
    diagnosticSubmit.hidden = !isLastStep;
    diagnosticSubmit.disabled = !hasSelection;
  }
  if (moveFocus) {
    const legend = quizSteps[currentQuizStep].querySelector("legend");
    legend?.setAttribute("tabindex", "-1");
    legend?.focus({ preventScroll: true });
  }
}

olfactoryForm?.addEventListener("change", (event) => {
  const selectedStep = event.target.closest("[data-quiz-step]");
  const selectedIndex = quizSteps.indexOf(selectedStep);
  if (selectedIndex !== currentQuizStep) return;
  if (diagnosticNext && currentQuizStep < quizSteps.length - 1) diagnosticNext.disabled = false;
  if (diagnosticSubmit && currentQuizStep === quizSteps.length - 1) diagnosticSubmit.disabled = false;
});
diagnosticNext?.addEventListener("click", () => {
  if (!quizSteps[currentQuizStep]?.querySelector("input:checked")) return;
  showQuizStep(currentQuizStep + 1);
});
diagnosticBack?.addEventListener("click", () => showQuizStep(currentQuizStep - 1));
diagnosticReset?.addEventListener("click", () => {
  olfactoryForm?.reset();
  if (olfactoryResult) {
    olfactoryResult.hidden = true;
    olfactoryResult.replaceChildren();
  }
  showQuizStep(0);
});
showQuizStep(0, false);

olfactoryForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const answers = Object.fromEntries(new FormData(olfactoryForm));
  const candidates = products.filter((product) => product.category === answers.family);
  let recommendation = candidates[0] || products.find((product) => product.category !== "accessoire");
  if (answers.intensity === "intense") {
    recommendation = candidates.find((product) => product.category === "oriental") || candidates.at(-1) || recommendation;
  }
  if (answers.occasion === "voyage") {
    recommendation = products.find((product) => product.category === "frais") || recommendation;
  }
  const familyLabels = { floral: "florale", boise: "boisée", frais: "fraîche", oriental: "orientale" };
  const intensityLabels = { subtile: "un sillage subtil", equilibree: "une présence équilibrée", intense: "un sillage intense" };
  const occasionLabels = { quotidien: "le quotidien", soiree: "vos soirées", voyage: "vos voyages" };
  const matchScore = answers.intensity === "equilibree" ? 96 : 92;
  olfactoryResult.hidden = false;
  diagnosticIndicators.forEach((indicator) => {
    indicator.classList.remove("is-active");
    indicator.classList.add("is-complete");
  });
  if (diagnosticStepLabel) diagnosticStepLabel.textContent = "Diagnostic terminé";
  olfactoryResult.innerHTML = `<img src="${recommendation.image}" alt="${recommendation.name}">
    <div><p class="eyebrow">Votre signature</p><h3>${recommendation.name}</h3>
    <p>${recommendation.notes}</p>
    <p class="diagnostic-match"><span>${matchScore}% de correspondance</span> Cette sélection relie votre sensibilité ${familyLabels[answers.family]}, ${intensityLabels[answers.intensity]} et une signature pensée pour ${occasionLabels[answers.occasion]}.</p>
    <strong>${formatCurrency(recommendation.price)}</strong>
    <div class="olfactory-result__actions"><button class="btn solid" type="button" data-add="${recommendation.id}">Ajouter au panier</button>
    <a class="btn" href="catalogue.html?univers=parfums">Voir la sélection</a></div></div>`;
  olfactoryResult.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
});

const overlay = document.createElement("div");
overlay.className = "shop-overlay";
overlay.setAttribute("aria-hidden", "true");
overlay.innerHTML = `<aside class="shop-panel" role="dialog" aria-modal="true" aria-label="Panneau client" tabindex="-1">
  <button class="overlay-close" type="button" aria-label="Fermer">×</button>
  <div id="shopPanelContent"></div></aside>`;
document.body.append(overlay);
const panel = overlay.querySelector("#shopPanelContent");
const panelDialog = overlay.querySelector(".shop-panel");
let panelOpener = null;
function openPanel(content) {
  panelOpener = document.activeElement;
  panel.innerHTML = content;
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-shop-panel");
  panelDialog.focus();
}
function closePanel() {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-shop-panel");
  panelOpener?.focus?.();
}
overlay.querySelector(".overlay-close").addEventListener("click", closePanel);
overlay.addEventListener("click", (event) => { if (event.target === overlay) closePanel(); });
overlay.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closePanel();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...panelDialog.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )];
  if (!focusable.length) {
    event.preventDefault();
    panelDialog.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function renderCart() {
  const lines = cart.flatMap((item) => {
    const product = productMap.get(Number(item.id));
    return product ? [{ product, quantity: Number(item.quantity) || 1 }] : [];
  });
  const total = lines.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
  openPanel(`<p class="eyebrow">Votre sélection</p><h2 class="section-title">Panier.</h2>
    ${lines.length ? lines.map(({ product, quantity }) => `<div class="cart-line">
      <img src="${product.image}" alt=""><div><strong>${product.name}</strong><br><small>Quantité ${quantity}</small></div>
      <button type="button" data-remove="${product.id}" aria-label="Retirer">×</button></div>`).join("") : "<p>Votre panier est vide.</p>"}
    <div class="cart-total"><span>Total</span><span>${formatCurrency(total)}</span></div>
    <button class="btn solid" id="sharedCheckout" type="button" ${lines.length ? "" : "disabled"}>Paiement sécurisé</button>`);
}

document.querySelectorAll(".cart-dot").forEach((dot) => {
  dot.closest("button")?.setAttribute("aria-label", "Ouvrir le panier");
  dot.closest("button")?.addEventListener("click", renderCart);
});
document.querySelectorAll(".favorites-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    const favorites = products.filter((product) => wishlist.includes(product.id));
    openPanel(`<p class="eyebrow">Votre sélection</p><h2 class="section-title">Favoris.</h2>
      ${favorites.length ? favorites.map((product) => `<a class="cart-line" href="catalogue.html?univers=${product.category === "accessoire" ? "accessoires" : "parfums"}">
        <img src="${product.image}" alt=""><span><strong>${product.name}</strong><small>${formatCurrency(product.price)}</small></span>
      </a>`).join("") : "<p>Vous n’avez encore ajouté aucun favori.</p>"}`);
  });
});
panel.addEventListener("click", async (event) => {
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    cart = cart.filter((item) => Number(item.id) !== Number(remove.dataset.remove));
    persistCart(); renderCart(); return;
  }
  if (event.target.id === "sharedCheckout") {
    event.target.disabled = true;
    try {
      const { url } = await apiRequest("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ items: cart.map(({ id, quantity }) => ({ id:Number(id), quantity:Number(quantity) })) }),
      });
      location.assign(url);
    } catch (error) { notify(error.message); event.target.disabled = false; }
  }
});

async function openAccount() {
  let user = null;
  try { user = (await apiRequest("/api/auth/me")).user; } catch {}
  if (user) {
    openPanel(`<p class="eyebrow">Espace client</p><h2 class="section-title" data-account-name></h2>
      <p data-account-email></p><button class="btn" id="sharedLogout">Se déconnecter</button>`);
    panel.querySelector("[data-account-name]").textContent = user.name;
    panel.querySelector("[data-account-email]").textContent = user.email;
    return;
  }
  openPanel(`<p class="eyebrow">Espace client</p><h2 class="section-title" id="sharedAccountTitle">Connexion.</h2>
    <form class="account-form" id="sharedAccountForm">
      <label data-name-field hidden>Nom complet<input name="name" minlength="2" maxlength="80"></label>
      <label>Adresse e-mail<input name="email" type="email" required></label>
      <label>Mot de passe<input name="password" type="password" minlength="10" required></label>
      <button class="btn solid" type="submit">Se connecter</button>
      <button class="btn" id="sharedAccountSwitch" type="button">Créer un compte</button>
    </form>`);
}
document.querySelectorAll(".login-btn").forEach((button) => {
  button.href = "#compte"; button.addEventListener("click", (event) => { event.preventDefault(); openAccount(); });
});
panel.addEventListener("submit", async (event) => {
  if (event.target.id !== "sharedAccountForm") return;
  event.preventDefault();
  const mode = event.target.dataset.mode || "login";
  try {
    const result = await apiRequest(`/api/auth/${mode}`, {
      method:"POST", body:JSON.stringify(Object.fromEntries(new FormData(event.target))),
    });
    notify(`Bienvenue, ${result.user.name}.`); openAccount();
  } catch (error) { notify(error.message); }
});
panel.addEventListener("click", async (event) => {
  if (event.target.id === "sharedAccountSwitch") {
    const form = document.querySelector("#sharedAccountForm");
    const register = form.dataset.mode !== "register";
    form.dataset.mode = register ? "register" : "login";
    form.querySelector("[data-name-field]").hidden = !register;
    form.querySelector('button[type="submit"]').textContent = register ? "Créer mon compte" : "Se connecter";
    event.target.textContent = register ? "J’ai déjà un compte" : "Créer un compte";
  }
  if (event.target.id === "sharedLogout") {
    await apiRequest("/api/auth/logout", { method:"POST" }); notify("Vous êtes déconnecté."); closePanel();
  }
});

document.querySelectorAll(".newsletter-form").forEach((form) => {
  form.removeAttribute("onsubmit");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = form.querySelector('input[type="email"]');
    const fullName = form.querySelector('[name="fullName"]');
    const phone = form.querySelector('[name="phone"]');
    try {
      await apiRequest("/api/newsletter", {
        method:"POST",
        body:JSON.stringify({ email:email.value, fullName:fullName.value, phone:phone.value }),
      });
      form.reset();
      notify("Bienvenue dans la communauté IMANA.");
      form.closest(".community-modal")?.dispatchEvent(new CustomEvent("community:joined"));
    }
    catch (error) { notify(error.message); }
  });
});

document.querySelectorAll(".search-box input").forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && input.value.trim()) location.href = `catalogue.html?q=${encodeURIComponent(input.value.trim())}`;
  });
});
document.querySelectorAll(".float-top").forEach((button) => {
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
});
const payment = new URLSearchParams(location.search).get("payment");
async function confirmReturnedPayment() {
  const sessionId = new URLSearchParams(location.search).get("session_id");
  if (!sessionId) {
    notify("Impossible de vérifier ce paiement.");
    return;
  }
  try {
    const { order } = await apiRequest(`/api/orders/status?session_id=${encodeURIComponent(sessionId)}`);
    if (order.status !== "paid") {
      notify("Paiement en cours de confirmation. Votre panier est conservé.");
      return;
    }
    cart = [];
    persistCart();
    notify("Paiement confirmé. Merci pour votre commande.");
    history.replaceState(null, "", location.pathname);
  } catch (error) {
    notify(error.message);
  }
}
if (payment === "success") confirmReturnedPayment();
if (payment === "cancelled") notify("Paiement annulé. Votre panier est conservé.");
persistCart();
