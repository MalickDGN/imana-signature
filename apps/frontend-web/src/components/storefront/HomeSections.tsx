'use client';
import Link from 'next/link';
import { Hero } from './Hero';
import { ProductGrid } from './ProductGrid';
import { Universes, Promotions } from './Editorial';
import { Diagnostic } from './Diagnostic';
import { useStorefront } from './StorefrontProvider';
export function HomeSections() { const { openPanel } = useStorefront();
return (<><Hero /><section className={"section boutique-universes"} id={"categories"} aria-labelledby={"boutique-universes-title"}>
<div className={"container"}>
<header className={"boutique-universes__header"}>
<div className={"eyebrow"}>{"explorer"}</div>
<h3 className={"section-title"} id={"boutique-universes-title"}>{"Les univers de la "}<span>{"Maison."}</span></h3>
<p>{"Découvrez nos parfums, collections exclusives, coffrets et accessoires dans un seul espace."}</p>
</header>
<Universes />
</div>
</section><section className={"section"} id={"promo"}>
<div className={"container"}>
<header className={"promo-section__header"}>
<h3 className={"section-title"}>{"Les temps forts de la "}<span>{"Maison."}</span></h3>
<p>{"Découvrez nos éditions exclusives et les offres réservées aux membres de la Maison."}</p>
</header>
<Promotions />
</div>
</section><section className={"section"} id={"nouvelle-collection"}>
<div className={"container"}>
<header className={"section-head"}>
<h3 className={"section-title"}>{"L'élégance tropicale, "}<span>{"réinventée."}</span></h3>
</header>
<article className={"premium-stage"}>
<img className={"premium-stage__backdrop"} src={"/assets/images/optimized/prestige.webp"} alt={"Collection premium IMANA"} width={"900"} height={"945"} loading={"lazy"} decoding={"async"} />
<div className={"premium-stage__content"}>
<div className={"eyebrow"}>{"édition signature"}</div>
<h3>{"Une collection mise en "}<span>{"scène."}</span></h3>
<p>{"Des sillages profonds, des matières lumineuses et un écrin cadeau offert pour chaque pièce de la sélection Prestige."}</p>
<Link className={"btn solid"} href={"/collections?univers=parfums"}>{"Explorer Prestige"}</Link>
</div>
<div className={"premium-stage__products"} aria-hidden={"true"}>
<img src={"/assets/images/optimized/imana-product-2.webp"} alt={""} width={"900"} height={"1125"} loading={"lazy"} decoding={"async"} />
<img src={"/assets/images/optimized/imana-product-3.webp"} alt={""} width={"900"} height={"1125"} loading={"lazy"} decoding={"async"} />
<span>{"Collection"}<br /><strong>{"Prestige"}</strong></span>
</div>
</article>
<ProductGrid kind="collection" />
</div>
</section><section className={"section"} id={"parfums"}>
<div className={"container"}>
<header className={"section-head"}>
<h3 className={"section-title"}>{"Best-sellers "}<span>{"olfactifs."}</span></h3>
</header>
<ProductGrid kind="parfums" />
<div className={"section-actions"}>
<Link href={"/collections?univers=parfums"} className={"btn section-actions__cta"}>{"Voir tous les parfums "}<span aria-hidden={"true"}>{"→"}</span></Link>
</div>
</div>
</section><section className={"section"} id={"accessoires"}>
<div className={"container"}>
<header className={"section-head"}>
<h3 className={"section-title"}>{"Pièces de "}<span>{"caractère."}</span></h3>
</header>
<ProductGrid kind="accessoires" />
<div className={"section-actions"}>
<Link href={"/collections?univers=accessoires"} className={"btn section-actions__cta"}>{"Voir tous les accessoires "}<span aria-hidden={"true"}>{"→"}</span></Link>
</div>
</div>
</section><section className={"brand-reference"} aria-labelledby={"brand-reference-title"}>
<div className={"container"}>
<h2 className={"brand-reference__title"} id={"brand-reference-title"}><span aria-hidden={"true"}></span>{"Maisons de référence"}<span aria-hidden={"true"}></span></h2>
<ul className={"brand-reference__list"} aria-label={"Marques disponibles dans la sélection IMANA"}>
<li>{"Dior"}</li><li>{"Chanel"}</li><li>{"Tom Ford"}</li><li>{"Xerjoff"}</li><li>{"Givenchy"}</li><li>{"Armani"}</li>
</ul>
</div>
</section><section className={"trustbar"} aria-label={"Services"}>
<div className={"trustbar__grid"}>
<div className={"trust-item"}>
<span className={"trust-item__icon"} aria-hidden={"true"}><svg viewBox={"0 0 24 24"}><path d={"M3 7h11v10H3zM14 10h4l3 3v4h-7z"}></path><circle cx={"7"} cy={"18"} r={"2"}></circle><circle cx={"18"} cy={"18"} r={"2"}></circle></svg></span>
<span><strong>{"Livraison locale"}</strong><small>{"Dakar sous 24 à 48 heures"}</small></span>
</div>
<div className={"trust-item"}>
<span className={"trust-item__icon"} aria-hidden={"true"}><svg viewBox={"0 0 24 24"}><path d={"M12 3 4 6v5c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-3Z"}></path><path d={"m9 12 2 2 4-5"}></path></svg></span>
<span><strong>{"Paiement sécurisé"}</strong><small>{"Wave ou paiement à la livraison"}</small><span className={"payment-marks"} aria-label={"Wave et paiement à la livraison"}><b className={"payment-mark wave"}>{"wave"}</b><b className={"payment-mark"}>{"À la livraison"}</b></span></span>
</div>
<div className={"trust-item"}>
<span className={"trust-item__icon"} aria-hidden={"true"}><svg viewBox={"0 0 24 24"}><path d={"M4 12a8 8 0 1 1 3 6"}></path><path d={"M4 17v-5h5"}></path></svg></span>
<span><strong>{"Conseil personnalisé"}</strong><small>{"Diagnostic olfactif interactif"}</small></span>
</div>
<div className={"trust-item"}>
<span className={"trust-item__icon"} aria-hidden={"true"}><svg viewBox={"0 0 24 24"}><path d={"M4 7h16v12H4zM8 7V5h8v2"}></path><path d={"M4 11h16"}></path></svg></span>
<span><strong>{"Coffret signature"}</strong><small>{"Emballage cadeau offert"}</small></span>
</div>
</div>
</section><Diagnostic /><section className={"newsletter"} id={"contact"}>
<div className={"container newsletter-box"}>
<div>
<div className={"eyebrow"} style={{"color":"rgb(63, 48, 41)"}}>{"contact & nouveautés"}</div>
<h2>{"Rejoindre la communauté."}</h2>
<p className={"newsletter-benefit"}>{"Profitez de 10 % sur votre première commande et recevez nos sélections privées."}</p>
</div>
<button className={"btn dark community-join-trigger"} id={"communityJoinTrigger"} type={"button"} aria-haspopup={"dialog"} aria-controls={"communityModal"} onClick={() => openPanel('community')}>{"Rejoindre"}</button>
</div>
</section></>);
}
