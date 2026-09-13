import { notFound } from 'next/navigation';
import type { CmsArticle } from '@/lib/api/content';

export const metadata = { title: 'Prévisualisation | IMANA Signature', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = process.env.API_GATEWAY_URL ?? 'http://localhost:3001';
  const response = await fetch(`${origin}/api/content/preview/${encodeURIComponent(token)}`, { cache: 'no-store' });
  if (!response.ok) notFound();
  const article = await response.json() as CmsArticle;
  return <article className="bg-ivoire px-6 py-20 text-dk-0 lg:px-[6%]">
    <div className="mx-auto mb-8 max-w-3xl border border-champ-dark bg-blanc p-4 text-sm">Prévisualisation privée — ce lien expire automatiquement.</div>
    <header className="mx-auto max-w-3xl border-b border-sable-dark pb-10"><h1 className="font-disp text-5xl font-semibold text-marine">{article.title}</h1>{article.excerpt && <p className="mt-6 text-lg text-dk-2">{article.excerpt}</p>}</header>
    <div className="article-content mx-auto max-w-3xl py-10 text-dk-2" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />
  </article>;
}
