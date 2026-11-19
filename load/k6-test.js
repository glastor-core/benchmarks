import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 }, // Warm-up
    { duration: '30s', target: 300 }, // Sustained load
    { duration: '10s', target: 0 },   // Cool-down
  ],
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
};

// Deterministic ~4 KB JSON payload
const ITEMS = Array.from({ length: 24 }, (_, idx) => ({
  sku: `GLASTOR-SKU-${String(idx).padStart(4, '0')}`,
  qty: (idx % 5) + 1,
  unit_cents: 1250 + idx * 100,
}));

const PAYLOAD = JSON.stringify({
  order_id: 'ord_01JGLASTORBENCHMARK4KB0001',
  tenant_id: 42,
  metadata: 'x'.repeat(2400),
  items: ITEMS,
});

const PARAMS = {
  headers: {
    'Content-Type': 'application/json',
  },
};

const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:8081/api/v1/ingest';

export default function () {
  const res = http.post(TARGET_URL, PAYLOAD, PARAMS);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
