/**
 * Доставка заявок в Telegram Bot API.
 *
 * Если переменные не заданы (локальная разработка), заявка не теряется:
 * печатаем её в консоль сервера и возвращаем ok. Для продакшена
 * TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID обязательны — см. README.
 */

import { interestLabel } from "@/lib/lead-schema";
import type { LeadRecord } from "@/lib/leads-store";

export type DeliveryMode = "telegram" | "console";

export type DeliveryResult =
  | { ok: true; mode: DeliveryMode }
  | { ok: false; error: "telegram_api" | "telegram_network" };

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

const TELEGRAM_MESSAGE_LIMIT = 3_900;

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Minsk",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function getTelegramConfig(): TelegramConfig | null {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID ?? "").trim();

  if (!botToken || !chatId) {
    return null;
  }

  return { botToken, chatId };
}

/** Текст уведомления менеджеру. Всё пользовательское — экранируем. */
export function formatLeadMessage(lead: LeadRecord): string {
  const lines: string[] = ["<b>Новая заявка · Кварта</b>", ""];

  lines.push(`<b>Имя:</b> ${escapeTelegramHtml(lead.name)}`);
  lines.push(`<b>Телефон:</b> ${escapeTelegramHtml(lead.phoneE164)}`);
  lines.push(`<b>Интерес:</b> ${escapeTelegramHtml(interestLabel(lead.interest))}`);

  if (lead.comment) {
    lines.push(`<b>Комментарий:</b> ${escapeTelegramHtml(lead.comment)}`);
  }

  lines.push("", "<b>Источник</b>");
  const utmEntries = Object.entries(lead.attribution.utm).filter(([, value]) => Boolean(value));

  if (utmEntries.length > 0) {
    for (const [key, value] of utmEntries) {
      lines.push(`${escapeTelegramHtml(key)}: ${escapeTelegramHtml(value ?? "")}`);
    }
  } else {
    lines.push("utm-меток нет (прямой заход)");
  }

  if (lead.attribution.clickId) {
    lines.push(`click_id: ${escapeTelegramHtml(lead.attribution.clickId)}`);
  }
  if (lead.attribution.referrer) {
    lines.push(`referrer: ${escapeTelegramHtml(lead.attribution.referrer)}`);
  }
  if (lead.attribution.page) {
    lines.push(`страница: ${escapeTelegramHtml(lead.attribution.page)}`);
  }

  lines.push("", `<b>Время:</b> ${timeFormatter.format(new Date(lead.createdAt))} (Минск)`);
  lines.push(`<b>ID:</b> ${escapeTelegramHtml(lead.id)}`);

  if (lead.requestId) {
    lines.push(`<b>requestId:</b> ${escapeTelegramHtml(lead.requestId)}`);
  }

  const message = lines.join("\n");
  return message.length > TELEGRAM_MESSAGE_LIMIT
    ? `${message.slice(0, TELEGRAM_MESSAGE_LIMIT - 20)}\n…сообщение обрезано`
    : message;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function readTelegramError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { description?: string };
    return payload.description ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

export async function deliverLead(lead: LeadRecord, fetchImpl: typeof fetch = fetch): Promise<DeliveryResult> {
  const message = formatLeadMessage(lead);
  const config = getTelegramConfig();

  if (!config) {
    console.info(`[kvarta] Telegram не настроен — заявка ${lead.id} только в лог:\n${htmlToPlainText(message)}`);
    return { ok: true, mode: "console" };
  }

  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      console.error(`[kvarta] Telegram API отказал (${lead.id}):`, await readTelegramError(response));
      return { ok: false, error: "telegram_api" };
    }

    return { ok: true, mode: "telegram" };
  } catch (error) {
    console.error(
      `[kvarta] Не достучались до Telegram (${lead.id}):`,
      error instanceof Error ? error.message : error,
    );
    return { ok: false, error: "telegram_network" };
  }
}
