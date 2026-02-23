import { loadStripe, type Stripe, type PaymentRequest } from '@stripe/stripe-js';

let stripeInstance: Stripe | null = null;
let stripeKey: string | null = null;

export const getStripe = async (publishableKey: string): Promise<Stripe | null> => {
  if (stripeInstance && stripeKey === publishableKey) return stripeInstance;
  stripeKey = publishableKey;
  stripeInstance = await loadStripe(publishableKey);
  return stripeInstance;
};

export interface PaymentRequestResult {
  paymentRequest: PaymentRequest;
  canMakeApplePayment: boolean;
}

export const createPaymentRequest = async (
  stripe: Stripe,
  totalCents: number,
  storeName: string
): Promise<PaymentRequestResult> => {
  const paymentRequest = stripe.paymentRequest({
    country: 'US',
    currency: 'usd',
    total: {
      label: storeName,
      amount: totalCents,
    },
    requestPayerName: false,
    requestPayerEmail: false,
  });

  const result = await paymentRequest.canMakePayment();
  const canMakeApplePayment = !!(result?.applePay || result?.googlePay);

  return { paymentRequest, canMakeApplePayment };
};
