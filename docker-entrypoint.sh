#!/bin/sh
set -e

: "${AUTH_UPSTREAM:?AUTH_UPSTREAM is required}"
: "${AR_UPSTREAM:?AR_UPSTREAM is required}"
: "${DISPUTE_UPSTREAM:?DISPUTE_UPSTREAM is required}"

export AUTH_HOST="${AUTH_HOST:-$(echo "$AUTH_UPSTREAM" | sed -E 's#https?://##; s#/.*##')}"
export AR_HOST="${AR_HOST:-$(echo "$AR_UPSTREAM" | sed -E 's#https?://##; s#/.*##')}"
export DISPUTE_HOST="${DISPUTE_HOST:-$(echo "$DISPUTE_UPSTREAM" | sed -E 's#https?://##; s#/.*##')}"

envsubst '${AUTH_UPSTREAM} ${AR_UPSTREAM} ${DISPUTE_UPSTREAM} ${AUTH_HOST} ${AR_HOST} ${DISPUTE_HOST}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
