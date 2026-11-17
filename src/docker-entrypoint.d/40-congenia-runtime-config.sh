#!/bin/sh
# Genera config.js con la configuración de arranque a partir de las variables de entorno del contenedor.
set -eu

CONFIG_FILE=/usr/share/nginx/html/config.js

API_BASE_URL="${API_BASE_URL:-}"

APP_ENV="${APP_ENV:-production}"
OIDC_AUTHORITY="${OIDC_AUTHORITY:-}"
OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-congenia-web}"
USE_FICHA_SEARCH_MOCK="${USE_FICHA_SEARCH_MOCK:-}"
USE_ADENDAS_MOCK="${USE_ADENDAS_MOCK:-}"
USE_CIE10_MOCK="${USE_CIE10_MOCK:-}"
ALLOW_DEV_SESSION="${ALLOW_DEV_SESSION:-false}"

escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$CONFIG_FILE" <<CONFIG
window.__CONGENIA_CONFIG__ = {
  API_BASE_URL: "$(escape "$API_BASE_URL")",
  OIDC_AUTHORITY: "$(escape "$OIDC_AUTHORITY")",
  OIDC_CLIENT_ID: "$(escape "$OIDC_CLIENT_ID")",
  APP_ENV: "$(escape "$APP_ENV")",
  USE_FICHA_SEARCH_MOCK: "$(escape "$USE_FICHA_SEARCH_MOCK")",
  USE_ADENDAS_MOCK: "$(escape "$USE_ADENDAS_MOCK")",
  USE_CIE10_MOCK: "$(escape "$USE_CIE10_MOCK")",
  ALLOW_DEV_SESSION: "$(escape "$ALLOW_DEV_SESSION")",
};
CONFIG

echo "[congenia] config.js generado — API_BASE_URL='${API_BASE_URL:-(mismo origen)}' APP_ENV='${APP_ENV}' USE_FICHA_SEARCH_MOCK='${USE_FICHA_SEARCH_MOCK:-auto}' USE_ADENDAS_MOCK='${USE_ADENDAS_MOCK:-auto}' USE_CIE10_MOCK='${USE_CIE10_MOCK:-auto}' ALLOW_DEV_SESSION='${ALLOW_DEV_SESSION}'"
