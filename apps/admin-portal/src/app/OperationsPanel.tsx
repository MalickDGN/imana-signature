'use client';

import { useCallback, useEffect, useState } from 'react';

interface OperationsData {
  metrics: { revenue: number; orders: number; averageOrder: number; customers: number; lowStock: number; pendingPayments: number; failedEtl: number };
  recentOrders: Array<{ id: number; reference: string; date: string; amount: number; customer: string; status: string; invoiceStatus: string }>;
  payments: Array<{ id: string; order_id: number; provider: string; amount_fcfa: number | string; external_reference?: string; status: string; created_at: string }>;
  etlJobs: Array<{ id: string; object_type: string; file_name: string; status: string; environment: string; updated_at: string }>;
  etlEvents: Array<{ id: number; job_id: string; file_name: string; event_type: string; details: { actor?: { id: string; email: string } | null }; happened_at: string }>;
  integrations: Array<{ name: string; status: string; configured: boolean }>;
}

const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });

export function OperationsPanel() {
  const [data, setData] = useState<OperationsData | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    const response = await fetch('/api/admin/operations/overview', { cache: 'no-store' });
    if (!response.ok) { setError('Les données opérationnelles sont indisponibles.'); return; }
    setData(await response.json() as OperationsData);
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (error) return <section className="panel module-alert is-error" role="alert">{error}<button type="button" onClick={() => void load()}>Réessayer</button></section>;
  if (!data) return <section className="panel module-empty" role="status">Chargement des opérations…</section>;
  const metrics = data.metrics;
  return <section className="feature-section" id="operations">
    <div className="section-heading"><div><p className="eyebrow">Données Odoo et paiements</p><h2>Pilotage opérationnel</h2></div><button className="secondary-action" type="button" onClick={() => void load()}>Actualiser</button></div>
    <div className="metrics-grid">
      <MiniMetric label="Chiffre d’affaires" value={money.format(metrics.revenue)} /><MiniMetric label="Commandes" value={String(metrics.orders)} /><MiniMetric label="Panier moyen" value={money.format(metrics.averageOrder)} /><MiniMetric label="Clients" value={String(metrics.customers)} /><MiniMetric label="Paiements en attente" value={String(metrics.pendingPayments)} /><MiniMetric label="Jobs ETL en erreur" value={String(metrics.failedEtl)} />
    </div>
    <div className="overview-grid">
      <div className="panel"><h3>Commandes récentes</h3><div className="table-scroll"><table><thead><tr><th>Référence</th><th>Client</th><th>Date</th><th>Montant</th><th>Commande</th><th>Facture</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.id}><td>{order.reference}</td><td>{order.customer}</td><td>{new Date(order.date).toLocaleDateString('fr-FR')}</td><td>{money.format(order.amount)}</td><td>{order.status}</td><td>{order.invoiceStatus}</td></tr>)}</tbody></table></div>{!data.recentOrders.length && <p className="module-empty">Aucune commande confirmée.</p>}</div>
      <div className="panel"><h3>Intégrations</h3>{data.integrations.map((item) => <div className="service-row" key={item.name}><span className={`status-dot ${item.configured ? 'is-online' : ''}`} /><strong>{item.name}</strong><small>{item.status}</small></div>)}</div>
    </div>
    <div className="overview-grid"><div className="panel"><h3>Paiements Mobile Money</h3><div className="table-scroll"><table><thead><tr><th>Commande</th><th>Opérateur</th><th>Montant</th><th>Statut</th><th>Référence externe</th></tr></thead><tbody>{data.payments.map((payment) => <tr key={payment.id}><td>#{payment.order_id}</td><td>{payment.provider}</td><td>{money.format(Number(payment.amount_fcfa))}</td><td>{payment.status}</td><td>{payment.external_reference ?? '—'}</td></tr>)}</tbody></table></div>{!data.payments.length && <p className="module-empty">Aucune transaction enregistrée.</p>}</div><div className="panel"><h3>Historique ETL</h3>{data.etlJobs.map((job) => <div className="service-row" key={job.id}><strong>{job.file_name}</strong><small>{job.object_type} · {job.environment} · {job.status}</small></div>)}{!data.etlJobs.length && <p className="module-empty">Aucun job persistant.</p>}</div></div>
    <div className="panel"><h3>Journal des actions ETL</h3><div className="table-scroll"><table><thead><tr><th>Date</th><th>Fichier</th><th>Action</th><th>Acteur</th></tr></thead><tbody>{data.etlEvents.map((event) => <tr key={event.id}><td>{new Date(event.happened_at).toLocaleString('fr-FR')}</td><td>{event.file_name}</td><td>{event.event_type}</td><td>{event.details.actor?.email ?? 'Système'}</td></tr>)}</tbody></table></div>{!data.etlEvents.length && <p className="module-empty">Aucun événement ETL enregistré.</p>}</div>
  </section>;
}

function MiniMetric({ label, value }: { label: string; value: string }) { return <article className="metric-card"><div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong></div></article>; }
