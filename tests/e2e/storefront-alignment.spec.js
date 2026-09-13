import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';

// Fixtures belong to this browser suite only; production uses the backend catalogue.
const products = [
  { id: 'test-box-1', name: 'Coffret découverte test', price: 45000, stock: 3, category: 'Accessoires', accessoryType: 'coffrets' },
  { id: 'test-box-2', name: 'Coffret signature test', price: 65000, stock: 2, category: 'Accessoires', accessoryType: 'coffrets' },
  { id: 'test-travel', name: 'Étui voyage test', price: 15000, stock: 4, category: 'Accessoires', accessoryType: 'voyage' },
  { id: 'test-perfume', name: 'Parfum test', price: 55000, stock: 0, category: 'Parfums', gender: 'femme' },
].map(product => ({ ...product, imageUrl: '/assets/images/optimized/imana-product-1.webp' }));

test.beforeEach(async ({ page }) => {
  await page.route('**/api/storefront/products', route => route.fulfill({ json: products }));
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
  await page.route('**/api/analytics/events', route => route.fulfill({ status: 204 }));
  await page.route('**/api/content/articles', route => route.fulfill({ json: [] }));
});

const pages = [
  { route: '/', file: 'index.html', landmark: '#accueil' },
  { route: '/about', file: 'la-maison.html', landmark: '#a-propos' },
  { route: '/blog', file: 'magazine.html', landmark: '#magazine-hero-title' },
  { route: '/collections', file: 'catalogue.html', landmark: '#shopUniverses' },
];

for (const { route, file, landmark } of pages) {
  test(`rend la page React et son URL historique : ${route}`, async ({ page }) => {
    test.setTimeout(60_000);
    for (const url of [route, `/${file}`]) {
      const catalogue = page.waitForResponse('**/api/storefront/products');
      const response = await page.goto(url);
      await catalogue;
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
      await expect(page.locator('header.header')).toBeVisible();
      await expect(page.locator(landmark)).toBeVisible();
      await expect(page.locator('script[src*="/_next/"]').first()).toBeAttached();
      expect(await page.locator('script[src^="/assets/js/"], script[src^="assets/js/"]').count()).toBe(0);
      // A working panel proves that the server markup has hydrated.
      await page.getByRole('button', { name: 'Ouvrir le panier' }).click();
      await expect(page.getByRole('dialog')).toContainText('Votre panier est vide.');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
  });

  test(`affiche les styles, médias et navigation validés : ${route}`, async ({ page }, info) => {
    test.setTimeout(60_000);
    // Account availability is independent of this visual/routing regression test.
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
    const errors = [];
    const missingAssets = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/assets/') && response.status() >= 400) {
        missingAssets.push(response.url());
      }
    });
    await page.goto(route);
    await expect(page.locator('header.header')).toBeVisible();
    await expect(page.locator('.brand-mark img')).toHaveAttribute('src', '/assets/images/branding/imana-logo-light.webp');
    await expect(page.locator('.cart-trigger')).toHaveCSS('background-color', 'rgb(32, 51, 99)');
    await expect(page.locator('footer')).toContainText('+221 77 740 17 63');
    await expect(page.locator('footer')).toContainText('Sicap Sacré-Cœur 2');

    if ((page.viewportSize()?.width ?? 1280) <= 920) {
      await page.locator('.mobile-search-toggle').click();
      await expect(page.locator('#globalSearch')).toBeFocused();
      await page.keyboard.press('Escape');
    }
    await expect.poll(() => page.evaluate(() =>
      [...document.images].filter((image) => image.loading !== 'lazy')
        .every((image) => image.complete && image.naturalWidth > 0),
    )).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    expect(missingAssets).toEqual([]);
    await page.screenshot({ path: info.outputPath(`${file}.png`), animations: 'disabled' });
  });
}

test('sert les médias et styles originaux sans altération', async ({ request }) => {
  async function verifyDirectory(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (directory === 'assets' && entry.name === 'js') continue;
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        await verifyDirectory(path);
      } else {
        const response = await request.get(`/${path}`);
        expect(response.status(), path).toBe(200);
        expect((await response.body()).equals(await readFile(path)), path).toBe(true);
      }
    }
  }
  await verifyDirectory('assets');
  const legacyScript = await request.get('/assets/js/script.js');
  expect(legacyScript.status()).toBe(404);
});

test('conserve les filtres des URL réécrites et le panier entre les pages', async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
  await page.goto('/catalogue.html?univers=accessoires&filter=coffrets');
  await expect(page.getByRole('tab', { name: /Accessoires/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#catalogGrid .product-card')).toHaveCount(2);
  const product = page.locator('#catalogGrid .product-card').first();
  const name = await product.locator('.product-name').textContent();
  await product.locator('.plus').click();
  await expect(page.locator('.cart-dot')).toHaveText('1');
  await page.goto('/blog');
  await expect(page.locator('.cart-dot')).toHaveText('1');
  await page.getByRole('button', { name: 'Ouvrir le panier' }).click();
  await expect(page.locator('.shop-panel')).toContainText(name);
  await page.getByRole('button', { name: `Retirer ${name}` }).click();
  await expect(page.locator('.shop-panel')).toContainText('Votre panier est vide.');
  await expect(page.locator('.cart-dot')).toHaveText('0');
});

test('conserve le diaporama et les liens vers les pages validées', async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null } }));
  await page.goto('/');
  await expect(page.locator('.hero-slide')).toHaveCount(5);
  await page.locator('#toggleHeroMotion').click();
  await expect(page.locator('#toggleHeroMotion')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Afficher la diapositive 5' }).click();
  await expect(page.locator('.hero-slide.active h1')).toContainText('La nuit révèle votre signature');
  if ((page.viewportSize()?.width ?? 1280) <= 920) await page.locator('.mobile-toggle').click();
  await page.locator('.menu-row').getByRole('link', { name: 'LA MAISON', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator('#a-propos .maison-about__card')).toHaveCount(3);
  await expect(page.locator('#conseils .guide-card')).toHaveCount(6);
});

test('affiche une erreur de catalogue et permet de réessayer', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/storefront/products', route => ++attempts === 1
    ? route.fulfill({ status: 503, json: { error: 'Catalogue temporairement indisponible.' } })
    : route.fulfill({ json: products }));
  await page.goto('/collections');
  await expect(page.locator('main').getByRole('alert')).toContainText('Catalogue temporairement indisponible.');
  await expect(page.locator('#catalogGrid .product-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
  await expect(page.locator('#catalogGrid .product-card')).toHaveCount(1);
  await expect(page.locator('#catalogGrid .plus')).toBeDisabled();
});

test('affiche un catalogue vide sans produits de remplacement', async ({ page }) => {
  await page.route('**/api/storefront/products', route => route.fulfill({ json: [] }));
  await page.goto('/collections');
  await expect(page.locator('#catalogEmpty')).toBeVisible();
  await expect(page.locator('#catalogGrid .product-card')).toHaveCount(0);
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
});
