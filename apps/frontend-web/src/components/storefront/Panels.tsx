'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { useWishlistStore } from '@/lib/store/wishlist';
import { requestJson } from '@/lib/storefront/api';
import { money, imageUrl } from '@/lib/storefront/model';
import { useStorefront } from './StorefrontProvider';
import { useDialog } from './hooks';

interface Customer { name: string; email: string }
function customer(value: unknown): Customer | null {
  if (!value || typeof value !== 'object') return null;
  const user = (value as {user?: unknown}).user;
  return user && typeof user === 'object' && 'name' in user && 'email' in user && typeof user.name === 'string' && typeof user.email === 'string' ? {name:user.name,email:user.email} : null;
}
export function Panels() {
  const { panel, openPanel, notify } = useStorefront();
  const close = useCallback(() => openPanel(null), [openPanel]); const dialog = useRef<HTMLElement>(null);
  const open = panel !== null && panel !== 'community'; useDialog(open, close, dialog);
  const items = useCartStore(state => state.items); const remove = useCartStore(state => state.removeItem);
  const favorites = useWishlistStore(state => state.items);
  const [user, setUser] = useState<Customer | null>(null); const [mode, setMode] = useState<'login'|'register'>('login'); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (panel !== 'account') return;
    const controller = new AbortController(); setPending(true); setError('');
    requestJson<unknown>('/api/auth/me', { signal: controller.signal }).then(value => setUser(customer(value))).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setPending(false); });
    return () => controller.abort();
  }, [panel]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { const user = customer(await requestJson<unknown>(`/api/auth/${mode}`, {method:'POST',body:JSON.stringify(data)})); if (!user) throw new Error('Réponse de connexion invalide.'); setUser(user); notify(`Bienvenue, ${user.name}.`); }
    catch(e) { setError(e instanceof Error ? e.message : 'Connexion impossible.'); } finally { setPending(false); }
  }
  async function logout() { setPending(true); try { await requestJson('/api/auth/logout', {method:'POST'}); setUser(null); close(); notify('Vous êtes déconnecté.'); } catch(e) { setError(e instanceof Error ? e.message : 'Déconnexion impossible.'); } finally { setPending(false); } }
  if (!open) return null;
  return <div className="shop-overlay open" onClick={event => { if(event.target === event.currentTarget) close(); }}>
    <aside className="shop-panel" role="dialog" aria-modal="true" aria-label="Panneau client" tabIndex={-1} ref={dialog}>
      <button className="overlay-close" type="button" onClick={close} aria-label="Fermer le panneau">×</button>
      {panel === 'cart' && <><p className="eyebrow">Votre sélection</p><h2 className="section-title">Panier.</h2>
        {items.length ? items.map(item => <div className="cart-line" key={item.id}><img src={imageUrl(item.imageUrl)} alt=""/><div><strong>{item.name}</strong><br/><small>Quantité {item.quantity}</small></div><button type="button" aria-label={`Retirer ${item.name}`} onClick={() => remove(item.id)}>×</button></div>) : <p>Votre panier est vide.</p>}
        <div className="cart-total"><span>Total</span><span>{money(items.reduce((sum,item) => sum + item.price * item.quantity, 0))}</span></div>
        {items.length > 0 && <Link className="btn solid" href="/checkout" onClick={close}>Paiement sécurisé</Link>}
      </>}
      {panel === 'wishlist' && <><p className="eyebrow">Votre sélection</p><h2 className="section-title">Favoris.</h2>{favorites.length ? favorites.map(product => <Link className="cart-line" key={product.id} href={`/products/${encodeURIComponent(product.id)}`} onClick={close}><img src={imageUrl(product.imageUrl)} alt=""/><span><strong>{product.name}</strong><small>{money(product.price)}</small></span></Link>) : <p>Vous n’avez encore ajouté aucun favori.</p>}</>}
      {panel === 'account' && <><p className="eyebrow">Espace client</p><h2 className="section-title">{user ? user.name : mode === 'register' ? 'Créer un compte.' : 'Connexion.'}</h2>
        {user ? <><p>{user.email}</p><button className="btn" onClick={logout} disabled={pending}>Se déconnecter</button></> : <form className="account-form" onSubmit={submit}>
          {mode === 'register' && <label>Nom complet<input name="name" autoComplete="name" minLength={2} maxLength={80} required/></label>}
          <label>Adresse e-mail<input name="email" type="email" autoComplete="email" required/></label>
          <label>Mot de passe<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={10} required/></label>
          <button className="btn solid" type="submit" disabled={pending}>{pending ? 'Chargement…' : mode === 'register' ? 'Créer mon compte' : 'Se connecter'}</button>
          <button className="btn" type="button" onClick={() => {setMode(mode === 'login' ? 'register' : 'login');setError('');}}>{mode === 'login' ? 'Créer un compte' : 'J’ai déjà un compte'}</button>
        </form>}{error && <p role="alert" className="storefront-status">{error}</p>}
      </>}
    </aside>
  </div>;
}

export function useCommunity() {
  const { panel, openPanel, notify } = useStorefront(); const [pending, setPending] = useState(false);
  const close = useCallback(() => openPanel(null), [openPanel]); const dialog = useRef<HTMLDivElement>(null);
  useDialog(panel === 'community', close, dialog);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; setPending(true);
    try { await requestJson('/api/newsletter', {method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))}); form.reset(); close(); notify('Bienvenue dans la communauté IMANA.'); }
    catch(e) { notify(e instanceof Error ? e.message : 'Inscription indisponible.'); } finally { setPending(false); }
  }
  return { panel, close, dialog, submit, pending };
}
