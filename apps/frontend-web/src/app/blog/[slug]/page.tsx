import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedArticle } from '@/lib/api/content';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await getPublishedArticle(slug);
    if (!article) return {};
    return {
      title: article.seoTitle || `${article.title} | IMANA Signature`,
      description: article.seoDescription || article.excerpt,
      alternates: article.canonicalUrl ? { canonical: article.canonicalUrl } : undefined,
      robots: article.seoIndex === false ? { index: false, follow: false } : undefined,
      openGraph: {
        title: article.seoTitle || article.title,
        description: article.seoDescription || article.excerpt,
        images: article.ogImageUrl ? [article.ogImageUrl] : undefined,
        type: 'article',
      },
    };
  } catch {
    return {};
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  let article;
  try {
    article = await getPublishedArticle(slug);
  } catch {
    notFound();
  }
  if (!article) notFound();

  return (
    <article className="bg-ivoire px-6 py-20 text-dk-0 lg:px-[6%]">
      <header className="mx-auto max-w-3xl border-b border-sable-dark pb-10">
        <Link href="/blog" className="text-xs font-semibold uppercase text-champ-dark">← Magazine</Link>
        <p className="mt-10 text-xs uppercase text-champ-dark">{article.categoryName ?? 'Inspiration'}</p>
        <h1 className="mt-3 font-disp text-5xl font-semibold leading-tight text-marine sm:text-6xl">{article.title}</h1>
        {article.excerpt && <p className="mt-6 text-lg leading-8 text-dk-2">{article.excerpt}</p>}
        {article.author && <p className="mt-3 text-sm text-dk-2">Par {article.author}</p>}
      </header>
      <div
        className="article-content mx-auto max-w-3xl py-10 text-dk-2"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />
      {article.galleryMediaIds && article.galleryMediaIds.length > 0 && <section className="mx-auto grid max-w-3xl gap-4 pb-12 sm:grid-cols-2" aria-label="Galerie">{article.galleryMediaIds.map((id) => <img key={id} src={`/api/content/media/${encodeURIComponent(id)}`} alt="" loading="lazy" className="h-auto w-full" />)}</section>}
    </article>
  );
}
