'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { message?: string };
      setError(payload.message ?? 'Identifiants invalides.'); setLoading(false); return;
    }
    router.replace('/'); router.refresh();
  }
  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <span className="brand-mark">IS</span><p className="eyebrow">Maison IMANA</p><h1>Administration</h1>
    <label>Adresse e-mail<input name="email" type="email" autoComplete="username" required /></label>
    <label>Mot de passe<input name="password" type="password" autoComplete="current-password" minLength={12} required /></label>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="primary-action" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
  </form></main>;
}
