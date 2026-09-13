import Link from 'next/link';
import { ConversionTracker } from '@/components/ConversionTracker';

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const confirmed = resolvedSearchParams.status === 'confirmed';
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      {confirmed && <ConversionTracker orderId={resolvedSearchParams.orderId} />}
      <h1 className="text-4xl font-bold text-gray-900">
        {confirmed ? 'Commande confirmée' : 'Paiement en attente'}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-gray-600">
        {confirmed
          ? 'Merci. Votre commande a bien été transmise à notre équipe.'
          : 'Votre commande est enregistrée, mais elle ne sera confirmée qu’après validation du paiement.'}
        {resolvedSearchParams.orderId ? ` Référence : ${resolvedSearchParams.orderId}.` : ''}
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
