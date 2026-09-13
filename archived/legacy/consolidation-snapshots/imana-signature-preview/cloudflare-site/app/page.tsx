"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Item = Record<string, string | number | null>;
type Dashboard = {
  sales: Item; stock: Item; customers: Item; invoicing: Item;
  payments: Item[]; deliveries: Item[];
};

const groups = [
  ["Pilotage", [["dashboard", "Vue d’ensemble"]]],
  ["Commerce", [["orders", "Commandes"], ["invoices", "Facturation"], ["transactions", "Paiements"], ["deliveries", "Livraisons"]]],
  ["Catalogue", [["products", "Produits"], ["variants", "Variantes"], ["categories", "Catégories"], ["stock", "Stock réel"]]],
  ["Audience", [["users", "Utilisateurs"], ["members", "Membres"], ["campaigns", "Campagnes"]]],
  ["Contenus", [["articles", "Articles"], ["faqs", "FAQ"], ["social-publications", "Réseaux sociaux"], ["seo-analysis", "Analyse SEO"]]],
  ["Configuration", [["payment-methods", "Moyens de paiement"], ["delivery-zones", "Zones de livraison"], ["audit-logs", "Journal d’audit"]]],
] as const;

const columns: Record<string, string[]> = {
  categories: ["name", "slug", "status", "sort_order"],
  products: ["name", "sku", "price", "stock", "status"],
  variants: ["name", "sku", "product_id", "price", "stock", "status"],
  users: ["name", "email", "role", "status"],
  members: ["full_name", "email", "phone", "status"],
  orders: ["id", "customer_email", "amount_total", "status", "delivery_status"],
  invoices: ["invoice_number", "total", "status", "due_at"],
  transactions: ["provider", "provider_reference", "amount", "status"],
  deliveries: ["recipient_name", "tracking_reference", "delivery_fee", "status"],
  campaigns: ["name", "channel", "audience", "status", "budget"],
  articles: ["title", "slug", "status", "published_at"],
  faqs: ["question", "category", "status"],
  "social-publications": ["network", "content", "status", "scheduled_at"],
  "payment-methods": ["name", "provider", "payment_timing", "enabled"],
  "delivery-zones": ["name", "fee", "estimated_days_min", "estimated_days_max", "enabled"],
  "audit-logs": ["created_at", "user_email", "action", "entity_type", "entity_id"],
};

const forms: Record<string, Array<[string, string, string]>> = {
  categories: [["name", "Nom", "text"], ["slug", "Slug", "text"], ["description", "Description", "textarea"], ["status", "Statut", "text"]],
  products: [["name", "Nom", "text"], ["slug", "Slug", "text"], ["sku", "SKU", "text"], ["description", "Description", "textarea"], ["price", "Prix", "number"], ["cost_price", "Prix de revient", "number"], ["stock", "Stock", "number"], ["status", "Statut", "text"]],
  variants: [["product_id", "ID produit", "number"], ["name", "Nom", "text"], ["sku", "SKU", "text"], ["price", "Prix", "number"], ["stock", "Stock", "number"], ["status", "Statut", "text"]],
  campaigns: [["name", "Nom", "text"], ["channel", "Canal", "text"], ["audience", "Audience", "text"], ["subject", "Sujet", "text"], ["content", "Contenu", "textarea"], ["budget", "Budget", "number"], ["status", "Statut", "text"]],
  articles: [["title", "Titre", "text"], ["slug", "Slug", "text"], ["excerpt", "Extrait", "textarea"], ["content", "Contenu", "textarea"], ["seo_title", "Titre SEO", "text"], ["seo_description", "Description SEO", "textarea"], ["status", "Statut", "text"]],
  faqs: [["question", "Question", "textarea"], ["answer", "Réponse", "textarea"], ["category", "Catégorie", "text"], ["status", "Statut", "text"]],
  "social-publications": [["network", "Réseau", "text"], ["content", "Contenu", "textarea"], ["media_url", "URL média", "text"], ["status", "Statut", "text"]],
  "payment-methods": [["name", "Nom", "text"], ["code", "Code", "text"], ["provider", "Fournisseur", "text"], ["payment_timing", "Encaissement", "text"], ["enabled", "Activé (1/0)", "number"]],
  "delivery-zones": [["name", "Nom", "text"], ["code", "Code", "text"], ["fee", "Frais", "number"], ["estimated_days_min", "Délai min.", "number"], ["estimated_days_max", "Délai max.", "number"], ["payment_timing", "Encaissement", "text"], ["enabled", "Activée (1/0)", "number"]],
};

async function api(path: string, options?: RequestInit) {
  const response = await fetch(`/api/admin/${path}`, {
    ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error || "Une erreur est survenue.");
  return body;
}

const money = (value: unknown) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(value) || 0);
const pretty = (key: string) => key.replaceAll("_", " ");
const isMoney = (key: string) => ["price", "cost_price", "amount", "amount_total", "total", "fee", "delivery_fee", "budget"].includes(key);

export default function Home() {
  const [view, setView] = useState("dashboard");
  const [user, setUser] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [seo, setSeo] = useState<{ articles: Item[]; products: Item[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState<Item | null | false>(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    try {
      if (!user) setUser((await api("me")).user);
      if (view === "dashboard") setDashboard(await api("dashboard"));
      else if (view === "seo-analysis") setSeo(await api("seo-analysis"));
      else if (view === "stock") setItems((await api("products")).items);
      else setItems((await api(view)).items);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Erreur"); }
    finally { setLoading(false); }
  }, [user, view]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => items.filter((item) =>
    !query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [items, query]);
  const currentTitle = groups.flatMap(([, links]) => links).find(([key]) => key === view)?.[1] || "Administration";

  return <div className="admin-shell">
    <aside className={`sidebar ${menu ? "open" : ""}`}>
      <button className="admin-brand" onClick={() => setView("dashboard")}>
        <Image src="/imana-logo.svg" alt="" width={38} height={48} /><span>IMANA<small>Administration</small></span>
      </button>
      <nav aria-label="Navigation administration">
        {groups.map(([group, links]) => <div key={group}><p className="nav-group">{group}</p>
          {links.map(([key, label]) => <button key={key} className={`nav-item ${view === key ? "active" : ""}`}
            onClick={() => { setView(key); setQuery(""); setMenu(false); }}>{label}</button>)}</div>)}
      </nav>
    </aside>
    <main className="admin-main">
      <header className="topbar">
        <button className="menu-toggle" aria-label="Ouvrir la navigation" onClick={() => setMenu(!menu)}>☰</button>
        <div><p className="eyebrow">Portail privé</p><h1>{currentTitle}</h1></div>
        <div className="account-menu"><span className="status-dot" /><div><strong>{user?.name || "Utilisateur"}</strong><small>{user?.role || "—"}</small></div>
          <button className="icon-button" aria-label="Actualiser" onClick={load}>↻</button></div>
      </header>
      <div className="content">
        {message && <p className="form-error" role="alert">{message}</p>}
        {loading ? <div className="loading">Chargement des données…</div> :
          view === "dashboard" && dashboard ? <DashboardView data={dashboard} /> :
          view === "seo-analysis" && seo ? <SeoView data={seo} /> :
          view === "stock" ? <StockView items={items} reload={load} setMessage={setMessage} /> :
          <ResourceView view={view} items={filtered} query={query} setQuery={setQuery}
            canWrite={Boolean(forms[view])} isAdmin={user?.role === "admin"} onEdit={setEditing}
            onDelete={async (id) => { if (!confirm("Supprimer définitivement cet élément ?")) return; await api(`${view}/${id}`, { method: "DELETE" }); load(); }} />}
      </div>
    </main>
    {editing !== false && <Editor view={view} item={editing} close={() => setEditing(false)}
      saved={() => { setEditing(false); setMessage("Enregistrement effectué."); load(); }} />}
  </div>;
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <article className="metric-card"><small>{label}</small><strong>{value}</strong><span>{note}</span></article>;
}

function DashboardView({ data }: { data: Dashboard }) {
  return <><section className="metric-grid">
    <Metric label="Chiffre d’affaires" value={money(data.sales.revenue)} note={`${data.sales.orders || 0} commandes`} />
    <Metric label="Panier moyen" value={money(data.sales.average_order)} note="Commandes payées" />
    <Metric label="Valeur du stock" value={money(data.stock.cost_value)} note={`${data.stock.units || 0} unités`} />
    <Metric label="Membres actifs" value={data.customers.members || 0} note={`${data.customers.users || 0} utilisateurs`} />
    <Metric label="Factures encaissées" value={money(data.invoicing.collected)} note={`${data.invoicing.invoices || 0} factures`} />
    <Metric label="Créances ouvertes" value={money(data.invoicing.outstanding)} note="Émises ou en retard" />
    <Metric label="Stock faible" value={data.stock.low_stock || 0} note={`${data.stock.products || 0} produits`} />
    <Metric label="Valeur commerciale" value={money(data.stock.retail_value)} note="Au prix de vente" />
  </section><section className="dashboard-grid">
    <StatusPanel title="Transactions de paiement" items={data.payments} />
    <StatusPanel title="État des livraisons" items={data.deliveries} />
  </section></>;
}

function StatusPanel({ title, items }: { title: string; items: Item[] }) {
  const total = items.reduce((sum, item) => sum + Number(item.count), 0) || 1;
  return <article className="panel"><div className="panel-header"><h2>{title}</h2></div><div className="progress-list">
    {items.length ? items.map((item) => <div className="progress-row" key={String(item.status)}><span>{item.status}</span>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${Number(item.count) / total * 100}%` }} /></div><strong>{item.count}</strong></div>)
      : <p className="empty-state">Aucune donnée pour le moment.</p>}
  </div></article>;
}

function ResourceView({ view, items, query, setQuery, canWrite, isAdmin, onEdit, onDelete }: {
  view: string; items: Item[]; query: string; setQuery: (v: string) => void; canWrite: boolean;
  isAdmin: boolean; onEdit: (item: Item | null) => void; onDelete: (id: string | number) => void;
}) {
  const keys = columns[view] || Object.keys(items[0] || {}).slice(0, 6);
  return <><div className="resource-toolbar"><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher dans cette liste" />
    {canWrite && <button className="primary-button" onClick={() => onEdit(null)}>Ajouter</button>}</div>
    <div className="table-wrap">{items.length ? <table><thead><tr>{keys.map((key) => <th key={key}>{pretty(key)}</th>)}<th>Actions</th></tr></thead>
      <tbody>{items.map((item) => <tr key={String(item.id)}>{keys.map((key) => <td key={key}>{isMoney(key) ? money(item[key]) :
        key === "status" || key === "role" ? <span className={`badge ${item[key]}`}>{item[key]}</span> : String(item[key] ?? "—").slice(0, 80)}</td>)}
        <td><div className="row-actions">{canWrite && <button onClick={() => onEdit(item)}>Modifier</button>}
          {canWrite && isAdmin && <button onClick={() => onDelete(item.id!)}>Supprimer</button>}</div></td></tr>)}</tbody></table>
      : <div className="empty-state"><h2>Aucun élément</h2><p>Ajoutez le premier élément ou modifiez la recherche.</p></div>}</div></>;
}

function Editor({ view, item, close, saved }: { view: string; item: Item | null; close: () => void; saved: () => void }) {
  const [error, setError] = useState("");
  return <div className="modal-backdrop"><section className="resource-modal" role="dialog" aria-modal="true" aria-label={`${item ? "Modifier" : "Ajouter"} ${view}`}>
    <header><div><p className="eyebrow">Édition</p><h2>{item ? "Modifier" : "Ajouter"}</h2></div><button onClick={close} aria-label="Fermer">×</button></header>
    <form onSubmit={async (event) => {
      event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
      for (const [name, , type] of forms[view]) if (type === "number" && values[name] !== "") values[name] = Number(values[name]) as never;
      try { await api(`${view}${item ? `/${item.id}` : ""}`, { method: item ? "PATCH" : "POST", body: JSON.stringify(values) }); saved(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Erreur"); }
    }}>{forms[view].map(([name, label, type]) => <label className={type === "textarea" ? "full" : ""} key={name}>{label}
      {type === "textarea" ? <textarea name={name} defaultValue={String(item?.[name] ?? "")} /> :
        <input name={name} type={type} defaultValue={String(item?.[name] ?? "")} required={["name", "slug", "title", "question", "answer"].includes(name)} />}</label>)}
      {error && <p className="form-error full">{error}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={close}>Annuler</button><button className="primary-button">Enregistrer</button></div>
    </form></section></div>;
}

function StockView({ items, reload, setMessage }: { items: Item[]; reload: () => void; setMessage: (v: string) => void }) {
  return <><div className="resource-toolbar"><p>Stock physique et valorisation en temps réel.</p></div>
    <div className="table-wrap"><table><thead><tr><th>Produit</th><th>SKU</th><th>Stock</th><th>Seuil</th><th>Valeur au coût</th><th>Mouvement</th></tr></thead>
      <tbody>{items.map((item) => <tr key={String(item.id)}><td>{item.name}</td><td>{item.sku}</td><td>{item.stock}</td><td>{item.low_stock_threshold}</td>
        <td>{money(Number(item.stock) * Number(item.cost_price))}</td><td><button className="secondary-button" onClick={async () => {
          const quantity = Number(prompt("Quantité signée (ex. 10 ou -2)")); if (!quantity) return;
          try { await api("stock/movements", { method: "POST", body: JSON.stringify({ product_id: item.id, movement_type: quantity > 0 ? "purchase" : "sale", quantity }) }); reload(); }
          catch (error) { setMessage(error instanceof Error ? error.message : "Erreur"); }
        }}>Ajuster</button></td></tr>)}</tbody></table></div></>;
}

function SeoView({ data }: { data: { articles: Item[]; products: Item[] } }) {
  const all = [...data.articles.map((x) => ({ ...x, type: "Article" })), ...data.products.map((x) => ({ ...x, type: "Produit", title: x.name }))];
  const average = all.length ? Math.round(all.reduce((sum, item) => sum + Number(item.score), 0) / all.length) : 0;
  return <><section className="metric-grid"><Metric label="Score SEO moyen" value={`${average}%`} note={`${all.length} contenus analysés`} />
    <Metric label="Contenus optimisés" value={all.filter((x) => Number(x.score) >= 75).length} note="Score supérieur ou égal à 75%" /></section>
    <div className="table-wrap"><table><thead><tr><th>Type</th><th>Contenu</th><th>Score</th></tr></thead><tbody>
      {all.map((item) => <tr key={`${item.type}-${item.id}`}><td>{item.type}</td><td>{item.title}</td><td><strong>{item.score}%</strong></td></tr>)}
    </tbody></table></div></>;
}
