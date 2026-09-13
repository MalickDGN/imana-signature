export interface Product {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    stock?: number;
    category?: string;
    categoryId?: string;
}
export interface ProductCategory {
    id: string;
    name: string;
}
export type ProductSort = 'name_asc' | 'price_asc' | 'price_desc';
