import config from "../../config";

// Minimal QPay v2 merchant client: token → invoice → payment check.
// Docs: https://developer.qpay.mn (v2). Callback bodies are never trusted;
// payment state always comes from /payment/check.

export type TQPayInvoice = {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // base64 PNG
  qPay_shortUrl?: string;
  urls?: { name: string; description: string; logo: string; link: string }[];
};

let token: { value: string; exp: number } | null = null;

const base = () => {
  if (!config.QPAY_URL) throw new Error("Онлайн төлбөр одоогоор идэвхгүй байна");
  return config.QPAY_URL.replace(/\/$/, "");
};

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`QPay ${path} ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

async function auth(): Promise<string> {
  if (token && Date.now() < token.exp) return token.value;
  const basic = Buffer.from(`${config.QPAY_USERNAME}:${config.QPAY_PASSWORD}`).toString("base64");
  const r = await call<{ access_token: string; expires_in: number }>("/auth/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });
  // QPay sends expires_in as an epoch (seconds); tolerate a duration too.
  const exp = r.expires_in > 1e9 ? r.expires_in * 1000 : Date.now() + r.expires_in * 1000;
  token = { value: r.access_token, exp: exp - 60_000 };
  return token.value;
}

async function authed<T>(path: string, body: unknown): Promise<T> {
  const init = (t: string): RequestInit => ({
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  try {
    return await call<T>(path, init(await auth()));
  } catch (err) {
    // Token revoked early → one retry with a fresh token.
    if (!(err instanceof Error) || !/ 401:/.test(err.message)) throw err;
    token = null;
    return call<T>(path, init(await auth()));
  }
}

export const QPay = {
  createInvoice(o: { id: string; code: string; total: number }): Promise<TQPayInvoice> {
    const cb = config.QPAY_CALLBACK_BASE.replace(/\/$/, "");
    return authed<TQPayInvoice>("/invoice", {
      invoice_code: config.QPAY_INVOICE_CODE,
      sender_invoice_no: o.code,
      invoice_receiver_code: "terminal",
      invoice_description: `Вайт грүпп захиалга ${o.code}`,
      amount: o.total,
      callback_url: `${cb}/qpay/callback/${o.id}`,
    });
  },

  // Sum of PAID payments on the invoice, in ₮.
  async paidAmount(invoiceId: string): Promise<number> {
    const r = await authed<{ rows?: { payment_status: string; payment_amount: number | string }[] }>(
      "/payment/check",
      { object_type: "INVOICE", object_id: invoiceId, offset: { page_number: 1, page_limit: 100 } },
    );
    return (r.rows ?? [])
      .filter((p) => p.payment_status === "PAID")
      .reduce((s, p) => s + Number(p.payment_amount), 0);
  },
};
