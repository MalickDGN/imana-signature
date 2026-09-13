'use client';

import { useEffect, useState } from 'react';

interface SeoIssue {
  entityType: 'article' | 'product';
  entityId: string;
  title: string;
  issues: string[];
}

interface SeoAnalysis {
  items: SeoIssue[];
  healthy: number;
  total: number;
}

export function SeoPanel() {
  const [analysis, setAnalysis] = useState<SeoAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/admin/seo-analysis', { cache: 'no-store' });
        if (!response.ok) throw new Error('load failed');
        setAnalysis((await response.json()) as SeoAnalysis);
      } catch {
        setError('Analyse SEO indisponible.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Diagnostic</p>
          <h2>Points à corriger</h2>
        </div>
        {analysis && <span className="result-count">{analysis.healthy}/{analysis.total} sains</span>}
      </div>

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && analysis && (
        analysis.items.length === 0 ? (
          <div className="module-empty">Aucun problème SEO détecté.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Titre</th>
                  <th>Problèmes</th>
                </tr>
              </thead>
              <tbody>
                {analysis.items.map((item) => (
                  <tr key={`${item.entityType}-${item.entityId}`}>
                    <td>{item.entityType === 'article' ? 'Article' : 'Produit'}</td>
                    <td>{item.title}</td>
                    <td>{item.issues.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  );
}
