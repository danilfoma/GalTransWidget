import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { ChatWidget } from "@/components/chat-widget";
import { resolveLocale, SUPPORTED_LOCALES } from "@/lib/locale";
import type { WidgetLocale } from "@/types/chat";
import "@/styles.css";

// The host page can change language after the widget has mounted: on a
// client-side-routed site, going from /en to /ro never reloads this iframe.
// embed.js re-resolves the language on every URL change and posts it here, so
// the widget follows along in place — reloading the iframe instead would close
// the panel and wipe the conversation off the screen mid-sentence.
//
// The sender's origin is deliberately not checked. Any page able to frame the
// widget has already been allowed through by the frame-ancestors CSP, and there
// is no single origin to compare against — the widget is embedded on other
// people's sites. The payload is what gets validated: an unknown value is
// ignored, so the worst a hostile parent can do is pick one of three languages.
function useHostLocale(): WidgetLocale {
  const [locale, setLocale] = useState<WidgetLocale>(resolveLocale);

  useEffect(() => {
    function onMessage(event: MessageEvent): void {
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null) return;

      const message = data as {
        source?: unknown;
        type?: unknown;
        lang?: unknown;
      };
      if (message.source !== "gal-trans-widget-host") return;
      if (message.type !== "lang" || typeof message.lang !== "string") return;
      if (!SUPPORTED_LOCALES.includes(message.lang as WidgetLocale)) return;

      setLocale(message.lang as WidgetLocale);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return locale;
}

function EmbeddedWidget() {
  const locale = useHostLocale();
  return <ChatWidget embedded locale={locale} />;
}

const root = document.getElementById("root");
if (!root) throw new Error("#root element is missing from embed.html");

createRoot(root).render(
  <StrictMode>
    <EmbeddedWidget />
  </StrictMode>,
);
