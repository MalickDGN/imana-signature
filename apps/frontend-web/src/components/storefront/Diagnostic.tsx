'use client';
import Link from 'next/link';
import { useDiagnostic, DiagnosticResult } from './DiagnosticLogic';
export function Diagnostic() { const ui = useDiagnostic();
return (<><section className={"olfactory-quiz"} id={"diagnostic"} aria-labelledby={"diagnostic-title"}>
<div className={"container olfactory-quiz__layout"}>
<div className={"olfactory-quiz__intro"}>
<div className={"eyebrow"}>{"diagnostic olfactif"}</div>
<h2 id={"diagnostic-title"}>{"Trouvez votre "}<span>{"empreinte."}</span></h2>
<p>{"Notre assistant intelligent analyse vos préférences pour révéler la création IMANA la plus proche de votre humeur et de votre style."}</p>
<button className={"btn solid diagnostic-launch"} id={"diagnosticLaunch"} type={"button"} aria-haspopup={"dialog"} aria-controls={"diagnosticModal"} onClick={ui.show}>{"\n              Lancer votre diagnostic\n              "}<span aria-hidden={"true"}>{"→"}</span>
</button>
</div>
<div className={"diagnostic-preview"} aria-hidden={"true"}>
<span>{"3 questions"}</span><span>{"≈ 1 minute"}</span><span>{"Conseil personnalisé"}</span>
</div>
</div>
<div className={"diagnostic-modal"} id={"diagnosticModal"} hidden={!ui.open}>
<div className={"diagnostic-modal__backdrop"} data-diagnostic-close={""} onClick={ui.close}></div>
<div className={"diagnostic-modal__dialog"} role={"dialog"} aria-modal={"true"} aria-labelledby={"diagnostic-modal-title"} tabIndex={-1} ref={ui.dialog}>
<button className={"diagnostic-modal__close"} type={"button"} data-diagnostic-close={""} aria-label={"Fermer le diagnostic"} onClick={ui.close}>{"×"}</button>
<div className={"diagnostic-panel"}>
<header className={"diagnostic-header"}>
<div>
<p className={"diagnostic-ai-label"}>{"Assistant intelligent · analyse locale"}</p>
<h2 id={"diagnostic-modal-title"}>{"Votre diagnostic olfactif"}</h2>
</div>
<span className={"sr-only"} id={"diagnosticStepLabel"} aria-live={"polite"}>{ui.result ? "Diagnostic terminé" : `Étape ${ui.step + 1} sur 3`}</span>
<ol className={"diagnostic-steps"} aria-label={"Progression du diagnostic"}>
<li className={ui.result || ui.step > 0 ? 'is-complete' : ui.step === 0 ? 'is-active' : ''} data-step-indicator={"1"}><span>{"1"}</span><small>{"Famille"}</small></li>
<li data-step-indicator={"2"} className={ui.result || ui.step > 1 ? 'is-complete' : ui.step === 1 ? 'is-active' : ''}><span>{"2"}</span><small>{"Intensité"}</small></li>
<li data-step-indicator={"3"} className={ui.result || ui.step > 2 ? 'is-complete' : ui.step === 2 ? 'is-active' : ''}><span>{"3"}</span><small>{"Moment"}</small></li>
</ol>
<button className={"diagnostic-reset"} id={"diagnosticReset"} type={"button"} aria-label={"Réinitialiser le diagnostic"} onClick={ui.reset}>{"↻"}</button>
</header>
<div className={"diagnostic-assistant"} id={"diagnosticAssistant"} aria-live={"polite"}>
<span className={"diagnostic-assistant__mark"} aria-hidden={"true"}>{"AI"}</span>
<p><strong>{"Commençons par votre instinct."}</strong>{" Il n’y a pas de mauvaise réponse : choisissez la famille qui vous attire spontanément."}</p>
</div>
<form className={"olfactory-form"} id={"olfactoryForm"} onSubmit={ui.submit} noValidate={true}>
<fieldset className={"quiz-step"} data-quiz-step={"1"} hidden={ui.step !== 0}><legend>{"Quelle famille olfactive vous attire ?"}</legend><div className={"quiz-options"}>
<label><input type={"radio"} name={"family"} value={"floral"} required={true} checked={ui.answers["family"] === "floral"} onChange={() => ui.answer("family", "floral")} /><span>{"Floral"}</span></label><label><input type={"radio"} name={"family"} value={"boise"} checked={ui.answers["family"] === "boise"} onChange={() => ui.answer("family", "boise")} /><span>{"Boisé"}</span></label><label><input type={"radio"} name={"family"} value={"frais"} checked={ui.answers["family"] === "frais"} onChange={() => ui.answer("family", "frais")} /><span>{"Frais"}</span></label><label><input type={"radio"} name={"family"} value={"oriental"} checked={ui.answers["family"] === "oriental"} onChange={() => ui.answer("family", "oriental")} /><span>{"Oriental"}</span></label>
</div></fieldset>
<fieldset className={"quiz-step"} data-quiz-step={"2"} hidden={ui.step !== 1}><legend>{"Quelle intensité souhaitez-vous porter ?"}</legend><div className={"quiz-options"}>
<label><input type={"radio"} name={"intensity"} value={"subtile"} required={true} checked={ui.answers["intensity"] === "subtile"} onChange={() => ui.answer("intensity", "subtile")} /><span>{"Subtile"}</span></label><label><input type={"radio"} name={"intensity"} value={"equilibree"} checked={ui.answers["intensity"] === "equilibree"} onChange={() => ui.answer("intensity", "equilibree")} /><span>{"Équilibrée"}</span></label><label><input type={"radio"} name={"intensity"} value={"intense"} checked={ui.answers["intensity"] === "intense"} onChange={() => ui.answer("intensity", "intense")} /><span>{"Intense"}</span></label>
</div></fieldset>
<fieldset className={"quiz-step"} data-quiz-step={"3"} hidden={ui.step !== 2}><legend>{"À quel moment imaginez-vous ce parfum ?"}</legend><div className={"quiz-options"}>
<label><input type={"radio"} name={"occasion"} value={"quotidien"} required={true} checked={ui.answers["occasion"] === "quotidien"} onChange={() => ui.answer("occasion", "quotidien")} /><span>{"Quotidien"}</span></label><label><input type={"radio"} name={"occasion"} value={"soiree"} checked={ui.answers["occasion"] === "soiree"} onChange={() => ui.answer("occasion", "soiree")} /><span>{"Soirée"}</span></label><label><input type={"radio"} name={"occasion"} value={"voyage"} checked={ui.answers["occasion"] === "voyage"} onChange={() => ui.answer("occasion", "voyage")} /><span>{"Voyage"}</span></label>
</div></fieldset>
<div className={"diagnostic-actions"}>
<div className={"diagnostic-arrows"} aria-label={"Navigation du diagnostic"}>
<button className={"arrow diagnostic-back"} id={"diagnosticBack"} type={"button"} aria-label={"Question précédente"} title={"Question précédente"} hidden={ui.step === 0} onClick={() => ui.setStep(ui.step - 1)}>{"<"}</button>
<button className={"arrow diagnostic-next"} id={"diagnosticNext"} type={"button"} aria-label={"Question suivante"} title={"Question suivante"} disabled={!ui.selected} hidden={ui.step === 2} onClick={() => ui.setStep(ui.step + 1)}>{">"}</button>
</div>
<button className={"btn solid diagnostic-submit"} type={"submit"} hidden={ui.step !== 2} disabled={!ui.selected}>{"Révéler ma signature →"}</button>
</div>
</form>
<div className={"olfactory-result"} id={"olfactoryResult"} aria-live={"polite"} hidden={!ui.result && !ui.resultError}><DiagnosticResult product={ui.result} error={ui.resultError} /></div>
</div>
</div>
</div>
</section></>);
}
