from fastapi import FastAPI
from pydantic import BaseModel


class OrderItem(BaseModel):
    sku: str
    qty: int
    unit_cents: int


class OrderPayload(BaseModel):
    order_id: str
    tenant_id: int
    metadata: str
    items: list[OrderItem]


app = FastAPI()


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/v1/ingest")
async def ingest_order(payload: OrderPayload):
    total_cents = sum(item.qty * item.unit_cents for item in payload.items)
    return {
        "status": "ACK_INGESTED",
        "order_id": payload.order_id,
        "tenant_id": payload.tenant_id,
        "item_count": len(payload.items),
        "total_cents": total_cents,
        "meta_bytes": len(payload.metadata),
    }
