function requireSuccess(response, provider) {
  if (response.ok) return response;
  return response.text().then((body) => {
    throw new Error(`${provider} a retourné ${response.status}: ${body.slice(0, 300)}`);
  });
}

export function paymentProviderStatus() {
  return {
    wave: Boolean(process.env.WAVE_API_KEY),
    orange_money: Boolean(process.env.ORANGE_MONEY_API_URL && process.env.ORANGE_MONEY_ACCESS_TOKEN),
  };
}

export async function createWavePayment({ amount, currency, successUrl, errorUrl, reference }) {
  if (!process.env.WAVE_API_KEY) throw new Error("WAVE_NOT_CONFIGURED");
  const response = await fetch("https://api.wave.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WAVE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(amount),
      currency: currency.toUpperCase(),
      success_url: successUrl,
      error_url: errorUrl,
      client_reference: reference,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  await requireSuccess(response, "Wave");
  const result = await response.json();
  return {
    providerReference: result.id,
    paymentUrl: result.wave_launch_url,
    raw: result,
  };
}

export async function createOrangeMoneyPayment({ amount, currency, successUrl, reference }) {
  if (!process.env.ORANGE_MONEY_API_URL || !process.env.ORANGE_MONEY_ACCESS_TOKEN) {
    throw new Error("ORANGE_MONEY_NOT_CONFIGURED");
  }
  const response = await fetch(process.env.ORANGE_MONEY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ORANGE_MONEY_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: currency.toUpperCase(),
      order_id: reference,
      return_url: successUrl,
      merchant_key: process.env.ORANGE_MONEY_MERCHANT_KEY,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  await requireSuccess(response, "Orange Money");
  const result = await response.json();
  return {
    providerReference: result.pay_token || result.transaction_id || reference,
    paymentUrl: result.payment_url || result.redirect_url,
    raw: result,
  };
}
