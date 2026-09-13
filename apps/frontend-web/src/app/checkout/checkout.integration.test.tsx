import type { ImgHTMLAttributes } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { useCartStore } from '@/lib/store/cart';
import CheckoutPage from './page';

const router = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

vi.mock('next/image', () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

const product = {
  id: '42',
  name: 'Ambre Nocturne',
  price: 68000,
  quantity: 2,
};

const deliveryZones = [
  { id: 'zone-standard', name: 'Livraison Standard', price_fcfa: '3000' },
  { id: 'zone-express', name: 'Livraison Express', price_fcfa: '7000' },
];

const paymentMethods = [
  { id: 'payment-cod', code: 'cod', label: 'Paiement à la livraison' },
  { id: 'payment-wave', code: 'wave', label: 'Wave' },
];

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(body) };
}

describe('checkout integration', () => {
  beforeEach(() => {
    localStorage.clear();
    router.push.mockReset();
    useCartStore.setState({
      items: [product],
      shippingAddress: null,
      shippingMethod: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits the complete mobile-money journey and clears the cart', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/delivery-zones') return Promise.resolve(jsonResponse(deliveryZones));
      if (url === '/api/payment-methods') return Promise.resolve(jsonResponse(paymentMethods));
      return Promise.resolve(jsonResponse({ id: 123, status: 'pending_payment' }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<CheckoutPage />);

    expect(
      await screen.findByRole('heading', { name: 'Adresse de livraison' }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nom complet'), 'Awa Ndiaye');
    await user.type(screen.getByLabelText('Email'), 'awa@example.com');
    await user.type(screen.getByLabelText('Telephone'), '+221770000000');
    await user.type(
      screen.getByLabelText('Adresse'),
      '10 rue de Dakar',
    );
    await user.type(screen.getByLabelText('Ville'), 'Dakar');
    await user.click(
      screen.getByRole('button', {
        name: 'Continuer vers la livraison',
      }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Methode de livraison' }),
    ).toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', { name: /Livraison Express/ }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Continuer vers le paiement' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Paiement' }),
    ).toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', { name: 'Wave' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Payer maintenant' }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/orders', expect.anything()),
    );
    const [, request] = fetchMock.mock.calls.find(([url]) => url === '/api/orders') as [
      string,
      RequestInit,
    ];

    expect(request.method).toBe('POST');
    expect(JSON.parse(String(request.body))).toEqual({
      items: [{ id: '42', quantity: 2 }],
      shippingAddress: {
        name: 'Awa Ndiaye',
        email: 'awa@example.com',
        phone: '+221770000000',
        address: '10 rue de Dakar',
        city: 'Dakar',
      },
      shippingMethod: {
        code: 'zone-express',
        name: 'Livraison Express',
        price: 7000,
      },
      payment: {
        method: 'wave',
      },
    });
    expect((request.headers as Record<string, string>)['Idempotency-Key']).toMatch(/^[\w-]{16,100}$/);
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        '/order/success?orderId=123&status=pending_payment',
      ),
    );
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('keeps the cart and displays an error when order creation fails', async () => {
    useCartStore.setState({
      shippingAddress: {
        name: 'Awa Ndiaye',
        email: 'awa@example.com',
        phone: '+221770000000',
        address: '10 rue de Dakar',
        city: 'Dakar',
      },
      shippingMethod: {
        code: 'zone-standard',
        name: 'Livraison Standard',
        price: 3000,
      },
    });
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/payment-methods') return Promise.resolve(jsonResponse(paymentMethods));
      return Promise.resolve(jsonResponse(null, false));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(<PaymentForm />);
    await user.click(
      await screen.findByRole('button', { name: 'Paiement à la livraison' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Payer maintenant' }),
    );

    expect(
      await screen.findByText(
        'Une erreur est survenue lors du paiement. Veuillez reessayer.',
      ),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toEqual([product]);
  });
});
