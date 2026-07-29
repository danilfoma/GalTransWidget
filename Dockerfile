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
#     WIDGET_FRAME_ANCESTORS   which sites may embed the widget in an <iframe>
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

# Default embed allow-list; override per deployment without rebuilding.
ENV WIDGET_FRAME_ANCESTORS="'self' https://gal-trans.md https://www.gal-trans.md"

# Drop nginx's own placeholder pages, then drop in the build.
RUN rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q -O /dev/null http://127.0.0.1/embed.html || exit 1
