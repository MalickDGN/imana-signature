'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { approvedArticles, campaigns, universes } from '@/lib/storefront/editorial';
import { imageUrl, money } from '@/lib/storefront/model';
import { requestJson } from '@/lib/storefront/api';
import { useStorefront } from './StorefrontProvider';
import { CartAddIcon } from './ProductGrid';

export function FeaturedProduct() {
  const { products, add } = useStorefront(); const product = products.find(p => p.collection === 'Prestige') || products[1];
  if (!product) return null;
  return <aside className="hero-product-card" aria-label="Produit vedette"><img src={product.imageUrl} alt={product.name} width="900" height="1125"/><div><small>Signature prestige</small><strong>{product.name}</strong><span>{money(product.price)}</span></div><button type="button" onClick={() => add(product)} aria-label={`Ajouter ${product.name} au panier`} disabled={product.stock === 0}><CartAddIcon/></button></aside>;
}
export function Universes() {
  const grid = useRef<HTMLUListElement>(null); const [position,setPosition] = useState({first:true,last:false,current:1});
  function update() { const el=grid.current; if(!el)return; const step=(el.firstElementChild?.getBoundingClientRect().width || el.clientWidth)+(parseFloat(getComputedStyle(el).columnGap)||0);setPosition({first:el.scrollLeft<=8,last:el.scrollLeft>=el.scrollWidth-el.clientWidth-8,current:Math.min(universes.length,Math.round(el.scrollLeft/step)+1)}); }
  useEffect(() => { update(); const observer = new ResizeObserver(update); if(grid.current)observer.observe(grid.current); return () => observer.disconnect(); },[]);
  function move(direction:number){const el=grid.current;if(el)el.scrollBy({left:direction*((el.firstElementChild?.getBoundingClientRect().width || el.clientWidth)+(parseFloat(getComputedStyle(el).columnGap)||0)),behavior:'smooth'});}
  return <div className="universe-carousel" role="region" aria-label="Carrousel des univers IMANA">
    <button className="universe-carousel__control universe-carousel__control--prev" type="button" aria-label="Afficher les univers précédents" disabled={position.first} onClick={()=>move(-1)}>‹</button>
    <ul className="boutique-universe-grid" data-boutique-universes="" aria-busy="false" tabIndex={0} ref={grid} onScroll={update} onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}}}>
      {universes.map(entry=><li key={entry.id}><Link className="boutique-card" href={entry.href} data-rotation={entry.rotationDirection}><img className="boutique-card__image" src={entry.image.src} alt={entry.image.alt} width="900" height="1125" loading="lazy" decoding="async"/>{entry.badge&&<span className="boutique-card__badge">{entry.badge}</span>}<span className="boutique-card__content">{entry.itemCount!==undefined&&<span className="boutique-card__count">{entry.itemCount} créations</span>}<strong>{entry.title}</strong><small>{entry.description}</small><span className="boutique-card__cta">Découvrir <span aria-hidden="true">→</span></span></span></Link></li>)}
    </ul>
    <button className="universe-carousel__control universe-carousel__control--next" type="button" aria-label="Afficher les univers suivants" disabled={position.last} onClick={()=>move(1)}>›</button><p className="sr-only universe-carousel__status" aria-live="polite">Univers {position.current} sur {universes.length}</p>
  </div>;
}
export function Promotions() {
  // Approved campaign dates remain explicit editorial data, not invented API data.
  const [today,setToday]=useState('');useEffect(()=>setToday(new Date().toISOString().slice(0,10)),[]);
  return <div className="promo-grid" data-promo-banners="" aria-busy="false">{campaigns.filter(c=>c.isActive&&(!today||(c.startDate<=today&&c.endDate>=today))).map(c=><article className="promo-card is-visible" key={c.id}><img src={c.image.src} alt={c.image.alt} width="1200" height="800" loading="lazy" decoding="async"/><div className="promo-content"><span className="promo-label">{c.badge}</span><span className="promo-eyebrow">{c.eyebrow}</span><h3>{c.title}</h3><p>{c.description}</p><span className="promo-period">Disponible jusqu’au {new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(c.endDate+'T12:00:00Z'))}</span><Link className="btn solid" href={c.href}>{c.ctaLabel} <span aria-hidden="true">→</span></Link></div></article>)}</div>;
}
interface Article { id:string; title:string; excerpt?:string; categoryName?:string; coverUrl?:string; slug:string }
export function Articles() {
  const [articles,setArticles]=useState<Article[]>(approvedArticles);
  useEffect(()=>{const controller=new AbortController();requestJson<unknown>('/api/content/articles',{signal:controller.signal}).then(value=>{if(Array.isArray(value)&&value.length&&value.every(a=>a&&typeof a.id==='string'&&typeof a.title==='string'&&typeof a.slug==='string'))setArticles(value as Article[]);}).catch(()=>{/* Keep the approved editorial selection available. */});return()=>controller.abort();},[]);
  return <div className="article-grid">{articles.map((article,index)=><article className={`article${index===0?' featured':''}`} key={article.id}><img src={imageUrl(article.coverUrl)} alt={article.title} width={index===0?1000:800} height={index===0?1500:1200} loading="lazy" decoding="async"/><div className="article-body"><div className="article-date">{article.categoryName}</div><h3>{article.slug?<Link href={`/blog/${encodeURIComponent(article.slug)}`}>{article.title}</Link>:article.title}</h3><p>{article.excerpt}</p></div></article>)}</div>;
}
