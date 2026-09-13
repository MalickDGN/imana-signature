(() => {
  const launch = document.querySelector("#diagnosticLaunch");
  const modal = document.querySelector("#diagnosticModal");
  const dialog = modal?.querySelector(".diagnostic-modal__dialog");
  const form = document.querySelector("#olfactoryForm");
  const assistant = document.querySelector("#diagnosticAssistant p");
  const reset = document.querySelector("#diagnosticReset");
  if (!launch || !modal || !dialog || !form) return;

  let returnFocus = launch;
  const initialAdvice = "<strong>Commençons par votre instinct.</strong> Il n’y a pas de mauvaise réponse : choisissez la famille qui vous attire spontanément.";
  const advice = {
    floral: "<strong>Profil floral détecté.</strong> Vous semblez rechercher une signature lumineuse, expressive et délicatement sensuelle.",
    boise: "<strong>Profil boisé détecté.</strong> Votre choix évoque l’assurance, la profondeur et une élégance durable.",
    frais: "<strong>Profil frais détecté.</strong> Vous privilégiez probablement la clarté, l’énergie et une présence naturelle.",
    oriental: "<strong>Profil oriental détecté.</strong> Votre univers paraît chaleureux, magnétique et riche en contrastes.",
    subtile: "<strong>Votre sillage sera discret.</strong> Je privilégierai une création élégante qui reste proche de la peau.",
    equilibree: "<strong>Vous recherchez l’équilibre.</strong> Je vais viser une présence perceptible, polyvalente et maîtrisée.",
    intense: "<strong>Vous assumez une forte présence.</strong> La recommandation favorisera la tenue et un sillage affirmé.",
    quotidien: "<strong>Usage quotidien enregistré.</strong> La polyvalence et le confort olfactif deviennent prioritaires.",
    soiree: "<strong>Contexte soirée enregistré.</strong> Je renforce le poids de la sensualité et de la persistance.",
    voyage: "<strong>Esprit voyage enregistré.</strong> Je recherche une composition fraîche, facile à porter et mémorable."
  };

  const setAdvice = (html) => {
    if (assistant) assistant.innerHTML = html;
  };

  const open = () => {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : launch;
    modal.hidden = false;
    document.body.classList.add("has-diagnostic-modal");
    requestAnimationFrame(() => dialog.focus());
  };

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("has-diagnostic-modal");
    returnFocus?.focus();
  };

  launch.addEventListener("click", open);
  modal.querySelectorAll("[data-diagnostic-close]").forEach((control) => control.addEventListener("click", close));
  form.addEventListener("change", (event) => {
    const value = event.target instanceof HTMLInputElement ? event.target.value : "";
    if (advice[value]) setAdvice(advice[value]);
  });
  reset?.addEventListener("click", () => setAdvice(initialAdvice));
  form.addEventListener("submit", () => {
    setTimeout(() => setAdvice("<strong>Analyse terminée.</strong> Votre recommandation associe votre famille préférée, l’intensité désirée et votre moment d’usage."), 0);
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll("button:not([hidden]):not(:disabled), input:not([disabled]), a[href]")]
      .filter((element) => element.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
