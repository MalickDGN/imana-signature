'use client';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { emptyFacets, filterProducts, type Facet } from '@/lib/storefront/model';
import { useStorefront } from './StorefrontProvider';

export function useDialog(open: boolean, close: () => void, ref: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      const nodes = [...(ref.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || [])].filter(el => !el.closest('[hidden]') && el.getClientRects().length);
      const first = nodes[0]; const last = nodes.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [open, close, ref]);
}

export function useHeader() {
  const pathname = usePathname(); const router = useRouter();
  const [menu, setMenu] = useState(false); const [mega, setMega] = useState(false); const [search, setSearch] = useState(false);
  const input = useRef<HTMLInputElement>(null); const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const close = useCallback(() => { setMenu(false); setMega(false); setSearch(false); }, []);
  useEffect(close, [pathname, close]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    const outside = (event: MouseEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) close(); };
    window.addEventListener('resize', close); document.addEventListener('keydown', keyboard); document.addEventListener('click', outside);
    return () => { window.removeEventListener('resize', close); document.removeEventListener('keydown', keyboard); document.removeEventListener('click', outside); clearTimeout(timer.current); };
  }, [close]);
  useEffect(() => { if (search) input.current?.focus(); }, [search]);
  function hover(open: boolean) {
    if (!matchMedia('(min-width: 921px) and (hover: hover)').matches) return;
    clearTimeout(timer.current);
    if (open) setMega(true); else timer.current = setTimeout(() => setMega(false), 220);
  }
  return { pathname, menu, mega, search, input, root, close, hover,
    toggleMenu: () => { setMenu(value => !value); setMega(false); },
    toggleMega: () => { setMega(value => !value); setMenu(false); },
    toggleSearch: () => setSearch(value => !value),
    searchFor: (query: string) => { close(); router.push(`/collections?q=${encodeURIComponent(query)}`); },
  };
}

export function useCarousel(count: number, interval = 10000) {
  const [index, setIndex] = useState(0); const [paused, setPaused] = useState(false); const [hovered, setHovered] = useState(false); const [reduced, setReduced] = useState(false); const [visible, setVisible] = useState(true);
  const start = useRef(0); const video = useRef<HTMLVideoElement>(null);
  const next = useCallback((offset: number) => setIndex(i => (i + offset + count) % count), [count]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setReduced(media.matches); change(); media.addEventListener('change', change);
    const visibility = () => setVisible(!document.hidden); document.addEventListener('visibilitychange', visibility);
    return () => { media.removeEventListener('change', change); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => { if (paused || hovered || reduced || !visible) return; const id = setInterval(() => next(1), interval); return () => clearInterval(id); }, [paused, hovered, reduced, visible, next, interval]);
  useEffect(() => { const node = video.current; if (!node) return; if (index === 0 && !paused && !reduced && visible) void node.play().catch(() => {}); else { node.pause(); if (index !== 0) node.currentTime = 0; } }, [index, paused, reduced, visible]);
  return { index, paused, setIndex, next, video, setHovered, toggle: () => setPaused(value => !value), start,
    touchEnd: (x: number) => { const delta = x - start.current; if (Math.abs(delta) > 45) next(delta < 0 ? 1 : -1); },
  };
}

export function useCatalog() {
  const params = useSearchParams(); const { products, loading, error } = useStorefront();
  const [universe, setUniverse] = useState(params.get('univers') === 'accessoires' ? 'accessoires' : 'parfums');
  const [filter, setFilter] = useState(params.get('filter') || (params.get('q') ? 'all' : universe));
  const [query, setQuery] = useState(params.get('q') || ''); const [sort, setSort] = useState('featured'); const [facets, setFacets] = useState(emptyFacets);
  const [open, setOpen] = useState(false); const dialog = useRef<HTMLElement>(null); const close = useCallback(() => setOpen(false), []);
  useDialog(open, close, dialog);
  useEffect(() => { setUniverse(params.get('univers') === 'accessoires' ? 'accessoires' : 'parfums'); setFilter(params.get('filter') || (params.get('q') ? 'all' : params.get('univers') || 'parfums')); setQuery(params.get('q') || ''); }, [params]);
  function selectUniverse(value: string) { setUniverse(value); setFilter(value); setFacets(emptyFacets()); const url = new URL(location.href); url.search = ''; url.searchParams.set('univers', value); window.history.replaceState(null, '', url); }
  function toggleFacet(key: Facet, value: string) { setFacets(current => ({ ...current, [key]: current[key].includes(value) ? current[key].filter(v => v !== value) : [...current[key], value] })); }
  function reset() { setFacets(emptyFacets()); setQuery(''); setSort('featured'); setFilter(universe); }
  const results = filterProducts(products, filter, query, facets, sort);
  const countFacet = (key: Facet, value: string) => filterProducts(products, universe, '', { ...emptyFacets(), [key]: [value] }, 'featured').length;
  return { universe, filter, setFilter, query, setQuery, sort, setSort, facets, toggleFacet, reset, countFacet, clearFacets: () => setFacets(emptyFacets()), activeCount: Object.values(facets).flat().length, results, loading, error, open, setOpen, close, dialog, selectUniverse };
}
