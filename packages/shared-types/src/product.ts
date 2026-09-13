export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  stock?: number;
  category?: string;
  categoryId?: string;
  sku?: string;
  templateId?: string;
  family?: string;
  gender?: string;
  brand?: string;
  collection?: string;
  badge?: string;
  notes?: string;
  format?: number;
  accessoryType?: string;
  seasons?: string[];
  occasions?: string[];
  attributes?: Record<string, string>;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export type ProductSort = 'name_asc' | 'price_asc' | 'price_desc';
