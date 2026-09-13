'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  BarChart3,
  Download,
  Megaphone,
  MousePointerClick,
  Plus,
  RefreshCw,
  SearchCheck,
  Users,
} from 'lucide-react';

interface AnalyticsData {
  range: { from: string; to: string };
  metrics: {
    visitors: number;
    sessions: number;
    pageviews: number;
    conversions: number;
    revenue: number;
    bounceRate: number;
    conversionRate: number;
  };
  timeline: Array<{
    day: string;
    visitors: number;
    sessions: number;
    pageviews: number;
    conversions: number;
  }>;
  topPages: Array<{ label: string; count: number }>;
  sources: Array<{ label: string; count: number }>;
  seo: {
    published_articles: number;
    missing_metadata: number;
    published_faqs: number;
  };
  campaigns: Campaign[];
}

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  utmCampaign: string;
  budgetFcfa: number;
  sessions: number;
  conversions: number;
  revenue: number;
}

const number = new Intl.NumberFormat('fr-FR');
const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

export function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCampaign, setShowCampaign] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/analytics/overview', {
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? 'Chargement impossible.');
      setData(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erreur Analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const maxTimeline = Math.max(
    1,
    ...(data?.timeline.map((point) => point.pageviews) ?? []),
  );

  return (
    <section className="feature-section" id="analytics">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SEO & Marketing</p>
          <h2>Performance digitale</h2>
          <p>Mesures first-party, conversions et campagnes sur les 30 derniers jours.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-action" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> Actualiser
          </button>
          <a className="secondary-action" href="/api/admin/analytics/report">
            <Download size={16} /> Rapport
          </a>
          <button
            className="primary-action"
            type="button"
            onClick={() => setShowCampaign((visible) => !visible)}
          >
            <Plus size={16} /> Campagne
          </button>
        </div>
      </div>

      {showCampaign && (
        <CampaignForm
          onCreated={() => {
            setShowCampaign(false);
            void load();
          }}
        />
      )}

      {error && <div className="module-alert is-error">{error}</div>}
      {loading && !data ? (
        <div className="module-empty"><Activity size={24} /> Chargement des indicateurs…</div>
      ) : data ? (
        <>
          <div className="analytics-metrics">
            <AnalyticsMetric icon={<Users />} label="Visiteurs" value={number.format(data.metrics.visitors)} />
            <AnalyticsMetric icon={<Activity />} label="Sessions" value={number.format(data.metrics.sessions)} />
            <AnalyticsMetric icon={<BarChart3 />} label="Pages vues" value={number.format(data.metrics.pageviews)} />
            <AnalyticsMetric icon={<ArrowDownRight />} label="Taux de rebond" value={`${data.metrics.bounceRate} %`} />
            <AnalyticsMetric icon={<MousePointerClick />} label="Conversions" value={number.format(data.metrics.conversions)} />
            <AnalyticsMetric icon={<Megaphone />} label="Taux de conversion" value={`${data.metrics.conversionRate} %`} />
          </div>

          <div className="analytics-layout">
            <div className="panel analytics-chart">
              <div className="panel-heading">
                <div><p className="eyebrow">Audience</p><h3>Pages vues par jour</h3></div>
              </div>
              {data.timeline.length ? (
                <div className="spark-bars" aria-label="Évolution des pages vues">
                  {data.timeline.map((point) => (
                    <span
                      key={point.day}
                      style={{ height: `${Math.max(4, (point.pageviews / maxTimeline) * 100)}%` }}
                      title={`${point.day}: ${point.pageviews} pages vues`}
                    />
                  ))}
                </div>
              ) : (
                <div className="module-empty">La collecte démarre avec les premières visites.</div>
              )}
            </div>

            <div className="panel seo-health">
              <div className="panel-heading">
                <div><p className="eyebrow">Référencement</p><h3>Santé des contenus</h3></div>
                <SearchCheck size={20} />
              </div>
              <dl>
                <div><dt>Articles publiés</dt><dd>{data.seo.published_articles}</dd></div>
                <div><dt>FAQ publiées</dt><dd>{data.seo.published_faqs}</dd></div>
                <div className={data.seo.missing_metadata ? 'is-warning' : ''}>
                  <dt>Métadonnées à compléter</dt><dd>{data.seo.missing_metadata}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="analytics-layout analytics-tables">
            <RankTable title="Pages principales" rows={data.topPages} />
            <RankTable title="Sources de trafic" rows={data.sources} />
          </div>

          <div className="panel campaign-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">Acquisition</p><h3>Campagnes marketing</h3></div>
            </div>
            {data.campaigns.length ? (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead><tr><th>Campagne</th><th>Canal</th><th>Statut</th><th>Sessions</th><th>Conversions</th><th>Revenu</th><th></th></tr></thead>
                  <tbody>{data.campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td><strong>{campaign.name}</strong><small>{campaign.utmCampaign}</small></td>
                      <td>{campaign.channel}</td>
                      <td>
                        <select
                          value={campaign.status}
                          onChange={async (event) => {
                            await fetch(`/api/admin/analytics/campaigns/${campaign.id}`, {
                              method: 'PATCH',
                              headers: { 'content-type': 'application/json' },
                              body: JSON.stringify({ status: event.target.value }),
                            });
                            void load();
                          }}
                        >
                          <option value="draft">Brouillon</option>
                          <option value="active">Active</option>
                          <option value="paused">Suspendue</option>
                          <option value="completed">Terminée</option>
                        </select>
                      </td>
                      <td>{number.format(campaign.sessions)}</td>
                      <td>{number.format(campaign.conversions)}</td>
                      <td>{money.format(campaign.revenue)}</td>
                      <td>
                        <button
                          type="button"
                          className="danger-action"
                          onClick={async () => {
                            await fetch(`/api/admin/analytics/campaigns/${campaign.id}`, { method: 'DELETE' });
                            void load();
                          }}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div className="module-empty">Aucune campagne configurée.</div>}
          </div>
        </>
      ) : null}
    </section>
  );
}

function CampaignForm({ onCreated }: { onCreated(): void }) {
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/analytics/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        channel: form.get('channel'),
        status: form.get('status'),
        utmCampaign: form.get('utmCampaign'),
        utmSource: form.get('utmSource'),
        utmMedium: form.get('utmMedium'),
        budgetFcfa: Number(form.get('budgetFcfa') ?? 0),
      }),
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload.message ?? 'Création impossible.');
    onCreated();
  }

  return (
    <form className="inline-form campaign-form" onSubmit={submit}>
      <label>Nom<input name="name" required maxLength={180} /></label>
      <label>Canal<select name="channel"><option value="email">Email</option><option value="social">Social</option><option value="paid">Paid</option><option value="seo">SEO</option><option value="other">Autre</option></select></label>
      <label>Statut<select name="status"><option value="draft">Brouillon</option><option value="active">Active</option><option value="paused">Suspendue</option><option value="completed">Terminée</option></select></label>
      <label>UTM campaign<input name="utmCampaign" required maxLength={160} /></label>
      <label>UTM source<input name="utmSource" maxLength={120} /></label>
      <label>UTM medium<input name="utmMedium" maxLength={120} /></label>
      <label>Budget FCFA<input name="budgetFcfa" min="0" type="number" defaultValue="0" /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-action" type="submit">Créer</button>
    </form>
  );
}

function AnalyticsMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="analytics-metric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function RankTable({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  return <div className="panel rank-panel"><div className="panel-heading"><h3>{title}</h3></div>{rows.length ? <ol>{rows.map((row) => <li key={row.label}><span>{row.label}</span><strong>{number.format(row.count)}</strong></li>)}</ol> : <div className="module-empty">Aucune donnée.</div>}</div>;
}
