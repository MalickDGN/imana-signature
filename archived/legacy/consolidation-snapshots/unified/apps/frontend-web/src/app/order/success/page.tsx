import Link from 'next/link';
import { ConversionTracker } from '@/components/ConversionTracker';

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <ConversionTracker orderId={searchParams.orderId} />
      <h1 className="text-4xl font-bold text-gray-900">Commande enregistree</h1>
      <p className="mx-auto mt-4 max-w-xl text-gray-600">
        Merci. Votre commande a bien ete transmise a notre equipe.
        {searchParams.orderId ? ` Reference: ${searchParams.orderId}.` : ''}
      </p>
      <Link
        href="/collections"
        className="mt-8 inline-flex rounded-lg bg-gray-800 px-8 py-3 font-semibold text-white hover:bg-gray-900"
      >
        Retour aux collections
      </Link>
    </div>
  );
}
