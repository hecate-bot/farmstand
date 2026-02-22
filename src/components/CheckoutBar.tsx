import { useState, useEffect, useRef } from 'react';
import type { CartItem, StoreSettings } from '../types';
import { getStripe, createPaymentRequest } from '../lib/stripe';
import { createPaymentIntent } from '../lib/api';
import type { Stripe, PaymentRequest, StripePaymentRequestButtonElement } from '@stripe/stripe-js';

interface Props {
  cart: CartItem[];
  settings: StoreSettings;
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function CheckoutBar({ cart, settings }: Props) {
  const [canApplePay, setCanApplePay] = useState(false);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [prButton, setPrButton] = useState<StripePaymentRequestButtonElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const applePayRef = useRef<HTMLDivElement>(null);

  const totalCents = cart.reduce((sum, item) => sum + item.product.price_cents * item.quantity, 0);
  const hasItems = totalCents > 0;

  // Initialize Stripe & Payment Request
  useEffect(() => {
    if (!settings.stripe_publishable_key) return;

    getStripe(settings.stripe_publishable_key).then(async (s) => {
      if (!s) return;
      setStripe(s);

      const { paymentRequest: pr, canMakeApplePayment } = await createPaymentRequest(
        s,
        totalCents || 100,
        settings.name
      );

      setPaymentRequest(pr);
      setCanApplePay(canMakeApplePayment);

      pr.on('paymentmethod', async (ev) => {
        setStatus('processing');
        try {
          const items = cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          }));
          const { clientSecret } = await createPaymentIntent(items);

          const { error: confirmError } = await s.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (confirmError) {
            ev.complete('fail');
            setStatus('error');
            setErrorMsg(confirmError.message || 'Payment failed');
          } else {
            ev.complete('success');
            setStatus('success');
          }
        } catch (err) {
          ev.complete('fail');
          setStatus('error');
          setErrorMsg('Payment failed. Please try again.');
        }
      });
    });
  }, [settings.stripe_publishable_key]);

  // Update payment request total when cart changes
  useEffect(() => {
    if (!paymentRequest || !hasItems) return;
    paymentRequest.update({
      total: { label: settings.name, amount: totalCents },
    });
  }, [totalCents, paymentRequest]);

  // Mount Apple Pay button
  useEffect(() => {
    if (!stripe || !paymentRequest || !canApplePay || !applePayRef.current) return;

    if (prButton) {
      prButton.unmount();
      setPrButton(null);
    }

    const elements = stripe.elements();
    const btn = elements.create('paymentRequestButton', {
      paymentRequest,
      style: {
        paymentRequestButton: {
          type: 'buy',
          theme: 'dark',
          height: '52px',
        },
      },
    });

    btn.mount(applePayRef.current);
    setPrButton(btn);

    return () => {
      btn.unmount();
    };
  }, [stripe, paymentRequest, canApplePay]);

  const handleVenmo = () => {
    if (!hasItems) return;
    const amount = (totalCents / 100).toFixed(2);
    const note = encodeURIComponent(`${settings.name} order`);
    const handle = settings.venmo_handle;

    const deepLink = `venmo://paycharge?txn=pay&recipients=${handle}&amount=${amount}&note=${note}`;
    const webFallback = `https://venmo.com/${handle}?txn=pay&amount=${amount}&note=${note}`;

    // Try deep link, fallback to web after 500ms
    window.location.href = deepLink;
    setTimeout(() => {
      window.open(webFallback, '_blank');
    }, 600);
  };

  if (!hasItems) return null;

  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 z-50">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
        <p className="text-gray-500 text-center">Your payment was received. Enjoy!</p>
        <button
          onClick={() => { setStatus('idle'); window.location.reload(); }}
          className="mt-8 btn-primary px-8"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 pb-safe"
      style={{ backgroundColor: 'white', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
    >
      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Total row */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-500 font-medium">Total</span>
          <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {formatPrice(totalCents)}
          </span>
        </div>

        {errorMsg && (
          <p className="text-red-500 text-sm mb-3 text-center">{errorMsg}</p>
        )}

        {/* Payment buttons */}
        <div className="flex flex-col gap-3 pb-2">
          {/* Apple Pay */}
          {canApplePay && (
            <div ref={applePayRef} className="w-full" />
          )}

          {/* Venmo */}
          {settings.venmo_handle && (
            <button
              onClick={handleVenmo}
              disabled={!hasItems || status === 'processing'}
              className="w-full py-3.5 rounded-2xl font-semibold text-base transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#3D95CE', color: 'white' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M19.5 1.5C21.2 3.6 22 5.9 22 8.7c0 4.5-3.9 10.3-7 14.1H6.3L3 2.5l8.2-.8 1.7 13.8C14.8 12.2 17 7.7 17 4.9c0-1.4-.2-2.3-.6-3.4L19.5 1.5z"/>
              </svg>
              Pay with Venmo
            </button>
          )}

          {/* Fallback if no payment methods configured */}
          {!canApplePay && !settings.venmo_handle && (
            <p className="text-center text-gray-400 text-sm py-2">
              Payment methods not configured yet.
            </p>
          )}
        </div>

        {settings.venmo_handle && (
          <p className="text-xs text-gray-400 text-center pb-2">
            Venmo: opens app with amount pre-filled
          </p>
        )}
      </div>
    </div>
  );
}
