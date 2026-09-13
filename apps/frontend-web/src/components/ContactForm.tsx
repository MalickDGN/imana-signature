'use client';

import { FormEvent, useState } from 'react';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Contact request failed');
      form.reset();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
      <label className="grid gap-2">
        <span>Nom complet</span>
        <input name="name" required maxLength={120} className="min-h-11 border border-sable-dark bg-blanc px-3" />
      </label>
      <label className="grid gap-2">
        <span>Email</span>
        <input name="email" type="email" required className="min-h-11 border border-sable-dark bg-blanc px-3" />
      </label>
      <label className="grid gap-2">
        <span>Téléphone (facultatif)</span>
        <input name="phone" type="tel" maxLength={30} className="min-h-11 border border-sable-dark bg-blanc px-3" />
      </label>
      <label className="grid gap-2">
        <span>Message</span>
        <textarea name="message" required maxLength={2000} rows={6} className="border border-sable-dark bg-blanc p-3" />
      </label>
      <button disabled={status === 'sending'} className="min-h-11 bg-marine px-5 font-semibold text-ivoire disabled:opacity-60">
        {status === 'sending' ? 'Envoi en cours…' : 'Envoyer'}
      </button>
      <div aria-live="polite">
        {status === 'sent' && <p className="text-green-700">Votre message a bien été transmis.</p>}
        {status === 'error' && <p className="text-red-700">Le message n’a pas pu être envoyé. Réessayez plus tard.</p>}
      </div>
    </form>
  );
}
