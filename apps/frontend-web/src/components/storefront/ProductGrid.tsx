'use client';
import Link from 'next/link';
import { useWishlistStore } from '@/lib/store/wishlist';
import { money, matchesFilter, type StorefrontProduct } from '@/lib/storefront/model';
import { useStorefront } from './StorefrontProvider';

export function CartAddIcon() { return <svg className="cart-add-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l2.2 9h9.1l1.7-6H9"/><path d="M13 3v6M10 6h6"/><circle cx="10" cy="18.5" r="1"/><circle cx="17" cy="18.5" r="1"/></svg>; }
export function StorefrontProductCard({ product }: { product: StorefrontProduct }) {
  const { add, hydrated } = useStorefront();
  const favorites = useWishlistStore(state => state.items);
  const toggle = useWishlistStore(state => state.toggle);
  const favorite = hydrated && favorites.some(p => p.id === product.id);
  const unavailable = product.stock === 0;
  return <article className="product-card" data-product-id={product.id}>
    <div className="product-visual">
      {product.badge && <span className={`badge${product.collection === 'Prestige' ? ' collection' : ''}`}>{product.badge}</span>}
      <Link href={`/products/${encodeURIComponent(product.id)}`}><img src={product.imageUrl} alt={product.name} width="900" height="1125" loading="lazy"/></Link>
      <button className="fav" type="button" onClick={() => toggle(product)} aria-label={`${favorite ? 'Retirer' : 'Ajouter'} ${product.name} ${favorite ? 'des' : 'aux'} favoris`} aria-pressed={favorite}>{favorite ? '♥' : '♡'}</button>
      <button className="btn add-hover" type="button" onClick={() => add(product)} disabled={unavailable}>{unavailable ? 'Indisponible' : 'Ajouter au panier'}</button>
    </div>
    <div className="product-info"><div className="product-meta">{product.family}{product.format ? ` · ${product.format} ml` : ''}</div>
      <h3 className="product-name"><Link href={`/products/${encodeURIComponent(product.id)}`}>{product.name}</Link></h3><p className="product-note">{product.notes}</p>
      <div className="product-bottom"><strong className="price">{money(product.price)}</strong><button className="plus" type="button" onClick={() => add(product)} aria-label={`Ajouter ${product.name} au panier`} disabled={unavailable}><CartAddIcon/></button></div>
    </div>
  </article>;
}
export function CatalogStatus() {
  const { loading, error, reload } = useStorefront();
  return loading ? <p className="storefront-status" role="status">Chargement de la sélection…</p> : error ? <div className="storefront-status" role="alert"><p>{error}</p><button className="btn" onClick={reload}>Réessayer</button></div> : null;
}
export function ProductGrid({ kind }: { kind: string }) {
  const { products, loading, error } = useStorefront();
  const selection = products.filter(p => matchesFilter(p, kind === 'accessoires' ? 'accessoires' : 'parfums')).slice(0, 4);
  return <><CatalogStatus/><div className="product-grid" data-product-section={kind}>{selection.map(p => <StorefrontProductCard key={p.id} product={p}/>)}</div>{!loading && !error && !selection.length && <p>Aucune création disponible pour le moment.</p>}</>;
}
