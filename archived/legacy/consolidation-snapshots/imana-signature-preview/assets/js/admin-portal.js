const state = { user: null, view: "dashboard", items: [], query: "" };
const login = document.querySelector("#adminLogin");
const shell = document.querySelector("#adminShell");
const content = document.querySelector("#adminContent");
const title = document.querySelector("#viewTitle");
const eyebrow = document.querySelector("#viewEyebrow");
const modal = document.querySelector("#resourceModal");
const modalDialog = modal.querySelector(".resource-modal");
const form = document.querySelector("#resourceForm");
let lastFocus = null;
let toastTimer;

const labels = {
  dashboard: ["Pilotage", "Vue d’ensemble"], orders: ["Commerce", "Commandes"],
  invoices: ["Commerce", "Facturation"], transactions: ["Commerce", "Paiements"],
  deliveries: ["Opérations", "Livraisons"], products: ["Catalogue", "Produits"],
  variants: ["Catalogue", "Variantes"], categories: ["Catalogue", "Catégories"],
  stock: ["Catalogue", "Stock réel"], users: ["Audience", "Utilisateurs"],
  members: ["Audience", "Membres"], campaigns: ["Marketing", "Campagnes"],
  articles: ["Contenus", "Articles"], faqs: ["Contenus", "FAQ"],
  "social-publications": ["Contenus", "Réseaux sociaux"],
  "seo-analysis": ["Acquisition", "Analyse SEO"],
  "payment-methods": ["Configuration", "Moyens de paiement"],
  "delivery-zones": ["Configuration", "Zones de livraison"],
  "audit-logs": ["Sécurité", "Journal d’audit"],
};

const resourceConfig = {
  categories: {
    columns: ["name", "slug", "status", "sort_order"],
    fields: [
      ["name", "Nom", "text", true], ["slug", "Slug", "text", true],
      ["description", "Description", "textarea"], ["sort_order", "Ordre", "number"],
      ["status", "Statut", "select", true, ["active", "inactive"]],
    ],
  },
  products: {
    columns: ["name", "sku", "price", "stock", "status"],
    fields: [
      ["name", "Nom", "text", true], ["slug", "Slug", "text", true],
      ["sku", "SKU", "text"], ["category_id", "ID catégorie", "number"],
      ["description", "Description", "textarea"], ["price", "Prix de vente", "number", true],
      ["cost_price", "Prix de revient", "number"], ["stock", "Stock initial", "number"],
      ["low_stock_threshold", "Seuil d’alerte", "number"], ["image_url", "URL de l’image", "url"],
      ["seo_title", "Titre SEO", "text"], ["seo_description", "Description SEO", "textarea"],
      ["status", "Statut", "select", true, ["draft", "active", "inactive", "archived"]],
    ],
  },
  variants: {
    columns: ["name", "sku", "product_id", "price", "stock", "status"],
    fields: [
      ["product_id", "ID produit", "number", true], ["name", "Nom", "text", true],
      ["sku", "SKU", "text", true], ["attributes_json", "Attributs JSON", "textarea"],
      ["price", "Prix", "number"], ["cost_price", "Prix de revient", "number"],
      ["stock", "Stock", "number"], ["status", "Statut", "select", true, ["active", "inactive"]],
    ],
  },
  campaigns: {
    columns: ["name", "channel", "status", "starts_at", "budget"],
    fields: [
      ["name", "Nom", "text", true], ["channel", "Canal", "select", true, ["email", "sms", "whatsapp", "social", "mixed"]],
      ["audience", "Audience", "text"], ["subject", "Sujet", "text"], ["content", "Contenu", "textarea"],
      ["starts_at", "Début", "datetime-local"], ["ends_at", "Fin", "datetime-local"],
      ["budget", "Budget", "number"], ["status", "Statut", "select", true, ["draft", "scheduled", "active", "paused", "completed"]],
    ],
  },
  articles: {
    columns: ["title", "slug", "status", "published_at"],
    fields: [
      ["title", "Titre", "text", true], ["slug", "Slug", "text", true],
      ["excerpt", "Extrait", "textarea"], ["content", "Contenu", "textarea"],
      ["seo_title", "Titre SEO", "text"], ["seo_description", "Description SEO", "textarea"],
      ["published_at", "Publication", "datetime-local"],
      ["status", "Statut", "select", true, ["draft", "scheduled", "published", "archived"]],
    ],
  },
  faqs: {
    columns: ["question", "category", "status", "sort_order"],
    fields: [
      ["question", "Question", "textarea", true], ["answer", "Réponse", "textarea", true],
      ["category", "Catégorie", "text"], ["sort_order", "Ordre", "number"],
      ["status", "Statut", "select", true, ["draft", "published", "archived"]],
    ],
  },
  "social-publications": {
    columns: ["network", "content", "status", "scheduled_at"],
    fields: [
      ["network", "Réseau", "select", true, ["instagram", "facebook", "tiktok", "linkedin", "x"]],
      ["content", "Contenu", "textarea", true], ["media_url", "URL média", "url"],
      ["scheduled_at", "Date prévue", "datetime-local"],
      ["status", "Statut", "select", true, ["draft", "scheduled"]],
    ],
  },
  "payment-methods": {
    columns: ["name", "code", "provider", "payment_timing", "enabled"],
    fields: [
      ["name", "Nom", "text", true], ["code", "Code", "text", true],
      ["provider", "Fournisseur", "text", true],
      ["payment_timing", "Encaissement", "select", true, ["order", "delivery"]],
      ["enabled", "Activé", "checkbox"],
    ],
  },
  "delivery-zones": {
    columns: ["name", "code", "fee", "payment_timing", "enabled"],
    fields: [
      ["name", "Nom", "text", true], ["code", "Code", "text", true],
      ["fee", "Frais", "number", true], ["free_from", "Gratuit à partir de", "number"],
      ["estimated_days_min", "Délai minimum", "number"], ["estimated_days_max", "Délai maximum", "number"],
      ["payment_timing", "Encaissement", "select", true, ["order", "delivery"]],
      ["enabled", "Activée", "checkbox"],
    ],
  },
  users: {
    columns: ["name", "email", "role", "status", "created_at"],
    fields: [
      ["name", "Nom", "text", true], ["email", "E-mail", "email", true],
      ["phone", "Téléphone", "tel"], ["password", "Mot de passe", "password", true],
      ["role", "Rôle", "select", true, ["visitor", "client", "manager", "admin"]],
      ["status", "Statut", "select", true, ["active", "suspended"]],
    ],
  },
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function formatCurrency(value, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value.includes?.("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function notify(message) {
  const toast = document.querySelector("#adminToast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.error || "Une erreur est survenue.");
    error.status = response.status;
    error.details = body?.details;
    throw error;
  }
  return body;
}

async function authenticate() {
  try {
    state.user = (await api("/api/admin/me")).user;
    showPortal();
    await navigate(location.hash.slice(1) || "dashboard", false);
  } catch {
    login.hidden = false;
    shell.hidden = true;
  }
}

function showPortal() {
  login.hidden = true;
  shell.hidden = false;
  document.querySelector("#adminName").textContent = state.user.name;
  document.querySelector("#adminRole").textContent = state.user.role;
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.hidden = state.user.role !== "admin";
  });
}

document.querySelector("#adminLoginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#loginError");
  error.textContent = "";
  try {
    await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(event.target))),
    });
    await authenticate();
  } catch (requestError) {
    error.textContent = requestError.message;
  }
});

document.querySelector("#adminLogout").addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" });
  state.user = null;
  shell.hidden = true;
  login.hidden = false;
  document.querySelector("#adminLoginForm").reset();
});

document.querySelector("#adminSidebar").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  navigate(button.dataset.view);
  document.querySelector("#adminSidebar").classList.remove("open");
  document.querySelector("#menuToggle").setAttribute("aria-expanded", "false");
});
document.querySelector("#refreshView").addEventListener("click", () => navigate(state.view, false));
document.querySelector("#menuToggle").addEventListener("click", (event) => {
  const open = document.querySelector("#adminSidebar").classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});

async function navigate(view, updateHash = true) {
  if (!labels[view] || (view === "audit-logs" && state.user.role !== "admin")) view = "dashboard";
  state.view = view;
  state.query = "";
  if (updateHash) history.replaceState(null, "", `#${view}`);
  [eyebrow.textContent, title.textContent] = labels[view];
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  content.innerHTML = '<div class="loading">Chargement des données…</div>';
  try {
    if (view === "dashboard") return renderDashboard(await api("/api/admin/dashboard"));
    if (view === "seo-analysis") return renderSeo(await api("/api/admin/seo-analysis"));
    if (view === "stock") return renderStock(await api("/api/admin/products?limit=100"));
    const result = await api(`/api/admin/${view}?limit=100`);
    state.items = result.items || [];
    renderResource(view);
  } catch (error) {
    if (error.status === 401 || error.status === 403) return authenticate();
    content.innerHTML = `<div class="empty-state"><h2>Impossible de charger cette vue</h2><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function metric(label, value, note) {
  return `<article class="metric-card"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`;
}

function renderDashboard(data) {
  const paymentTotal = data.payments.reduce((sum, item) => sum + item.count, 0) || 1;
  const deliveryTotal = data.deliveries.reduce((sum, item) => sum + item.count, 0) || 1;
  content.innerHTML = `
    <section class="metric-grid">
      ${metric("Chiffre d’affaires", formatCurrency(data.sales.revenue), `${data.sales.orders} commandes`)}
      ${metric("Panier moyen", formatCurrency(data.sales.average_order), "Commandes payées")}
      ${metric("Valeur du stock", formatCurrency(data.stock.cost_value), `${data.stock.units} unités physiques`)}
      ${metric("Membres actifs", data.customers.members, `${data.customers.clients} comptes clients`)}
      ${metric("Factures encaissées", formatCurrency(data.invoicing.collected), `${data.invoicing.invoices} factures`)}
      ${metric("Créances ouvertes", formatCurrency(data.invoicing.outstanding), "Émises ou en retard")}
      ${metric("Stock faible", data.stock.low_stock, `${data.stock.products} produits suivis`)}
      ${metric("Valeur commerciale", formatCurrency(data.stock.retail_value), "Au prix de vente")}
    </section>
    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-header"><h2>Transactions de paiement</h2><button class="secondary-button" data-go="transactions">Voir les transactions</button></div>
        <div class="progress-list">${progressRows(data.payments, paymentTotal)}</div>
      </article>
      <article class="panel">
        <div class="panel-header"><h2>État des livraisons</h2><button class="secondary-button" data-go="deliveries">Voir les livraisons</button></div>
        <div class="progress-list">${progressRows(data.deliveries, deliveryTotal)}</div>
      </article>
    </section>`;
  content.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
}

function progressRows(items, total) {
  if (!items.length) return '<p class="empty-state">Aucune donnée pour le moment.</p>';
  return items.map((item) => `<div class="progress-row"><span>${escapeHtml(item.status)}</span>
    <div class="progress-track"><div class="progress-fill" style="width:${Math.round(item.count / total * 100)}%"></div></div>
    <strong>${item.count}</strong></div>`).join("");
}

function tableConfig(view) {
  const fixed = {
    orders: ["id", "customer_name", "email", "amount_total", "status", "delivery_status", "created_at"],
    invoices: ["invoice_number", "customer_email", "total", "status", "due_at"],
    transactions: ["id", "payment_method_name", "provider_reference", "amount", "status", "created_at"],
    deliveries: ["id", "zone_name", "recipient_name", "tracking_reference", "delivery_fee", "status"],
    members: ["full_name", "email", "phone", "status", "subscribed_at"],
    "audit-logs": ["created_at", "user_email", "action", "entity_type", "entity_id", "ip_address"],
  };
  return resourceConfig[view]?.columns || fixed[view] || Object.keys(state.items[0] || {}).slice(0, 7);
}

function displayCell(key, value, row) {
  if (["price", "cost_price", "amount", "amount_total", "total", "delivery_fee", "budget"].includes(key)) {
    return formatCurrency(value, row.currency || "XOF");
  }
  if (key.endsWith("_at") || key === "created_at") return formatDate(value);
  if (["status", "role", "payment_timing"].includes(key)) return `<span class="badge ${escapeHtml(value)}">${escapeHtml(value ?? "—")}</span>`;
  if (key === "enabled") return value ? "Oui" : "Non";
  const textValue = String(value ?? "—");
  return escapeHtml(textValue.length > 72 ? `${textValue.slice(0, 72)}…` : textValue);
}

function renderResource(view) {
  const columns = tableConfig(view);
  const canCreate = Boolean(resourceConfig[view]);
  const rows = state.items.filter((item) =>
    !state.query || JSON.stringify(item).toLowerCase().includes(state.query.toLowerCase()));
  content.innerHTML = `
    <div class="resource-toolbar">
      <input id="resourceSearch" type="search" placeholder="Rechercher dans cette liste" value="${escapeHtml(state.query)}">
      ${canCreate ? `<button class="primary-button" id="createResource">Ajouter</button>` : ""}
    </div>
    <div class="table-wrap">
      ${rows.length ? `<table><thead><tr>${columns.map((key) => `<th>${escapeHtml(key.replaceAll("_", " "))}</th>`).join("")}<th>Actions</th></tr></thead>
      <tbody>${rows.map((row) => `<tr>${columns.map((key) => `<td>${displayCell(key, row[key], row)}</td>`).join("")}
      <td><div class="row-actions">${resourceConfig[view] ? `<button data-edit="${row.id}">Modifier</button>` : ""}
      ${view === "social-publications" ? `<button data-publish="${row.id}">Publier</button>` : ""}
      ${resourceConfig[view] && state.user.role === "admin" ? `<button data-delete="${row.id}">Supprimer</button>` : ""}</div></td></tr>`).join("")}</tbody></table>`
        : '<div class="empty-state"><h2>Aucun élément</h2><p>La liste est vide ou aucun résultat ne correspond à la recherche.</p></div>'}
    </div>`;
  document.querySelector("#resourceSearch").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderResource(view);
    document.querySelector("#resourceSearch").focus();
  });
  document.querySelector("#createResource")?.addEventListener("click", () => openResourceModal(view));
  content.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () =>
    openResourceModal(view, state.items.find((item) => item.id === Number(button.dataset.edit)))));
  content.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteResource(view, button.dataset.delete)));
  content.querySelectorAll("[data-publish]").forEach((button) => button.addEventListener("click", () => publishSocial(button.dataset.publish)));
}

function fieldHtml(field, item = {}) {
  const [name, fieldLabel, type, required, choices] = field;
  let value = item[name] ?? "";
  if (name.endsWith("_json") && typeof value !== "string") value = JSON.stringify(value || {}, null, 2);
  const requiredAttribute = required ? "required" : "";
  if (type === "textarea") return `<label class="full">${escapeHtml(fieldLabel)}<textarea name="${name}" ${requiredAttribute}>${escapeHtml(value)}</textarea></label>`;
  if (type === "select") return `<label>${escapeHtml(fieldLabel)}<select name="${name}" ${requiredAttribute}>
    ${choices.map((choice) => `<option value="${choice}" ${value === choice ? "selected" : ""}>${escapeHtml(choice)}</option>`).join("")}</select></label>`;
  if (type === "checkbox") return `<label><span>${escapeHtml(fieldLabel)}</span><input name="${name}" type="checkbox" ${value ? "checked" : ""}></label>`;
  return `<label>${escapeHtml(fieldLabel)}<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${requiredAttribute}></label>`;
}

function openResourceModal(view, item = null) {
  lastFocus = document.activeElement;
  modal.hidden = false;
  modal.querySelector("#modalTitle").textContent = item ? `Modifier — ${labels[view][1]}` : `Ajouter — ${labels[view][1]}`;
  form.dataset.view = view;
  form.dataset.id = item?.id || "";
  const fields = item && view === "users"
    ? resourceConfig.users.fields.filter(([name]) => !["email", "password"].includes(name))
    : resourceConfig[view].fields;
  form.innerHTML = `${fields.map((field) => fieldHtml(field, item || {})).join("")}
    <div class="form-actions"><button class="secondary-button" type="button" data-close-modal>Annuler</button>
    <button class="primary-button" type="submit">Enregistrer</button></div>`;
  modalDialog.focus();
}

function closeModal() {
  modal.hidden = true;
  form.reset();
  lastFocus?.focus?.();
}
modal.addEventListener("click", (event) => {
  if (event.target === modal || event.target.closest("[data-close-modal]")) closeModal();
});
modal.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

form.addEventListener("submit", async (event) => {
  if (form.dataset.view === "stock") return;
  event.preventDefault();
  const view = form.dataset.view;
  const id = form.dataset.id;
  const data = {};
  for (const [name, , type] of resourceConfig[view].fields) {
    const input = form.elements[name];
    if (!input || (id && view === "users" && ["email", "password"].includes(name))) continue;
    if (type === "checkbox") data[name] = input.checked;
    else if (type === "number") {
      if (input.value === "") continue;
      data[name] = Number(input.value);
    }
    else if (name.endsWith("_json")) {
      try { data[name] = input.value ? JSON.parse(input.value) : {}; }
      catch { notify("Le champ JSON n’est pas valide."); return; }
    } else data[name] = input.value || null;
  }
  try {
    await api(`/api/admin/${view}${id ? `/${id}` : ""}`, {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(data),
    });
    closeModal();
    notify("Enregistrement effectué.");
    await navigate(view, false);
  } catch (error) {
    notify(error.message);
  }
});

async function deleteResource(view, id) {
  if (!confirm("Supprimer définitivement cet élément ?")) return;
  try {
    await api(`/api/admin/${view}/${id}`, { method: "DELETE" });
    notify("Élément supprimé.");
    await navigate(view, false);
  } catch (error) { notify(error.message); }
}

async function publishSocial(id) {
  try {
    await api(`/api/admin/social-publications/${id}/publish`, { method: "POST" });
    notify("Publication envoyée.");
    await navigate("social-publications", false);
  } catch (error) { notify(error.message); }
}

function renderStock(result) {
  state.items = result.items || [];
  content.innerHTML = `
    <div class="resource-toolbar"><p>Enregistrez chaque entrée, vente, retour ou ajustement pour conserver un stock réel.</p>
      <button class="primary-button" id="newMovement">Nouveau mouvement</button></div>
    <div class="table-wrap"><table><thead><tr><th>Produit</th><th>SKU</th><th>Stock</th><th>Seuil</th><th>Valeur au coût</th><th>État</th></tr></thead>
    <tbody>${state.items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.sku)}</td><td>${item.stock}</td>
      <td>${item.low_stock_threshold}</td><td>${formatCurrency(item.stock * item.cost_price)}</td>
      <td><span class="badge ${item.stock <= item.low_stock_threshold ? "failed" : "active"}">${item.stock <= item.low_stock_threshold ? "Stock faible" : "Disponible"}</span></td></tr>`).join("")}</tbody></table></div>`;
  document.querySelector("#newMovement").addEventListener("click", openStockModal);
}

function openStockModal() {
  lastFocus = document.activeElement;
  modal.hidden = false;
  modal.querySelector("#modalTitle").textContent = "Nouveau mouvement de stock";
  form.dataset.view = "stock";
  form.dataset.id = "";
  form.innerHTML = `
    <label>Produit<select name="product_id" required>${state.items.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} — ${item.stock}</option>`).join("")}</select></label>
    <label>Type<select name="movement_type"><option value="purchase">Entrée</option><option value="sale">Vente</option><option value="return">Retour</option><option value="adjustment">Ajustement</option><option value="damage">Perte</option></select></label>
    <label>Quantité signée<input name="quantity" type="number" required placeholder="Ex. 10 ou -2"></label>
    <label>Coût unitaire<input name="unit_cost" type="number" min="0"></label>
    <label>Référence<input name="reference"></label><label class="full">Note<textarea name="note"></textarea></label>
    <div class="form-actions"><button class="secondary-button" type="button" data-close-modal>Annuler</button><button class="primary-button">Enregistrer</button></div>`;
}

function renderSeo(data) {
  const all = [...data.articles.map((item) => ({ ...item, type: "Article" })),
    ...data.products.map((item) => ({ ...item, type: "Produit", title: item.name }))];
  const average = all.length ? Math.round(all.reduce((sum, item) => sum + item.score, 0) / all.length) : 0;
  content.innerHTML = `
    <section class="metric-grid">${metric("Score SEO moyen", `${average}%`, `${all.length} contenus analysés`)}
      ${metric("Contenus optimisés", all.filter((item) => item.score >= 75).length, "Score supérieur ou égal à 75%")}
      ${metric("À améliorer", all.filter((item) => item.score < 75).length, "Métadonnées ou contenu incomplets")}
      ${metric("Articles publiés", data.articles.filter((item) => item.status === "published").length, "Indexables actuellement")}</section>
    <div class="table-wrap"><table><thead><tr><th>Type</th><th>Contenu</th><th>Score</th><th>Titre</th><th>Description</th><th>Contenu</th></tr></thead>
    <tbody>${all.map((item) => `<tr><td>${item.type}</td><td>${escapeHtml(item.title)}</td><td><strong>${item.score}%</strong></td>
      ${["title", "description", "content"].map((check) => `<td><span class="badge ${item.checks[check] ? "active" : "failed"}">${item.checks[check] ? "OK" : "À revoir"}</span></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

form.addEventListener("submit", async (event) => {
  if (form.dataset.view !== "stock") return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  try {
    await api("/api/admin/stock/movements", {
      method: "POST",
      body: JSON.stringify({
        product_id: Number(values.product_id),
        movement_type: values.movement_type,
        quantity: Number(values.quantity),
        unit_cost: values.unit_cost ? Number(values.unit_cost) : null,
        reference: values.reference || null,
        note: values.note || null,
      }),
    });
    closeModal();
    notify("Stock mis à jour.");
    await navigate("stock", false);
  } catch (error) { notify(error.message); }
}, { capture: true });

authenticate();
