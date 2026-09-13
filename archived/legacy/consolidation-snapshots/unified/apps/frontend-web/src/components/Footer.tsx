import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-champ/15 bg-marine px-6 pb-8 pt-16 text-ivoire lg:px-[6%]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-champ/15 pb-12 md:grid-cols-[1.4fr_1fr] md:items-end">
          <p className="select-none font-disp text-7xl font-semibold text-champ/10 sm:text-8xl">
            IMANA
          </p>
          <p className="font-disp text-2xl leading-8 text-txt-1">
            L’élégance accessible.
            <em className="block text-champ-light">
              Votre signature, votre identité.
            </em>
          </p>
        </div>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-disp text-2xl text-champ-light">IMANA Signature</p>
            <p className="mt-4 max-w-xs text-sm leading-7 text-txt-2">
              Maison de parfums et lifestyle premium, guidée par le conseil et
              une sélection exigeante.
            </p>
          </div>
          <FooterColumn
            title="Boutique"
            links={[
              ['/collections', 'Tous les parfums'],
              ['/categories', 'Catégories'],
              ['/wishlist', 'Liste d’envies'],
              ['/cart', 'Mon panier'],
            ]}
          />
          <FooterColumn
            title="Maison"
            links={[
              ['/about', 'À propos'],
              ['/blog', 'Magazine'],
              ['/contact', 'Contact et conseil'],
            ]}
          />
          <FooterColumn
            title="Informations"
            links={[
              ['/legal', 'Mentions légales'],
              ['/privacy', 'Confidentialité'],
            ]}
          />
        </div>
        <p className="border-t border-champ/15 pt-6 text-center text-xs text-txt-3">
          © {new Date().getFullYear()} IMANA Signature. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<[string, string]>;
}) {
  return (
    <nav aria-label={title}>
      <p className="text-xs font-semibold uppercase text-champ">{title}</p>
      <ul className="mt-4 grid gap-3 text-sm text-txt-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="hover:text-champ-light">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
