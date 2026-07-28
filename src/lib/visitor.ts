const VISITOR_KEY = "gt-widget-visitor";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = makeId();
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return makeId();
  }
}
