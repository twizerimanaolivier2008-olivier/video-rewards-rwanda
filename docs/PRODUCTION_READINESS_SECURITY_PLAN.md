# Production Readiness and Security Remediation Plan

Repository: Video Rewards Rwanda  
Review date: 2026-11-26  
Review scope: source-level review of the current `main` branch. This is not a penetration test or a production deployment certification.

## Executive summary

The application is a React/Vite frontend with an Express API and MySQL database. It supports user accounts, video rewards, referrals, MTN MoMo/Airtel Money flows, withdrawals, and administration.

Do not process real customer funds or expose this build as a production financial service until the critical findings below are fixed and tested. In particular, payment verification currently trusts a client-supplied status, withdrawal balance checks are not atomic, and video reward eligibility trusts a client-supplied watch duration.

## Critical findings observed in source

### P0 — Payment verification trusts client input

File: `backend/src/controllers/paymentController.js`

The MoMo and Airtel verification handlers accept `status` from `req.body`; when it equals `SUCCESSFUL`, the handler completes a pending transaction and upgrades the account. The submitted `reference` is not used to look up and independently verify the provider transaction.

**Required remediation**
- Never accept a client-provided payment status as proof of payment.
- Verify the transaction server-to-server with the payment provider, or validate a provider-signed webhook using the provider's documented signature and replay-protection scheme.
- Match immutable merchant reference, provider transaction ID, currency, amount, payer, and expected user/order.
- Enforce unique constraints on provider references and idempotent state transitions.
- Treat unknown, late, duplicated, mismatched, and out-of-order callbacks safely.
- Keep payment secrets in a secret manager/environment, never in Git or frontend bundles.

### P0 — Withdrawal race / double-spend risk

File: `backend/src/controllers/paymentController.js`

The withdrawal handler reads a user's balance, compares it with the requested amount, then creates a withdrawal and transaction in separate operations. Concurrent requests can pass the same balance check. No atomic debit/reservation is shown in this handler.

**Required remediation**
- Use a single database transaction with row locking or a conditional atomic update.
- Reserve funds when a withdrawal is accepted; release the reservation only on a verified failure/cancellation.
- Use integer minor units (RWF whole francs where appropriate) or rigorously defined decimal arithmetic; never use JavaScript floating-point arithmetic for money.
- Add unique idempotency keys and unique provider payout references.
- Enforce legal state transitions and maker-checker approval for high-risk payouts.
- Reconcile payout status with the provider before marking it paid.

### P0 — Video rewards can be forged

File: `backend/src/controllers/videoController.js`

The watch endpoint calculates completion from `req.body.watch_duration` and grants rewards when that client-supplied number reaches 90% of the video duration. A caller can submit an inflated duration without actually watching the video.

**Required remediation**
- Do not treat browser-reported watch duration as proof.
- Issue short-lived server-created watch sessions and validate playback progress using signed session identifiers, periodic server-side checkpoints, plausible elapsed time, playback rate and seek limits.
- Apply per-user, per-video, per-device and campaign caps, plus anomaly detection.
- Make reward issuance idempotent and transactional with the ledger and unique watch entitlement.
- Recognize that browser telemetry can be manipulated; combine it with fraud controls and advertiser-side measurement.

### P0 — Weak JWT configuration and session lifecycle

Files: `backend/src/controllers/authController.js`, `backend/src/middleware/auth.js`

The controller falls back to `your-secret-key`. Login and registration issue seven-day JWTs. There is no refresh-token rotation or revocation mechanism visible in the reviewed files. The auth middleware loads `SELECT *` from the user row.

**Required remediation**
- Fail startup if required secrets are missing or weak; remove all default secrets.
- Use short-lived access tokens and rotating, hashed, revocable refresh tokens stored server-side.
- Validate JWT algorithm, issuer, audience, expiry and subject; support session/device revocation and password-change invalidation.
- Select only required user columns in auth middleware; never attach password hashes or unnecessary personal data to `req.user`.
- Add login throttling, progressive delays, generic login errors, password reset protections, email/phone verification, MFA for administrators, and breached-password checks.
- Use secure, HttpOnly, SameSite cookies where architecture permits; protect state-changing cookie-authenticated requests against CSRF. Avoid persistent bearer tokens in localStorage.

### P1 — Financial writes are not atomic

Files: `backend/src/controllers/authController.js`, `backend/src/controllers/videoController.js`, `backend/src/models/User.js`

Registration, referral credits, video-view records, balance/points changes, and transaction rows are written separately. A partial failure can leave account balances and transaction history inconsistent.

**Required remediation**
- Introduce an append-only double-entry ledger with balanced debit/credit postings.
- Perform each business operation, ledger posting, idempotency record, and outbox event in one SQL transaction.
- Derive available balance from ledger entries or maintain a transactionally updated balance projection with periodic reconciliation.
- Never edit or delete posted ledger entries; correct mistakes with compensating entries.
- Add database constraints for uniqueness, valid positive amounts, currency, references, and allowed state transitions.

### P1 — Broad CORS and missing edge/API protections

File: `backend/server.js`

The API currently enables CORS without an explicit origin allowlist. The reviewed server entry point does not show global request rate limits, a security-header policy, request-size limits, or centralized schema validation.

**Required remediation**
- Configure exact production frontend origins and methods/headers.
- Add Helmet/security headers, strict JSON/body limits, schema validation, request timeouts, and per-route rate limits.
- Add Turnstile or equivalent bot mitigation to high-abuse public endpoints, validating tokens on the server.
- Add WAF rules, DDoS protections, and API abuse monitoring at the edge.
- Redact credentials, tokens, phone numbers, and payment payloads from logs.

### P1 — Database production defaults

File: `backend/src/config/db.js`

The pool defaults to MySQL root and an empty password when environment variables are absent.

**Required remediation**
- Fail closed if production DB settings are missing.
- Use a dedicated least-privilege database user, TLS to the database, private networking/firewall rules, managed secrets and connection limits.
- Encrypt disks/backups and restrict backup access.
- Run schema migrations through a controlled release process; test restores regularly.

## Recommended financial architecture

1. **Authoritative internal ledger:** Store immutable journal entries in MySQL. Use a unique business idempotency key for every earn, deposit, referral credit, refund, withdrawal reservation and payout.
2. **Payment state machine:** `created -> pending_provider -> confirmed | failed | expired -> reconciled`. Only verified provider evidence may transition a deposit to confirmed.
3. **Outbox pattern:** Commit the ledger and an outbox event atomically; asynchronously deliver notifications, blockchain anchors and analytics with retries.
4. **Reconciliation:** Periodically compare internal payment/payout records against provider settlement reports and alert on every mismatch.
5. **Operational controls:** Dual approval for sensitive admin actions, immutable audit trail, alerts for unusual velocity, device/IP changes, referral rings, payout spikes and repeated failed authentication.

## Blockchain: use anchoring, not on-chain personal/financial data

Do not store names, phone numbers, email addresses, wallet secrets, full transaction payloads, or user balances directly on a public blockchain. Public chains are permanent and can expose private data.

Recommended design:
- Keep the authoritative transaction ledger in the relational database.
- Canonicalize each finalized ledger event and compute a cryptographic hash.
- Periodically build a Merkle tree over finalized event hashes and anchor only the Merkle root, batch ID, chain ID and minimal timestamp metadata on a selected chain.
- Keep the Merkle proofs and event data off-chain under access controls.
- Verify inclusion proofs independently; do not treat a blockchain confirmation as proof that a mobile-money payment actually settled.
- Define chain, fees, confirmation/finality policy, key custody, retry/reorg handling and compliance requirements before implementation.

Blockchain anchoring is an audit-integrity layer, not a substitute for double-entry accounting, payment-provider verification, backups, or database access controls.

## Deployment direction

The current application is MySQL-based and has no checked-in Wrangler configuration. Do not silently migrate production data to D1 as part of deployment.

Preferred first production path:
- Deploy the existing Express API to a managed Node.js host or secured VPS/container.
- Host the Vite frontend as static assets behind a CDN.
- Use managed MySQL with private connectivity and automated backups.
- Terminate TLS at the edge/load balancer; keep the origin private where possible.
- Use a staging environment, CI checks, migration backups, health checks, structured redacted logs and rollback procedures.

Cloudflare can provide DNS, TLS, CDN/WAF, Turnstile, rate limiting, and bot protections. If the product is deliberately migrated to Workers/D1, plan and test a separate data migration. D1 Time Travel is always enabled for supported D1 databases; current retention is 7 days on Workers Free and 30 days on Workers Paid. Restoring Time Travel overwrites the database in place and cancels in-flight queries/transactions, so record the previous bookmark and rehearse recovery before production use. Keep independent exports/backups for longer retention and disaster recovery.

## Performance work

- Fix the N+1 query pattern in `getAllVideos` by fetching watch status in one joined/batched query.
- Add pagination bounds and indexes based on real query plans; avoid unbounded history queries.
- Cache public video/catalog metadata at the edge; never cache authenticated balances, profiles, payment state or admin responses as public content.
- Serve optimized responsive thumbnails, lazy-load media, and use a dedicated video CDN/streaming service.
- Add compression, immutable hashed static assets, HTTP caching, and bundle analysis.
- Measure p50/p95 API latency, DB query time, frontend Core Web Vitals, error rates and payment callback lag before/after each optimization.

## Required release gates

- Automated unit/integration tests for auth, permissions, ledger invariants, idempotency, provider callbacks, withdrawals, referrals and reward issuance.
- Concurrency tests proving two simultaneous withdrawals cannot overspend.
- Negative tests proving forged payment statuses and forged watch durations cannot earn money.
- Dependency, secret, static-analysis and vulnerability scans.
- Staging provider sandbox tests and end-to-end payment/payout reconciliation.
- Backup restore rehearsal and documented incident response.
- No production secrets, user data, private keys or provider credentials committed to Git.

## Deployment information still required

Before deploying or changing live infrastructure, confirm:
- The actual server/provider (VPS/SSH host, Render, Railway, Fly.io, or Cloudflare account) and whether it is staging or production.
- Domain name and DNS ownership.
- MySQL host/version and whether production data already exists.
- Payment provider production credentials/webhook configuration (enter them only in the host's secret manager, never in chat or Git).
- Blockchain network preference and whether on-chain anchoring is legally/commercially required.

This plan records source-level issues and recommended work. It does not claim the issues are fixed, that a penetration test has passed, or that the application has been deployed.
