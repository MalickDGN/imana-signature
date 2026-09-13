import type { ImgHTMLAttributes } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductCard } from './ProductCard';
import { useCartStore } from '@/lib/store/cart';
import { useWishlistStore } from '@/lib/store/wishlist';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => <img {...props} />,
}));

const product = {
  id: '42',
  name: 'Ambre Nocturne',
  category: 'Niche',
  price: 68000,
  stock: 3,
};

describe('ProductCard', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [] });
    useWishlistStore.setState({ items: [] });
  });

  it('adds the product to the cart and announces the result', () => {
    render(<ProductCard product={product} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Ajouter rapidement' }),
    );

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({ id: '42', quantity: 1 }),
    ]);
    expect(screen.getByText('Ambre Nocturne a été ajouté au panier.')).toBeInTheDocument();
  });

  it('toggles the product in the wishlist', () => {
    render(<ProductCard product={product} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ajouter Ambre Nocturne aux favoris',
      }),
    );

    expect(useWishlistStore.getState().items).toEqual([product]);
  });

  it('prevents adding an unavailable product', () => {
    render(<ProductCard product={{ ...product, stock: 0 }} />);

    expect(
      screen.getByRole('button', { name: 'Indisponible' }),
    ).toBeDisabled();
  });
});
