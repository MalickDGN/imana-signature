'use client';

import { useState } from 'react';
import { useAdminList } from '../../lib/useAdminList';

interface SocialPublicationRow {
  id: string;
  title: string;
  platform: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
}

const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'linkedin', 'whatsapp'];

export function SocialPublicationsPanel() {
  const { items, loading, error, reload } = useAdminList<SocialPublicationRow>('/api/admin/social-publications');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  const create = async (formData: FormData) => {
    setFormError('');
    const response = await fetch('/api/admin/social-publications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(formData.get('title') ?? ''),
        body: String(formData.get('body') ?? ''),
        platform: String(formData.get('platform') ?? ''),
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setFormError(payload.message ?? 'Création impossible.');
      return;
    }
    setCreating(false);
    await reload();
  };

  const publish = async (id: string) => {
    setActionError('');
    const response = await fetch(`/api/admin/social-publications/${id}/publish`, { method: 'POST' });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setActionError(payload.message ?? 'La publication a échoué.');
    }
    await reload();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/social-publications/${id}`, { method: 'DELETE' });
    await reload();
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Contenu</p>
          <h2>Publications</h2>
        </div>
        <button type="button" className="primary-action" onClick={() => setCreating((value) => !value)}>
          {creating ? 'Annuler' : 'Ajouter'}
        </button>
      </div>

      {creating && (
        <form className="editor-panel" action={(formData) => void create(formData)}>
          <label>
            Titre
            <input name="title" required />
          </label>
          <label>
            Contenu
            <textarea name="body" required rows={3} />
          </label>
          <label>
            Plateforme
            <select name="platform" required defaultValue="">
              <option value="" disabled>Choisir…</option>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </label>
          {formError && <p className="form-error">{formError}</p>}
          <button type="submit" className="primary-action">Enregistrer en brouillon</button>
        </form>
      )}

      {actionError && <div className="module-alert is-error">{actionError}</div>}
      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Plateforme</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.platform}</td>
                  <td>{row.status}</td>
                  <td style={{ display: 'flex', gap: '6px' }}>
                    {row.status !== 'published' && (
                      <button type="button" className="secondary-action" onClick={() => void publish(row.id)}>
                        Publier
                      </button>
                    )}
                    <button type="button" className="danger-action" onClick={() => void remove(row.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
