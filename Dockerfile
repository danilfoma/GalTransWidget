# ---------------------------------------------------------------------------
# Gal Trans widget — production image.
#
#   docker build -t gal-trans-widget .
#   docker run --rm -p 8080:80 gal-trans-widget
#
# Stage 1 builds the static bundle with Vite, stage 2 serves dist/ with nginx.
# Nothing from the build stage survives except dist/ — no Node, no sources.
#
# In Dokploy: Build Type = Dockerfile, Dockerfile Path = Dockerfile,
#   Port = 80, Domain = chat.gal-trans.md at path "/".
#
#   Runtime env (takes effect on restart, no rebuild):
#     WIDGET_FRAME_ANCESTORS   which sites may embed the widget in an <iframe>.
#                              CSP source list, space- OR comma-separated;
#                              trailing slashes are tolerated and
#                              WIDGET_ALLOWED_ORIGINS is accepted as an alias.
#                              Default: 'self' + the Gal Trans domains.
#     WIDGET_CHANNEL_WHATSAPP  Contact handles shown in the widget footer. A bare
#     WIDGET_CHANNEL_TELEGRAM  handle/number builds the standard link; a full
#     WIDGET_CHANNEL_VIBER     https:// value is used verbatim. Unset = that
#     WIDGET_CHANNEL_FACEBOOK  channel is hidden.
#
#   Build arg (needs a rebuild — Vite inlines it into the browser bundle):
#     VITE_WIDGET_API_URL      leave EMPTY so the widget's /api/* calls stay
#                              relative, i.e. same-origin. See README.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Empty by default. Relative /api/* calls are what keep the server's
# same-origin abuse guard valid and avoid CORS entirely; point this elsewhere
# only if the API genuinely lives on another origin.
ARG VITE_WIDGET_API_URL=""
ENV VITE_WIDGET_API_URL=${VITE_WIDGET_API_URL}

# Type-checks, then builds (see the "build" script).
RUN npm run build

FROM nginx:1.27-alpine AS runner

# Rendered by the image's entrypoint at container start. The filter keeps
# envsubst away from nginx's own $uri/$host variables.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER="WIDGET_"

# Sourced by nginx's entrypoint just before the envsubst step: it normalises the
# embed allow-list (and holds its default), and renders /config.js from the
# WIDGET_CHANNEL_* variables. The allow-list default deliberately lives in the
# script, not in an ENV here — an ENV default would be indistinguishable from a
# real value and would shadow the WIDGET_ALLOWED_ORIGINS alias. The executable
# bit is required: nginx's entrypoint skips files it cannot execute.
COPY docker-entrypoint.d/10-widget-config.envsh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/10-widget-config.envsh

# Drop nginx's own placeholder pages, then drop in the build.
RUN rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q -O /dev/null http://127.0.0.1/embed.html || exit 1
