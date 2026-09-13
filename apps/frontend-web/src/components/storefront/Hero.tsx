'use client';
import Link from 'next/link';
import { useCarousel } from './hooks';
import { FeaturedProduct } from './Editorial';
export function Hero() { const ui = useCarousel(5);
return (<><section className={"hero"} id={"accueil"}>
<div className={"hero-slider"} onMouseEnter={() => ui.setHovered(true)} onMouseLeave={() => ui.setHovered(false)} onFocus={() => ui.setHovered(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) ui.setHovered(false); }} onTouchStart={event => { ui.start.current = event.changedTouches[0].clientX; }} onTouchEnd={event => ui.touchEnd(event.changedTouches[0].clientX)}>
<article className={"hero-slide" + (ui.index === 0 ? ' active' : '')} aria-hidden={ui.index !== 0}>
<video className={"hero-media"} muted={true} loop={true} playsInline={true} preload={"metadata"} poster={"/assets/images/optimized/imana-product-1.webp"} aria-label={"Animation de la collection IMANA Signature"} ref={ui.video}>
<source src={"/assets/videos/imana-signature-hero.mp4"} type={"video/mp4"} />
</video>
<div className={"container hero-content"}>
<div className={"hero-kicker"}>{"parfums"}</div>
<h1>{"L'élégance en "}<span>{"signature."}</span></h1>
<p>{"Explorez des signatures olfactives contemporaines, avec sélection vérifiée et livraison à Dakar comme à l’international."}</p>
<div className={"hero-actions"}>
<Link href={"#nouvelle-collection"} className={"btn solid"}>{"découvrir la collection"}</Link>
<Link href={"/collections?univers=parfums"} className={"btn"}>{"voir tous les parfums"}</Link>
</div>
</div>
<FeaturedProduct />
</article>
<article className={"hero-slide" + (ui.index === 1 ? ' active' : '')} aria-hidden={ui.index !== 1}>
<img src={"/assets/images/optimized/prestige.webp"} alt={"Sélection d’accessoires premium IMANA"} width={"1600"} height={"1024"} loading={"lazy"} />
<div className={"container hero-content"}>
<div className={"hero-kicker"}>{"accessoires"}</div>
<h1>{"Les détails qui "}<span>{"signent."}</span></h1>
<p>{"Montres, bijoux, sacs et chaussures : des pièces premium pour compléter votre univers de style."}</p>
<div className={"hero-actions"}>
<Link href={"/collections?univers=accessoires"} className={"btn solid"}>{"découvrir les accessoires"}</Link>
<Link href={"/collections?univers=accessoires"} className={"btn"}>{"explorer la boutique"}</Link>
</div>
</div>
</article>
<article className={"hero-slide" + (ui.index === 2 ? ' active' : '')} aria-hidden={ui.index !== 2}>
<img src={"/assets/images/optimized/product-floral.webp"} alt={"Découvertes olfactives IMANA"} width={"1600"} height={"1024"} loading={"lazy"} />
<div className={"container hero-content"}>
<div className={"hero-kicker"}>{"découvertes"}</div>
<h1>{"Chaque note a son "}<span>{"moment."}</span></h1>
<p>{"Fresh, boisé, floral, intense, bureau, soirée ou voyage : naviguez par humeur et par occasion."}</p>
<div className={"hero-actions"}>
<Link href={"/collections?univers=parfums"} className={"btn solid"}>{"découvrir les filtres"}</Link>
<Link href={"/blog"} className={"btn"}>{"lire le magazine"}</Link>
</div>
</div>
</article>
<article className={"hero-slide" + (ui.index === 3 ? ' active' : '')} aria-hidden={ui.index !== 3}>
<img src={"/assets/images/optimized/evasion.webp"} alt={"Coffrets et offres privées IMANA"} width={"1600"} height={"1024"} loading={"lazy"} />
<div className={"container hero-content"}>
<div className={"hero-kicker"}>{"campagne promo"}</div>
<h1>{"Offres privées, "}<span>{"temps limité."}</span></h1>
<p>{"Profitez d'avantages exclusifs sur une sélection de parfums et coffrets premium."}</p>
<div className={"hero-actions"}>
<Link href={"#promo"} className={"btn solid"}>{"voir les offres"}</Link>
<Link href={"#nouvelle-collection"} className={"btn"}>{"nouvelle collection"}</Link>
</div>
</div>
</article>
<article className={"hero-slide hero-slide--signature" + (ui.index === 4 ? ' active' : '')} aria-hidden={ui.index !== 4}>
<img src={"/assets/images/optimized/imana-signature-flacon.webp"} alt={"Flacon et écrin bleu nuit de la collection Signature IMANA"} width={"1200"} height={"1800"} loading={"lazy"} decoding={"async"} />
<div className={"hero-signature-glow"} aria-hidden={"true"}></div>
<div className={"container hero-content"}>
<div className={"hero-kicker"}>{"collection signature"}</div>
<h1>{"La nuit révèle votre "}<span>{"signature."}</span></h1>
<p>{"Un flacon sculptural, un écrin bleu profond et un sillage boisé pensé comme une pièce de caractère."}</p>
<div className={"hero-actions"}>
<Link href={"#nouvelle-collection"} className={"btn solid"}>{"découvrir Signature"}</Link>
<Link href={"/collections?univers=parfums&filter=collection"} className={"btn"}>{"explorer la collection"}</Link>
</div>
</div>
</article>
<div className={"hero-arrows"}>
<button className={"arrow"} id={"prevHero"} type={"button"} aria-label={"Slide précédente"} onClick={() => ui.next(-1)}>{"‹"}</button>
<button className={"arrow"} id={"nextHero"} type={"button"} aria-label={"Slide suivante"} onClick={() => ui.next(1)}>{"›"}</button>
</div>
<div className={"hero-dots"} id={"heroDots"}>{Array.from({length: 5}, (_, index) => <button type="button" key={index} className={ui.index === index ? 'active' : ''} aria-current={ui.index === index} aria-label={`Afficher la diapositive ${index + 1}`} onClick={() => ui.setIndex(index)} />)}</div>
<button className={"hero-motion-toggle"} id={"toggleHeroMotion"} type={"button"} aria-pressed={ui.paused} aria-label={ui.paused ? 'Reprendre les animations du diaporama' : 'Suspendre les animations du diaporama'} onClick={ui.toggle}><span aria-hidden="true">{ui.paused ? "▶" : "Ⅱ"}</span><span>{ui.paused ? "Lecture" : "Pause"}</span></button>
</div>
</section></>);
}
