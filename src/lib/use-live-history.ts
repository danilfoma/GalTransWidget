// ---------------------------------------------------------------------------
// The live transcript loop.
//
// A human operator who takes over the conversation in aichat has no way to push
// anything to this widget — aichat offers no socket, no server-sent stream and no
// webhook on the widget side. Their own embedded widget solves it by re-reading
// the transcript about once a second, and so do we.
//
// Three things this loop is careful about:
//   * it re-schedules AFTER each response instead of using setInterval, so a slow
//     network can never stack overlapping requests;
//   * it stops entirely while the tab is hidden (and catches up the moment it
//     comes back), because a backgrounded tab polling once a second is pure waste
//     and eats the 60-per-minute budget aichat allows per IP;
//   * it backs off on failure, so a rate-limited or down upstream is not hammered.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";

import { pollAichatHistory } from "@/lib/api";
import type { HistoryMessage, PollConfig } from "@/types/chat";

/** Cadence while the visitor is actually looking at the conversation. */
const POLL_OPEN_MS = 1_000;
/** Cadence while the panel is closed — still live, just not urgent. */
const POLL_CLOSED_MS = 10_000;
/** Failures double the wait up to this ceiling. */
const POLL_BACKOFF_MAX_MS = 30_000;

interface LiveHistoryOptions {
  /** Undefined until the first /api/history reply lands, or if no agent is set. */
  poll: PollConfig | undefined;
  visitorId: string;
  /** Whether the chat panel is on screen — decides the cadence. */
  isOpen: boolean;
  /** Called with the full server-side transcript on every successful read. */
  onMessages: (messages: HistoryMessage[]) => void;
}

export function useLiveHistory({
  poll,
  visitorId,
  isOpen,
  onMessages,
}: LiveHistoryOptions): void {
  // Held in a ref so a caller that re-creates the callback each render does not
  // tear down and restart the loop.
  const onMessagesRef = useRef(onMessages);
  useEffect(() => {
    onMessagesRef.current = onMessages;
  }, [onMessages]);

  const widgetId = poll?.widgetId;
  const apiUrl = poll?.apiUrl;

  useEffect(() => {
    if (!widgetId || !apiUrl || !visitorId) return;
    if (typeof document === "undefined") return;

    const config: PollConfig = { widgetId, apiUrl };
    const controller = new AbortController();

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let inFlight = false;

    function nextDelay(): number {
      const base = isOpen ? POLL_OPEN_MS : POLL_CLOSED_MS;
      if (failures === 0) return base;
      return Math.min(base * 2 ** failures, POLL_BACKOFF_MAX_MS);
    }

    function schedule(): void {
      if (stopped || document.visibilityState !== "visible") return;
      timer = setTimeout(() => void tick(), nextDelay());
    }

    async function tick(): Promise<void> {
      if (stopped || inFlight) return;
      if (document.visibilityState !== "visible") return;

      inFlight = true;
      const messages = await pollAichatHistory(
        config,
        visitorId,
        controller.signal,
      );
      inFlight = false;

      if (stopped) return;

      if (messages === null) {
        failures += 1;
      } else {
        failures = 0;
        onMessagesRef.current(messages);
      }

      schedule();
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState !== "visible") {
        // Nothing to cancel beyond the pending timer: an in-flight request is
        // cheap and its result is still worth merging when it lands.
        if (timer) clearTimeout(timer);
        return;
      }
      // Back on screen — read immediately rather than waiting out the interval.
      if (timer) clearTimeout(timer);
      void tick();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    void tick();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [widgetId, apiUrl, visitorId, isOpen]);
}
