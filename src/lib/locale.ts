import type { WidgetLocale } from "@/types/chat";

export const SUPPORTED_LOCALES: readonly WidgetLocale[] = ["ro", "ru", "en"];
export const DEFAULT_LOCALE: WidgetLocale = "ro";

function normalize(raw: string | null | undefined): WidgetLocale | null {
  if (!raw) return null;
  const base = raw.toLowerCase().split("-")[0] as WidgetLocale;
  return SUPPORTED_LOCALES.includes(base) ? base : null;
}

export function resolveLocale(): WidgetLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const fromQuery = normalize(
    new URLSearchParams(window.location.search).get("lang"),
  );
  if (fromQuery) return fromQuery;

  const navLangs =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
  for (const candidate of navLangs) {
    const hit = normalize(candidate);
    if (hit) return hit;
  }

  return DEFAULT_LOCALE;
}
