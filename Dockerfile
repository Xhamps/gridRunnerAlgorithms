# Static site, no build step: nginx serves the pages and assets as they are.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY *.html /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
