import type {
  PaymentDetails,
  ShippingAddress,
  ShippingMethod,
} from './address';

export interface OrderItem {
  id: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  payment: PaymentDetails;
}

export interface CreateOrderResult {
  id: number;
  status: 'pending_payment' | 'confirmed';
}
