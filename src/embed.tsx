import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ChatWidget } from "@/components/chat-widget";
import { resolveLocale } from "@/lib/locale";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root element is missing from embed.html");

createRoot(root).render(
  <StrictMode>
    <ChatWidget embedded locale={resolveLocale()} />
  </StrictMode>,
);
