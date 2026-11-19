import Fastify from 'fastify';

const app = Fastify({ logger: false });

app.get('/health', async (_req, reply) => {
  return reply.code(200).send();
});

app.post('/api/v1/ingest', async (req) => {
  const payload = req.body;
  let totalCents = 0;
  for (const item of payload.items) {
    totalCents += item.qty * item.unit_cents;
  }

  return {
    status: 'ACK_INGESTED',
    order_id: payload.order_id,
    tenant_id: payload.tenant_id,
    item_count: payload.items.length,
    total_cents: totalCents,
    meta_bytes: payload.metadata.length,
  };
});

await app.listen({ host: '0.0.0.0', port: 8080 });
