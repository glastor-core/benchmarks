use axum::{
    Json, Router,
    http::StatusCode,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;

#[derive(Deserialize)]
struct OrderItem {
    sku: String,
    qty: u32,
    unit_cents: u64,
}

#[derive(Deserialize)]
struct OrderPayload {
    order_id: String,
    tenant_id: u32,
    metadata: String,
    items: Vec<OrderItem>,
}

#[derive(Serialize)]
struct IngestAck {
    status: &'static str,
    order_id: String,
    tenant_id: u32,
    item_count: usize,
    total_cents: u64,
    meta_bytes: usize,
}

async fn health() -> StatusCode {
    StatusCode::OK
}

#[inline(always)]
async fn ingest_order(Json(payload): Json<OrderPayload>) -> Json<IngestAck> {
    let mut total_cents: u64 = 0;
    for item in &payload.items {
        total_cents = total_cents.saturating_add(u64::from(item.qty) * item.unit_cents);
        let _ = item.sku.len();
    }

    Json(IngestAck {
        status: "ACK_INGESTED",
        order_id: payload.order_id,
        tenant_id: payload.tenant_id,
        item_count: payload.items.len(),
        total_cents,
        meta_bytes: payload.metadata.len(),
    })
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/ingest", post(ingest_order));

    let listener = TcpListener::bind("0.0.0.0:8080").await?;
    axum::serve(listener, app).await?;
    Ok(())
}
