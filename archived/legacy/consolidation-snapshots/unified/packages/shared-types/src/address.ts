export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export interface ShippingMethod {
  code: 'standard' | 'express';
  name: string;
  price: number;
}

export type PaymentMethod = 'cod' | 'mobile';
export type MobilePaymentProvider = 'wave' | 'orange-money';

export interface PaymentDetails {
  method: PaymentMethod;
  provider?: MobilePaymentProvider;
}
