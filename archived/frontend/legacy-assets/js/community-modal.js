(() => {
  const trigger = document.querySelector("#communityJoinTrigger");
  const modal = document.querySelector("#communityModal");
  const dialog = modal?.querySelector(".community-modal__dialog");
  if (!trigger || !modal || !dialog) return;
  let returnFocus = trigger;

  const open = () => {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger;
    modal.hidden = false;
    document.body.classList.add("has-community-modal");
    requestAnimationFrame(() => dialog.focus());
  };
  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("has-community-modal");
    returnFocus.focus();
  };
  trigger.addEventListener("click", open);
  modal.querySelectorAll("[data-community-close]").forEach((control) => control.addEventListener("click", close));
  modal.addEventListener("community:joined", close);
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll("button:not(:disabled), input:not(:disabled), a[href]")]
      .filter((element) => element.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
