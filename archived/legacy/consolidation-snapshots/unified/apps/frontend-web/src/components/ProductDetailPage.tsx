import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge, Container, SectionHeading } from '@imana-signature/ui-kit';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductCard } from '@/components/ProductCard';
import { WishlistButton } from '@/components/WishlistButton';
import { getProduct, getProducts } from '@/lib/api/products';
import { notFound } from 'next/navigation';

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const related = product.categoryId
    ? await getProducts({ category: product.categoryId }).catch(() => [])
    : [];
  const recommendations = related
    .filter((item) => item.id !== product.id)
    .slice(0, 4);
  const unavailable = typeof product.stock === 'number' && product.stock <= 0;
  const visual =
    product.imageUrl ||
    (product.category?.toLocaleLowerCase('fr').includes('niche')
      ? '/assets/img/imana/niche.webp'
      : '/assets/img/imana/designers.webp');

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    sku: product.id,
    category: product.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'XOF',
      price: product.price,
      availability: unavailable
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Collections',
        item: '/collections',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
      },
    ],
  };

  return (
    <div className="bg-ivoire text-marine">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productSchema, breadcrumbSchema]),
        }}
      />
      <Container className="py-6">
        <nav
          aria-label="Fil d’Ariane"
          className="flex items-center gap-2 overflow-hidden text-xs text-dk-2"
        >
          <Link href="/">Accueil</Link>
          <ChevronRight size={13} />
          <Link href="/collections">Collections</Link>
          <ChevronRight size={13} />
          <span className="truncate text-marine" aria-current="page">
            {product.name}
          </span>
        </nav>
      </Container>

      <Container className="grid gap-10 pb-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-sable/35 lg:sticky lg:top-28">
          <Image
            src={visual}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="object-cover"
          />
          <div className="absolute left-4 top-4">
            <Badge tone={unavailable ? 'danger' : 'accent'}>
              {unavailable ? 'Indisponible' : 'Sélection IMANA'}
            </Badge>
          </div>
        </div>

        <div className="self-start py-2 lg:py-10">
          <p className="text-xs font-bold uppercase text-champ-dark">
            {product.category || 'Parfumerie'}
          </p>
          <h1 className="mt-3 font-disp text-5xl font-semibold leading-[0.95] sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-6 text-2xl font-semibold">
            {product.price.toLocaleString('fr-FR')} FCFA
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                unavailable ? 'bg-red-700' : 'bg-emerald-600'
              }`}
            />
            {unavailable
              ? 'Actuellement indisponible'
              : `En stock${product.stock !== undefined ? ` · ${product.stock} disponible(s)` : ''}`}
          </div>

          <div className="mt-8 border-y border-sable-dark py-7">
            <p className="leading-8 text-dk-2">
              {product.description ||
                'Une fragrance sélectionnée par IMANA Signature pour son caractère, son élégance et la qualité de son sillage.'}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-[1fr_auto] gap-3">
            <AddToCartButton product={product} />
            <WishlistButton product={product} className="h-14 w-14" />
          </div>

          <div className="mt-10 grid divide-y divide-sable-dark border-y border-sable-dark">
            <Assurance
              icon={<ShieldCheck size={20} />}
              title="Authenticité contrôlée"
              copy="Référentiel produit et prix synchronisés avec Odoo."
            />
            <Assurance
              icon={<PackageCheck size={20} />}
              title="Stock vérifié"
              copy="La disponibilité est contrôlée à nouveau avant la commande."
            />
            <Assurance
              icon={<Headphones size={20} />}
              title="Conseil personnalisé"
              copy="Notre équipe vous accompagne dans le choix de votre signature."
            />
          </div>

          <Link
            href="/contact"
            className="mt-8 flex min-h-24 items-center gap-4 bg-champ-pale p-5"
          >
            <Sparkles className="shrink-0 text-champ-dark" size={22} />
            <span>
              <strong className="block font-disp text-xl">
                Une hésitation sur cette fragrance ?
              </strong>
              <small className="mt-1 block text-dk-2">
                Demandez un conseil selon votre style et l’occasion.
              </small>
            </span>
          </Link>
        </div>
      </Container>

      {recommendations.length > 0 && (
        <section className="border-t border-sable-dark bg-blanc py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="Même univers"
              title="Vous pourriez aussi aimer"
              action={
                <Link
                  href={`/collections?category=${product.categoryId}`}
                  className="text-sm font-semibold text-champ-dark"
                >
                  Voir toute la catégorie →
                </Link>
              }
            />
            <div className="mt-9 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}

function Assurance({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-4 py-4">
      <span className="mt-1 text-champ-dark">{icon}</span>
      <span>
        <strong className="block text-sm">{title}</strong>
        <small className="mt-1 block leading-5 text-dk-2">{copy}</small>
      </span>
    </div>
  );
}
