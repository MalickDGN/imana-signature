'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CalendarClock,
  Edit3,
  Eye,
  FileText,
  FolderTree,
  HelpCircle,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

type CmsTab = 'articles' | 'taxonomies' | 'faqs' | 'media';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  bodyHtml: string;
  status: string;
  publishAt?: string;
  categoryId?: string;
  categoryName?: string;
  seoTitle?: string;
  seoDescription?: string;
  tagIds?: string[];
  tags?: Array<{ id: string; name: string }>;
}

interface Taxonomy {
  id: string;
  name: string;
  slug: string;
}

interface Faq {
  id: string;
  question: string;
  answerHtml: string;
  status: string;
  categoryId?: string;
  categoryName?: string;
  sequence: number;
}

interface Media {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string;
  url: string;
}

export function CmsPanel() {
  const [tab, setTab] = useState<CmsTab>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Taxonomy[]>([]);
  const [tags, setTags] = useState<Taxonomy[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [faqCategories, setFaqCategories] = useState<Taxonomy[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [editingArticle, setEditingArticle] = useState<Article | null | undefined>();
  const [editingFaq, setEditingFaq] = useState<Faq | null | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const paths = [
        'cms/articles',
        'cms/categories',
        'cms/tags',
        'cms/faqs',
        'cms/faq-categories',
        'cms/media',
      ];
      const responses = await Promise.all(
        paths.map((path) => fetch(`/api/admin/${path}`, { cache: 'no-store' })),
      );
      const payloads = await Promise.all(responses.map((response) => response.json()));
      const failed = responses.findIndex((response) => !response.ok);
      if (failed >= 0) throw new Error(payloads[failed].message ?? 'Chargement impossible.');
      setArticles(payloads[0]);
      setCategories(payloads[1]);
      setTags(payloads[2]);
      setFaqs(payloads[3]);
      setFaqCategories(payloads[4]);
      setMedia(payloads[5]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erreur CMS.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="feature-section" id="cms">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Gestion de contenu</p>
          <h2>CMS éditorial</h2>
          <p>Articles, taxonomies, FAQ et médiathèque administrables.</p>
        </div>
        <button className="secondary-action" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      <div className="cms-tabs" role="tablist" aria-label="Sections du CMS">
        <TabButton active={tab === 'articles'} onClick={() => setTab('articles')} icon={<FileText />} label="Articles" />
        <TabButton active={tab === 'taxonomies'} onClick={() => setTab('taxonomies')} icon={<FolderTree />} label="Catégories & tags" />
        <TabButton active={tab === 'faqs'} onClick={() => setTab('faqs')} icon={<HelpCircle />} label="FAQ" />
        <TabButton active={tab === 'media'} onClick={() => setTab('media')} icon={<ImageIcon />} label="Médias" />
      </div>

      {error && <div className="module-alert is-error">{error}</div>}
      {loading ? <div className="module-empty">Chargement du CMS…</div> : (
        <>
          {tab === 'articles' && (
            <div className="cms-workspace">
              <div className="cms-list panel">
                <div className="panel-heading">
                  <h3>Articles</h3>
                  <button className="primary-action" type="button" onClick={() => setEditingArticle(null)}>
                    <Plus size={16} /> Article
                  </button>
                </div>
                {articles.length ? articles.map((article) => (
                  <button className="content-row" type="button" key={article.id} onClick={() => setEditingArticle(article)}>
                    <span className="content-icon"><FileText size={18} /></span>
                    <span><strong>{article.title}</strong><small>{article.categoryName ?? 'Sans catégorie'} · {article.slug}</small></span>
                    <span className={`status-tag is-${article.status}`}>{article.status}</span>
                    <Edit3 size={15} />
                  </button>
                )) : <div className="module-empty">Créez le premier article du site.</div>}
              </div>
              {editingArticle !== undefined && (
                <ArticleEditor
                  article={editingArticle}
                  categories={categories}
                  tags={tags}
                  onClose={() => setEditingArticle(undefined)}
                  onSaved={() => { setEditingArticle(undefined); void load(); }}
                />
              )}
            </div>
          )}

          {tab === 'taxonomies' && (
            <div className="taxonomy-grid">
              <TaxonomyManager title="Catégories d’articles" endpoint="cms/categories" items={categories} onCreated={load} />
              <TaxonomyManager title="Tags" endpoint="cms/tags" items={tags} onCreated={load} />
              <TaxonomyManager title="Catégories FAQ" endpoint="cms/faq-categories" items={faqCategories} onCreated={load} />
            </div>
          )}

          {tab === 'faqs' && (
            <div className="cms-workspace">
              <div className="cms-list panel">
                <div className="panel-heading">
                  <h3>Questions fréquentes</h3>
                  <button className="primary-action" type="button" onClick={() => setEditingFaq(null)}>
                    <Plus size={16} /> Question
                  </button>
                </div>
                {faqs.length ? faqs.map((faq) => (
                  <button className="content-row" type="button" key={faq.id} onClick={() => setEditingFaq(faq)}>
                    <span className="content-icon"><HelpCircle size={18} /></span>
                    <span><strong>{faq.question}</strong><small>{faq.categoryName ?? 'Sans catégorie'} · ordre {faq.sequence}</small></span>
                    <span className={`status-tag is-${faq.status}`}>{faq.status}</span>
                  </button>
                )) : <div className="module-empty">Aucune question enregistrée.</div>}
              </div>
              {editingFaq !== undefined && (
                <FaqEditor
                  faq={editingFaq}
                  categories={faqCategories}
                  onClose={() => setEditingFaq(undefined)}
                  onSaved={() => { setEditingFaq(undefined); void load(); }}
                />
              )}
            </div>
          )}

          {tab === 'media' && <MediaManager items={media} onUploaded={load} />}
        </>
      )}
    </section>
  );
}

function ArticleEditor({ article, categories, tags, onClose, onSaved }: {
  article: Article | null;
  categories: Taxonomy[];
  tags: Taxonomy[];
  onClose(): void;
  onSaved(): void;
}) {
  const [preview, setPreview] = useState(false);
  const [body, setBody] = useState(article?.bodyHtml ?? '');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const status = String(form.get('status'));
    const publishAt = String(form.get('publishAt') ?? '');
    const payload = {
      title: form.get('title'),
      slug: form.get('slug') || undefined,
      excerpt: form.get('excerpt') || undefined,
      bodyHtml: body,
      status,
      publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
      categoryId: form.get('categoryId') || undefined,
      seoTitle: form.get('seoTitle') || undefined,
      seoDescription: form.get('seoDescription') || undefined,
      tagIds: form.getAll('tagIds'),
    };
    const response = await fetch(
      `/api/admin/cms/articles${article ? `/${article.id}` : ''}`,
      {
        method: article ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json();
    if (!response.ok) return setError(result.message ?? 'Enregistrement impossible.');
    onSaved();
  }

  async function remove() {
    if (!article || !window.confirm('Supprimer définitivement cet article ?')) return;
    const response = await fetch(`/api/admin/cms/articles/${article.id}`, { method: 'DELETE' });
    if (response.ok) onSaved();
  }

  return (
    <form className="editor-panel panel" onSubmit={submit}>
      <div className="panel-heading">
        <div><p className="eyebrow">{article ? 'Modification' : 'Nouveau contenu'}</p><h3>{article?.title ?? 'Article'}</h3></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
      </div>
      <div className="editor-grid">
        <label className="field-wide">Titre<input name="title" required maxLength={220} defaultValue={article?.title} /></label>
        <label>Slug<input name="slug" maxLength={240} defaultValue={article?.slug} /></label>
        <label>Catégorie<select name="categoryId" defaultValue={article?.categoryId ?? ''}><option value="">Sans catégorie</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="field-wide">Résumé<textarea name="excerpt" rows={2} defaultValue={article?.excerpt} /></label>
        <label>Statut<select name="status" defaultValue={article?.status ?? 'draft'}><option value="draft">Brouillon</option><option value="scheduled">Planifié</option><option value="published">Publié</option><option value="unpublished">Dépublié</option></select></label>
        <label>Date de publication<input name="publishAt" type="datetime-local" defaultValue={toLocalDate(article?.publishAt)} /></label>
        <fieldset className="field-wide tag-selector"><legend>Tags</legend>{tags.map((tag) => <label key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={article?.tags?.some((item) => item.id === tag.id)} /> {tag.name}</label>)}</fieldset>
        <label className="field-wide">Contenu HTML<textarea name="bodyHtml" rows={10} required value={body} onChange={(event) => setBody(event.target.value)} /></label>
        <label>Titre SEO<input name="seoTitle" maxLength={70} defaultValue={article?.seoTitle} /></label>
        <label>Description SEO<textarea name="seoDescription" rows={3} maxLength={170} defaultValue={article?.seoDescription} /></label>
      </div>
      {preview && <iframe className="content-preview" sandbox="" title="Prévisualisation de l’article" srcDoc={`<!doctype html><meta charset="utf-8"><style>body{font:16px/1.65 system-ui;padding:24px;color:#202735}img{max-width:100%}</style>${body}`} />}
      {error && <p className="form-error">{error}</p>}
      <div className="editor-actions">
        {article && <button className="danger-action" type="button" onClick={() => void remove()}><Trash2 size={16} /> Supprimer</button>}
        <button className="secondary-action" type="button" onClick={() => setPreview((value) => !value)}><Eye size={16} /> {preview ? 'Masquer' : 'Prévisualiser'}</button>
        <button className="primary-action" type="submit"><CalendarClock size={16} /> Enregistrer</button>
      </div>
    </form>
  );
}

function FaqEditor({ faq, categories, onClose, onSaved }: {
  faq: Faq | null;
  categories: Taxonomy[];
  onClose(): void;
  onSaved(): void;
}) {
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/cms/faqs${faq ? `/${faq.id}` : ''}`, {
      method: faq ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: form.get('question'),
        answerHtml: form.get('answerHtml'),
        categoryId: form.get('categoryId') || undefined,
        status: form.get('status'),
        sequence: Number(form.get('sequence')),
      }),
    });
    const result = await response.json();
    if (!response.ok) return setError(result.message ?? 'Enregistrement impossible.');
    onSaved();
  }

  async function remove() {
    if (!faq || !window.confirm('Supprimer cette question ?')) return;
    const response = await fetch(`/api/admin/cms/faqs/${faq.id}`, { method: 'DELETE' });
    if (response.ok) onSaved();
  }

  return (
    <form className="editor-panel panel" onSubmit={submit}>
      <div className="panel-heading"><h3>{faq ? 'Modifier la question' : 'Nouvelle question'}</h3><button className="icon-button" type="button" onClick={onClose} aria-label="Fermer"><X size={18} /></button></div>
      <div className="editor-grid">
        <label className="field-wide">Question<input name="question" required maxLength={300} defaultValue={faq?.question} /></label>
        <label className="field-wide">Réponse HTML<textarea name="answerHtml" required rows={8} defaultValue={faq?.answerHtml} /></label>
        <label>Catégorie<select name="categoryId" defaultValue={faq?.categoryId ?? ''}><option value="">Sans catégorie</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Statut<select name="status" defaultValue={faq?.status ?? 'draft'}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="unpublished">Dépublié</option></select></label>
        <label>Ordre<input name="sequence" type="number" min="0" defaultValue={faq?.sequence ?? 10} /></label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="editor-actions">{faq && <button className="danger-action" type="button" onClick={() => void remove()}><Trash2 size={16} /> Supprimer</button>}<button className="primary-action" type="submit">Enregistrer</button></div>
    </form>
  );
}

function TaxonomyManager({ title, endpoint, items, onCreated }: {
  title: string;
  endpoint: string;
  items: Taxonomy[];
  onCreated(): Promise<void>;
}) {
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/${endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: form.get('name') }),
    });
    if (response.ok) {
      event.currentTarget.reset();
      await onCreated();
    }
  }
  return <div className="panel taxonomy-panel"><div className="panel-heading"><h3>{title}</h3></div><form className="taxonomy-form" onSubmit={submit}><input name="name" required placeholder="Nouveau libellé" /><button className="icon-button" type="submit" aria-label="Ajouter"><Plus size={18} /></button></form><ul>{items.map((item) => <li key={item.id}><strong>{item.name}</strong><small>{item.slug}</small></li>)}</ul></div>;
}

function MediaManager({ items, onUploaded }: { items: Media[]; onUploaded(): Promise<void> }) {
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/cms/media', { method: 'POST', body: form });
    const result = await response.json();
    if (!response.ok) return setError(result.message ?? 'Téléversement impossible.');
    event.currentTarget.reset();
    setError('');
    await onUploaded();
  }
  return <div className="panel media-panel"><div className="panel-heading"><div><p className="eyebrow">Bibliothèque</p><h3>Médias</h3></div></div><form className="media-upload" onSubmit={submit}><label><Upload size={20} /><span>Fichier image, vidéo ou PDF</span><input name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf" /></label><input name="altText" placeholder="Texte alternatif" maxLength={255} /><button className="primary-action" type="submit">Téléverser</button></form>{error && <p className="form-error">{error}</p>}<div className="media-grid">{items.map((item) => <article key={item.id}><div className="media-thumb">{item.mimeType.startsWith('image/') ? <img src={item.url} alt={item.altText ?? item.name} /> : <FileText size={30} />}</div><strong>{item.name}</strong><small>{formatBytes(item.sizeBytes)}</small></article>)}</div></div>;
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick(): void; icon: React.ReactNode; label: string }) {
  return <button className={active ? 'is-active' : ''} type="button" role="tab" aria-selected={active} onClick={onClick}>{icon}{label}</button>;
}

function toLocalDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatBytes(value: number) {
  return value < 1024 * 1024 ? `${Math.round(value / 1024)} Ko` : `${(value / 1024 / 1024).toFixed(1)} Mo`;
}
