export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export interface ShippingMethod {
  /** Id of the active delivery_zones row this method resolves to server-side. */
  code: string;
  name: string;
  price: number;
}

export interface PaymentDetails {
  /** Code of the active payment_methods row this selection resolves to server-side. */
  method: string;
}
