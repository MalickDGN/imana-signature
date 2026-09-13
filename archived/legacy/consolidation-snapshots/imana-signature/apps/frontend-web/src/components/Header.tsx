'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWishlistStore } from '@/lib/store/wishlist';
import { CartIcon } from './CartIcon';

const mainLinks = [
  { href: '/about', label: 'La Maison' },
  { href: '/blog', label: 'Magazine' },
  { href: '/contact', label: 'Conseil' },
];

const shopGroups = [
  {
    title: 'Parfums',
    links: [
      ['/collections', 'Tous les parfums'],
      ['/collections?category=1', 'Parfums designers'],
      ['/collections?category=2', 'Parfums de niche'],
      ['/categories', 'Toutes les catégories'],
    ],
  },
  {
    title: 'Découvrir',
    links: [
      ['/collections?sort=price_desc', 'Sélection premium'],
      ['/collections?availability=in-stock', 'Disponibles maintenant'],
      ['/contact', 'Trouver ma signature'],
      ['/wishlist', 'Ma liste d’envies'],
    ],
  },
];

export function Header() {
  const pathname = usePathname();
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setShopOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShopOpen(false);
        setMobileOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <>
      <div className="bg-champ px-4 py-2 text-center text-[11px] font-bold uppercase text-marine">
        Parfums authentiques · Stock vérifié dans Odoo · Livraison au Sénégal
      </div>
      <header className="sticky top-0 z-40 border-b border-champ/15 bg-marine/95 text-ivoire backdrop-blur-xl">
        <nav
          aria-label="Navigation principale"
          className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6"
        >
          <button
            type="button"
            className="grid h-11 w-11 place-items-center md:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>

          <Link href="/" aria-label="IMANA Signature - Accueil">
            <Image
              src="/assets/img/logos/logo-imana.webp"
              alt="IMANA Signature"
              width={64}
              height={64}
              priority
              className="h-14 w-14 object-contain"
            />
          </Link>

          <div className="hidden h-full items-center gap-8 text-xs font-bold uppercase md:flex">
            <button
              type="button"
              className="flex h-full items-center gap-1 text-txt-1 transition hover:text-champ-light"
              aria-expanded={shopOpen}
              aria-controls="shop-menu"
              onClick={() => setShopOpen((open) => !open)}
            >
              Boutique <ChevronDown size={14} />
            </button>
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-champ-light ${
                  pathname === link.href ? 'text-champ-light' : 'text-txt-1'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center text-txt-1 transition hover:text-champ-light"
              aria-label="Rechercher"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={20} />
            </button>
            <WishlistLink />
            <Link href="/cart" aria-label="Voir le panier" className="text-txt-1">
              <CartIcon />
            </Link>
          </div>
        </nav>

        {shopOpen && (
          <div
            id="shop-menu"
            className="absolute inset-x-0 top-full border-y border-champ/15 bg-marine shadow-2xl"
          >
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-9 md:grid-cols-[1fr_1fr_1.35fr]">
              {shopGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-bold uppercase text-champ">{group.title}</p>
                  <ul className="mt-4 grid gap-3 text-sm text-txt-1">
                    {group.links.map(([href, label]) => (
                      <li key={href}>
                        <Link href={href} className="hover:text-champ-light">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <Link
                href="/contact"
                className="flex min-h-40 flex-col justify-end bg-champ-pale p-6 text-marine"
              >
                <Sparkles size={21} />
                <strong className="mt-5 font-disp text-2xl">
                  Quel parfum raconte votre histoire ?
                </strong>
                <span className="mt-2 text-sm">Demander un conseil personnalisé</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-marine text-ivoire md:hidden">
          <div className="flex h-[72px] items-center justify-between border-b border-champ/15 px-5">
            <strong className="font-disp text-2xl text-champ-light">IMANA</strong>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center"
              aria-label="Fermer le menu"
              onClick={() => setMobileOpen(false)}
            >
              <X size={22} />
            </button>
          </div>
          <nav aria-label="Navigation mobile" className="overflow-y-auto px-5 py-8">
            <p className="text-xs font-bold uppercase text-champ">Boutique</p>
            <div className="mt-3 grid border-t border-champ/15">
              {shopGroups.flatMap((group) => group.links).map(([href, label]) => (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  className="border-b border-champ/15 py-4 font-disp text-2xl"
                >
                  {label}
                </Link>
              ))}
            </div>
            <p className="mt-9 text-xs font-bold uppercase text-champ">Maison</p>
            <div className="mt-3 grid border-t border-champ/15">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-champ/15 py-4 font-disp text-2xl"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-marine/85 px-5 pt-[15vh] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-title"
        >
          <div className="w-full max-w-2xl bg-ivoire p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-champ-dark">Catalogue</p>
                <h2 id="search-title" className="mt-1 font-disp text-3xl text-marine">
                  Rechercher une fragrance
                </h2>
              </div>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center text-marine"
                aria-label="Fermer la recherche"
                onClick={() => setSearchOpen(false)}
              >
                <X size={21} />
              </button>
            </div>
            <form action="/collections" className="mt-7 flex border-b-2 border-marine">
              <label htmlFor="global-search" className="sr-only">
                Nom du parfum
              </label>
              <input
                id="global-search"
                name="search"
                type="search"
                autoFocus
                placeholder="Nom, maison, collection…"
                className="min-h-14 min-w-0 flex-1 bg-transparent px-1 text-lg text-marine outline-none"
              />
              <button
                type="submit"
                className="grid h-14 w-14 place-items-center text-marine"
                aria-label="Lancer la recherche"
              >
                <Search size={21} />
              </button>
            </form>
            <p className="mt-4 text-sm text-dk-2">
              Essayez « Oud », « Rose » ou parcourez nos collections.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function WishlistLink() {
  const [hydrated, setHydrated] = useState(false);
  const count = useWishlistStore((state) => state.items.length);

  useEffect(() => setHydrated(true), []);

  return (
    <Link
      href="/wishlist"
      aria-label="Ma liste d’envies"
      className="relative grid h-11 w-11 place-items-center text-txt-1 transition hover:text-champ-light"
    >
      <Heart size={20} />
      {hydrated && count > 0 && (
        <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-champ px-1 text-[10px] font-bold text-marine">
          {count}
        </span>
      )}
    </Link>
  );
}
