import { log } from "@/lib/log";
import { mapHistoryPayload } from "@/lib/history-map";
import type {
  AssistantReply,
  ChatRequest,
  ChatResponse,
  HistoryMessage,
  HistoryResponse,
  PollConfig,
  WidgetLocale,
} from "@/types/chat";

/** aichat serves the tail of the conversation; 40 is what its own widget asks for. */
const HISTORY_LIMIT = 40;

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

/**
 * Re-read the transcript straight from aichat — the only call that leaves this
 * app's own origin. Returns `null` on any failure, which the caller must NOT
 * confuse with an empty conversation: a rate-limited or unreachable poll has to
 * leave the visible thread untouched, while a real empty result is simply
 * nothing to merge.
 */
export async function pollAichatHistory(
  poll: PollConfig,
  visitorId: string,
  signal?: AbortSignal,
): Promise<HistoryMessage[] | null> {
  const url =
    `${poll.apiUrl}/widget/history` +
    `?widget_id=${encodeURIComponent(poll.widgetId)}` +
    `&session_id=${encodeURIComponent(visitorId)}` +
    `&limit=${HISTORY_LIMIT}`;

  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal,
    });
    if (!res.ok) {
      log.warn("poll: aichat history returned", res.status);
      return null;
    }
    return mapHistoryPayload(await res.json());
  } catch (err) {
    // An abort is the component unmounting, not a failure worth logging.
    if (err instanceof DOMException && err.name === "AbortError") return null;
    log.warn(
      "poll: aichat history unreachable —",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}
