const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ?? 'http://localhost:3001';

export interface CmsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  bodyHtml: string;
  publishAt?: string;
  categoryName?: string;
  coverUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export interface CmsFaq {
  id: string;
  question: string;
  answerHtml: string;
  categoryName?: string;
}

export async function getPublishedArticles(): Promise<CmsArticle[]> {
  const response = await fetch(`${API_GATEWAY_URL}/api/content/articles`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Content API returned ${response.status}.`);
  const payload: unknown = await response.json();
  return Array.isArray(payload) ? (payload as CmsArticle[]) : [];
}

export async function getPublishedArticle(
  slug: string,
): Promise<CmsArticle | null> {
  const response = await fetch(
    `${API_GATEWAY_URL}/api/content/articles/${encodeURIComponent(slug)}`,
    { next: { revalidate: 60 } },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Content API returned ${response.status}.`);
  return response.json() as Promise<CmsArticle>;
}

export async function getPublishedFaqs(): Promise<CmsFaq[]> {
  const response = await fetch(`${API_GATEWAY_URL}/api/content/faqs`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Content API returned ${response.status}.`);
  const payload: unknown = await response.json();
  return Array.isArray(payload) ? (payload as CmsFaq[]) : [];
}
