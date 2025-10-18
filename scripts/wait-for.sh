#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <url|host:port> [timeout]" >&2
  exit 1
fi

TARGET="$1"
TIMEOUT="${2:-60}"
START="$(date +%s)"

echo "Waiting for $TARGET (timeout ${TIMEOUT}s)..."

is_ready_http() {
  curl -fsSo /dev/null --max-time 2 "$1" >/dev/null 2>&1
}

is_ready_tcp() {
  local host="${1%:*}"
  local port="${1#*:}"
  nc -z "$host" "$port" >/dev/null 2>&1
}

while true; do
  if [[ "$TARGET" == http*://* ]]; then
    if is_ready_http "$TARGET"; then
      echo "Ready: $TARGET"
      exit 0
    fi
  else
    if is_ready_tcp "$TARGET"; then
      echo "Ready: $TARGET"
      exit 0
    fi
  fi

  NOW="$(date +%s)"
  ELAPSED=$((NOW - START))
  if (( ELAPSED >= TIMEOUT )); then
    echo "Timed out after ${TIMEOUT}s waiting for $TARGET" >&2
    exit 1
  fi
  sleep 2
done
