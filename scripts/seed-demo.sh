#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"

echo "Seeding demo users at ${BASE_URL}/auth/seed..."
curl -fsSL -X POST "${BASE_URL}/auth/seed" -H "Content-Type: application/json" || {
  echo "Failed to seed demo users" >&2
  exit 1
}
echo
echo "Demo users created."
echo "- alice@company.com / pass1234  (sales)"
echo "- bob@company.com / pass1234    (engineering)"
echo "- admin@company.com / superadmin123  (admin, all)"
