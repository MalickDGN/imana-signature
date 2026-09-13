import Link from 'next/link';
import { getProductCategories } from '@/lib/api/products';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await getProductCategories().catch(() => []);

  return (
    <div className="mx-auto min-h-[60vh] max-w-5xl px-6 py-12">
      <h1 className="font-disp text-5xl font-semibold text-marine">
        Catégories
      </h1>
      <div className="mt-10 divide-y divide-sable-dark border-y border-sable-dark">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/collections?category=${category.id}`}
            className="flex items-center justify-between py-5 text-lg text-marine hover:text-champ-dark"
          >
            {category.name}
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
