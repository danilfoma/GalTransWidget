import { useCallback, useEffect, useRef, useState } from "react";

import { MessageRow, TypingRow } from "@/components/chat-messages";
import {
  BotIcon,
  CalendarIcon,
  ChatIcon,
  CloseIcon,
  FacebookIcon,
  MinimizeIcon,
  PriceIcon,
  SearchIcon,
  SendIcon,
  TelegramIcon,
  TicketIcon,
  ViberIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { fetchHistory, registerVisit, sendChat } from "@/lib/api";
import { useLiveHistory } from "@/lib/use-live-history";
import { getRuntimeConfig } from "@/lib/config";
import { log } from "@/lib/log";
import { getVisitorId } from "@/lib/visitor";
import type {
  ChatMessage,
  HistoryMessage,
  PollConfig,
  TripResult,
  WidgetLocale,
} from "@/types/chat";

const LABELS: Record<
  WidgetLocale,
  {
    name: string;
    status: string;
    welcome: string;
    placeholder: string;
    social: string;
    error: string;
    peek: string;
    quick: string[];
  }
> = {
  ro: {
    name: "Asistent Gal Trans",
    status: "Răspunde imediat",
    welcome:
      "Salut! 👋 Sunt asistentul Gal Trans. Găsesc curse, orarul sau te ajut cu un bilet. Unde vrei să mergi?",
    placeholder: "Scrie un mesaj…",
    social: "Sau scrie-ne pe",
    error: "Ceva n-a mers. Mai încearcă o dată, te rog.",
    peek: "Ai nevoie de ajutor cu o cursă? Întreabă-mă 👋",
    quick: ["Găsește o cursă", "Orar", "Biletul meu", "Prețuri"],
  },
  ru: {
    name: "Ассистент Gal Trans",
    status: "Отвечает сразу",
    welcome:
      "Привет! 👋 Я ассистент Gal Trans. Найду рейсы, расписание или помогу с билетом. Куда едем?",
    placeholder: "Напишите сообщение…",
    social: "Или напишите нам в",
    error: "Что-то пошло не так. Попробуйте ещё раз.",
    peek: "Нужна помощь с рейсом? Спросите меня 👋",
    quick: ["Найти рейс", "Расписание", "Мой билет", "Цены"],
  },
  en: {
    name: "Gal Trans Assistant",
    status: "Replies instantly",
    welcome:
      "Hi! 👋 I'm the Gal Trans assistant. I can find trips, the timetable or help with a ticket. Where to?",
    placeholder: "Type your message…",
    social: "Or reach us on",
    error: "Something went wrong. Please try again.",
    peek: "Need a hand with a trip? Ask me 👋",
    quick: ["Find a trip", "Timetable", "My ticket", "Prices"],
  },
};

const QUICK_ICONS = [SearchIcon, CalendarIcon, TicketIcon, PriceIcon];

// The greeting is the one message the widget wrote itself, so it is the one
// message that must follow a language change (the host can switch language
// while the widget is open). Everything else was actually said, in the language
// it was said in, and is left alone.
const WELCOME_ID = "welcome";

interface Channel {
  label: string;
  href: string;
  icon: typeof WhatsAppIcon;
}

// A handle that already looks like a URL is used verbatim. That is the escape
// hatch for the cases the templates below cannot express — a Facebook *page*
// (facebook.com/name) rather than Messenger (m.me/name), a group invite link,
// a short link.
function channelHref(handle: string, template: (h: string) => string): string {
  return /^https?:\/\//i.test(handle) ? handle : template(handle);
}

// Contact links come from the runtime config (`/config.js`, regenerated from
// WIDGET_CHANNEL_* every time the container starts), so a deployment sets them
// with a restart instead of a rebuild. A channel with no configured handle is
// dropped entirely — a dead `https://t.me/` link is worse than no icon.
function buildChannels(): Channel[] {
  const { whatsapp, telegram, viber, facebook } = getRuntimeConfig();
  const channels: Channel[] = [];

  if (whatsapp) {
    channels.push({
      label: "WhatsApp",
      href: channelHref(whatsapp, (h) => `https://wa.me/${h}`),
      icon: WhatsAppIcon,
    });
  }
  if (telegram) {
    channels.push({
      label: "Telegram",
      href: channelHref(telegram, (h) => `https://t.me/${h}`),
      icon: TelegramIcon,
    });
  }
  if (viber) {
    channels.push({
      label: "Viber",
      href: channelHref(viber, (h) => `viber://chat?number=%2B${h}`),
      icon: ViberIcon,
    });
  }
  if (facebook) {
    channels.push({
      label: "Facebook",
      href: channelHref(facebook, (h) => `https://m.me/${h}`),
      icon: FacebookIcon,
    });
  }

  return channels;
}

// Evaluated once at module load. `/config.js` is a classic script in the page
// head, so it has already run by the time this deferred module is evaluated.
const CHANNELS: Channel[] = buildChannels();

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Math.round(performance.now() * 1000));
}

/** True when two threads hold the very same message objects, in the same order. */
function isSameThread(a: ChatMessage[], b: ChatMessage[]): boolean {
  return a.length === b.length && a.every((message, i) => message === b[i]);
}

function nowTs(): number {
  return Date.now();
}

export function ChatWidget({
  locale = "ro",
  embedded = false,
}: {
  locale?: WidgetLocale;
  embedded?: boolean;
}) {
  const t = LABELS[locale];

  const [open, setOpen] = useState(false);
  const [showPeek, setShowPeek] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: WELCOME_ID, sender: "assistant", text: t.welcome, createdAt: 0 },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [visitorId, setVisitorId] = useState("");
  const [pollConfig, setPollConfig] = useState<PollConfig>();

  const bottomRef = useRef<HTMLDivElement>(null);
  const visitorIdRef = useRef<string>("");

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, open]);

  // Fold the server's copy of the conversation into what is on screen. The
  // server is authoritative, so this runs on every poll — which is exactly why
  // it must return the SAME array when nothing changed: the scroll effect above
  // watches `messages`, and a fresh array once a second would drag the thread
  // down forever.
  const syncHistory = useCallback((incoming: HistoryMessage[]) => {
    if (incoming.length === 0) return;

    setMessages((current) => {
      const welcome = current.find((m) => m.id === WELCOME_ID);
      const known = new Map(
        current
          .filter((m) => m.serverKey !== undefined)
          .map((m) => [m.serverKey as string, m]),
      );

      // Keep the existing object whenever the message is unchanged, so an
      // unchanged poll rebuilds an identical array and React bails out.
      const server: ChatMessage[] = incoming.map((h) => {
        const previous = known.get(h.serverKey);
        if (previous && previous.text === h.text) return previous;
        return {
          id: previous?.id ?? makeId(),
          sender: h.sender,
          text: h.text,
          createdAt: h.createdAt,
          serverKey: h.serverKey,
        };
      });

      // Bubbles that live only in this browser. An error notice stays; an
      // optimistic one disappears once the server echoes it back. Each server
      // message can absorb at most one, or the same sentence sent twice in a row
      // would cancel itself out.
      const absorbed = new Set<string>();
      const graftedTrips = new Map<string, TripResult[]>();

      const localOnly = current.filter((m) => {
        if (m.id === WELCOME_ID || m.serverKey !== undefined) return false;
        if (m.local) return true;

        const match = server.find(
          (s) =>
            s.serverKey !== undefined &&
            !absorbed.has(s.serverKey) &&
            s.sender === m.sender &&
            s.text === m.text,
        );
        if (!match?.serverKey) return true;

        absorbed.add(match.serverKey);
        // aichat's transcript carries no trip cards, so move them across from
        // the reply this bubble came from — otherwise the search results vanish
        // on the very next poll.
        if (m.trips?.length && !match.trips?.length) {
          graftedTrips.set(match.serverKey, m.trips);
        }
        return false;
      });

      const merged = graftedTrips.size
        ? server.map((s) => {
            const trips = s.serverKey
              ? graftedTrips.get(s.serverKey)
              : undefined;
            return trips ? { ...s, trips } : s;
          })
        : server;

      const next = [...(welcome ? [welcome] : []), ...merged, ...localOnly];
      return isSameThread(current, next) ? current : next;
    });
  }, []);

  useEffect(() => {
    const vid = getVisitorId();
    visitorIdRef.current = vid;
    log.info("init: visitor", vid.slice(0, 8));
    void registerVisit(vid);

    let cancelled = false;
    void (async () => {
      const history = await fetchHistory(vid);
      if (cancelled) return;
      // Both values the live poll needs, published together once the first read
      // lands — there is nothing for it to do before that anyway.
      if (history.poll) setPollConfig(history.poll);
      setVisitorId(vid);
      syncHistory(history.messages);
      log.info("init: rehydrated", history.messages.length, "messages");
    })();

    return () => {
      cancelled = true;
    };
  }, [syncHistory]);

  // Keep the transcript live: an operator who takes over the conversation in
  // aichat cannot push anything to us, so we re-read it instead.
  useLiveHistory({
    poll: pollConfig,
    visitorId,
    isOpen: open,
    onMessages: syncHistory,
  });

  useEffect(() => {
    if (!embedded || typeof window === "undefined" || window.parent === window) {
      return;
    }
    const state = open ? "open" : showPeek ? "peek" : "fab";
    window.parent.postMessage({ source: "gal-trans-widget", type: "state", state }, "*");
  }, [embedded, open, showPeek]);

  async function handleSend(raw: string) {
    const text = raw.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: makeId(),
      sender: "user",
      text,
      createdAt: nowTs(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setIsTyping(true);

    try {
      const reply = await sendChat(text, locale, visitorIdRef.current);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          sender: "assistant",
          text: reply.text,
          trips: reply.trips,
          createdAt: nowTs(),
        },
      ]);
    } catch (err) {
      log.error(
        "chat: could not get a reply —",
        err instanceof Error ? err.message : String(err),
      );
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          sender: "assistant",
          text: t.error,
          createdAt: nowTs(),
          // The server never sends this one, so the live poll must not mistake
          // it for a stale optimistic bubble and drop it.
          local: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  const showQuick = messages.length <= 1 && !isTyping;

  return (
    <div
      className={
        embedded
          ? "fixed inset-0 z-[2147483000] flex flex-col items-end justify-end gap-3 p-3 font-sans"
          : "fixed bottom-5 right-5 z-[2147483000] flex flex-col items-end gap-3 font-sans"
      }
    >
      {open && (
        <section
          role="dialog"
          aria-label={t.name}
          className="flex h-[560px] max-h-[calc(100dvh-2.5rem)] w-[384px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          style={{ animation: "wgt-in .2s ease-out" }}
        >
          <header className="flex items-center gap-3 bg-brand px-4 py-3.5 text-brand-foreground">
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <BotIcon className="size-[22px]" />
              <span className="absolute -bottom-px -right-px size-3 rounded-full border-2 border-brand bg-success" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[15px] font-extrabold leading-tight">{t.name}</span>
              <span className="flex items-center gap-1.5 text-[11.5px] opacity-90">
                <span className="size-1.5 rounded-full bg-success" />
                {t.status}
              </span>
            </span>
            <span className="ml-auto flex gap-1">
              <button
                type="button"
                aria-label="Minimize"
                onClick={() => setOpen(false)}
                className="flex size-[30px] items-center justify-center rounded-md bg-white/15 transition-colors hover:bg-white/30"
              >
                <MinimizeIcon className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="flex size-[30px] items-center justify-center rounded-md bg-white/15 transition-colors hover:bg-white/30"
              >
                <CloseIcon className="size-4" />
              </button>
            </span>
          </header>

          <div className="wgt-scroll flex flex-1 flex-col gap-3.5 overflow-y-auto bg-card px-4 pb-2 pt-4.5">
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                // Resolved at render rather than rewritten in state: the
                // greeting text is derived from the active language, it is not
                // part of the conversation.
                message={m.id === WELCOME_ID ? { ...m, text: t.welcome } : m}
              />
            ))}
            {isTyping && <TypingRow />}
            <div ref={bottomRef} />
          </div>

          {showQuick && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-1 pt-2">
              {t.quick.map((label, i) => {
                const Icon = QUICK_ICONS[i] ?? SearchIcon;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSend(label)}
                    className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[12.5px] font-semibold text-foreground transition-colors hover:border-brand hover:bg-brand/10 hover:text-brand"
                  >
                    <Icon className="size-[13px]" />
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card px-3.5 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              className="h-[42px] flex-1 rounded-full border border-border bg-background px-4 text-[13.5px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/25"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim() || isTyping}
              className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-40"
            >
              <SendIcon className="size-[18px]" />
            </button>
          </form>

          {CHANNELS.length > 0 && (
            <div className="flex items-center gap-2.5 border-t border-border bg-muted px-4 py-2.5">
              <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                {t.social}
              </span>
              <span className="ml-auto flex gap-1.5">
                {CHANNELS.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-[30px] items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-brand hover:bg-brand/10 hover:text-brand"
                  >
                    <Icon className="size-[15px]" />
                  </a>
                ))}
              </span>
            </div>
          )}
        </section>
      )}

      {!open && showPeek && (
        <div
          className="relative max-w-[220px] rounded-2xl rounded-br-sm border border-border bg-card px-3.5 py-3 text-[13px] leading-snug text-foreground shadow-lg"
          style={{ animation: "wgt-in .25s ease-out" }}
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setShowPeek(false)}
            className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground"
          >
            <CloseIcon className="size-3" />
          </button>
          {t.peek}
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => {
          setOpen((v) => !v);
          setShowPeek(false);
        }}
        className="flex size-[60px] items-center justify-center rounded-full bg-brand text-brand-foreground shadow-xl transition-transform hover:-translate-y-0.5 hover:bg-brand-hover active:translate-y-0"
      >
        {open ? <CloseIcon className="size-6" /> : <ChatIcon className="size-[26px]" />}
      </button>
    </div>
  );
}
