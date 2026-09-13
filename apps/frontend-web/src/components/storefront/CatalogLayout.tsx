'use client';
import Link from 'next/link';
import { useCatalog } from './hooks';
import { CampaignBanner } from './CampaignBanner';
import { StorefrontProductCard, CatalogStatus } from './ProductGrid';
import { labels, type Facet } from '@/lib/storefront/model';
export function CatalogLayout() { const ui = useCatalog();
return (<><section className={"catalog-page catalog-page--standalone"} id={"boutique"}>
<div className={"container catalog-inner"}>
<CampaignBanner />
<div className={"catalog-benefits"} aria-label={"Engagements de la boutique"}>
<span><strong>{"100 % authentiques"}</strong><small>{"Produits vérifiés"}</small></span>
<span><strong>{"Livraison 24–48 h"}</strong><small>{"À Dakar"}</small></span>
<span><strong>{"Conseil personnalisé"}</strong><small>{"Avant votre commande"}</small></span>
</div>
<div className={"shop-universes"} id={"shopUniverses"} role={"tablist"} aria-label={"Univers de la boutique"}>
<button className={'shop-universe' + (ui.universe === "parfums" ? ' active' : '')} type={"button"} role={"tab"} aria-selected={ui.universe === "parfums"} data-universe={"parfums"} onClick={() => ui.selectUniverse("parfums")}>
<span className={"shop-universe-index"}>{"01"}</span>
<span><strong>{"Parfums"}</strong><small>{"Eaux de parfum, signatures et collections privées"}</small></span>
<span aria-hidden={"true"}>{"→"}</span>
</button>
<button className={'shop-universe' + (ui.universe === "accessoires" ? ' active' : '')} type={"button"} role={"tab"} aria-selected={ui.universe === "accessoires"} data-universe={"accessoires"} onClick={() => ui.selectUniverse("accessoires")}>
<span className={"shop-universe-index"}>{"02"}</span>
<span><strong>{"Accessoires"}</strong><small>{"Coffrets, objets parfumés et essentiels nomades"}</small></span>
<span aria-hidden={"true"}>{"→"}</span>
</button>
</div>
<div className={"catalog-controls"}>
<div className={"catalog-toolbar"}>
<strong id={"productCount"} aria-live={"polite"}>{ui.results.length} article{ui.results.length > 1 ? "s" : ""}</strong>
<button className={"catalog-filter-toggle"} id={"catalogFilterToggle"} type={"button"} aria-controls={"catalogFacets"} aria-expanded={ui.open} onClick={() => ui.setOpen(true)}>
<svg viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} aria-hidden={"true"}><path d={"M4 6h16M7 12h10M10 18h4"}></path></svg>{"\n                Filtres "}<span id={"activeFilterCount"} hidden={ui.activeCount === 0}>{ui.activeCount}</span>
</button>
<label className={"catalog-search"}>
<span className={"sr-only"}>{"Rechercher dans la boutique"}</span>
<svg viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} aria-hidden={"true"}><circle cx={"11"} cy={"11"} r={"7"}></circle><path d={"m20 20-4-4"}></path></svg>
<input id={"catalogSearch"} type={"search"} placeholder={"Rechercher une fragrance…"} autoComplete={"off"} value={ui.query} onChange={event => ui.setQuery(event.currentTarget.value)} />
</label>
<label className={"catalog-sort"}>
<span>{"Trier par"}</span>
<select id={"catalogSort"} value={ui.sort} onChange={event => ui.setSort(event.currentTarget.value)}>
<option value={"featured"}>{"Sélection IMANA"}</option>
<option value={"price-asc"}>{"Prix croissant"}</option>
<option value={"price-desc"}>{"Prix décroissant"}</option>
<option value={"name"}>{"Nom A–Z"}</option>
</select>
</label>
</div>
<div id={"shopFilters"}>
<div className={"filter-bar"} data-universe-filters={"parfums"} aria-label={"Filtrer les parfums"} hidden={ui.universe !== "parfums"}>
<button className={'filter-btn' + (ui.filter === "parfums" ? ' active' : '')} data-filter={"parfums"} onClick={() => ui.setFilter("parfums")}>{"Tous les parfums"}</button>
<button className={'filter-btn' + (ui.filter === "women" ? ' active' : '')} data-filter={"women"} onClick={() => ui.setFilter("women")}>{"Parfums Femme"}</button>
<button className={'filter-btn' + (ui.filter === "men" ? ' active' : '')} data-filter={"men"} onClick={() => ui.setFilter("men")}>{"Parfums Homme"}</button>
<button className={'filter-btn' + (ui.filter === "children" ? ' active' : '')} data-filter={"children"} onClick={() => ui.setFilter("children")}>{"Parfums Enfant"}</button>
<button className={'filter-btn' + (ui.filter === "niche" ? ' active' : '')} data-filter={"niche"} onClick={() => ui.setFilter("niche")}>{"Parfums de niche"}</button>
</div>
<div className={"filter-bar"} data-universe-filters={"accessoires"} aria-label={"Filtrer les accessoires"} hidden={ui.universe !== "accessoires"}>
<button className={'filter-btn' + (ui.filter === "accessoires" ? ' active' : '')} data-filter={"accessoires"} onClick={() => ui.setFilter("accessoires")}>{"Tous les accessoires"}</button>
<button className={'filter-btn' + (ui.filter === "coffrets" ? ' active' : '')} data-filter={"coffrets"} onClick={() => ui.setFilter("coffrets")}>{"Coffrets cadeaux"}</button>
<button className={'filter-btn' + (ui.filter === "voyage" ? ' active' : '')} data-filter={"voyage"} onClick={() => ui.setFilter("voyage")}>{"Accessoires de voyage"}</button>
<button className={'filter-btn' + (ui.filter === "maison" ? ' active' : '')} data-filter={"maison"} onClick={() => ui.setFilter("maison")}>{"Parfums d’intérieur"}</button>
</div>
</div>
</div>
<div className={"catalog-facet-overlay"} id={"catalogFacetOverlay"} hidden={!ui.open} onClick={ui.close}></div>
<div className={"catalog-results"}>
<aside className={"catalog-facets" + (ui.open ? ' is-open' : '')} id={"catalogFacets"} aria-label={"Filtres du catalogue"} ref={ui.dialog} tabIndex={-1}>
<header>
<strong>{"Filtrer la sélection"}</strong>
<button type={"button"} id={"catalogFacetClose"} aria-label={"Fermer les filtres"} onClick={ui.close}>{"×"}</button>
</header>
<details open={true} id={"genderFilters"} data-universe-filters={"parfums"} hidden={ui.universe !== "parfums"}>
<summary>{"Genre"}</summary>
<div className={"facet-options"}>
<label><input type={"checkbox"} data-facet={"gender"} value={"homme"} checked={ui.facets["gender"].includes("homme")} onChange={() => ui.toggleFacet("gender", "homme")} /><span>{"Homme"}</span><small>{ui.countFacet("gender", "homme")}</small></label>
<label><input type={"checkbox"} data-facet={"gender"} value={"femme"} checked={ui.facets["gender"].includes("femme")} onChange={() => ui.toggleFacet("gender", "femme")} /><span>{"Femme"}</span><small>{ui.countFacet("gender", "femme")}</small></label>
<label><input type={"checkbox"} data-facet={"gender"} value={"enfant"} checked={ui.facets["gender"].includes("enfant")} onChange={() => ui.toggleFacet("gender", "enfant")} /><span>{"Enfant"}</span><small>{ui.countFacet("gender", "enfant")}</small></label>
</div>
</details>
<details open={true}>
<summary>{"Famille olfactive"}</summary>
<div className={"facet-options"}>
<label><input type={"checkbox"} data-facet={"family"} value={"floral"} checked={ui.facets["family"].includes("floral")} onChange={() => ui.toggleFacet("family", "floral")} /><span>{"Floral"}</span><small>{ui.countFacet("family", "floral")}</small></label>
<label><input type={"checkbox"} data-facet={"family"} value={"frais"} checked={ui.facets["family"].includes("frais")} onChange={() => ui.toggleFacet("family", "frais")} /><span>{"Frais"}</span><small>{ui.countFacet("family", "frais")}</small></label>
<label><input type={"checkbox"} data-facet={"family"} value={"boise"} checked={ui.facets["family"].includes("boise")} onChange={() => ui.toggleFacet("family", "boise")} /><span>{"Boisé"}</span><small>{ui.countFacet("family", "boise")}</small></label>
<label><input type={"checkbox"} data-facet={"family"} value={"oriental"} checked={ui.facets["family"].includes("oriental")} onChange={() => ui.toggleFacet("family", "oriental")} /><span>{"Oriental"}</span><small>{ui.countFacet("family", "oriental")}</small></label>
</div>
</details>
<details open={true}>
<summary>{"Marques"}</summary>
<div className={"facet-options"}>
<label><input type={"checkbox"} data-facet={"brand"} value={"imana"} checked={ui.facets["brand"].includes("imana")} onChange={() => ui.toggleFacet("brand", "imana")} /><span>{"IMANA Signature"}</span><small>{ui.countFacet("brand", "imana")}</small></label>
<label><input type={"checkbox"} data-facet={"brand"} value={"dior"} checked={ui.facets["brand"].includes("dior")} onChange={() => ui.toggleFacet("brand", "dior")} /><span>{"Dior"}</span><small>{ui.countFacet("brand", "dior")}</small></label>
<label><input type={"checkbox"} data-facet={"brand"} value={"chanel"} checked={ui.facets["brand"].includes("chanel")} onChange={() => ui.toggleFacet("brand", "chanel")} /><span>{"Chanel"}</span><small>{ui.countFacet("brand", "chanel")}</small></label>
<label><input type={"checkbox"} data-facet={"brand"} value={"tom-ford"} checked={ui.facets["brand"].includes("tom-ford")} onChange={() => ui.toggleFacet("brand", "tom-ford")} /><span>{"Tom Ford"}</span><small>{ui.countFacet("brand", "tom-ford")}</small></label>
<label><input type={"checkbox"} data-facet={"brand"} value={"xerjoff"} checked={ui.facets["brand"].includes("xerjoff")} onChange={() => ui.toggleFacet("brand", "xerjoff")} /><span>{"Xerjoff"}</span><small>{ui.countFacet("brand", "xerjoff")}</small></label>
<label><input type={"checkbox"} data-facet={"brand"} value={"initio"} checked={ui.facets["brand"].includes("initio")} onChange={() => ui.toggleFacet("brand", "initio")} /><span>{"Initio"}</span><small>{ui.countFacet("brand", "initio")}</small></label>
<label><input type={"checkbox"} data-facet={"brand"} value={"mfk"} checked={ui.facets["brand"].includes("mfk")} onChange={() => ui.toggleFacet("brand", "mfk")} /><span>{"Maison Francis Kurkdjian"}</span><small>{ui.countFacet("brand", "mfk")}</small></label>
</div>
</details>
<details open={true}>
<summary>{"Collection"}</summary>
<div className={"facet-options"}>
<label><input type={"checkbox"} data-facet={"collection"} value={"heritage"} checked={ui.facets["collection"].includes("heritage")} onChange={() => ui.toggleFacet("collection", "heritage")} /><span>{"Héritage"}</span><small>{ui.countFacet("collection", "heritage")}</small></label>
<label><input type={"checkbox"} data-facet={"collection"} value={"prestige"} checked={ui.facets["collection"].includes("prestige")} onChange={() => ui.toggleFacet("collection", "prestige")} /><span>{"Prestige"}</span><small>{ui.countFacet("collection", "prestige")}</small></label>
<label><input type={"checkbox"} data-facet={"collection"} value={"evasion"} checked={ui.facets["collection"].includes("evasion")} onChange={() => ui.toggleFacet("collection", "evasion")} /><span>{"Évasion"}</span><small>{ui.countFacet("collection", "evasion")}</small></label>
<label><input type={"checkbox"} data-facet={"collection"} value={"edition"} checked={ui.facets["collection"].includes("edition")} onChange={() => ui.toggleFacet("collection", "edition")} /><span>{"Édition limitée"}</span><small>{ui.countFacet("collection", "edition")}</small></label>
</div>
</details>
<details open={true}>
<summary>{"Budget"}</summary>
<div className={"facet-options"}>
<label><input type={"checkbox"} data-facet={"price"} value={"under-50"} checked={ui.facets["price"].includes("under-50")} onChange={() => ui.toggleFacet("price", "under-50")} /><span>{"Moins de 50 000 FCFA"}</span></label>
<label><input type={"checkbox"} data-facet={"price"} value={"50-70"} checked={ui.facets["price"].includes("50-70")} onChange={() => ui.toggleFacet("price", "50-70")} /><span>{"50 000–70 000 FCFA"}</span></label>
<label><input type={"checkbox"} data-facet={"price"} value={"over-70"} checked={ui.facets["price"].includes("over-70")} onChange={() => ui.toggleFacet("price", "over-70")} /><span>{"Plus de 70 000 FCFA"}</span></label>
</div>
</details>
<details open={true}>
<summary>{"Saisons"}</summary>
<div className={"facet-options"}>
<label><input type={"checkbox"} data-facet={"season"} value={"printemps"} checked={ui.facets["season"].includes("printemps")} onChange={() => ui.toggleFacet("season", "printemps")} /><span>{"Printemps"}</span></label>
<label><input type={"checkbox"} data-facet={"season"} value={"ete"} checked={ui.facets["season"].includes("ete")} onChange={() => ui.toggleFacet("season", "ete")} /><span>{"Été"}</span></label>
<label><input type={"checkbox"} data-facet={"season"} value={"automne"} checked={ui.facets["season"].includes("automne")} onChange={() => ui.toggleFacet("season", "automne")} /><span>{"Automne"}</span></label>
<label><input type={"checkbox"} data-facet={"season"} value={"hiver"} checked={ui.facets["season"].includes("hiver")} onChange={() => ui.toggleFacet("season", "hiver")} /><span>{"Hiver"}</span></label>
</div>
</details>
<details open={true}>
<summary>{"Occasions"}</summary>
<div className={"facet-options"}>
<label><input type={"checkbox"} data-facet={"occasion"} value={"quotidien"} checked={ui.facets["occasion"].includes("quotidien")} onChange={() => ui.toggleFacet("occasion", "quotidien")} /><span>{"Quotidien"}</span></label>
<label><input type={"checkbox"} data-facet={"occasion"} value={"bureau"} checked={ui.facets["occasion"].includes("bureau")} onChange={() => ui.toggleFacet("occasion", "bureau")} /><span>{"Bureau"}</span></label>
<label><input type={"checkbox"} data-facet={"occasion"} value={"soiree"} checked={ui.facets["occasion"].includes("soiree")} onChange={() => ui.toggleFacet("occasion", "soiree")} /><span>{"Soirée"}</span></label>
<label><input type={"checkbox"} data-facet={"occasion"} value={"voyage"} checked={ui.facets["occasion"].includes("voyage")} onChange={() => ui.toggleFacet("occasion", "voyage")} /><span>{"Voyage"}</span></label>
<label><input type={"checkbox"} data-facet={"occasion"} value={"speciale"} checked={ui.facets["occasion"].includes("speciale")} onChange={() => ui.toggleFacet("occasion", "speciale")} /><span>{"Occasion spéciale"}</span></label>
</div>
</details>
<button className={"facet-reset"} id={"facetReset"} type={"button"} onClick={ui.clearFacets}>{"Tout effacer"}</button>
</aside>
<div className={"catalog-results__main"}>
<div className="active-filters" id="activeFilters" aria-live="polite">{(Object.entries(ui.facets) as [Facet, string[]][]).flatMap(([key, values]) => values.map(value => <span key={key + value} className="active-filter">{labels[value] || value}<button type="button" onClick={() => ui.toggleFacet(key, value)} aria-label={`Retirer le filtre ${labels[value] || value}`}>×</button></span>))}</div>
<><CatalogStatus /><div className="product-grid" id="catalogGrid">{ui.results.map(product => <StorefrontProductCard key={product.id} product={product} />)}</div></>
<div className={"catalog-empty"} id={"catalogEmpty"} hidden={ui.loading || !!ui.error || ui.results.length > 0}>
<h3>{"Aucun résultat."}</h3>
<p>{"Essayez une autre recherche ou revenez à l’ensemble de la sélection."}</p>
<button className={"btn"} id={"catalogReset"} type={"button"} onClick={ui.reset}>{"Réinitialiser les filtres"}</button>
</div>
</div>
</div>
</div>
</section></>);
}
