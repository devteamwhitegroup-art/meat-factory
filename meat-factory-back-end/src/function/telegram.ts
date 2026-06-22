import config from "../config";

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = config;

// Best-effort fire-and-forget Telegram notification. Both env vars must be
// set; otherwise the call logs and resolves to false so the caller can
// continue (we don't want a missing bot token to block inventory ingestion).
export async function sendTelegramMessage(message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn(
      "[telegram] skipped: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set",
    );
    return false;
  }
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[telegram] non-OK response:", res.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.error(
      "[telegram] error:",
      e instanceof Error ? e.message : "unknown error",
    );
    return false;
  }
}
