(function () {
  "use strict";

  if (window.__galTransWidgetLoaded) return;
  window.__galTransWidgetLoaded = true;

  var script =
    document.currentScript ||
    document.querySelector('script[src*="embed.js"]');
  if (!script) return;

  var origin = new URL(script.src, window.location.href).origin;

  var SUPPORTED = ["ro", "ru", "en"];
  var DEFAULT_LANG = "ro";

  function normalizeLang(raw) {
    if (!raw) return null;
    var base = String(raw).toLowerCase().split("-")[0];
    return SUPPORTED.indexOf(base) !== -1 ? base : null;
  }

  // First URL path segment: /en, /ro/schedule, /en-US/… — how a localized site
  // is routed, and the one signal that stays correct across a client-side
  // navigation. A segment that is not a locale ("/schedule") normalizes to null.
  function langFromPath() {
    return normalizeLang(window.location.pathname.split("/")[1]);
  }

  function langFromNavigator() {
    var navLangs =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language];
    for (var i = 0; i < navLangs.length; i++) {
      var n = normalizeLang(navLangs[i]);
      if (n) return n;
    }
    return null;
  }

  // Priority: data-lang (the site saying it outright) → URL path → <html lang>
  // → browser languages → default.
  function resolveLang() {
    var docEl = document.documentElement;
    return (
      normalizeLang(script.getAttribute("data-lang")) ||
      langFromPath() ||
      normalizeLang(docEl && docEl.getAttribute("lang")) ||
      langFromNavigator() ||
      DEFAULT_LANG
    );
  }

  var lang = resolveLang();
  var lastPathLang = langFromPath();

  var SIZES = {
    fab: { w: 96, h: 96 },
    peek: { w: 320, h: 220 },
    open: { w: 416, h: 700 },
  };
  var MOBILE_BP = 480;

  var iframe = document.createElement("iframe");
  iframe.src =
    origin + "/embed.html" + (lang ? "?lang=" + encodeURIComponent(lang) : "");
  iframe.title = "Gal Trans assistant";
  iframe.setAttribute("aria-label", "Gal Trans assistant");
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("scrolling", "no");

  var style = {
    position: "fixed",
    bottom: "0",
    right: "0",
    width: SIZES.peek.w + "px",
    height: SIZES.peek.h + "px",
    maxWidth: "100vw",
    maxHeight: "100dvh",
    border: "0",
    background: "transparent",
    colorScheme: "light",
    zIndex: "2147483000",
    transition: "width .25s ease, height .25s ease",
  };
  for (var k in style) iframe.style[k] = style[k];

  var currentState = "peek";

  function isMobile() {
    return window.innerWidth < MOBILE_BP;
  }

  function apply(state) {
    currentState = state;
    if (state === "open" && isMobile()) {
      iframe.style.width = "100vw";
      iframe.style.height = "100dvh";
      return;
    }
    var s = SIZES[state] || SIZES.fab;
    iframe.style.width = Math.min(s.w, window.innerWidth) + "px";
    iframe.style.height = Math.min(s.h, window.innerHeight) + "px";
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data;
    if (!data || data.source !== "gal-trans-widget") return;
    if (data.type === "state" && data.state) apply(data.state);
  });

  window.addEventListener("resize", function () {
    apply(currentState);
  });

  // ── Language, kept in sync after load ─────────────────────────────────────
  // A localized site switches language by navigating (/en → /ro). On a
  // client-side-routed site that navigation never reloads this iframe, so
  // without the code below the widget would stay on the language it was created
  // with. Pushing the new language over postMessage instead of resetting
  // iframe.src keeps the open panel and the visible conversation intact.
  var iframeReady = false;

  function sendLang() {
    if (!iframeReady || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      { source: "gal-trans-widget-host", type: "lang", lang: lang },
      origin,
    );
  }

  function syncLang() {
    var pathLang = langFromPath();
    // Moving to a *different* localized route is the site changing language on
    // purpose, so it outranks a data-lang that was set once at load time and may
    // never be updated afterwards. Otherwise the normal priority order applies.
    var next = pathLang && pathLang !== lastPathLang ? pathLang : resolveLang();
    lastPathLang = pathLang;
    if (next === lang) return;
    lang = next;
    sendLang();
  }

  iframe.addEventListener("load", function () {
    iframeReady = true;
    // The iframe resolves its own language from ?lang= on first load, so this
    // only matters when the URL changed while it was still loading.
    sendLang();
  });

  // popstate covers back/forward. pushState/replaceState fire no event of their
  // own, so they are wrapped — call through first, keep the original return
  // value, leave the host's router otherwise untouched.
  window.addEventListener("popstate", syncLang);
  ["pushState", "replaceState"].forEach(function (name) {
    var original = history[name];
    if (typeof original !== "function") return;
    history[name] = function () {
      var result = original.apply(this, arguments);
      syncLang();
      return result;
    };
  });

  // Some sites flip data-lang instead of navigating.
  if (window.MutationObserver) {
    new MutationObserver(syncLang).observe(script, {
      attributes: true,
      attributeFilter: ["data-lang"],
    });
  }

  function mount() {
    document.body.appendChild(iframe);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
