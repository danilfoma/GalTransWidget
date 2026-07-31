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

Build-time, in `.env.local` (see `.env.example`):

| Variable | Default | Meaning |
|---|---|---|
| `VITE_WIDGET_API_URL` | *(empty)* | Base URL for the widget's HTTP calls. Empty means relative paths. |
| `API_PROXY_TARGET` | *(empty)* | Dev-server proxy target for `/api/*`. No effect on the production build. |

`VITE_`-prefixed values are inlined into the browser bundle — never put a secret
in one.

Run-time, on the container — `WIDGET_FRAME_ANCESTORS` and `WIDGET_CHANNEL_*`, see
[Deployment](#deployment). They are read at start-up, so they change with a
restart and never touch the bundle. There is no local equivalent: in dev the
contact channels come from the checked-in `public/config.js`, which the
container regenerates on every start.

## Project layout

```
.
├── index.html              preview page entry
├── embed.html              iframe page entry
├── Dockerfile              production image (Vite build → nginx)
├── nginx.conf.template     static host config, rendered at container start
├── docker-entrypoint.d/
│   └── 10-widget-config.envsh  start-up: frame-ancestors + config.js
├── public/
│   ├── embed.js            the loader pasted on the host site
│   └── config.js           runtime config — dev defaults, regenerated in the image
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
    │   ├── config.ts       reads window.__WIDGET_CONFIG__ (contact channels)
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

## Deployment

The build output is plain static files, so any static host serves it. The
included `Dockerfile` builds the bundle and serves it with nginx:

```bash
docker build -t gal-trans-widget .
docker run --rm -p 8080:80 gal-trans-widget   # http://localhost:8080/embed.html
```

| Variable | When | Meaning |
|---|---|---|
| `WIDGET_FRAME_ANCESTORS` | runtime | Origins allowed to embed the widget. CSP source list, space- or comma-separated; trailing slashes tolerated; `WIDGET_ALLOWED_ORIGINS` accepted as an alias. Default `'self' https://gal-trans.md https://www.gal-trans.md`. `*` allows any site. |
| `WIDGET_CHANNEL_WHATSAPP` | runtime | Phone number, international format without `+` (`37360123456`). Unset hides the icon. |
| `WIDGET_CHANNEL_TELEGRAM` | runtime | Username without `@` (`GalTrans8`). |
| `WIDGET_CHANNEL_VIBER` | runtime | Phone number, international format without `+`. |
| `WIDGET_CHANNEL_FACEBOOK` | runtime | Messenger handle (`galtrans.md` → `m.me/galtrans.md`). |
| `VITE_WIDGET_API_URL` | build arg | Base URL for the widget's HTTP calls. Leave empty. |

Every `WIDGET_CHANNEL_*` value is a bare handle — the widget builds the link. To
override the link entirely, pass a full `https://…` value and it is used
verbatim: that is how you point Facebook at a page (`https://facebook.com/name`)
instead of Messenger. A channel with no value is not rendered at all, so a
half-configured deployment shows fewer icons rather than dead links.

Both are applied by `docker-entrypoint.d/10-widget-config.envsh` at container
start: it normalises the allow-list and writes `/config.js`. A restart is
enough — no rebuild. The effective values are printed in the container log, which
is the fastest way to confirm a variable actually arrived.

Two things decide whether a deployment works:

**The `/api/*` calls must reach the backend on the same origin.** The bundle
calls `POST /api/visit`, `GET /api/history` and `POST /api/chat` as relative
paths. Serving these files alone gives you a widget with no backend — route
`/api/*` on the widget's domain to the server that answers them. Pointing
`VITE_WIDGET_API_URL` at another origin instead means the calls become
cross-origin, which needs CORS on the server and defeats its same-origin abuse
protection.

**`frame-ancestors` is what stops other sites embedding the widget.** It is a
response header, so it is the host's job, not the bundle's — a static host with
no header configuration leaves the widget embeddable by anyone. The nginx config
here sets it from `WIDGET_FRAME_ANCESTORS`. Never add `X-Frame-Options`: it
cannot express an allow-list and `SAMEORIGIN` would block the embed outright.

Note that this is not a single-page app — two independent HTML entry points, no
client-side router. A static host must **not** be configured with the usual SPA
fallback (`try_files … /index.html`); an unknown path should return 404.

### On Dokploy

1. New Application → GitHub provider → this repository, branch `main`.
2. Build Type **Dockerfile**, path `Dockerfile`, context `.` — Port **80**.
3. Domain: the widget's hostname at path `/`, HTTPS + Let's Encrypt.
4. Add the backend as a second application on the **same domain** at path
   `/api` (no path stripping — it expects to receive `/api/...` intact).
5. Environment: `WIDGET_FRAME_ANCESTORS` listing the sites that embed the
   widget, plus any `WIDGET_CHANNEL_*` you want shown. Nothing else — no secret
   ever belongs in this image, and every `WIDGET_CHANNEL_*` value ends up
   readable in the browser anyway.

Step 5 has one trap of its own: this is a static nginx image, so it reads *only*
those variables. Server-side settings that belong to the backend application
(API keys and URLs, assistant ids, rate-limit knobs) do nothing here — pasting
them onto this app is harmless but misleading, and the frame-ancestors variable
hiding among them is easy to misspell. If the widget refuses to be framed, read
the container log first: it prints the allow-list it actually applied.

Step 2 is the one that bites. Dokploy's **Static** build type looks like the
right choice for a static site, but it ignores this `Dockerfile` and generates
its own four-line one — `FROM nginx:alpine`, `WORKDIR /usr/share/nginx/html/`,
`COPY nginx.conf /etc/nginx/nginx.conf`, `COPY . .` — which never runs `npm ci`
or `vite build`. The image then holds the *sources*, `dist/` never exists, and
the deploy answers **502 Bad Gateway** because the generated config listens on
80 while the application port is still Dokploy's default 3000. The build log
tells you which one ran: a correct build starts with
`FROM node:22-alpine AS builder` and shows two stages; the broken one
transfers a ~169 B dockerfile and reports four steps.

## Customization

| What | Where |
|---|---|
| Brand colors, radius, font | `src/styles.css` — the `:root` block |
| Copy and quick replies (ro / ru / en) | `LABELS` in `src/components/chat-widget.tsx` |
| Contact channel handles | `WIDGET_CHANNEL_*` on the deployment (dev: `public/config.js`) |
| Contact channel link templates | `buildChannels` in `src/components/chat-widget.tsx` |
| Iframe sizes | `SIZES` in `public/embed.js` |
| Mobile full-screen breakpoint | `MOBILE_BP` in `public/embed.js` |

Adding a language means adding an entry to `LABELS`, to `SUPPORTED_LOCALES` in
`src/lib/locale.ts`, and to `SUPPORTED` in `public/embed.js`.
