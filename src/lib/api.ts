import { log } from "@/lib/log";
import type {
  AssistantReply,
  ChatRequest,
  ChatResponse,
  HistoryResponse,
  WidgetLocale,
} from "@/types/chat";

const API_BASE = (import.meta.env.VITE_WIDGET_API_URL ?? "").replace(/\/$/, "");

function endpoint(path: string): string {
  return `${API_BASE}${path}`;
}

export async function registerVisit(visitorId: string): Promise<void> {
  try {
    await fetch(endpoint("/api/visit"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId }),
    });
  } catch (err) {
    log.warn(
      "visit: registration failed —",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function sendChat(
  message: string,
  locale: WidgetLocale,
  visitorId: string,
  signal?: AbortSignal,
): Promise<AssistantReply> {
  const body: ChatRequest = { message, locale, visitorId };

  const res = await fetch(endpoint("/api/chat"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    log.error("chat: request failed —", res.status);
    throw new Error(`chat request failed: ${res.status}`);
  }

  const data = (await res.json()) as ChatResponse;
  return data.reply;
}

export async function fetchHistory(visitorId: string): Promise<HistoryResponse> {
  try {
    const res = await fetch(
      endpoint(`/api/history?v=${encodeURIComponent(visitorId)}`),
    );
    if (!res.ok) {
      log.warn("history: request failed —", res.status);
      return { messages: [], source: "none" };
    }
    return (await res.json()) as HistoryResponse;
  } catch (err) {
    log.error(
      "history: request error —",
      err instanceof Error ? err.message : String(err),
    );
    return { messages: [], source: "none" };
  }
}
