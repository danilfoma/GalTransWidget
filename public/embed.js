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

  function resolveLang() {
    var explicit = normalizeLang(script.getAttribute("data-lang"));
    if (explicit) return explicit;

    var docEl = document.documentElement;
    var htmlLang = normalizeLang(docEl && docEl.getAttribute("lang"));
    if (htmlLang) return htmlLang;

    var navLangs =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language];
    for (var i = 0; i < navLangs.length; i++) {
      var n = normalizeLang(navLangs[i]);
      if (n) return n;
    }

    return DEFAULT_LANG;
  }

  var lang = resolveLang();

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

  function mount() {
    document.body.appendChild(iframe);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
