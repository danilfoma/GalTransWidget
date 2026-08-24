export type Sender = "user" | "assistant";

export type WidgetLocale = "ro" | "ru" | "en";

export interface TripResult {
  id: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  priceLabel: string;
  seatsLeft?: number;
  bookUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  trips?: TripResult[];
  createdAt: number;
  /** Set once the server has echoed this message back — the de-duplication key
   * for the live poll. Absent on bubbles that exist only in this browser. */
  serverKey?: string;
  /** Purely local bubble (an error notice) that the server will never send, so
   * the live poll must keep it instead of treating it as a stale duplicate. */
  local?: boolean;
}

export interface AssistantReply {
  text: string;
  trips?: TripResult[];
}

export interface ChatRequest {
  message: string;
  locale?: WidgetLocale;
  visitorId?: string;
}

export interface ChatResponse {
  reply: AssistantReply;
}

export interface HistoryMessage {
  sender: Sender;
  text: string;
  createdAt: number;
  /** Stable identity derived from the server payload — see lib/history-map.ts. */
  serverKey: string;
}

/**
 * What the browser needs in order to read the transcript straight from aichat.
 *
 * The transcript has to be re-read about once a second, because a human operator
 * who takes over the conversation has no way to push anything to us. aichat caps
 * `/widget/history` at 60 requests per minute PER IP — a budget sized for one
 * browser polling once a second. Routed through the API server every visitor
 * would share its single egress IP and the whole site would run out after a
 * handful of open widgets, so the poll runs in the browser instead.
 *
 * It is handed down by GET /api/history, so this app needs no new build-time
 * variable: when the agent is not configured the field is simply absent and no
 * polling starts. The widget id is not a secret — it is the only credential
 * aichat's widget endpoints take, and every embedded aichat widget carries it in
 * the page.
 */
export interface PollConfig {
  widgetId: string;
  apiUrl: string;
}

export interface HistoryResponse {
  messages: HistoryMessage[];
  source: "remote" | "none";
  /** Absent when the agent is not configured — then the widget does not poll. */
  poll?: PollConfig;
}
