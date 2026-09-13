'use client';
import Link from 'next/link';
import { useCarousel } from './hooks';
export function CampaignBanner() { const ui = useCarousel(3, 8000);
return (<><div className={"catalog-banner"} id={"catalogBanner"} role={"region"} aria-roledescription={"carrousel"} aria-label={"Campagnes de la boutique"} onMouseEnter={() => ui.setHovered(true)} onMouseLeave={() => ui.setHovered(false)} onFocus={() => ui.setHovered(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) ui.setHovered(false); }} onTouchStart={event => { ui.start.current = event.changedTouches[0].clientX; }} onTouchEnd={event => ui.touchEnd(event.changedTouches[0].clientX)}>
<div className={"catalog-banner__track"}>
<article className={"catalog-banner__slide" + (ui.index === 0 ? ' is-active' : '')} aria-hidden={ui.index !== 0}>
<img src={"/assets/images/optimized/campaign-limited-edition.webp"} alt={"Édition limitée IMANA Signature"} width={"1600"} height={"900"} />
<div className={"catalog-banner__content"}>
<span>{"Édition limitée"}</span>
<h2>{"La rareté, le temps d’une "}<em>{"signature."}</em></h2>
<p>{"Des créations confidentielles disponibles jusqu’à épuisement."}</p>
<Link className={"btn solid"} href={"/collections?filter=niche"}>{"Découvrir la sélection"}</Link>
</div>
</article>
<article className={"catalog-banner__slide" + (ui.index === 1 ? ' is-active' : '')} aria-hidden={ui.index !== 1}>
<img src={"/assets/images/optimized/campaign-private-offer.webp"} alt={"Coffrets et attentions privées IMANA"} width={"1600"} height={"900"} loading={"lazy"} />
<div className={"catalog-banner__content"}>
<span>{"Art d’offrir"}</span>
<h2>{"Des attentions pensées pour "}<em>{"marquer."}</em></h2>
<p>{"Coffrets signature, écrins premium et essentiels nomades."}</p>
<Link className={"btn solid"} href={"/collections?univers=accessoires&filter=coffrets"}>{"Explorer les coffrets"}</Link>
</div>
</article>
<article className={"catalog-banner__slide" + (ui.index === 2 ? ' is-active' : '')} aria-hidden={ui.index !== 2}>
<img src={"/assets/images/optimized/prestige.webp"} alt={"Sélection Prestige IMANA Signature"} width={"1600"} height={"1024"} loading={"lazy"} />
<div className={"catalog-banner__content"}>
<span>{"Conseil personnalisé"}</span>
<h2>{"Trouvez le parfum qui vous "}<em>{"ressemble."}</em></h2>
<p>{"Trois réponses suffisent pour révéler votre profil olfactif."}</p>
<Link className={"btn solid"} href={"/#diagnostic"}>{"Lancer le diagnostic"}</Link>
</div>
</article>
</div>
<button className={"catalog-banner__arrow catalog-banner__arrow--prev"} type={"button"} aria-label={"Campagne précédente"} onClick={() => ui.next(-1)}>{"‹"}</button>
<button className={"catalog-banner__arrow catalog-banner__arrow--next"} type={"button"} aria-label={"Campagne suivante"} onClick={() => ui.next(1)}>{"›"}</button>
<div className={"catalog-banner__dots"} aria-label={"Choisir une campagne"}>{Array.from({length: 3}, (_, index) => <button type="button" key={index} className={ui.index === index ? 'is-active' : ''} aria-current={ui.index === index} aria-label={`Afficher la campagne ${index + 1}`} onClick={() => ui.setIndex(index)} />)}</div>
</div></>);
}
