# SCALABILITY.md — TradeDesk Technical Scalability Notes

This document outlines the architectural properties that make TradeDesk horizontally scalable and production-ready without re-engineering the core codebase.

---

## 1. Horizontal Scaling — Serverless by Default

TradeDesk's API runs on Cloudflare Workers, which auto-scale across **300+ edge locations globally** with no ops overhead. Each Worker invocation is isolated, stateless, and spawns in under 5ms with zero cold starts. There is no concept of "scaling up" because Cloudflare handles concurrency allocation automatically at the network edge — traffic spikes during market open or flash crashes are absorbed transparently.

D1, Cloudflare's native SQLite database, is built for edge reads. For read-heavy workloads, D1 supports **read replicas at the edge**, meaning each Worker can query a geographically close replica rather than a central database. Writes are still serialized through the primary, but the vast majority of TradeDesk's read/write ratio (order queries vs. inserts) makes this topology ideal.

---

## 2. Caching Strategy

The current architecture uses **Cloudflare KV** for two stateful concerns:

- **JWT blacklisting**: When a user logs out, their token's `jti` is stored in KV with a TTL equal to the remaining token lifetime. Every authenticated request checks this KV entry. KV is globally replicated with millisecond read latency.
- **Rate limiting**: Sliding window counters keyed by IP and user ID. Each counter expires automatically via KV's native TTL.

For future performance at scale, a natural extension is **per-user response caching** for the `GET /orders` endpoint:

```
Key: cache:orders:<userId>:<statusFilter>
TTL: 30 seconds
Invalidation: explicit delete on POST /orders or PATCH /orders/:id
```

This eliminates D1 queries for the most common read path during normal trading activity, with the cache coherence guarantee that any mutation immediately invalidates the relevant key.

---

## 3. Microservices Path

The current monolithic Worker is cleanly separated by responsibility (`auth`, `orders`, `admin`) and can split into independent Workers with zero code changes beyond route mounting:

- **`auth-worker`**: Handles register/login/logout, owns user credential management
- **`orders-worker`**: Owns order CRUD and state machine transitions
- **`notifications-worker`**: Consumes audit log writes via Cloudflare Queues, sends webhooks or email on status changes

Each Worker can have its own isolated D1 binding (auth data vs. order data in separate databases), improving blast radius isolation and allowing independent deployment cycles.

For stateful coordination — e.g., preventing duplicate order submissions during network retries — **Cloudflare Durable Objects** provide strongly consistent, single-threaded execution co-located with the edge. An order deduplication Durable Object keyed by `userId + idempotency-key` can guarantee exactly-once semantics without database-level locking.

---

## 4. Load Balancing

Cloudflare's **anycast routing** automatically directs each incoming request to the nearest available edge node. There is no load balancer to configure, no health checks to manage, and no instance groups to autoscale. The network itself is the load balancer, operating at Layer 3. For TradeDesk, this means a user in Singapore and a user in Frankfurt both experience sub-50ms API latency independently, without any additional infrastructure.

---

## 5. Database Scaling

At current scale, D1 is ideal. When write throughput exceeds D1's limits (approximately 100k writes/day on the free tier, unlimited on paid), the migration path is:

1. **Hyperdrive + Neon (serverless Postgres)**: Hyperdrive is Cloudflare's connection pooler that sits between Workers and any external Postgres database. It maintains persistent connection pools at the edge, eliminating per-request connection overhead. Neon provides serverless Postgres with auto-scaling compute. The application code requires **zero changes** — the same `.prepare().bind()` SQL interface works identically.

2. **Read scaling**: Neon supports read replicas natively. Hyperdrive can be configured to route `SELECT` queries to replicas and `INSERT/UPDATE/DELETE` to the primary, providing linear read scalability.

---

## 6. Observability

For production monitoring, TradeDesk can be instrumented with:

- **Cloudflare Workers Logpush**: Streams structured Worker invocation logs to R2 (object storage), Datadog, or any HTTP endpoint in real time. Captures request duration, status codes, CPU time, and custom `console.log()` output.
- **Tail Workers**: A secondary Worker that receives every HTTP event and error from the primary Worker in real time, enabling custom alerting logic (e.g., page on-call if 5xx rate exceeds 1% for 60 seconds).
- **Sentry**: The Sentry SDK works inside Workers (via `@sentry/cloudflare`). Attach it to the Hono `onError` handler to capture stack traces, request context, and user ID for every unhandled exception.
- **Analytics Engine**: Cloudflare's time-series data store for custom business metrics (orders per minute, active users per edge region) without egress costs.

These capabilities provide full observability from request ingress to database query without running any additional infrastructure.
