'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
const approved = new Set(['/', '/index.html', '/about', '/la-maison', '/la-maison.html', '/blog', '/magazine', '/magazine.html', '/collections', '/catalogue', '/catalogue.html']);
export function PageFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return approved.has(pathname) ? <>{children}</> : <div className="storefront-page">{children}</div>;
}
