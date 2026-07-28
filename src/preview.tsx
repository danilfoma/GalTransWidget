import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ChatWidget } from "@/components/chat-widget";
import { resolveLocale } from "@/lib/locale";
import "@/styles.css";

function PreviewBackdrop() {
  return (
    <div aria-hidden className="select-none">
      <div className="h-1.5 bg-dark-section" />
      <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-6">
        <span className="flex items-baseline gap-1">
          <span className="font-serif text-2xl font-extrabold italic text-brand [transform:skew(-6deg)]">
            GAL
          </span>
          <span className="text-[11px] font-extrabold tracking-[0.15em] text-primary">
            TRANS
          </span>
        </span>
        <nav className="ml-auto hidden gap-5 text-[13px] font-semibold text-primary/70 sm:flex">
          <span className="text-primary">Timetable</span>
          <span>Contacts</span>
          <span>Blog</span>
          <span className="text-primary">My tickets</span>
          <span>Cart</span>
          <span>EN</span>
        </nav>
      </header>

      <section className="relative flex flex-col justify-center gap-4 bg-brand px-8 py-14 text-brand-foreground">
        <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-75">
          Gal Trans · since 1998
        </p>
        <h1 className="max-w-md text-3xl font-extrabold leading-tight md:text-4xl">
          Buy bus tickets online
        </h1>
        <div className="flex max-w-xl items-center gap-3 rounded-full bg-card p-1.5 pl-5 shadow-lg">
          <span className="text-sm font-semibold text-primary">Chișinău</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-sm font-semibold text-primary">Bucharest</span>
          <span className="ml-auto flex h-10 items-center rounded-full bg-brand px-5 text-sm font-bold text-brand-foreground">
            Search
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 p-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-lg border border-border bg-card shadow-sm"
          />
        ))}
      </section>
    </div>
  );
}

function Preview() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <PreviewBackdrop />
      <ChatWidget locale={resolveLocale()} />
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("#root element is missing from index.html");

createRoot(root).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
