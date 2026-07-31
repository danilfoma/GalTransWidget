/**
 * Runtime widget configuration — contact channel handles.
 *
 * This checked-in copy holds the LOCAL DEV defaults only. In the production
 * image the file is REGENERATED at container start from the WIDGET_CHANNEL_*
 * environment variables (see `docker-entrypoint.d/10-widget-config.envsh`), so
 * a deployment changes its contact links with a restart — no rebuild, no handle
 * baked into the bundle.
 *
 * It is a classic (non-module) script loaded from the page <head>, so it always
 * runs before the deferred bundle reads it via `getRuntimeConfig()`.
 *
 * Every value is a bare handle, not a URL — the widget builds the link
 * (wa.me / t.me / viber / m.me). A full `https://…` value is used verbatim
 * instead, which is how you point Facebook at a page rather than Messenger.
 * An empty value hides that channel.
 */
window.__WIDGET_CONFIG__ = {
  whatsapp: "",
  telegram: "",
  viber: "",
  facebook: "",
};
