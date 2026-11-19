FROM rust:1.85-slim-bookworm AS builder
WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/target/release/glastor-bench-rust /app/server
EXPOSE 8080
ENTRYPOINT ["/app/server"]
