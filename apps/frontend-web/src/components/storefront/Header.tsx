'use client';
import Link from 'next/link';
import { useHeader } from './hooks';
import { useStorefront } from './StorefrontProvider';
import { useCartStore } from '@/lib/store/cart';
export function Header() { const ui = useHeader(); const { openPanel, hydrated } = useStorefront(); const count = useCartStore(state => state.items.reduce((sum, item) => sum + item.quantity, 0));
return (<div ref={ui.root} style={{display: "contents"}}><div className={"topbar"}>
<div className={"marquee"}>
<span>{"parfums authentiques • livraison à dakar et à l’international • ouvert 24h/24, 7j/7 • conseil personnalisé • "}</span>
<span>{"parfums authentiques • livraison à dakar et à l’international • ouvert 24h/24, 7j/7 • conseil personnalisé • "}</span>
</div>
</div><header className={"header"}>
<nav className={"nav"}>
<Link href={"/"} className={"brand"}>
<span className={"brand-mark"}><img src={"/assets/images/branding/imana-logo-light.webp"} alt={"IMANA Signature"} width={"680"} height={"229"} /></span>
</Link>
<div className={'menu-row' + (ui.menu ? ' open' : '')}>
<Link href={"/collections"} className={"nav-link shop-trigger" + (ui.pathname === '/' || ui.pathname === '/collections' ? ' active' : '')} id={"shopTrigger"} onClick={(event) => { event.preventDefault(); ui.toggleMega(); }} onMouseEnter={() => ui.hover(true)} onMouseLeave={() => ui.hover(false)} aria-expanded={ui.mega} aria-controls={"megaMenu"} aria-haspopup={true}>{"\n            BOUTIQUE\n            "}<svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"}>
<path d={"m6 9 6 6 6-6"}></path>
</svg>
</Link>
<Link href={"/about"} className={"nav-link" + (ui.pathname === "/about" ? ' active' : '')}>{"LA MAISON"}</Link>
<Link href={"/blog"} className={"nav-link" + (ui.pathname === "/blog" ? ' active' : '')}>{"MAGAZINE"}</Link>
<a href={'/#contact'} className={"nav-link" + (ui.pathname === "#contact" ? ' active' : '')}>{"CONTACT"}</a>
</div>
<div className={"right-tools"}>
<label className={'search-box' + (ui.search ? ' is-mobile-open' : '')}>
<svg viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"}>
<circle cx={"11"} cy={"11"} r={"8"}></circle>
<path d={"m21 21-4.35-4.35"}></path>
</svg>
<input id={"globalSearch"} aria-label={"Rechercher un parfum"} placeholder={"Rechercher un parfum..."} ref={ui.input} onKeyDown={event => { if (event.key === 'Enter') ui.searchFor(event.currentTarget.value); }} />
</label><button className={"icon-btn mobile-search-toggle"} type={"button"} aria-label={"Ouvrir la recherche"} aria-expanded={ui.search} onClick={ui.toggleSearch}>
<svg viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"}><circle cx={"11"} cy={"11"} r={"8"}></circle><path d={"m21 21-4.35-4.35"}></path></svg>
</button><button className={"icon-btn favorites-trigger"} type={"button"} aria-label={"Ouvrir les favoris"} onClick={() => openPanel('wishlist')}>
<svg viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"}>
<path d={"M20.8 4.6c-1.7-1.7-4.5-1.7-6.2 0L12 7.2 9.4 4.6c-1.7-1.7-4.5-1.7-6.2 0s-1.7 4.5 0 6.2L12 19.6l8.8-8.8c1.7-1.7 1.7-4.5 0-6.2Z"}></path>
</svg>
</button><button className={"icon-btn cart-trigger"} type={"button"} aria-label={"Ouvrir le panier"} onClick={() => openPanel('cart')}>
<svg viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"}>
<path d={"M4 5h2l2.2 9h9.1l1.7-6H9"}></path><path d={"M13 3v6M10 6h6"}></path><circle cx={"10"} cy={"18.5"} r={"1"}></circle><circle cx={"17"} cy={"18.5"} r={"1"}></circle>
</svg>
<span className={"cart-dot"}>{hydrated ? count : 0}</span>
</button>
<Link className={"btn login-btn"} href={"#compte"} aria-label={"Se connecter"} onClick={event => { event.preventDefault(); openPanel('account'); }}><svg viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} aria-hidden={"true"}><circle cx={"12"} cy={"8"} r={"4"}></circle><path d={"M4.5 21a7.5 7.5 0 0 1 15 0"}></path></svg><span>{"Se connecter"}</span></Link>
<button className={"icon-btn mobile-toggle"} type={"button"} aria-label={ui.menu ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={ui.menu} onClick={ui.toggleMenu}>
<svg viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"}>
<path d={"M4 7h16M4 12h16M4 17h16"}></path>
</svg>
</button>
</div>
</nav>
</header><div className={'mega' + (ui.mega ? ' show' : '')} id={"megaMenu"} aria-hidden={!ui.mega} onMouseEnter={() => ui.hover(true)} onMouseLeave={() => ui.hover(false)}>
<div className={"mega-inner"}>
<div className={"mega-col"}>
<div className={"mega-title"}>{"PARFUMS"}</div>
<ul className={"mega-list"}>
<li><Link href={"/collections"}>{"Tous les parfums"}</Link></li>
<li><Link href={"/collections"}>{"Pour hommes"}</Link></li>
<li><Link href={"/collections"}>{"Pour femmes"}</Link></li>
<li><Link href={"/collections"}>{"Parfums designers"}</Link></li>
<li><Link href={"/collections"}>{"Parfums de niche"}</Link></li>
<li><Link href={"/collections"}>{"Collections privées"}</Link></li>
<li><Link href={"/collections"}>{"Nouvelle collection"}</Link></li>
</ul>
<Link className={"mega-more"} href={"/collections"}>{"Voir la boutique de parfums →"}</Link>
</div>
<div className={"mega-col"}>
<div className={"mega-title"}>{"MARQUES"}</div>
<ul className={"mega-list"}>
<li><Link href={"/collections?q=Dior"}>{"Dior"}</Link></li>
<li><Link href={"/collections?q=Chanel"}>{"Chanel"}</Link></li>
<li><Link href={"/collections?q=Tom%20Ford"}>{"Tom ford"}</Link></li>
<li><Link href={"/collections?q=Xerjoff"}>{"Xerjoff"}</Link></li>
<li><Link href={"/collections?q=Initio"}>{"Initio"}</Link></li>
<li><Link href={"/collections?q=Maison%20Francis%20Kurkdjian"}>{"Maison Francis Kurkdjian"}</Link></li>
</ul>
<Link className={"mega-more"} href={"/collections"}>{"Voir toutes les marques →"}</Link>
</div>
<div className={"mega-col"}>
<div className={"mega-title"}>{"ACCESSOIRES"}</div>
<ul className={"mega-list"}>
<li><Link href={"/collections?univers=accessoires&q=Montres"}>{"Montres"}</Link></li>
<li><Link href={"/collections?univers=accessoires&q=Bijoux"}>{"Bijoux"}</Link></li>
<li><Link href={"/collections?univers=accessoires&q=Sacs"}>{"Sacs"}</Link></li>
<li><Link href={"/collections?univers=accessoires&q=Chaussures"}>{"Chaussures"}</Link></li>
<li><Link href={"/collections?univers=accessoires"}>{"Curated collections"}</Link></li>
<li><Link href={"/collections?univers=accessoires&filter=collection"}>{"Éditions spéciales"}</Link></li>
</ul>
<Link className={"mega-more"} href={"/collections?univers=accessoires"}>{"Voir la boutique d'accessoires →"}</Link>
</div>
<div className={"mega-feature"}>
<div>
<div className={"eyebrow"}>{"Diagnostic olfactif"}</div>
<h3>{"Trouvez votre "}<span>{"signature."}</span></h3>
<p>{"Trois choix suffisent pour révéler le parfum le plus proche de votre humeur et de votre style."}</p>
<Link className={"btn solid"} href={"/#diagnostic"}>{"Commencer le diagnostic →"}</Link>
</div>
</div>
</div>
</div></div>);
}
