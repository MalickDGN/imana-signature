'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '@imana-signature/ui-kit';

export default function ProductError({ reset }: { reset(): void }) {
  return (
    <div className="min-h-[70vh] bg-ivoire py-14">
      <EmptyState
        icon={<AlertTriangle size={22} />}
        title="Cette fragrance ne peut pas être chargée"
        description="La connexion au catalogue a rencontré un problème temporaire."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="min-h-11 bg-marine px-6 text-sm font-semibold text-ivoire"
            >
              Réessayer
            </button>
            <Link
              href="/collections"
              className="inline-flex min-h-11 items-center border border-marine px-6 text-sm font-semibold text-marine"
            >
              Retour aux collections
            </Link>
          </div>
        }
      />
    </div>
  );
}
