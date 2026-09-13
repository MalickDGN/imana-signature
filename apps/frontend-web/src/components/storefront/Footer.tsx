'use client';
import Link from 'next/link';

export function Footer() { 
return (<><footer className={"site-footer"}>
<div className={"container footer-grid"}>
<div className={"footer-identity"}>
<Link className={"footer-logo"} href={"/"} aria-label={"IMANA Signature — Accueil"}><img src={"/assets/images/branding/imana-logo-footer-gold.webp"} alt={"IMANA Signature"} width={"600"} height={"600"} /></Link>
<p>{"Parfums authentiques, accessoires premium et service client attentionné depuis Dakar."}</p>
<div className={"footer-socials"} aria-label={"Réseaux sociaux IMANA Signature"}>
<a href={"https://www.instagram.com/imana.signature"} target={"_blank"} rel={"noopener noreferrer"} aria-label={"Instagram"}><svg viewBox={"0 0 24 24"}><rect x={"3"} y={"3"} width={"18"} height={"18"} rx={"5"}></rect><circle cx={"12"} cy={"12"} r={"4"}></circle><circle cx={"17.5"} cy={"6.5"} r={"1"}></circle></svg></a>
<a href={"https://www.facebook.com/imana.signature"} target={"_blank"} rel={"noopener noreferrer"} aria-label={"Facebook"}><svg viewBox={"0 0 24 24"}><path d={"M14 8h4V3h-4c-4 0-6 2.4-6 6v3H4v5h4v4h5v-4h4l1-5h-5V9c0-.7.3-1 1-1Z"}></path></svg></a>
<a href={"https://www.tiktok.com/@imana.signature"} target={"_blank"} rel={"noopener noreferrer"} aria-label={"TikTok"}><svg viewBox={"0 0 24 24"}><path d={"M15 3c.5 3 2.2 4.8 5 5v4c-2 0-3.8-.6-5-1.6V16a6 6 0 1 1-6-6v4a2 2 0 1 0 2 2V3Z"}></path></svg></a>
<a href={"https://wa.me/221777401763"} target={"_blank"} rel={"noopener noreferrer"} aria-label={"WhatsApp"}><svg viewBox={"0 0 24 24"}><path d={"M20 11.8a8 8 0 0 1-11.8 7L3 20l1.4-5A8 8 0 1 1 20 11.8Z"}></path><path d={"M8 8c1 4 3 6 7 7"}></path></svg></a>
</div>
</div>
<nav aria-label={"Navigation boutique"}><h4>{"Boutique"}</h4><ul><li><Link href={"/collections"}>{"Parfums"}</Link></li><li><Link href={"/collections?univers=accessoires"}>{"Accessoires"}</Link></li><li><Link href={"/collections?filter=niche"}>{"Parfums de niche"}</Link></li></ul></nav>
<nav aria-label={"Navigation Maison"}><h4>{"La Maison"}</h4><ul><li><Link href={"/about#a-propos"}>{"À propos"}</Link></li><li><Link href={"/about#conseils"}>{"Conseils"}</Link></li><li><Link href={"/blog"}>{"Magazine"}</Link></li></ul></nav>
<div className={"footer-service"}><h4>{"Nous contacter"}</h4><address><span>{"Sicap Sacré-Cœur 2, Villa 7777"}</span><span>{"Dakar, Sénégal — BP 25208"}</span><a href={"tel:+221777401763"}>{"+221 77 740 17 63"}</a><span>{"Ouvert 24h/24, 7j/7"}</span></address></div>
</div>
<div className={"container footer-bottom"}><span>{"© 2026 IMANA Signature."}</span><span>{"Maison de parfumerie contemporaine · Dakar"}</span></div>
</footer><a className={"float-chat"} href={"https://wa.me/221777401763?text=Bonjour%20IMANA%20Signature%2C%20je%20souhaite%20rejoindre%20votre%20communaut%C3%A9."} target={"_blank"} rel={"noopener noreferrer"} aria-label={"Rejoindre la communauté IMANA Signature sur WhatsApp"}>
<svg viewBox={"0 0 24 24"} aria-hidden={"true"}><path d={"M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.4-4.9a8.4 8.4 0 1 1 16.1-3.9Z"}></path><path d={"M8.2 7.6c.2-.4.4-.4.7-.4h.5c.2 0 .3.1.4.4l.8 1.9c.1.3 0 .5-.2.7l-.6.7c.8 1.7 2.1 2.9 3.8 3.7l.6-.8c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.5 0 .4-.2 1.3-.8 1.8-.6.5-1.4.8-2.3.6-1.1-.2-2.5-.7-4.3-2.2-2.3-1.9-3.8-4.5-4-5.5-.2-.9.1-1.6.5-2.1Z"}></path></svg>
</a><button className="float-top" type="button" aria-label="Revenir en haut de la page" onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>↑</button></>);
}
