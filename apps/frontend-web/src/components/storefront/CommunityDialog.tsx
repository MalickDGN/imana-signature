'use client';
import Link from 'next/link';
import { useCommunity } from './Panels';
export function CommunityDialog() { const { panel, close, dialog, submit, pending } = useCommunity();
return (<><div className={"community-modal"} id={"communityModal"} hidden={panel !== 'community'}>
<div className={"community-modal__backdrop"} data-community-close={""} onClick={close}></div>
<div className={"community-modal__dialog"} role={"dialog"} aria-modal={"true"} aria-labelledby={"communityModalTitle"} tabIndex={-1} ref={dialog}>
<button className={"community-modal__close"} type={"button"} data-community-close={""} aria-label={"Fermer le formulaire"} onClick={close}>{"×"}</button>
<div className={"community-modal__intro"}>
<span>{"Communauté IMANA"}</span>
<h2 id={"communityModalTitle"}>{"Entrez dans le "}<em>{"cercle."}</em></h2>
<p>{"Recevez nos nouvelles collections, invitations privées et conseils personnalisés directement sur WhatsApp et par email."}</p>
</div>
<form className={"newsletter-form community-form"} onSubmit={submit}>
<label><span>{"Nom complet"}</span><input type={"text"} name={"fullName"} autoComplete={"name"} placeholder={"Votre nom et prénom"} required={true} minLength={2} /></label>
<label><span>{"Numéro WhatsApp"}</span><input type={"tel"} name={"phone"} autoComplete={"tel"} inputMode={"tel"} placeholder={"+221 77 000 00 00"} required={true} /></label>
<label><span>{"Adresse email"}</span><input type={"email"} name={"email"} autoComplete={"email"} placeholder={"vous@exemple.com"} required={true} /></label>
<label className={"community-form__consent"}><input type={"checkbox"} required={true} /><span>{"J’accepte de recevoir les actualités et offres privées IMANA."}</span></label>
<button className={"btn solid"} type={"submit"} disabled={pending}>{pending ? "Inscription en cours…" : "Rejoindre la communauté"}</button>
<p className={"community-form__privacy"}>{"Vos informations restent confidentielles et vous pouvez vous désinscrire à tout moment."}</p>
</form>
</div>
</div></>);
}
