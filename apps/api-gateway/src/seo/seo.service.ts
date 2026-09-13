import { Injectable } from '@nestjs/common';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { OdooService } from '../integrations/odoo/odoo.service';

export interface SeoIssue {
  entityType: 'article' | 'product';
  entityId: string;
  title: string;
  issues: string[];
}

@Injectable()
export class SeoService {
  constructor(
    private readonly db: PortalDatabaseService,
    private readonly odoo: OdooService,
  ) {}

  async analyze(): Promise<{ items: SeoIssue[]; healthy: number; total: number }> {
    const articles = await this.db.query<{
      id: string;
      title: string;
      seo_title: string | null;
      seo_description: string | null;
      canonical_url: string | null;
      status: string;
    }>(
      `SELECT id, title, seo_title, seo_description, canonical_url, status
       FROM ${this.db.table('cms_articles')}
       WHERE status IN ('published', 'scheduled')`,
    );
    const products = await this.odoo.findProducts(
      [['sale_ok', '=', true]],
      ['id', 'display_name', 'description_sale'],
    );

    const items: SeoIssue[] = [];

    for (const article of articles.rows) {
      const issues: string[] = [];
      const seoTitle = article.seo_title ?? '';
      const seoDescription = article.seo_description ?? '';
      if (!seoTitle) issues.push('Titre SEO manquant');
      else if (seoTitle.length > 70) issues.push('Titre SEO trop long (>70 caractères)');
      if (!seoDescription) issues.push('Meta description manquante');
      else if (seoDescription.length > 170) issues.push('Meta description trop longue (>170 caractères)');
      if (!article.canonical_url) issues.push('URL canonique manquante');
      if (issues.length) {
        items.push({ entityType: 'article', entityId: article.id, title: article.title, issues });
      }
    }

    for (const product of products) {
      const issues: string[] = [];
      const name = String(product.display_name ?? '');
      const description = String(product.description_sale ?? '');
      if (!name || name.length < 10) issues.push('Nom produit trop court pour le SEO');
      if (!description) issues.push('Description produit manquante');
      if (issues.length) {
        items.push({ entityType: 'product', entityId: String(product.id), title: name, issues });
      }
    }

    return {
      items,
      healthy: articles.rows.length + products.length - items.length,
      total: articles.rows.length + products.length,
    };
  }
}
