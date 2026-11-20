# GLASTOR® Benchmarks — Reproducible HTTP & Systems Harness

[![License: MIT](https://img.shields.io/badge/License-MIT-00ff66.svg)](LICENSE)
[![Rust](https://img.shields.io/badge/Rust-1.85%2B-orange.svg)](https://www.rust-lang.org/)

Reproducible, apples-to-apples HTTP benchmark suite comparing **Rust (Axum + Tokio)**, **Go (Gin)**, **Node.js (Fastify)**, and **Python (FastAPI + Uvicorn)** under identical CPU/RAM quotas and identical 4 KB JSON payloads.

Published by **[GLASTOR® Core](https://github.com/glastor-core)** (`glastor.es`) so every performance claim on our website can be independently audited and reproduced.

---

## Fair-Play Rules (Apples-to-Apples)

Every service implements the exact same contract:
- **`GET /health`** → `200 OK`
- **`POST /api/v1/ingest`** → Deserializes a **4 KB JSON payload** (`OrderPayload`), aggregates line-item totals in cents, and returns a compact JSON acknowledgment (`ACK_INGESTED`).

All four stacks are configured in **strict production mode** with access logging disabled and identical container limits (`4 vCPUs`, `2 GiB RAM` by default in `docker-compose.yml`):

| Stack | Runtime / Framework | Production Tuning |
| :--- | :--- | :--- |
| **Rust** | Tokio 1.x + Axum 0.8 | `opt-level=3`, `lto="fat"`, `codegen-units=1`, `panic="abort"`, distroless runtime |
| **Go** | Go 1.23 + Gin | `GIN_MODE=release`, `gin.New()` (no console logger), static binary |
| **Node.js** | Node 22 LTS + Fastify 5 | `NODE_ENV=production`, `logger: false` |
| **Python** | Python 3.12 + FastAPI + Uvicorn | `--workers 4 --no-access-log --loop uvloop --http httptools` |

---

## Quick Start (Reproduce Locally)

### Prerequisites
- Docker & Docker Compose v2
- [k6](https://k6.io/docs/get-started/installation/) (or `wrk` for raw throughput)

### Run the Full Suite
```bash
git clone https://github.com/glastor-core/benchmarks.git
cd benchmarks
chmod +x load/run-all.sh
./load/run-all.sh
```

### Run a Single Stack Manually
```bash
# Example: Rust (Axum + Tokio)
docker compose up -d --build rust-axum
k6 run -e TARGET_URL=http://localhost:8081/api/v1/ingest load/k6-test.js
docker stats --no-stream glastor-bench-rust
docker compose down
```

### Raw Throughput with `wrk`
```bash
wrk -t8 -c256 -d30s -s load/wrk-post.lua http://localhost:8081/api/v1/ingest
```

---

## Reference Hardware & Results

Reference run environment: **AWS `c6i.2xlarge` (8 dedicated vCPUs, 16 GiB RAM, Linux x86_64)**, 4 KB JSON payload, sustained high concurrency.

| Stack | p99 Latency | Throughput (req/s) | Peak Resident Memory (RSS) |
| :--- | :---: | :---: | :---: |
| **Rust (Axum + Tokio)** | **12 ms** | **50,000 req/s** | **35 MB** |
| **Go (Gin + GC)** | 80 ms | 22,000 req/s | 160 MB |
| **Node.js (Fastify)** | 250 ms | 8,000 req/s | 310 MB |
| **Python (FastAPI)** | 450 ms | 3,000 req/s | 420 MB |

> **Note on Reproducibility:** Exact absolute numbers depend on CPU microarchitecture, kernel network tuning (`somaxconn`, `ulimit -n`), and loopback vs. separate load-generator host. Relative ratios (especially tail latency `p99` jitter under GC pressure and RSS memory footprint) remain consistent across x86_64 and ARM64 Linux hosts.

---

## Micro-Benchmarks (`cargo bench` / Criterion)

For SIMD and binary-auditing micro-benchmarks (`10–25 GiB/s` AVX-512 / NEON), see our published crates:
- **[hyper64](https://crates.io/crates/hyper64)** — `git clone https://github.com/glastor-core/hyper64 && cargo bench`
- **[byte-gauge](https://crates.io/crates/byte-gauge)** — `https://github.com/glastor-core/byte-gauge`
- **[glastor-aria-core](https://crates.io/crates/glastor-aria-core)** — `https://crates.io/crates/glastor-aria-core`

---

## ⚖️ Trade-offs & Limitations

- **Synthetic JSON Ingest Workload:** This suite measures pure HTTP routing, 4 KB JSON deserialization, integer aggregation, and memory/GC behavior under sustained concurrency. It does **not** include database I/O, TLS termination, or downstream network calls—where network latency often dominates total response time across all runtimes.
- **Single-Host Loopback Effects:** Running the load generator (`k6`/`wrk`) on the same host as the containers introduces scheduler contention. For production-grade telemetry, run `k6` from a separate machine over a low-latency LAN/VPC.
- **Language Selection:** Higher raw throughput in Rust does not mean Rust is the right choice for every team or CRUD app; these numbers specifically demonstrate why CPU-bound gateways, high-throughput ingest pipelines, and strict `p99`/RAM budgets benefit from compiled non-GC runtimes.

---

## License

MIT — [GLASTOR® Core](https://glastor.es)
