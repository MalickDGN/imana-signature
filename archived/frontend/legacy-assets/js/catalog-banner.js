(() => {
  const banner = document.querySelector("#catalogBanner");
  if (!banner) return;
  const slides = [...banner.querySelectorAll(".catalog-banner__slide")];
  const dots = banner.querySelector(".catalog-banner__dots");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let active = 0;
  let timer;

  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const selected = slideIndex === active;
      slide.classList.toggle("is-active", selected);
      slide.setAttribute("aria-hidden", String(!selected));
    });
    dots?.querySelectorAll("button").forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === active);
      dot.setAttribute("aria-current", dotIndex === active ? "true" : "false");
    });
  };
  const restart = () => {
    clearInterval(timer);
    if (!reducedMotion) timer = setInterval(() => show(active + 1), 6500);
  };

  if (dots) {
    dots.innerHTML = slides.map((_, index) =>
      `<button type="button" aria-label="Afficher la campagne ${index + 1}"${index === 0 ? ' class="is-active" aria-current="true"' : ""}></button>`).join("");
    dots.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      show([...dots.children].indexOf(button));
      restart();
    });
  }
  banner.querySelector(".catalog-banner__arrow--prev")?.addEventListener("click", () => { show(active - 1); restart(); });
  banner.querySelector(".catalog-banner__arrow--next")?.addEventListener("click", () => { show(active + 1); restart(); });
  banner.addEventListener("mouseenter", () => clearInterval(timer));
  banner.addEventListener("mouseleave", restart);
  banner.addEventListener("focusin", () => clearInterval(timer));
  banner.addEventListener("focusout", restart);
  show(0);
  restart();
})();
