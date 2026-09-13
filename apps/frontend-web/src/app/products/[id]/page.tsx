import type { Metadata } from 'next';
import ProductDetailPage from '@/components/ProductDetailPage';
import { getProduct } from '@/lib/api/products';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id).catch(() => null);
  if (!product) return { title: 'Produit introuvable | IMANA Signature' };

  return {
    title: `${product.name} | IMANA Signature`,
    description:
      product.description ?? `Découvrez ${product.name} chez IMANA Signature.`,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default ProductDetailPage;
