// ---------------------------------------------------------------------------
// Parser for an aichat `/widget/history` payload, used by the live poll — the
// one call this app makes that does NOT go through its own /api origin. The
// same parser runs on the API server; keep the two in step.
// ---------------------------------------------------------------------------

import { log } from "@/lib/log";
import type { HistoryMessage } from "@/types/chat";

/**
 * aichat sends `time` as epoch milliseconds inside a STRING ("1787593464687"),
 * not as ISO. `Date.parse` on that returns NaN, which would stamp every polled
 * message with the current time and break the ordering and de-duplication the
 * live transcript depends on.
 */
export function parseTime(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return NaN;
  return /^\d+$/.test(raw) ? Number(raw) : Date.parse(raw);
}

/**
 * A stable identity for a message, derived only from what the server sent, so
 * the same message keeps the same key across every poll. Length stands in for
 * the body: two messages sharing a role AND a millisecond are already
 * implausible, and comparing lengths keeps the key small.
 */
function serverKeyOf(role: string, time: unknown, text: string): string {
  const stamp = typeof time === "string" ? time : String(parseTime(time));
  return `${role}|${stamp}|${text.length}`;
}

function mapHistoryMessage(raw: unknown): HistoryMessage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const { role, content } = record;

  if (typeof content !== "string") return null;

  // aichat only ever emits "user" / "assistant" — a human operator's messages
  // arrive as "assistant" too. Anything else is a change on their side that we
  // would otherwise drop in silence, so say it out loud.
  if (role !== "user" && role !== "assistant") {
    log.warn("history: dropping message with unexpected role —", String(role));
    return null;
  }

  const createdAt = parseTime(record.time);

  return {
    sender: role,
    text: content,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    serverKey: serverKeyOf(role, record.time, content),
  };
}

/** Pull the message list out of an aichat history response body. */
export function mapHistoryPayload(data: unknown): HistoryMessage[] {
  const raw =
    typeof data === "object" && data !== null && "messages" in data
      ? (data as { messages: unknown }).messages
      : [];

  if (!Array.isArray(raw)) return [];

  return raw
    .map(mapHistoryMessage)
    .filter((message): message is HistoryMessage => message !== null);
}
