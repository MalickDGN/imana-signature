import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("adapte les actions du header au format d’écran", async ({ page }) => {
  await page.goto("/");
  const mobileSearch = page.locator(".mobile-search-toggle");
  const searchBox = page.locator(".search-box");
  const loginLabel = page.locator(".login-btn span");
  const isCompact = (page.viewportSize()?.width ?? 1280) <= 920;

  if (isCompact) {
    await expect(mobileSearch).toBeVisible();
    await expect(loginLabel).toBeHidden();
    await mobileSearch.click();
    await expect(mobileSearch).toHaveAttribute("aria-expanded", "true");
    await expect(searchBox).toBeVisible();
    await expect(searchBox.locator("input")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(mobileSearch).toHaveAttribute("aria-expanded", "false");
  } else {
    await expect(mobileSearch).toBeHidden();
    await expect(searchBox).toBeVisible();
    await expect(loginLabel).toBeVisible();
  }
});

test("place les maisons de reference et les services avant le diagnostic", async ({ page }) => {
  await page.goto("/");
  const brands = page.locator(".brand-reference");
  await expect(brands.getByRole("listitem")).toHaveCount(6);
  await expect(brands).toContainText("Dior");
  await expect(brands).toContainText("Chanel");
  const sequenceIsCorrect = await brands.evaluate((section) => {
    const trustbar = section.nextElementSibling;
    const diagnostic = trustbar?.nextElementSibling;
    return trustbar?.classList.contains("trustbar") && diagnostic?.id === "diagnostic";
  });
  expect(sequenceIsCorrect).toBe(true);
});

test("affiche les coordonnees de Dakar et ouvre la communaute WhatsApp", async ({ page }) => {
  for (const route of ["/", "/catalogue.html", "/la-maison.html", "/magazine.html"]) {
    await page.goto(route);
    await expect(page.locator("footer")).toContainText("Dakar");
    await expect(page.locator("footer")).toContainText("+221 77 740 17 63");
    await expect(page.locator("footer")).toContainText("24h/24");
    const whatsapp = page.getByRole("link", { name: "Rejoindre la communauté IMANA Signature sur WhatsApp" });
    await expect(whatsapp).toHaveAttribute("href", /wa\.me\/221777401763/);
    await expect(whatsapp).toHaveAttribute("target", "_blank");
    await expect(whatsapp).toHaveCSS("background-color", "rgb(32, 51, 99)");
    await expect(whatsapp).toHaveCSS("color", "rgb(184, 144, 85)");
  }
});

test("présente les quatre services de confiance", async ({ page }) => {
  await page.goto("/");
  const trustbar = page.getByRole("region", { name: "Services" });
  await expect(trustbar.locator(".trust-item")).toHaveCount(4);
  await expect(trustbar.locator(".payment-mark")).toHaveCount(4);
  await expect(trustbar.getByText("Livraison locale")).toBeVisible();
  await expect(trustbar.getByText("Paiement sécurisé")).toBeVisible();
  await expect(trustbar.getByText("Conseil personnalisé")).toBeVisible();
  await expect(trustbar.getByText("Coffret signature")).toBeVisible();
});

test("utilise la nouvelle icone panier dans le menu et sur les produits", async ({ page }) => {
  await page.goto("/");
  const menuCart = page.locator(".cart-trigger");
  await expect(menuCart).toBeVisible();
  await expect(menuCart.locator("svg circle")).toHaveCount(2);
  await expect(menuCart).toHaveCSS("background-color", "rgb(32, 51, 99)");
  await expect(menuCart).toHaveCSS("color", "rgb(184, 144, 85)");
  await expect(page.locator(".favorites-trigger")).toHaveCSS("background-color", "rgb(32, 51, 99)");
  await expect(page.locator(".login-btn")).toHaveCSS("color", "rgb(184, 144, 85)");
  const productCart = page.locator("#parfums .plus").first();
  const productInfo = page.locator("#parfums .product-info").first();
  await expect(productInfo).toHaveCSS("background-color", "rgb(220, 232, 244)");
  await expect(productInfo).toHaveCSS("padding-top", "14px");
  const infoMetrics = await page.locator("#parfums .product-info").evaluateAll((items) => items.map((item) => {
    const infoBox = item.getBoundingClientRect();
    const bottomBox = item.querySelector(".product-bottom").getBoundingClientRect();
    return {
      height: Math.round(infoBox.height),
      bottomInset: Math.round(infoBox.bottom - bottomBox.bottom)
    };
  }));
  expect(new Set(infoMetrics.map(({ height }) => height)).size).toBe(1);
  expect(new Set(infoMetrics.map(({ bottomInset }) => bottomInset)).size).toBe(1);
  await expect(productCart.locator(".cart-add-icon")).toHaveCount(1);
  await expect(productCart).toHaveAccessibleName(/Ajouter .* au panier/);
  await expect(productCart).toHaveCSS("background-color", "rgb(32, 51, 99)");
  await expect(productCart).toHaveCSS("color", "rgb(184, 144, 85)");
  await expect(productCart).toHaveCSS("width", "48px");
  await productCart.click();
  await expect(page.locator(".cart-dot")).toHaveText("1");
});

test("fait défiler les cinq campagnes du hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero-slide")).toHaveCount(5);
  const heroVideo = page.locator(".hero-slide").first().locator("video");
  await expect(heroVideo).toBeVisible();
  await expect(heroVideo.locator("source")).toHaveAttribute("src", "assets/videos/imana-signature-hero.mp4");
  await expect.poll(() => heroVideo.evaluate((video) => video.duration || 0)).toBeGreaterThan(9);
  await expect(page.locator(".hero-slide.active h1")).toContainText("signature");
  await expect(page.locator(".hero-slide.active h1")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator(".hero-slide.active h1 span")).toHaveCSS("color", "rgb(184, 144, 85)");
  await page.getByRole("button", { name: "Slide suivante" }).click();
  await expect(page.locator(".hero-slide.active h1")).toContainText("signent");
  await page.getByRole("button", { name: "Afficher la diapositive 4" }).click();
  await expect(page.locator(".hero-slide.active h1")).toContainText("temps limité");
});

test("permet de suspendre les animations du hero", async ({ page }) => {
  await page.goto("/");
  const control = page.locator("#toggleHeroMotion");
  await expect(control).toHaveAccessibleName("Suspendre les animations du diaporama");
  await control.click();
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await expect(control).toHaveAccessibleName("Reprendre les animations du diaporama");
  await expect(page.locator(".hero-slide.active video")).toHaveJSProperty("paused", true);
  await control.click();
  await expect(control).toHaveAttribute("aria-pressed", "false");
});

test("intègre les éléments marchands inspirés de la vidéo", async ({ page }) => {
  await page.goto("/");
  const productSpotlight = page.locator(".hero-product-card");
  await expect(productSpotlight).toBeAttached();
  await expect(page.locator(".boutique-universe-grid .boutique-card")).toHaveCount(5);
  await expect(page.locator(".premium-stage")).toBeVisible();
  await expect(page.locator(".premium-stage")).toContainText("Prestige");
  if (await productSpotlight.isVisible()) {
    await productSpotlight.getByRole("button", { name: "Ajouter Ébène Royal au panier" }).click();
    await expect(page.locator(".cart-dot")).toHaveText("1");
  }
});

test("présente deux campagnes promotionnelles éditoriales et accessibles", async ({ page }) => {
  await page.goto("/");
  const campaigns = page.locator("#promo .promo-card");
  await expect(campaigns).toHaveCount(2);
  await expect(campaigns.locator(".promo-label")).toHaveCount(2);
  await expect(campaigns.getByRole("link")).toHaveCount(2);
  await expect(campaigns.locator("img[loading='lazy'][decoding='async']")).toHaveCount(2);
  await expect(campaigns.locator("img[src*='campaign-']")).toHaveCount(2);
  await expect(campaigns.getByText("La rareté, le temps d'une édition.")).toBeVisible();
  await expect(campaigns.getByText("Des attentions réservées à nos membres.")).toBeVisible();
  await expect(campaigns.getByText(/Nouveau|Signature/)).toHaveCount(0);
  const cardBoxes = await campaigns.evaluateAll((cards) => cards.map((card) => {
    const box = card.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
  }));
  const spacing = Math.abs(cardBoxes[0].top - cardBoxes[1].top) < 2
    ? cardBoxes[1].left - cardBoxes[0].right
    : cardBoxes[1].top - cardBoxes[0].bottom;
  expect(spacing).toBeGreaterThanOrEqual(15);
});

test("propose un diagnostic olfactif et cinq univers permanents", async ({ page }) => {
  await page.goto("/");
  const universes = page.locator("#categories .boutique-card");
  await expect(universes).toHaveCount(5);
  await expect(page.locator(".universe-nav, #categories .cat-card")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Parfums Femme/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Parfums Homme/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Parfums de niche", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Marques/ })).toHaveCount(0);
  await expect(universes.locator("img[loading='lazy'][decoding='async']")).toHaveCount(5);
  await expect(universes.getByText(/Nouveautés|Collections Signature|Éditions limitées|Offres privées/)).toHaveCount(0);
  const firstUniverse = universes.first();
  await expect(firstUniverse).toHaveCSS("background-color", "rgb(32, 51, 99)");
  await expect(firstUniverse).toHaveCSS("border-top-color", "rgba(184, 144, 85, 0.78)");
  await expect(firstUniverse.locator(".boutique-card__count")).toHaveCSS("color", "rgb(226, 191, 131)");
  await expect(firstUniverse.locator(".boutique-card__cta")).toHaveCSS("color", "rgb(184, 144, 85)");
  await expect(page.locator("#diagnosticStepLabel")).toHaveText("Étape 1 sur 3");
  const diagnosticModal = page.locator("#diagnosticModal");
  await expect(diagnosticModal).toBeHidden();
  await page.getByRole("button", { name: "Lancer votre diagnostic" }).click();
  await expect(diagnosticModal).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Votre diagnostic olfactif" })).toBeFocused();
  await expect(page.locator(".quiz-step:visible")).toHaveCount(1);
  await expect(page.locator(".diagnostic-panel > .diagnostic-header")).toHaveCount(1);
  await expect(page.locator(".diagnostic-panel > #olfactoryForm")).toHaveCount(1);
  await expect(page.locator(".quiz-options input").first()).toHaveCSS("width", "10px");
  const nextQuestion = page.getByRole("button", { name: "Question suivante" });
  await expect(nextQuestion).toHaveText(">");
  await expect(page.locator("#diagnosticBack")).toHaveText("<");
  await expect(nextQuestion).toBeDisabled();
  await page.locator("#olfactoryForm").getByText("Floral", { exact: true }).click();
  await expect(nextQuestion).toBeEnabled();
  await nextQuestion.click();
  await expect(page.locator("#diagnosticStepLabel")).toHaveText("Étape 2 sur 3");
  await page.locator("#olfactoryForm").getByText("Équilibrée", { exact: true }).click();
  await nextQuestion.click();
  await expect(page.locator("#diagnosticStepLabel")).toHaveText("Étape 3 sur 3");
  await page.locator("#olfactoryForm").getByText("Soirée", { exact: true }).click();
  const revealSignature = page.getByRole("button", { name: "Révéler ma signature" });
  await expect(revealSignature).toBeEnabled();
  const revealBox = await revealSignature.boundingBox();
  expect(revealBox?.width).toBeGreaterThanOrEqual(190);
  expect(revealBox?.height).toBeGreaterThanOrEqual(48);
  await revealSignature.click();
  const result = page.locator("#olfactoryResult");
  await expect(result).toBeVisible();
  await expect(page.locator("#diagnosticStepLabel")).toHaveText("Diagnostic terminé");
  await expect(result).toContainText("Votre signature");
  await expect(result).toContainText("% de correspondance");
  await result.getByRole("button", { name: "Ajouter au panier" }).click();
  await expect(page.locator(".cart-dot")).toHaveText("1");
});

test("fait defiler les cartes de la section univers en carrousel", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Carrousel des univers IMANA" });
  const track = carousel.locator(".boutique-universe-grid");
  const previous = carousel.locator(".universe-carousel__control--prev");
  const next = carousel.locator(".universe-carousel__control--next");
  await expect(track.locator(":scope > li")).toHaveCount(5);
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.click();
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect(previous).toBeEnabled();
  await track.focus();
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeLessThan(5);
});

test("place les CTA en fin de section et révèle l’ajout au survol", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".section-actions")).toHaveCount(2);
  const perfumeCta = page.locator("#parfums .product-grid + .section-actions .btn");
  await expect(perfumeCta).toBeVisible();
  await expect(page.locator("#accessoires .product-grid + .section-actions .btn")).toBeVisible();
  await perfumeCta.focus();
  await expect(perfumeCta).toHaveCSS("outline-style", "solid");
  await expect(perfumeCta).toHaveCSS("outline-width", "3px");
  const card = page.locator("#parfums .product-card").first();
  const hoverAction = card.locator(".add-hover");
  await expect(hoverAction).toBeHidden();
  if ((page.viewportSize()?.width || 0) > 920) {
    await card.hover();
    await expect(hoverAction).toBeVisible();
  }
  await expect(card.locator(".plus")).toBeVisible();
});

test("réorganise les catégories et le diagnostic en supprimant les anciens blocs", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main > #la-maison, main > #magazine")).toHaveCount(0);
  const orderedIds = await page.locator("main > section[id]").evaluateAll((sections) => sections.map((section) => section.id));
  expect(orderedIds.indexOf("categories")).toBeLessThan(orderedIds.indexOf("promo"));
  expect(orderedIds.indexOf("diagnostic")).toBeGreaterThan(orderedIds.indexOf("accessoires"));
  const sectionPadding = await page.locator("#categories").evaluate((section) => parseFloat(getComputedStyle(section).paddingTop));
  expect(sectionPadding).toBeLessThanOrEqual(64);
});

test("ouvre et ferme le méga-menu sur ordinateur et mobile", async ({ page }) => {
  await page.goto("/catalogue.html");
  const trigger = page.locator(".shop-trigger");
  if (!(await trigger.isVisible())) {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  }
  await trigger.click();
  const megaMenu = page.locator("#megaMenu");
  await expect(megaMenu).toBeVisible();
  await expect(megaMenu).toHaveCSS("background-color", "rgba(32, 51, 99, 0.99)");
  await expect(megaMenu.locator(".mega-title").first()).toHaveCSS("color", "rgb(184, 144, 85)");
  await expect(megaMenu.locator(".mega-list a").first()).toHaveCSS("color", "rgba(255, 255, 255, 0.78)");
  await expect(megaMenu.locator(".mega-feature")).toContainText("Diagnostic olfactif");
  await expect(megaMenu.locator(".mega-feature")).toContainText("Trouvez votre signature");
  await expect(megaMenu.locator(".mega-feature .btn")).toHaveAttribute("href", "index.html#diagnostic");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#megaMenu")).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("ouvre le méga-menu depuis le fichier index-save direct", async ({ page }) => {
  await page.goto(pathToFileURL(resolve("index-save.html")).href);
  const trigger = page.locator(".shop-trigger");
  if (!(await trigger.isVisible())) {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  }
  await trigger.click();
  await expect(page.locator("#megaMenu")).toBeVisible();
});

test("fait défiler les slides depuis le fichier index-save direct", async ({ page }) => {
  await page.goto(pathToFileURL(resolve("index-save.html")).href);
  await expect(page.locator(".hero-slide.active h1")).toContainText("signature");
  await page.getByRole("button", { name: "Slide suivante" }).click();
  await expect(page.locator(".hero-slide.active h1")).toContainText("signent");
  await page.getByRole("button", { name: "Afficher la diapositive 3" }).click();
  await expect(page.locator(".hero-slide.active h1")).toContainText("moment");
});

test("affiche les produits depuis le fichier index-save direct", async ({ page }) => {
  await page.goto(pathToFileURL(resolve("index-save.html")).href);
  await expect(page.locator(".boutique-universe-grid .boutique-card")).toHaveCount(5);
  await expect(page.locator("#parfums .product-card")).toHaveCount(4);
  await expect(page.locator("#accessoires .product-card")).toHaveCount(7);
  await expect(page.locator("#parfums .product-name").first()).toContainText("Nuit de Dakar");
  await page.locator("#accessoires .product-card").first().locator(".plus").click();
  await expect(page.locator(".cart-dot")).toHaveText("1");
  await page.getByRole("button", { name: "Ouvrir le panier" }).click();
  await expect(page.getByRole("dialog", { name: "Votre panier" })).toBeVisible();
  await expect(page.locator("#localCartContent .cart-line")).toHaveCount(1);
});

test("affiche et filtre le catalogue depuis le fichier direct", async ({ page }) => {
  await page.goto(pathToFileURL(resolve("catalogue.html")).href);
  const grid = page.locator("#catalogGrid");
  await expect(grid.locator(".product-card")).toHaveCount(7);
  await page.locator("#catalogSearch").fill("Ébène Royal");
  await expect(grid.locator(".product-card")).toHaveCount(1);
  await page.getByRole("tab", { name: /Accessoires/ }).click();
  await expect(grid.locator(".product-card")).toHaveCount(0);
  await page.locator("#catalogSearch").fill("");
  await expect(grid.locator(".product-card")).toHaveCount(4);
});

test("fait fonctionner le diagnostic depuis le fichier index direct", async ({ page }) => {
  await page.goto(pathToFileURL(resolve("index.html")).href);
  await page.getByRole("button", { name: "Lancer votre diagnostic" }).click();
  const form = page.locator("#olfactoryForm");
  const next = page.getByRole("button", { name: "Question suivante" });
  await form.getByText("Floral", { exact: true }).click();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.locator("#diagnosticStepLabel")).toHaveText("Étape 2 sur 3");
  await form.getByText("Équilibrée", { exact: true }).click();
  await next.click();
  await form.getByText("Soirée", { exact: true }).click();
  await page.getByRole("button", { name: "Révéler ma signature" }).click();
  await expect(page.locator("#olfactoryResult")).toBeVisible();
  await expect(page.locator("#diagnosticStepLabel")).toHaveText("Diagnostic terminé");
});

test("relie les quatre espaces du site", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText("signature");
  if (!(await page.getByRole("link", { name: "LA MAISON", exact: true }).isVisible())) {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  }
  await page.getByRole("link", { name: "LA MAISON", exact: true }).click();
  await expect(page).toHaveURL(/la-maison\.html/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("héritage");
  if (!(await page.getByRole("link", { name: "MAGAZINE", exact: true }).isVisible())) {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  }
  await page.getByRole("link", { name: "MAGAZINE", exact: true }).click();
  await expect(page).toHaveURL(/magazine\.html/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("olfactif");
});

test("décline un hero éditorial cohérent sur chaque page", async ({ page }) => {
  const pages = [
    { path: "/la-maison.html", title: "héritage", cta: "Découvrir notre histoire" },
    { path: "/magazine.html", title: "olfactif", cta: "Lire les dernières histoires" }
  ];

  for (const item of pages) {
    await page.goto(item.path);
    const hero = page.locator(".page-hero");
    await expect(hero).toBeVisible();
    await expect(hero.getByRole("heading", { level: 1 })).toContainText(item.title);
    await expect(hero.locator("p")).not.toBeEmpty();
    await expect(hero.getByRole("link", { name: item.cta })).toBeVisible();
    await expect(hero.locator("img[alt]")).toHaveCount(1);
    await expect(hero).toHaveCSS("background-color", "rgb(32, 51, 99)");
    await expect(hero.locator("h1 span")).toHaveCSS("color", "rgb(184, 144, 85)");
    await expect(hero.locator(".btn")).toHaveCSS("background-color", "rgb(184, 144, 85)");
  }
  await page.goto("/catalogue.html");
  await expect(page.locator(".page-hero")).toHaveCount(0);
  await expect(page.locator("#catalogBanner")).toBeVisible();
});

test("fait défiler les campagnes du catalogue", async ({ page }) => {
  await page.goto("/catalogue.html");
  const banner = page.locator("#catalogBanner");
  await expect(banner.locator(".catalog-banner__slide")).toHaveCount(3);
  await expect(banner.locator(".catalog-banner__slide.is-active h2")).toContainText("rareté");
  await banner.getByRole("button", { name: "Campagne suivante" }).click();
  await expect(banner.locator(".catalog-banner__slide.is-active h2")).toContainText("attentions");
  await banner.getByRole("button", { name: "Afficher la campagne 3" }).click();
  await expect(banner.locator(".catalog-banner__slide.is-active h2")).toContainText("ressemble");
  await expect(banner.locator(".catalog-banner__slide.is-active")).toHaveAttribute("aria-hidden", "false");
});

test("présente l’histoire et les guides de la Maison", async ({ page }) => {
  await page.goto("/la-maison.html");
  const about = page.locator("#a-propos");
  const guides = page.locator("#conseils");
  await expect(about.locator(".maison-about__card")).toHaveCount(3);
  await expect(about).toContainText("Histoire IMANA Signature");
  await expect(about).toContainText("Vision & valeurs");
  await expect(about).toContainText("Luxe & lifestyle");
  await expect(guides.locator(".guide-card")).toHaveCount(6);
  await expect(guides).toContainText("Conseils personnalisés");
  await expect(guides).toContainText("Comment choisir son parfum");
  await expect(guides).toContainText("Comment porter un parfum");
  await expect(guides).toContainText("Astuces de tenue");
  await expect(guides).toContainText("Parfum, look & occasion");
  await expect(guides).toContainText("Articles & astuces lifestyle");
  await expect(guides.getByRole("link", { name: /Lancer mon diagnostic/ })).toHaveAttribute("href", "index.html#diagnostic");
});

test("simplifie les en-têtes de section présents pour ne garder que le titre", async ({ page }) => {
  let totalHeads = 0;
  for (const path of ["/", "/catalogue.html", "/la-maison.html", "/magazine.html"]) {
    await page.goto(path);
    const heads = page.locator(".section-head");
    totalHeads += await heads.count();
    await expect(heads.locator(":scope > .eyebrow, :scope > div, :scope > p")).toHaveCount(0);
    const structures = await heads.evaluateAll((items) => items.map((head) =>
      [...head.children].map((child) => ({
        tag: child.tagName,
        classes: [...child.classList]
      }))
    ));
    for (const children of structures) {
      expect(children.length).toBeGreaterThanOrEqual(1);
      expect(children[0]).toMatchObject({ tag: "H3", classes: expect.arrayContaining(["section-title"]) });
      for (const child of children.slice(1)) {
        expect(child).toMatchObject({ tag: "A", classes: expect.arrayContaining(["btn"]) });
      }
    }
    const titleAlignments = await heads.locator(":scope > .section-title")
      .evaluateAll((titles) => titles.map((title) => getComputedStyle(title).textAlign));
    expect(titleAlignments.every((alignment) => alignment === "center")).toBe(true);
  }
  expect(totalHeads).toBeGreaterThan(0);
  await page.goto("/");
  await expect(page.locator("#promo .eyebrow")).toHaveCount(0);
  await expect(page.locator("#parfums .section-actions__cta")).toHaveAttribute("href", "catalogue.html?univers=parfums");
  await expect(page.locator("#accessoires .section-actions__cta")).toHaveAttribute("href", "catalogue.html?univers=accessoires");
  await expect(page.locator(".newsletter h2")).toHaveText("Rejoindre la communauté.");
});

test("filtre le catalogue et conserve le panier entre les pages", async ({ page }) => {
  await page.goto("/catalogue.html");
  await expect(page.locator(".product-card")).toHaveCount(7);
  if ((page.viewportSize()?.width ?? 1280) <= 920) await page.locator("#catalogFilterToggle").click();
  await page.locator('[data-facet="family"][value="floral"]').check();
  await expect(page.locator(".product-card")).toHaveCount(2);
  if ((page.viewportSize()?.width ?? 1280) <= 920) await page.locator("#catalogFacetClose").click();
  await page.locator(".product-card").first().locator(".plus").click();
  await expect(page.locator(".cart-dot")).toHaveText("1");
  await page.goto("/magazine.html");
  await expect(page.locator(".cart-dot")).toHaveText("1");
  await page.getByRole("button", { name: "Ouvrir le panier" }).click();
  await expect(page.getByText("Panier.")).toBeVisible();
});

test("recherche, trie et réinitialise le catalogue", async ({ page }) => {
  await page.goto("/catalogue.html");
  const grid = page.locator("#catalogGrid");
  const search = page.locator("#catalogSearch");
  const sort = page.locator("#catalogSort");
  await expect(page.locator(".catalog-benefits > span")).toHaveCount(3);
  await search.fill("Ébène Royal");
  await expect(grid.locator(".product-card")).toHaveCount(1);
  await expect(grid.locator(".product-name")).toContainText("Ébène Royal");
  await search.fill("");
  await sort.selectOption("price-asc");
  const ascendingPrices = await grid.locator(".price").allTextContents();
  const numericPrices = ascendingPrices.map((price) => Number(price.replace(/[^\d]/g, "")));
  expect(numericPrices).toEqual([...numericPrices].sort((a, b) => a - b));
  await search.fill("introuvable-xyz");
  await expect(page.locator("#catalogEmpty")).toBeVisible();
  await page.locator("#catalogReset").click();
  await expect(grid.locator(".product-card")).toHaveCount(7);
  await expect(page.locator("#catalogEmpty")).toBeHidden();
});

test("combine les facettes du catalogue et ouvre le tiroir mobile", async ({ page }) => {
  await page.goto("/catalogue.html");
  const isMobile = (page.viewportSize()?.width ?? 1280) <= 920;
  if (isMobile) {
    await page.locator("#catalogFilterToggle").click();
    await expect(page.locator("#catalogFacets")).toHaveClass(/is-open/);
    await expect(page.locator("#catalogFilterToggle")).toHaveAttribute("aria-expanded", "true");
  }
  await page.locator('[data-facet="family"][value="oriental"]').check();
  await expect(page.locator("#catalogGrid .product-card")).toHaveCount(2);
  await page.locator('[data-facet="price"][value="50-70"]').check();
  await expect(page.locator("#catalogGrid .product-card")).toHaveCount(1);
  await expect(page.locator("#activeFilterCount")).toHaveText("2");
  await page.locator("#facetReset").click();
  await expect(page.locator("#catalogGrid .product-card")).toHaveCount(7);
  if (isMobile) {
    await page.locator("#catalogFacetClose").click();
    await expect(page.locator("#catalogFacets")).not.toHaveClass(/is-open/);
  }
});

test("filtre le catalogue par genre sur serveur et fichier direct", async ({ page }) => {
  for (const url of ["/catalogue.html", pathToFileURL(resolve("catalogue.html")).href]) {
    await page.goto(url);
    const grid = page.locator("#catalogGrid");
    const genders = page.locator("#genderFilters");
    if ((page.viewportSize()?.width ?? 1280) <= 920) {
      await page.locator("#catalogFilterToggle").click();
      await expect(page.locator("#catalogFacets")).toHaveClass(/is-open/);
    }
    await expect(page.locator("#catalogFacets > #genderFilters")).toHaveCount(1);
    await expect(genders.locator("summary")).toHaveText("Genre");
    await expect(genders.locator('[data-facet="gender"]')).toHaveCount(3);
    await genders.locator('[data-facet="gender"][value="homme"]').check();
    await expect(grid.locator(".product-card")).toHaveCount(3);
    await genders.locator('[data-facet="gender"][value="femme"]').check();
    await expect(grid.locator(".product-card")).toHaveCount(6);
    await genders.locator('[data-facet="gender"][value="homme"]').uncheck();
    await expect(grid.locator(".product-card")).toHaveCount(3);
    await genders.locator('[data-facet="gender"][value="femme"]').uncheck();
    await genders.locator('[data-facet="gender"][value="enfant"]').check();
    await expect(grid.locator(".product-card")).toHaveCount(1);
    await page.locator("#facetReset").click();
    await expect(grid.locator(".product-card")).toHaveCount(7);
  }
});

test("combine les filtres de saisons et d’occasions", async ({ page }) => {
  await page.goto("/catalogue.html");
  if ((page.viewportSize()?.width ?? 1280) <= 920) await page.locator("#catalogFilterToggle").click();
  const grid = page.locator("#catalogGrid");
  await page.locator('[data-facet="season"][value="printemps"]').check();
  await expect(grid.locator(".product-card")).toHaveCount(3);
  await page.locator('[data-facet="occasion"][value="speciale"]').check();
  await expect(grid.locator(".product-card")).toHaveCount(2);
  await expect(page.locator("#activeFilterCount")).toHaveText("2");
});

test("filtre par marque et propose des catégories propres à chaque univers", async ({ page }) => {
  await page.goto("/catalogue.html");
  const grid = page.locator("#catalogGrid");
  await expect(page.locator('[data-universe-filters="parfums"] .filter-btn')).toHaveCount(5);
  await page.locator('[data-filter="women"]').click();
  await expect(grid.locator(".product-card")).toHaveCount(3);
  if ((page.viewportSize()?.width ?? 1280) <= 920) await page.locator("#catalogFilterToggle").click();
  await page.locator('[data-facet="brand"][value="dior"]').check();
  await expect(grid.locator(".product-card")).toHaveCount(1);
  await page.locator("#facetReset").click();
  if ((page.viewportSize()?.width ?? 1280) <= 920) await page.locator("#catalogFacetClose").click();
  await page.getByRole("tab", { name: /Accessoires/ }).click();
  await expect(page.locator('[data-universe-filters="accessoires"] .filter-btn')).toHaveCount(4);
  await page.locator('[data-filter="coffrets"]').click();
  await expect(grid.locator(".product-card")).toHaveCount(2);
});

test("distingue les univers parfums et accessoires", async ({ page }) => {
  await page.goto("/catalogue.html?univers=accessoires");
  await expect(page.getByRole("tab", { name: /Accessoires/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".product-card")).toHaveCount(4);
  await page.locator('[data-filter="voyage"]').click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("tab", { name: /Parfums/ }).click();
  await expect(page.locator(".product-card")).toHaveCount(7);
  await expect(page).toHaveURL(/univers=parfums/);
});

test("ouvre directement les filtres depuis les univers de la Maison", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Coffrets cadeaux/ }).click();
  await expect(page).toHaveURL(/univers=accessoires&filter=coffrets/);
  await expect(page.locator('[data-filter="coffrets"]')).toHaveClass(/active/);
  await expect(page.locator(".product-card")).toHaveCount(2);
});

test("mémorise et affiche les favoris entre les pages", async ({ page }) => {
  await page.goto("/");
  const product = page.locator("#parfums .product-card").first();
  const name = await product.locator(".product-name").textContent();
  await product.locator(".fav").click();
  await page.getByRole("button", { name: "Ouvrir les favoris" }).click();
  await expect(page.locator(".shop-panel")).toContainText(name);
  await page.goto("/magazine.html");
  await page.getByRole("button", { name: "Ouvrir les favoris" }).click();
  await expect(page.locator(".shop-panel")).toContainText(name);
});

test("crée un compte partagé sur tout le site", async ({ page }) => {
  const email = `client-${Date.now()}-${test.info().project.name}@example.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Se connecter" }).click();
  await page.getByRole("button", { name: "Créer un compte" }).click();
  const accountDialog = page.getByRole("dialog", { name: "Panneau client" });
  await accountDialog.getByLabel("Nom complet").fill("Awa Test");
  await accountDialog.getByLabel("Adresse e-mail").fill(email);
  await accountDialog.getByLabel("Mot de passe").fill("MotDePasse!2026");
  await accountDialog.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("heading", { name: "Awa Test" })).toBeVisible();
  await page.goto("/catalogue.html");
  await page.getByRole("link", { name: "Se connecter" }).click();
  await expect(page.getByText(email)).toBeVisible();
});

test("enregistre l’inscription newsletter depuis l’accueil", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Rejoindre", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Entrez dans le cercle." });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  const responsePromise = page.waitForResponse("**/api/newsletter");
  await dialog.getByLabel("Nom complet").fill("Awa Diop");
  await dialog.getByLabel("Numéro WhatsApp").fill("+221 77 123 45 67");
  await dialog.getByLabel("Adresse email").fill(`news-${Date.now()}@example.com`);
  await dialog.getByText(/J’accepte/).click();
  await dialog.getByRole("button", { name: "Rejoindre la communauté" }).click();
  expect((await responsePromise).status()).toBe(201);
  await expect(page.locator(".toast-global")).toContainText("Bienvenue");
  await expect(page.locator("#communityModal")).toBeHidden();
});

test("aligne le footer, le logo vertical et les réseaux sociaux sur toutes les pages", async ({ page }) => {
  for (const route of ["/", "/catalogue.html", "/la-maison.html", "/magazine.html"]) {
    await page.goto(route);
    const footer = page.locator(".site-footer");
    await expect(footer).toBeVisible();
    await expect(footer.locator(".footer-grid > *")).toHaveCount(4);
    await expect(footer.locator(".footer-logo img")).toHaveAttribute(
      "src",
      "assets/images/branding/imana-logo-footer-gold.webp",
    );
    for (const network of ["Instagram", "Facebook", "TikTok", "WhatsApp"]) {
      await expect(footer.getByRole("link", { name: network, exact: true })).toBeVisible();
    }
    await expect(footer).toContainText("Sicap Sacré-Cœur 2");
    await expect(footer).toContainText("+221 77 740 17 63");
  }
});

test("intègre les nouveaux visuels de marque IMANA", async ({ page }) => {
  await page.goto("/");
  const signatureSlide = page.locator(".hero-slide--signature");
  await expect(page.locator(".hero-slide")).toHaveCount(5);
  await expect(signatureSlide.locator("img")).toHaveAttribute(
    "src",
    "assets/images/optimized/imana-signature-flacon.webp",
  );
  await page.locator("#heroDots button").last().click();
  await expect(signatureSlide).toHaveClass(/active/);
  await expect(signatureSlide.getByRole("heading", { name: /La nuit révèle votre signature/ })).toBeVisible();
  await expect(page.locator('[data-product-id="4"] img').first()).toHaveAttribute(
    "src",
    /imana-signature-flacon\.webp$/,
  );

  await page.goto("/la-maison.html");
  await expect(page.locator("#histoire .image-frame img")).toHaveAttribute(
    "src",
    "assets/images/optimized/imana-brand-universe.webp",
  );
});

test("refuse proprement le paiement sans secret Stripe", async ({ request }) => {
  const response = await request.post("/api/checkout", {
    data: { items: [{ id: 1, quantity: 1 }] },
  });
  expect(response.status()).toBe(503);
  expect((await response.json()).error).toContain("Paiement non configuré");
});

test("ne confirme pas un paiement à partir des seuls paramètres de l’URL", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("imana-signature-cart", JSON.stringify([{ id: 1, quantity: 1 }]));
  });
  await page.goto("/?payment=success&session_id=cs_test_inconnue");
  await expect(page.locator(".toast-global")).toContainText("Commande introuvable");
  await expect(page.locator(".cart-dot")).toHaveText("1");
  const storedCart = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("imana-signature-cart") || "[]"));
  expect(storedCart).toEqual([{ id: 1, quantity: 1 }]);
});

test("permet à un administrateur de piloter le portail dédié", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Adresse e-mail").fill("admin-e2e@example.com");
  await page.getByLabel("Mot de passe").fill("AdminSecure!2026");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Vue d’ensemble" })).toBeVisible();
  await expect(page.getByText("Chiffre d’affaires")).toBeVisible();
  await expect(page.getByText("Valeur du stock")).toBeVisible();

  if ((page.viewportSize()?.width ?? 1280) <= 820) {
    await page.getByRole("button", { name: "Ouvrir la navigation" }).click();
  }
  await page.getByRole("button", { name: "Catégories" }).click();
  await expect(page.getByRole("heading", { name: "Catégories" })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter" }).click();
  const dialog = page.getByRole("dialog", { name: /Ajouter — Catégories/ });
  const suffix = `${Date.now()}-${test.info().project.name}`;
  await dialog.getByLabel("Nom").fill(`Test ${suffix}`);
  await dialog.getByLabel("Slug").fill(`test-${suffix}`);
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#adminToast")).toContainText("Enregistrement effectué");
  await expect(page.getByText(`Test ${suffix}`)).toBeVisible();
});
