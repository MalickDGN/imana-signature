import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@imana-signature/shared-types';
import { ProductCard } from '@/components/ProductCard';
import { getProducts } from '@/lib/api/products';
import { getPublishedFaqs, type CmsFaq } from '@/lib/api/content';
import { Headphones, PackageCheck, ShieldCheck, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const universes = [
  {
    name: 'Parfums Designers',
    description: 'Les signatures des grandes maisons internationales.',
    image: '/assets/img/imana/designers.webp',
  },
  {
    name: 'Parfums de Niche',
    description: 'Des compositions confidentielles et singulières.',
    image: '/assets/img/imana/niche.webp',
  },
  {
    name: 'Coffrets Découverte',
    description: 'Des voyages olfactifs à offrir ou à explorer.',
    image: '/assets/img/imana/coffrets.webp',
  },
];

const lifestyle = [
  {
    name: 'Univers féminin',
    copy: 'Fragrances, style et élégance au quotidien.',
    image: '/assets/img/imana/femme.webp',
  },
  {
    name: 'Univers masculin',
    copy: 'Parfums de caractère et art du détail.',
    image: '/assets/img/imana/homme.webp',
  },
  {
    name: 'Art de vivre',
    copy: 'Ambiances et gestes qui donnent une signature à la maison.',
    image: '/assets/img/imana/home.webp',
  },
];

const fallbackFaqs = [
  {
    question: 'Comment choisir un parfum sans le tester longtemps ?',
    answer:
      'Commencez par la famille olfactive, l’occasion et l’intensité recherchée. Notre équipe peut ensuite affiner la sélection avec vous.',
  },
  {
    question: 'Comment améliorer la tenue de ma fragrance ?',
    answer:
      'Appliquez-la sur une peau hydratée, aux points de pulsation, sans frotter. Conservez le flacon à l’abri de la chaleur et de la lumière.',
  },
  {
    question: 'Le stock affiché est-il vérifié au moment de commander ?',
    answer:
      'Oui. La disponibilité Odoo est contrôlée une seconde fois avant la création de la commande.',
  },
];

export default async function HomePage() {
  let featuredProducts: Product[] = [];
  let faqs: CmsFaq[] = fallbackFaqs.map((faq, index) => ({
    id: `fallback-${index}`,
    question: faq.question,
    answerHtml: faq.answer,
  }));
  try {
    featuredProducts = (
      await getProducts({ sort: 'price_desc' })
    ).slice(0, 4);
  } catch {
    // The visual storefront remains available while Odoo is temporarily down.
  }
  try {
    const publishedFaqs = await getPublishedFaqs();
    if (publishedFaqs.length) faqs = publishedFaqs;
  } catch {
    // The curated fallback stays visible while the CMS is temporarily down.
  }

  return (
    <div className="bg-ivoire text-dk-0">
      <section className="relative flex min-h-[76vh] items-end overflow-hidden bg-marine px-6 pb-14 pt-24 sm:min-h-[82vh] sm:px-10 lg:px-[6%]">
        <Image
          src="/assets/img/imana/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-marine/60 sm:bg-[linear-gradient(90deg,rgba(13,27,46,0.98)_0%,rgba(13,27,46,0.91)_38%,rgba(13,27,46,0.2)_78%)]" />
        <div data-reveal className="relative z-10 max-w-3xl pb-4">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-10 bg-champ" />
            <p className="text-xs font-semibold uppercase text-champ-light">
              Maison de parfums · Dakar
            </p>
          </div>
          <h1 className="font-disp text-6xl font-semibold leading-none text-ivoire sm:text-7xl lg:text-8xl">
            IMANA Signature
          </h1>
          <p className="mt-5 max-w-2xl font-disp text-3xl leading-tight text-champ-light sm:text-4xl">
            Un parfum différent pour chaque version de vous.
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-txt-1">
            Découvrez des fragrances de créateurs et de niche, choisies pour
            raconter votre histoire avec justesse.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/collections"
              className="inline-flex min-h-11 items-center bg-champ px-6 text-sm font-semibold uppercase text-marine transition hover:bg-champ-light"
            >
              Explorer la boutique
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center border border-champ/60 px-6 text-sm font-semibold uppercase text-champ-light hover:bg-champ/10"
            >
              Trouver ma signature
            </Link>
          </div>
        </div>
      </section>

      <div className="scrollbar-hidden overflow-x-auto border-y border-champ/20 bg-marine-2 px-6 py-4 text-txt-1">
        <div className="mx-auto flex min-w-max max-w-7xl justify-center gap-9 text-xs font-semibold uppercase">
          <span className="flex items-center gap-2"><ShieldCheck size={16} /> Authenticité contrôlée</span>
          <span className="flex items-center gap-2"><PackageCheck size={16} /> Stock Odoo vérifié</span>
          <span className="flex items-center gap-2"><Truck size={16} /> Livraison au Sénégal</span>
          <span className="flex items-center gap-2"><Headphones size={16} /> Conseil personnalisé</span>
        </div>
      </div>

      <section data-reveal className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase text-champ-dark">
              Notre histoire
            </p>
            <h2 className="mt-3 font-disp text-5xl font-semibold leading-none text-marine sm:text-6xl">
              L’univers <em className="font-normal text-champ-dark">IMANA</em>
            </h2>
          </div>
          <div className="grid gap-6 text-base leading-8 text-dk-2 sm:grid-cols-2">
            <p>
              Une maison née d’une passion pour le parfum, l’élégance et l’art
              de vivre, avec une sélection guidée par l’authenticité.
            </p>
            <p>
              Designers, niche et objets de style se rencontrent dans une
              expérience attentive, contemporaine et accessible.
            </p>
          </div>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {['Élégance', 'Authenticité', 'Raffinement', 'Conseil'].map(
            (value) => (
              <div key={value} className="border-t border-sable-dark py-5">
                <h3 className="font-disp text-2xl text-marine">{value}</h3>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="bg-marine px-6 py-20 text-ivoire lg:px-[6%] lg:py-28">
        <div data-reveal className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase text-champ">
            Boutique parfums
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <h2 className="font-disp text-5xl font-semibold sm:text-6xl">
              Collections <em className="font-normal text-champ-light">olfactives</em>
            </h2>
            <Link href="/categories" className="text-sm text-champ-light">
              Toutes les catégories →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {universes.map((universe) => (
              <Link
                key={universe.name}
                href="/collections"
                className="group relative aspect-[4/3] overflow-hidden"
              >
                <Image
                  src={universe.image}
                  alt={universe.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-marine via-marine/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-disp text-3xl font-semibold">
                    {universe.name}
                  </h3>
                  <p className="mt-1 text-sm text-txt-1">
                    {universe.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section data-reveal className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase text-champ-dark">
                Sélection
              </p>
              <h2 className="mt-2 font-disp text-5xl font-semibold text-marine">
                Nos signatures
              </h2>
            </div>
            <Link href="/collections" className="text-sm text-champ-dark">
              Voir tout le catalogue →
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-blanc px-6 py-20 lg:px-[6%] lg:py-28">
        <div data-reveal className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase text-champ-dark">
            Magazine et inspirations
          </p>
          <h2 className="mt-3 font-disp text-5xl font-semibold text-marine sm:text-6xl">
            L’univers <em className="font-normal text-champ-dark">IMANA</em>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {lifestyle.map((item) => (
              <article key={item.name}>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-5 font-disp text-3xl text-marine">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-dk-2">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-marine px-6 py-20 text-ivoire lg:px-[6%] lg:py-28">
        <div data-reveal className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-champ">
              Espace conseil
            </p>
            <h2 className="mt-3 font-disp text-5xl font-semibold sm:text-6xl">
              Votre guide <em className="font-normal text-champ-light">olfactif</em>
            </h2>
            <p className="mt-6 max-w-xl leading-8 text-txt-1">
              Nous vous aidons à relier personnalité, famille olfactive,
              intensité et occasion pour trouver une fragrance cohérente.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex min-h-11 items-center bg-champ px-6 font-semibold text-marine"
            >
              Demander un conseil
            </Link>
          </div>
          <div className="divide-y divide-champ/20 border-y border-champ/20">
            {faqs.map((faq) => (
              <details key={faq.id} className="group py-5">
                <summary className="cursor-pointer list-none font-disp text-xl text-ivoire">
                  {faq.question}
                </summary>
                <div
                  className="pt-4 leading-7 text-txt-1"
                  dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                />
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[440px] items-center justify-center overflow-hidden px-6 py-20 text-center">
        <Image
          src="/assets/img/imana/hero.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-marine/85" />
        <div data-reveal className="relative z-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase text-champ">
            Expérience IMANA
          </p>
          <h2 className="mt-4 font-disp text-5xl font-semibold leading-none text-ivoire sm:text-6xl">
            Votre signature, <em className="font-normal text-champ-light">votre identité.</em>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/collections" className="bg-champ px-6 py-3 font-semibold text-marine">
              Explorer la boutique
            </Link>
            <Link href="/contact" className="border border-champ/60 px-6 py-3 text-champ-light">
              Conseil personnalisé
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
