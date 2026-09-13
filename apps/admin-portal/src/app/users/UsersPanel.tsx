'use client';

import { useEffect, useState } from 'react';

const ROLES = [
  'ADMIN', 'MANAGER', 'COMMERCIAL', 'LOGISTICS', 'ACCOUNTING', 'SUPPORT',
  'CMS_EDITOR', 'CMS_REVIEWER', 'CMS_PUBLISHER', 'ETL_VIEWER', 'ETL_OPERATOR', 'ETL_APPROVER',
] as const;

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  roles: string[];
  active: boolean;
  created_at: string;
}

export function UsersPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['MANAGER']);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!response.ok) throw new Error('load failed');
      setUsers((await response.json()) as AdminUserRow[]);
    } catch {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createUser = async (formData: FormData) => {
    setFormError('');
    const body = {
      email: String(formData.get('email') ?? ''),
      name: String(formData.get('name') ?? ''),
      password: String(formData.get('password') ?? ''),
      roles: selectedRoles,
    };
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setFormError(payload.message ?? 'Création impossible.');
      return;
    }
    setCreating(false);
    setSelectedRoles(['MANAGER']);
    await load();
  };

  const toggleActive = async (userRow: AdminUserRow) => {
    await fetch(`/api/admin/users/${userRow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !userRow.active }),
    });
    await load();
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((entry) => entry !== role) : [...current, role],
    );
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Back-office</p>
          <h2>Comptes administrateurs</h2>
        </div>
        <button type="button" className="primary-action" onClick={() => setCreating((value) => !value)}>
          {creating ? 'Annuler' : 'Ajouter'}
        </button>
      </div>

      {creating && (
        <form
          className="editor-panel"
          action={(formData) => void createUser(formData)}
        >
          <label>
            Nom
            <input name="name" required minLength={2} />
          </label>
          <label>
            E-mail
            <input name="email" type="email" required />
          </label>
          <label>
            Mot de passe
            <input name="password" type="password" required minLength={12} />
          </label>
          <fieldset>
            <legend>Rôles</legend>
            {ROLES.map((role) => (
              <label key={role} style={{ display: 'inline-flex', gap: '4px', marginRight: '12px' }}>
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))}
          </fieldset>
          {formError && <p className="form-error">{formError}</p>}
          <button type="submit" className="primary-action">Créer le compte</button>
        </form>
      )}

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>E-mail</th>
                <th>Rôles</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.roles.join(', ')}</td>
                  <td>{row.active ? 'Actif' : 'Désactivé'}</td>
                  <td>
                    <button type="button" className="secondary-action" onClick={() => void toggleActive(row)}>
                      {row.active ? 'Désactiver' : 'Activer'}
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
