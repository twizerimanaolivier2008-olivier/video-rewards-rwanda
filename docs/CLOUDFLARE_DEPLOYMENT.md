# Cloudflare deployment runbook

This repository now includes a Cloudflare Worker for the Vite frontend and an API reverse proxy, a Wrangler configuration, a GitHub Actions deployment workflow, and a production Dockerfile for the existing Express API.

## Current deployment boundary

- The Worker serves the built React/Vite site from `frontend/dist`.
- Requests to `/api/*` are proxied to the single HTTPS origin configured as the Worker secret `API_ORIGIN`.
- The API origin must be the existing Express application running on a Node.js-compatible host. The Dockerfile is provided for a VPS or container host.
- MySQL remains the authoritative database. Do not expose MySQL to the public internet.
- No Cloudflare zone/domain, Hyperdrive configuration, R2 bucket, or backend origin was present in the connected Cloudflare account at the time this runbook was prepared. Existing Workers were left untouched.

## Cloudflare account preparation

1. In Cloudflare, create an API token scoped to the target account with permission to deploy Workers Scripts and edit Workers settings. Use a dedicated deployment token, not a Global API Key.
2. Add these GitHub Actions repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Merge the deployment workflow to `main` only after the backend origin is ready. A push to `main` builds the frontend and deploys the Worker.
4. Configure the Worker secret `API_ORIGIN` to the HTTPS origin of the Express backend. It must be an origin only, e.g. `https://api-origin.example.net`, with no path, query, username or password:
   ```sh
   npx wrangler secret put API_ORIGIN --config wrangler.jsonc
   ```
5. Test `/api/health`, registration, login, profile, video, payment sandbox callbacks and admin authorization on staging before directing real users to the Worker.

The Worker deliberately fails closed with HTTP 503 when `API_ORIGIN` is absent or invalid. It will not become an open proxy.

## Express backend host

Build the container from the repository root:

```sh
docker build -f backend/Dockerfile -t video-rewards-rwanda-api ./backend
```

Run it with a managed secret store or environment variables supplied by the host. Required settings include:

- `PORT=5000`
- `NODE_ENV=production`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (random, high entropy; do not reuse a development secret)
- `FRONTEND_URL` (the deployed Worker URL)
- SMTP settings for account verification email
- Payment-provider credentials only when the real provider integration has been implemented and verified

Use a dedicated least-privilege MySQL user, TLS, network allowlisting/private connectivity, automated backups, and a tested restore process. Do not make port 3306 public. Persist `backend/src/uploads/avatars` on durable storage or migrate avatars to private object storage with authenticated delivery; container filesystems are ephemeral.

Prefer Cloudflare Tunnel between a supported backend host and Cloudflare if you have a VPS with a stable running `cloudflared` connector. Otherwise use a managed Node.js host with HTTPS and restrict the origin to Cloudflare where the provider supports it. Do not expose a development server.

## Existing application work still required before production

This infrastructure scaffold is not a security certification and does not make unsafe financial flows safe. The current source still contains high-risk behavior:

- MoMo/Airtel verification accepts client-supplied `status`; implement authenticated provider callbacks/server-to-server verification before granting paid status.
- Withdrawals check balance and create records in separate operations; implement atomic reservations and idempotency.
- Video reward eligibility trusts client-supplied watch duration; replace it with server-issued watch sessions and fraud controls.
- JWT secret fallback exists in `authController.js`; remove it and fail startup when secrets are missing. Implement refresh-token rotation/revocation.
- The MySQL pool defaults to root/empty password; fail closed in production and use least privilege.
- Registration/referral/reward financial writes need atomic transactions and an immutable double-entry ledger.
- Restrict CORS, add rate limits, request validation, security headers, admin MFA and structured redacted audit logs.
- The backend currently stores avatars on local disk; use durable storage before multi-instance deployment.

Do not accept real payments or enable production withdrawals until these items are addressed and tested.

## Database and backups

Keep the existing MySQL database for this rollout. Take a verified pre-migration backup, test restoration into a separate staging database, and run schema migrations through reviewed scripts. Cloudflare D1 Time Travel applies to D1 databases, not this existing MySQL database; it is not a MySQL backup solution.

## Blockchain recommendation

For the first release, keep MySQL as the authoritative double-entry ledger. After ledger correctness and provider reconciliation are implemented, batch finalized ledger-event hashes into a Merkle tree and anchor only the Merkle root, batch identifier and minimal metadata on an EVM-compatible low-fee network. Evaluate Base and Polygon using current fees, finality, availability and compliance needs at implementation time. Never publish names, phone numbers, email addresses, wallet secrets, balances or raw transaction details on-chain.

## Domain

A domain has not been selected or purchased. The Worker can initially be tested on the account's `workers.dev` hostname once deployed. Purchase and add the production domain to Cloudflare later, update DNS, configure the custom Worker domain, and set the API CORS allowlist to the exact frontend origin.

## Rollback

Keep the last known-good Worker deployment/version and deploy a previous Git commit to roll back frontend/edge changes. Database schema changes must be backward-compatible and independently reversible; never roll back financial data by overwriting live ledger rows.
