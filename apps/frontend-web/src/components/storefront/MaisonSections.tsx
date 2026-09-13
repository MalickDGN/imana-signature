import Link from 'next/link';

export function MaisonSections() { 
return (<><section className={"page-hero page-hero--maison"} aria-labelledby={"maison-hero-title"}>
<img className={"page-hero__media"} src={"/assets/images/optimized/manifesto.webp"} alt={"Univers lumineux et matières de la Maison IMANA"} width={"900"} height={"1125"} />
<div className={"page-hero__content"}>
<div className={"eyebrow"}>{"la maison"}</div>
<h1 id={"maison-hero-title"}>{"L'élégance en "}<span>{"héritage."}</span></h1>
<p>{"Une maison contemporaine où le parfum, les matières et le geste racontent une vision singulière du raffinement."}</p>
<Link className={"btn solid"} href={"#histoire"}>{"Découvrir notre histoire"}</Link>
</div>
</section><section className={"section"} id={"histoire"}>
<div className={"container split"}>
<div className={"text-block"}>
<div className={"eyebrow"}>{"notre histoire"}</div>
<h2>{"Une signature "}<span>{"premium."}</span></h2>
<p>{"IMANA Signature est une maison de parfum et de lifestyle contemporain : des fragrances authentiques, des accessoires de caractère et un service de proximité pensé autour de chaque client."}</p>
<p>{"La page LA MAISON sert d'espace institutionnel : histoire, positionnement, valeurs, promesse client, engagements qualité et présentation de l'équipe."}</p>
<Link className={"btn solid"} href={"/collections"} style={{"marginTop":"28px"}}>{"explorer la boutique →"}</Link>
</div>
<div className={"image-frame"}>
<img src={"/assets/images/optimized/imana-brand-universe.webp"} alt={"Univers de marque IMANA Signature : textile, accessoires et objets lifestyle bleu nuit, ivoire et or"} width={"1600"} height={"900"} loading={"lazy"} decoding={"async"} />
</div>
</div>
</section><section className={"section"} id={"values"} style={{"background":"var(--navy2)"}}>
<div className={"container"}>
<header className={"section-head"}>
<h3 className={"section-title"}>{"Authenticité, "}<span>{"confiance,"}</span>{" élégance."}</h3>
</header>
<div className={"values"}>
<article className={"value-card"}><h4>{"Authenticité"}</h4><p>{"Chaque parfum est présenté comme un produit vérifié, avec une promesse claire sur la qualité et l'origine."}</p></article>
<article className={"value-card"}><h4>{"Service"}</h4><p>{"Livraison à Dakar et à l’international, paiement flexible et accompagnement personnalisé."}</p></article>
<article className={"value-card"}><h4>{"Raffinement"}</h4><p>{"Une identité éditoriale, premium et distinctive, au-dessus des templates e-commerce classiques."}</p></article>
</div>
</div>
</section><section className={"section maison-about"} id={"a-propos"} aria-labelledby={"about-title"}>
<div className={"container"}>
<header className={"section-head"}>
<h3 className={"section-title"} id={"about-title"}>{"À propos de la "}<span>{"Maison."}</span></h3>
</header>
<div className={"maison-about__grid"}>
<article className={"maison-about__card maison-about__card--story"}>
<span className={"maison-about__index"}>{"01"}</span>
<div>
<h3>{"Histoire IMANA Signature"}</h3>
<p>{"Née à Dakar, IMANA Signature imagine une expérience où la parfumerie sélective rencontre l’élégance contemporaine. La Maison rassemble des créations authentiques, choisies pour leur émotion, leur qualité et leur capacité à accompagner chaque personnalité."}</p>
</div>
</article>
<article className={"maison-about__card"}>
<span className={"maison-about__index"}>{"02"}</span>
<div>
<h3>{"Vision & valeurs"}</h3>
<p>{"Rendre le beau accessible sans banaliser l’exception : authenticité des produits, écoute attentive, transparence et service disponible 24h/24 guident chaque relation."}</p>
</div>
</article>
<article className={"maison-about__card"}>
<span className={"maison-about__index"}>{"03"}</span>
<div>
<h3>{"Luxe & lifestyle"}</h3>
<p>{"Notre vision du luxe est personnelle et vivante. Parfums et accessoires composent un vestiaire sensoriel pensé pour Dakar, le voyage et les moments qui méritent une signature."}</p>
</div>
</article>
</div>
</div>
</section><section className={"section maison-guides"} id={"conseils"} aria-labelledby={"guides-title"}>
<div className={"container"}>
<header className={"section-head"}>
<h3 className={"section-title"} id={"guides-title"}>{"Conseils & "}<span>{"inspirations."}</span></h3>
</header>
<div className={"maison-guides__grid"}>
<article className={"guide-card guide-card--featured"}>
<img src={"/assets/images/optimized/journal-featured.webp"} alt={"Conseillère IMANA présentant une sélection olfactive"} width={"1200"} height={"675"} loading={"lazy"} decoding={"async"} />
<div className={"guide-card__body"}>
<span>{"Accompagnement"}</span>
<h3>{"Conseils personnalisés"}</h3>
<p>{"Votre peau, vos goûts et votre rythme de vie sont uniques. Notre diagnostic vous aide à identifier les familles, intensités et occasions qui vous correspondent."}</p>
<Link href={"/#diagnostic"}>{"Lancer mon diagnostic "}<span aria-hidden={"true"}>{"→"}</span></Link>
</div>
</article>
<article className={"guide-card"}>
<span>{"Guide 01"}</span>
<h3>{"Comment choisir son parfum"}</h3>
<p>{"Apprenez à lire les familles olfactives, tester une fragrance sur peau et laisser évoluer ses notes avant de décider."}</p>
<Link href={"/blog"}>{"Lire le guide "}<span aria-hidden={"true"}>{"→"}</span></Link>
</article>
<article className={"guide-card"}>
<span>{"Guide 02"}</span>
<h3>{"Comment porter un parfum"}</h3>
<p>{"Découvrez les points de pulsation, la juste quantité et les gestes qui respectent la construction de votre fragrance."}</p>
<Link href={"/blog"}>{"Découvrir les gestes "}<span aria-hidden={"true"}>{"→"}</span></Link>
</article>
<article className={"guide-card"}>
<span>{"Expertise"}</span>
<h3>{"Astuces de tenue"}</h3>
<p>{"Hydratation, conservation et superposition : les essentiels pour prolonger le sillage sans dénaturer les notes."}</p>
<Link href={"/blog"}>{"Voir les astuces "}<span aria-hidden={"true"}>{"→"}</span></Link>
</article>
<article className={"guide-card"}>
<span>{"Style"}</span>
<h3>{"Parfum, look & occasion"}</h3>
<p>{"Accordez une fragrance fraîche au bureau, un boisé à une silhouette structurée ou un oriental à vos soirées."}</p>
<Link href={"/collections"}>{"Composer ma signature "}<span aria-hidden={"true"}>{"→"}</span></Link>
</article>
<article className={"guide-card guide-card--image"}>
<img src={"/assets/images/optimized/journal-lasting.webp"} alt={"Parfum et accessoires composant un univers lifestyle"} width={"1200"} height={"675"} loading={"lazy"} decoding={"async"} />
<div className={"guide-card__body"}>
<span>{"Magazine"}</span>
<h3>{"Articles & astuces lifestyle"}</h3>
<p>{"Rituels, tendances, voyages et inspirations : explorez l’art de vivre IMANA au-delà du parfum."}</p>
<Link href={"/blog"}>{"Explorer le Magazine "}<span aria-hidden={"true"}>{"→"}</span></Link>
</div>
</article>
</div>
</div>
</section></>);
}
