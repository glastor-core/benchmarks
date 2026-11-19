#!/usr/bin/env bash
set -euo pipefail

STACKS=(
  "rust-axum:8081:glastor-bench-rust"
  "go-gin:8082:glastor-bench-go"
  "node-fastify:8083:glastor-bench-node"
  "python-fastapi:8084:glastor-bench-python"
)

mkdir -p results

for entry in "${STACKS[@]}"; do
  IFS=":" read -r service port container <<< "$entry"
  echo "============================================================"
  echo ">>> Benchmarking $service (http://localhost:$port)"
  echo "============================================================"

  docker compose up -d --build "$service"

  # Wait until /health returns 200
  for _ in $(seq 1 30); do
    if curl -sf "http://localhost:$port/health" > /dev/null; then
      break
    fi
    sleep 0.5
  done

  k6 run \
    -e "TARGET_URL=http://localhost:$port/api/v1/ingest" \
    --summary-export="results/${service}.json" \
    load/k6-test.js

  echo ">>> Peak Container Stats ($container):"
  docker stats --no-stream "$container"

  docker compose stop "$service"
  docker compose rm -f "$service"
done

echo "All benchmarks completed. JSON summaries saved in ./results/"
