(() => {
  const slider = document.querySelector(".hero-slider");
  const slides = [...document.querySelectorAll(".hero-slide")];
  const dots = document.querySelector("#heroDots");
  const previous = document.querySelector("#prevHero");
  const next = document.querySelector("#nextHero");
  const motionToggle = document.querySelector("#toggleHeroMotion");

  if (!slider || slides.length < 2 || !dots) return;

  let index = 0;
  let timer;
  let touchStartX = 0;
  let userPaused = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  dots.innerHTML = slides
    .map((_, slideIndex) => `<button type="button" aria-label="Afficher la diapositive ${slideIndex + 1}"></button>`)
    .join("");

  function displaySlide(target) {
    index = (target + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.style.pointerEvents = active ? "auto" : "none";

      const video = slide.querySelector("video");
      if (!video) return;
      if (active && !reduceMotion.matches && !userPaused) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });

    [...dots.children].forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function stopAutoplay() {
    window.clearInterval(timer);
  }

  function startAutoplay() {
    stopAutoplay();
    if (!reduceMotion.matches && !document.hidden && !userPaused) {
      timer = window.setInterval(() => displaySlide(index + 1), 10000);
    }
  }

  function navigate(target) {
    displaySlide(target);
    startAutoplay();
  }

  previous?.addEventListener("click", () => navigate(index - 1));
  next?.addEventListener("click", () => navigate(index + 1));
  motionToggle?.addEventListener("click", () => {
    userPaused = !userPaused;
    motionToggle.setAttribute("aria-pressed", String(userPaused));
    motionToggle.setAttribute("aria-label", userPaused
      ? "Reprendre les animations du diaporama"
      : "Suspendre les animations du diaporama");
    motionToggle.lastElementChild.textContent = userPaused ? "Lecture" : "Pause";
    motionToggle.firstElementChild.textContent = userPaused ? "▶" : "Ⅱ";
    if (userPaused) {
      stopAutoplay();
      slides.forEach((slide) => slide.querySelector("video")?.pause());
    } else {
      displaySlide(index);
      startAutoplay();
    }
  });
  dots.addEventListener("click", (event) => {
    const target = [...dots.children].indexOf(event.target);
    if (target >= 0) navigate(target);
  });

  slider.addEventListener("mouseenter", stopAutoplay);
  slider.addEventListener("mouseleave", startAutoplay);
  slider.addEventListener("focusin", stopAutoplay);
  slider.addEventListener("focusout", startAutoplay);
  slider.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0]?.clientX || 0;
  }, { passive: true });
  slider.addEventListener("touchend", (event) => {
    const distance = (event.changedTouches[0]?.clientX || 0) - touchStartX;
    if (Math.abs(distance) > 45) navigate(index + (distance < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });
  reduceMotion.addEventListener?.("change", startAutoplay);

  displaySlide(0);
  if (document.readyState === "complete") {
    startAutoplay();
  } else {
    window.addEventListener("load", startAutoplay, { once: true });
  }
})();
