#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Building API image..."
docker build -t enterprise-chat-api "$ROOT_DIR/apps/api"

echo "Building inference image..."
docker build -t enterprise-chat-inference "$ROOT_DIR/apps/inference"

echo "Building web image..."
docker build -t enterprise-chat-web "$ROOT_DIR/apps/web"

echo "Images built locally (enterprise-chat-{api,inference,web})."
