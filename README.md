# Gal Trans chat widget

A React app that renders a floating chat launcher and panel, plus a small loader
script that embeds it into a website through an iframe.

## Stack

| | |
|---|---|
| Framework | React 19 |
| Build tool | Vite 7 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Runtime deps | `react`, `react-dom` |

## Getting started

```bash
npm install
npm run dev          # http://localhost:4310
```

Two pages are served:

| URL | What it is |
|---|---|
| `/` | Preview — the widget over a placeholder page background. Development only. |
| `/embed.html` | The widget alone on a transparent background. This is the page the iframe loads. |

Add `?lang=ro`, `?lang=ru` or `?lang=en` to either URL to force a language.

```bash
npm run build        # type-checks, then builds to dist/
npm run preview      # serve the production build locally
npm run check-types  # tsc --noEmit
```

## Configuration

Build-time only, in `.env.local` (see `.env.example`):

| Variable | Default | Meaning |
|---|---|---|
| `VITE_WIDGET_API_URL` | *(empty)* | Base URL for the widget's HTTP calls. Empty means relative paths. |
| `API_PROXY_TARGET` | *(empty)* | Dev-server proxy target for `/api/*`. No effect on the production build. |

`VITE_`-prefixed values are inlined into the browser bundle — never put a secret
in one.

## Project layout

```
.
├── index.html              preview page entry
├── embed.html              iframe page entry
├── public/
│   └── embed.js            the loader pasted on the host site
└── src/
    ├── preview.tsx         mounts the widget over the placeholder background
    ├── embed.tsx           mounts the widget alone, transparent
    ├── styles.css          Tailwind + brand tokens (colors, radius, font)
    ├── components/
    │   ├── chat-widget.tsx     launcher, panel, composer, quick replies, labels
    │   ├── chat-messages.tsx   message bubbles, trip result card, typing indicator
    │   └── icons.tsx           inline SVG icons
    ├── lib/
    │   ├── api.ts          the HTTP calls — the only networking in the app
    │   ├── locale.ts       language resolution (?lang → navigator → default)
    │   ├── visitor.ts      stable per-browser id, kept in localStorage
    │   └── log.ts          prefixed console logger
    └── types/chat.ts       request/response types
```

## Embedding on a website

Build the app, host `dist/` on a domain, then add a single line to the host site:

```html
<script src="https://<widget-domain>/embed.js" async></script>
```

That is the entire integration. Optionally force a language:

```html
<script src="https://<widget-domain>/embed.js" data-lang="ru" async></script>
```

`public/embed.js` is the only code that runs on the host page. It appends one
transparent `<iframe>` pointing at `<origin>/embed.html`, fixed to the
bottom-right corner, and resizes it on `postMessage` from that iframe (verified
by `event.origin`): 96×96 launcher only, 320×220 teaser, 416×700 panel open,
full-screen below a 480px viewport.

## Customization

| What | Where |
|---|---|
| Brand colors, radius, font | `src/styles.css` — the `:root` block |
| Copy and quick replies (ro / ru / en) | `LABELS` in `src/components/chat-widget.tsx` |
| Contact channel links | `CHANNELS` in `src/components/chat-widget.tsx` |
| Iframe sizes | `SIZES` in `public/embed.js` |
| Mobile full-screen breakpoint | `MOBILE_BP` in `public/embed.js` |

Adding a language means adding an entry to `LABELS`, to `SUPPORTED_LOCALES` in
`src/lib/locale.ts`, and to `SUPPORTED` in `public/embed.js`.
