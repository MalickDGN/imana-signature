import { Container, Skeleton } from '@imana-signature/ui-kit';

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-ivoire py-10" aria-label="Chargement du produit">
      <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="py-8">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-5 h-16 w-4/5" />
          <Skeleton className="mt-6 h-8 w-40" />
          <Skeleton className="mt-9 h-32 w-full" />
          <Skeleton className="mt-8 h-14 w-full" />
        </div>
      </Container>
    </div>
  );
}
