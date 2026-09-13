import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedArticles, type CmsArticle } from '@/lib/api/content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Magazine | IMANA Signature',
  description: 'Conseils, inspirations lifestyle, actualités et événements IMANA.',
};

export default async function BlogPage() {
  let articles: CmsArticle[] = [];
  try {
    articles = await getPublishedArticles();
  } catch {
    // Keep the editorial page available while the content service is offline.
  }

  return (
    <div className="min-h-[70vh] bg-ivoire px-6 py-20 text-dk-0 lg:px-[6%]">
      <header className="mx-auto max-w-7xl border-b border-sable-dark pb-10">
        <p className="text-xs font-semibold uppercase text-champ-dark">Journal IMANA</p>
        <h1 className="mt-3 font-disp text-6xl font-semibold text-marine">Magazine</h1>
        <p className="mt-5 max-w-2xl leading-7 text-dk-2">
          Inspirations, conseils et actualités autour du parfum et de l’art de vivre.
        </p>
      </header>
      <section className="mx-auto grid max-w-7xl gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
        {articles.length ? articles.map((article) => (
          <article className="border-t border-champ-dark pt-5" key={article.id}>
            <p className="text-xs uppercase text-champ-dark">{article.categoryName ?? 'Inspiration'}</p>
            <h2 className="mt-3 font-disp text-3xl text-marine">
              <Link href={`/blog/${article.slug}`}>{article.title}</Link>
            </h2>
            {article.excerpt && <p className="mt-4 leading-7 text-dk-2">{article.excerpt}</p>}
            <Link className="mt-5 inline-flex text-sm font-semibold text-champ-dark" href={`/blog/${article.slug}`}>
              Lire l’article →
            </Link>
          </article>
        )) : (
          <div className="md:col-span-2 lg:col-span-3">
            <h2 className="font-disp text-3xl text-marine">Les premières histoires arrivent bientôt.</h2>
          </div>
        )}
      </section>
    </div>
  );
}
