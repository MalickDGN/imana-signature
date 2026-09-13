import { Container, Skeleton } from '@imana-signature/ui-kit';

export default function CollectionsLoading() {
  return (
    <div className="min-h-screen bg-ivoire py-14" aria-label="Chargement du catalogue">
      <Container>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-4 h-14 w-full max-w-xl" />
        <div className="mt-12 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="hidden lg:grid lg:content-start lg:gap-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-12 w-full" />
            ))}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item}>
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="mt-4 h-7 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
