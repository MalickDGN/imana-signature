import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Compass, Gem, HeartHandshake, Sparkles } from 'lucide-react';
import { Container, SectionHeading } from '@imana-signature/ui-kit';

export const metadata: Metadata = {
  title: 'La Maison | IMANA Signature',
  description:
    'Découvrez la vision, la mission et l’expertise parfum de la maison IMANA Signature.',
};

const values = [
  {
    icon: <Gem size={21} />,
    title: 'Exigence',
    copy: 'Une sélection guidée par la qualité, la traçabilité et la justesse.',
  },
  {
    icon: <Compass size={21} />,
    title: 'Singularité',
    copy: 'Chaque fragrance doit pouvoir révéler une facette personnelle.',
  },
  {
    icon: <HeartHandshake size={21} />,
    title: 'Attention',
    copy: 'Le conseil précède la vente et accompagne chaque découverte.',
  },
  {
    icon: <Sparkles size={21} />,
    title: 'Élégance',
    copy: 'Une expérience sobre, sensorielle et pensée dans le détail.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-ivoire text-marine">
      <section className="relative flex min-h-[68vh] items-end overflow-hidden px-6 pb-14 pt-24 lg:px-[6%]">
        <Image
          src="/assets/img/imana/femme.webp"
          alt="Univers parfum et lifestyle IMANA Signature"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-marine/65" />
        <div className="relative z-10 max-w-4xl">
          <p className="text-xs font-bold uppercase text-champ">La Maison</p>
          <h1 className="mt-3 font-disp text-6xl font-semibold leading-none text-ivoire sm:text-7xl">
            IMANA Signature
          </h1>
          <p className="mt-5 max-w-2xl font-disp text-3xl leading-tight text-champ-light">
            Le parfum comme langage intime et signature personnelle.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase text-champ-dark">Notre histoire</p>
            <h2 className="mt-3 font-disp text-5xl font-semibold leading-none">
              Choisir moins.
              <em className="block font-normal text-champ-dark">Ressentir davantage.</em>
            </h2>
          </div>
          <div className="grid gap-6 text-lg leading-8 text-dk-2 sm:grid-cols-2">
            <p>
              IMANA Signature est née d’une conviction simple : une fragrance
              ne se résume ni à une marque ni à une tendance. Elle accompagne
              une présence, une mémoire et une manière d’habiter le monde.
            </p>
            <p>
              Notre rôle est de rendre cette rencontre plus claire grâce à une
              sélection exigeante, des informations fiables et un conseil
              attentif, en ligne comme auprès de notre équipe.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-marine py-16 text-ivoire sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div className="relative min-h-[420px] overflow-hidden">
            <Image
              src="/assets/img/imana/niche.webp"
              alt="Sélection de parfums de niche"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <SectionHeading
              eyebrow="Vision & mission"
              title="Rendre le parfum personnel"
              description="Notre vision est de devenir une référence du parfum premium et du lifestyle au Sénégal, avec une expérience digitale aussi attentive que le conseil en boutique."
              inverted
            />
            <div className="mt-9 grid gap-6 border-t border-champ/20 pt-7 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-champ">Vision</p>
                <p className="mt-3 leading-7 text-txt-1">
                  Faire de chaque choix de parfum une expression consciente de
                  son identité.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-champ">Mission</p>
                <p className="mt-3 leading-7 text-txt-1">
                  Sélectionner, expliquer et recommander des fragrances avec
                  exigence et sensibilité.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Notre ADN"
            title="Une exigence qui se ressent"
            description="Quatre principes structurent la sélection, le conseil et l’expérience IMANA."
          />
          <div className="mt-10 grid border-y border-sable-dark sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <article
                key={value.title}
                className="border-b border-sable-dark p-6 sm:border-r lg:border-b-0"
              >
                <span className="text-champ-dark">{value.icon}</span>
                <h3 className="mt-5 font-disp text-3xl">{value.title}</h3>
                <p className="mt-3 text-sm leading-7 text-dk-2">{value.copy}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/collections"
              className="inline-flex min-h-11 items-center bg-marine px-6 text-sm font-semibold text-ivoire"
            >
              Explorer la sélection
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center border border-marine px-6 text-sm font-semibold"
            >
              Échanger avec un conseiller
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
