'use client';
import Link from 'next/link';
import { Articles } from './Editorial';
export function MagazineSections() { 
return (<><section className={"page-hero page-hero--magazine"} aria-labelledby={"magazine-hero-title"}>
<img className={"page-hero__media"} src={"/assets/images/optimized/journal-featured.webp"} alt={"Flacons et matières inspirant le carnet olfactif IMANA"} width={"900"} height={"1125"} />
<div className={"page-hero__content"}>
<div className={"eyebrow"}>{"magazine"}</div>
<h1 id={"magazine-hero-title"}>{"Carnet "}<span>{"olfactif."}</span></h1>
<p>{"Guides, inspirations et rencontres pour mieux comprendre les notes qui façonnent votre signature."}</p>
<Link className={"btn solid"} href={"#guides"}>{"Lire les dernières histoires"}</Link>
</div>
</section><section className={"section"} id={"guides"}>
<div className={"container"}>
<header className={"section-head"}>
<h3 className={"section-title"}>{"Magazine "}<span>{"éditorial."}</span></h3>
</header>
<Articles />
</div>
</section></>);
}
