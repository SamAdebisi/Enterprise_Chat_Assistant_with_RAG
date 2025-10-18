#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/deployments/docker-compose.yml"

echo "Bringing up local stack..."
docker compose -f "$COMPOSE_FILE" up --build -d "$@"

echo "Services starting. Run 'scripts/wait-for.sh http://localhost:8080/health' to check readiness."
