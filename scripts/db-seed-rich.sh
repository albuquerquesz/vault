#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_ENV="$ROOT_DIR/apps/api/.env"

if [[ ! -f "$API_ENV" ]]; then
	cp "$ROOT_DIR/apps/api/.env.example" "$API_ENV"
	printf 'Created apps/api/.env from .env.example.\n'
fi

cd "$ROOT_DIR"
docker compose up -d --wait postgres
bun run --cwd apps/api db:migrate
docker compose exec -T postgres sh -c 'exec psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$ROOT_DIR/apps/api/src/db/seed-rich.sql"
