#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/deployments/docker-compose.yml"

echo "Stopping local stack..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans "$@"
