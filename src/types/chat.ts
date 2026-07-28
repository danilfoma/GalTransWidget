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
}

export interface HistoryResponse {
  messages: HistoryMessage[];
  source: "remote" | "none";
}
