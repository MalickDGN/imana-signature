// One-time migration helper. Runtime rendering uses the resulting TSX, never HTML parsing.
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const out = path.resolve(__dirname, '../src/components/storefront');
const docs = Object.fromEntries(['index', 'la-maison', 'magazine', 'catalogue'].map(name => [name, new JSDOM(fs.readFileSync(path.join(root, name + '.html'), 'utf8')).window.document]));
const voids = new Set(['img', 'input', 'source', 'br', 'hr', 'wbr', 'meta', 'link']);
const bools = new Set(['hidden', 'disabled', 'required', 'checked', 'selected', 'open', 'muted', 'loop', 'autoplay', 'playsinline', 'controls', 'multiple']);
const names = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', autoplay: 'autoPlay', playsinline: 'playsInline', autocomplete: 'autoComplete', inputmode: 'inputMode', minlength: 'minLength', maxlength: 'maxLength', readonly: 'readOnly', srcset: 'srcSet', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule', viewbox: 'viewBox' };
function href(value) { for (const [file, route] of [['index.html', '/'], ['catalogue.html', '/collections'], ['la-maison.html', '/about'], ['magazine.html', '/blog']]) if (value.startsWith(file)) return route + value.slice(file.length); return value.startsWith('assets/') ? '/' + value : value; }
function jsx(node, mode = '') {
  if (node.nodeType === 3) return node.textContent.trim() ? `{${JSON.stringify(node.textContent)}}` : '\n';
  if (node.nodeType !== 1) return '';
  const id = node.id; const cls = node.classList;
  if (node.tagName === 'SCRIPT') return '';
  if (mode === 'home') {
    if (id === 'accueil') return '<Hero />';
    if (id === 'diagnostic') return '<Diagnostic />';
    if (cls.contains('universe-carousel')) return '<Universes />';
    if (node.hasAttribute('data-promo-banners')) return '<Promotions />';
    if (node.hasAttribute('data-product-section')) return `<ProductGrid kind=${JSON.stringify(node.dataset.productSection)} />`;
  }
  if (mode === 'hero' && cls.contains('hero-product-card')) return '<FeaturedProduct />';
  if (mode === 'magazine' && cls.contains('article-grid')) return '<Articles />';
  if (mode === 'catalog' && id === 'catalogBanner') return '<CampaignBanner />';
  if (mode === 'catalog' && id === 'catalogGrid') return '<><CatalogStatus /><div className="product-grid" id="catalogGrid">{ui.results.map(product => <StorefrontProductCard key={product.id} product={product} />)}</div></>';
  if (mode === 'catalog' && id === 'activeFilters') return '<div className="active-filters" id="activeFilters" aria-live="polite">{(Object.entries(ui.facets) as [Facet, string[]][]).flatMap(([key, values]) => values.map(value => <span key={key + value} className="active-filter">{labels[value] || value}<button type="button" onClick={() => ui.toggleFacet(key, value)} aria-label={`Retirer le filtre ${labels[value] || value}`}>×</button></span>))}</div>';
  const props = {};
  let children = [...node.childNodes].map(child => jsx(child, mode)).join('');
  for (const attr of node.attributes) {
    if (attr.name.startsWith('on')) continue;
    const key = names[attr.name] || attr.name;
    if (attr.name === 'style') {
      const style = Object.fromEntries(Array.from({length: node.style.length}, (_, i) => node.style[i]).map(key => [key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), node.style.getPropertyValue(key)]));
      props.style = JSON.stringify(style); continue;
    }
    props[key] = bools.has(attr.name) ? 'true' : JSON.stringify(['href', 'src', 'poster'].includes(attr.name) ? href(attr.value) : attr.value);
  }
  if (mode === 'home' && id === 'communityJoinTrigger') props.onClick = "() => openPanel('community')";
  if (mode === 'header') {
    if (cls.contains('brand')) props.href = JSON.stringify('/');
    if (cls.contains('nav-link')) { const dest = href(node.getAttribute('href')); props.className = JSON.stringify(node.className.replace(' active', '')) + ` + (${dest === '/collections' ? "ui.pathname === '/' || ui.pathname === '/collections'" : 'ui.pathname === ' + JSON.stringify(dest)} ? ' active' : '')`; }
    if (cls.contains('menu-row')) props.className = "'menu-row' + (ui.menu ? ' open' : '')";
    if (cls.contains('shop-trigger')) Object.assign(props, {onClick: '(event) => { event.preventDefault(); ui.toggleMega(); }', onMouseEnter: '() => ui.hover(true)', onMouseLeave: '() => ui.hover(false)', 'aria-expanded': 'ui.mega', 'aria-controls': '"megaMenu"', 'aria-haspopup': 'true'});
    if (cls.contains('mobile-toggle')) Object.assign(props, {onClick: 'ui.toggleMenu', 'aria-expanded': 'ui.menu', 'aria-label': "ui.menu ? 'Fermer le menu' : 'Ouvrir le menu'"});
    if (cls.contains('search-box')) props.className = "'search-box' + (ui.search ? ' is-mobile-open' : '')";
    if (id === 'globalSearch') Object.assign(props, {ref: 'ui.input', onKeyDown: "event => { if (event.key === 'Enter') ui.searchFor(event.currentTarget.value); }"});
    if (cls.contains('mobile-search-toggle')) Object.assign(props, {onClick: 'ui.toggleSearch', 'aria-expanded': 'ui.search'});
    if (cls.contains('favorites-trigger')) props.onClick = "() => openPanel('wishlist')";
    if (cls.contains('cart-trigger')) props.onClick = "() => openPanel('cart')";
    if (cls.contains('cart-dot')) children = '{hydrated ? count : 0}';
    if (cls.contains('login-btn')) props.onClick = "event => { event.preventDefault(); openPanel('account'); }";
    if (id === 'megaMenu') Object.assign(props, {className: "'mega' + (ui.mega ? ' show' : '')", 'aria-hidden': '!ui.mega', onMouseEnter: '() => ui.hover(true)', onMouseLeave: '() => ui.hover(false)'});
    if (node.getAttribute('href') === '#contact') props.href = "'/#contact'";
  }
  if (mode === 'hero' || mode === 'banner') {
    const hero = mode === 'hero'; const slideClass = hero ? 'hero-slide' : 'catalog-banner__slide';
    if (cls.contains(slideClass)) { const i = [...node.parentElement.children].filter(n => n.classList.contains(slideClass)).indexOf(node); props.className = JSON.stringify(node.className.replace(/ active| is-active/g, '')) + ` + (ui.index === ${i} ? '${hero ? ' active' : ' is-active'}' : '')`; props['aria-hidden'] = `ui.index !== ${i}`; props.inert = `ui.index !== ${i} ? '' : undefined`; }
    if (node.tagName === 'VIDEO') { props.ref = 'ui.video'; delete props.autoPlay; }
    if (cls.contains('hero-slider') || id === 'catalogBanner') Object.assign(props, {onMouseEnter: '() => ui.setHovered(true)', onMouseLeave: '() => ui.setHovered(false)', onFocus: '() => ui.setHovered(true)', onBlur: 'event => { if (!event.currentTarget.contains(event.relatedTarget)) ui.setHovered(false); }', onTouchStart: 'event => { ui.start.current = event.changedTouches[0].clientX; }', onTouchEnd: 'event => ui.touchEnd(event.changedTouches[0].clientX)'});
    if (id === 'prevHero' || node.getAttribute('aria-label') === 'Campagne précédente') props.onClick = '() => ui.next(-1)';
    if (id === 'nextHero' || node.getAttribute('aria-label') === 'Campagne suivante') props.onClick = '() => ui.next(1)';
    if (id === 'heroDots' || cls.contains('catalog-banner__dots')) children = `{Array.from({length: ${hero ? 5 : 3}}, (_, index) => <button type="button" key={index} className={ui.index === index ? '${hero ? 'active' : 'is-active'}' : ''} aria-current={ui.index === index} aria-label={\`${hero ? 'Afficher la diapositive' : 'Afficher la campagne'} \${index + 1}\`} onClick={() => ui.setIndex(index)} />)}`;
    if (id === 'toggleHeroMotion') { props.onClick = 'ui.toggle'; props['aria-pressed'] = 'ui.paused'; props['aria-label'] = "ui.paused ? 'Reprendre les animations du diaporama' : 'Suspendre les animations du diaporama'"; children = '<span aria-hidden="true">{ui.paused ? "▶" : "Ⅱ"}</span><span>{ui.paused ? "Lecture" : "Pause"}</span>'; }
  }
  if (mode === 'catalog') {
    if (id === 'catalogSearch') Object.assign(props, {value: 'ui.query', onChange: 'event => ui.setQuery(event.currentTarget.value)'});
    if (id === 'catalogSort') Object.assign(props, {value: 'ui.sort', onChange: 'event => ui.setSort(event.currentTarget.value)'});
    if (node.hasAttribute('data-universe')) Object.assign(props, {className: "'shop-universe' + (ui.universe === " + JSON.stringify(node.dataset.universe) + " ? ' active' : '')", 'aria-selected': 'ui.universe === ' + JSON.stringify(node.dataset.universe), onClick: '() => ui.selectUniverse(' + JSON.stringify(node.dataset.universe) + ')'});
    if (node.hasAttribute('data-universe-filters')) props.hidden = 'ui.universe !== ' + JSON.stringify(node.dataset.universeFilters);
    if (node.hasAttribute('data-filter')) Object.assign(props, {className: "'filter-btn' + (ui.filter === " + JSON.stringify(node.dataset.filter) + " ? ' active' : '')", onClick: '() => ui.setFilter(' + JSON.stringify(node.dataset.filter) + ')'});
    if (node.hasAttribute('data-facet')) { const key = JSON.stringify(node.dataset.facet), value = JSON.stringify(node.getAttribute('value')); Object.assign(props, {checked: `ui.facets[${key}].includes(${value})`, onChange: `() => ui.toggleFacet(${key}, ${value})`}); }
    if (node.tagName === 'SMALL' && node.parentElement.querySelector('[data-facet]')) { const input = node.parentElement.querySelector('[data-facet]'); children = `{ui.countFacet(${JSON.stringify(input.dataset.facet)}, ${JSON.stringify(input.value)})}`; }
    if (id === 'productCount') children = '{ui.results.length} article{ui.results.length > 1 ? "s" : ""}';
    if (id === 'catalogEmpty') props.hidden = 'ui.loading || !!ui.error || ui.results.length > 0';
    if (id === 'catalogReset') props.onClick = 'ui.reset';
    if (id === 'facetReset') props.onClick = 'ui.clearFacets';
    if (id === 'catalogFilterToggle') Object.assign(props, {onClick: '() => ui.setOpen(true)', 'aria-expanded': 'ui.open'});
    if (id === 'catalogFacetClose') props.onClick = 'ui.close';
    if (id === 'catalogFacetOverlay') Object.assign(props, {hidden: '!ui.open', onClick: 'ui.close'});
    if (id === 'catalogFacets') { props.className = JSON.stringify(node.className) + " + (ui.open ? ' is-open' : '')"; props.ref = 'ui.dialog'; props.tabIndex = '-1'; }
    if (id === 'activeFilterCount') { children = '{ui.activeCount}'; props.hidden = 'ui.activeCount === 0'; }
  }
  if (mode === 'diagnostic') {
    if (id === 'diagnosticLaunch') props.onClick = 'ui.show';
    if (id === 'diagnosticModal') props.hidden = '!ui.open';
    if (node.hasAttribute('data-diagnostic-close')) props.onClick = 'ui.close';
    if (cls.contains('diagnostic-modal__dialog')) props.ref = 'ui.dialog';
    if (id === 'diagnosticStepLabel') children = '{ui.result ? "Diagnostic terminé" : `Étape ${ui.step + 1} sur 3`}';
    if (node.hasAttribute('data-step-indicator')) props.className = `ui.result || ui.step > ${Number(node.dataset.stepIndicator) - 1} ? 'is-complete' : ui.step === ${Number(node.dataset.stepIndicator) - 1} ? 'is-active' : ''`;
    if (id === 'diagnosticReset') props.onClick = 'ui.reset';
    if (id === 'olfactoryForm') { props.onSubmit = 'ui.submit'; props.noValidate = 'true'; }
    if (node.hasAttribute('data-quiz-step')) props.hidden = `ui.step !== ${Number(node.dataset.quizStep) - 1}`;
    if (node.tagName === 'INPUT') { const name = JSON.stringify(node.name), value = JSON.stringify(node.value); props.checked = `ui.answers[${name}] === ${value}`; props.onChange = `() => ui.answer(${name}, ${value})`; }
    if (id === 'diagnosticBack') { props.hidden = 'ui.step === 0'; props.onClick = '() => ui.setStep(ui.step - 1)'; }
    if (id === 'diagnosticNext') { props.hidden = 'ui.step === 2'; props.disabled = '!ui.selected'; props.onClick = '() => ui.setStep(ui.step + 1)'; }
    if (cls.contains('diagnostic-submit')) { props.hidden = 'ui.step !== 2'; props.disabled = '!ui.selected'; }
    if (id === 'olfactoryResult') { props.hidden = '!ui.result && !ui.resultError'; children = '<DiagnosticResult product={ui.result} error={ui.resultError} />'; }
  }
  if (mode === 'community') {
    if (id === 'communityModal') props.hidden = "panel !== 'community'";
    if (node.hasAttribute('data-community-close')) props.onClick = 'close';
    if (cls.contains('community-modal__dialog')) props.ref = 'dialog';
    if (node.tagName === 'FORM') props.onSubmit = 'submit';
    if (node.tagName === 'BUTTON' && node.type === 'submit') { props.disabled = 'pending'; children = '{pending ? "Inscription en cours…" : "Rejoindre la communauté"}'; }
  }
  if (mode === 'footer' && cls.contains('float-top')) props.onClick = '() => window.scrollTo({ top: 0, behavior: "smooth" })';
  const tag = node.tagName === 'A' && (props.href?.startsWith('"/') || props.href?.startsWith('"#')) ? 'Link' : node.tagName.toLowerCase();
  return `<${tag}${Object.entries(props).map(([key, value]) => ` ${key}={${value}}`).join('')}${voids.has(tag) ? ' />' : `>${children}</${tag}>`}`;
}
function write(name, body, imports = '', hook = '', client = true) {
  fs.writeFileSync(path.join(out, name + '.tsx'), `${client ? "'use client';\n" : ''}import Link from 'next/link';\n${imports}\nexport function ${name}() { ${hook}\nreturn (<>${body}</>);\n}\n`);
}
const d = docs.index;
write('Header', [d.querySelector('.topbar'), d.querySelector('.header'), d.querySelector('#megaMenu')].map(n => jsx(n, 'header')).join(''), `import { useHeader } from './hooks';\nimport { useStorefront } from './StorefrontProvider';\nimport { useCartStore } from '@/lib/store/cart';`, "const ui = useHeader(); const { openPanel, hydrated } = useStorefront(); const count = useCartStore(state => state.items.reduce((sum, item) => sum + item.quantity, 0));");
// The wrapper is display:contents, keeping the approved header's exact geometry.
let header = fs.readFileSync(path.join(out, 'Header.tsx'), 'utf8').replace('return (<>', 'return (<div ref={ui.root} style={{display: "contents"}}>');
header = header.replace('</>);', '</div>);'); fs.writeFileSync(path.join(out, 'Header.tsx'), header);
write('Footer', [d.querySelector('footer'), d.querySelector('.float-chat')].map(n => jsx(n, 'footer')).join('') + '<button className="float-top" type="button" aria-label="Revenir en haut de la page" onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>↑</button>');
write('Hero', jsx(d.querySelector('#accueil'), 'hero'), "import { useCarousel } from './hooks';\nimport { FeaturedProduct } from './Editorial';", 'const ui = useCarousel(5);');
write('CampaignBanner', jsx(docs.catalogue.querySelector('#catalogBanner'), 'banner'), "import { useCarousel } from './hooks';", 'const ui = useCarousel(3, 8000);');
write('HomeSections', [...d.querySelector('main').children].map(n => jsx(n, 'home')).join(''), "import { Hero } from './Hero';\nimport { ProductGrid } from './ProductGrid';\nimport { Universes, Promotions } from './Editorial';\nimport { Diagnostic } from './Diagnostic';\nimport { useStorefront } from './StorefrontProvider';", 'const { openPanel } = useStorefront();');
write('MaisonSections', [...docs['la-maison'].querySelector('main').children].map(n => jsx(n)).join(''), '', '', false);
write('MagazineSections', [...docs.magazine.querySelector('main').children].map(n => jsx(n, 'magazine')).join(''), "import { Articles } from './Editorial';");
write('CatalogLayout', jsx(docs.catalogue.querySelector('#boutique'), 'catalog'), "import { useCatalog } from './hooks';\nimport { CampaignBanner } from './CampaignBanner';\nimport { StorefrontProductCard, CatalogStatus } from './ProductGrid';\nimport { labels, type Facet } from '@/lib/storefront/model';", 'const ui = useCatalog();');
write('Diagnostic', jsx(d.querySelector('#diagnostic'), 'diagnostic'), "import { useDiagnostic, DiagnosticResult } from './DiagnosticLogic';", 'const ui = useDiagnostic();');
write('CommunityDialog', jsx(d.querySelector('#communityModal'), 'community'), "import { useCommunity } from './Panels';", 'const { panel, close, dialog, submit, pending } = useCommunity();');
console.log('Converted all four approved pages and shared markup into TSX.');
