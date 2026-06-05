# XRT Total Supply API

A small Express service with a single endpoint that returns the combined
**total supply** of the **XRT** token of the [Robonomics](https://robonomics.network/)
parachain.

Two non-overlapping parts are summed:

| Source | What we count | Query |
|--------|---------------|-------|
| **Robonomics** parachain (Polkadot, `paraId 3388`) | native token issuance | `balances.totalIssuance` |
| **Polkadot Asset Hub** (`paraId 1000`) | XRT teleported to Asset Hub | `foreignAssets.asset(<XRT XCM location>)` → `supply` |

```
total = totalIssuance(Robonomics) + supply(XRT on Asset Hub)
```

### Why there is no double counting

XRT moves to Asset Hub via the teleport model: tokens are **burned** on
Robonomics and re-issued on Asset Hub. Verified: the Asset Hub sovereign account
on Robonomics holds `0 XRT`, i.e. there is no reserve there, and the Robonomics
`totalIssuance` no longer includes those tokens. Hence the two parts are
independent.

> The XRT wrapper bridged into Asset Hub from Ethereum (Snowbridge) is a
> different token origin and is intentionally **not** included in the total.

## Running

### Local

```bash
npm install
npm start          # http://localhost:3000
# or with auto-restart on changes:
npm run dev
```

### Docker

```bash
cp .env.example .env   # adjust variables if needed
docker compose up --build
```

The app will be available at `http://127.0.0.1:${APP_PORT}` (default `3000`).
The port is bound to `127.0.0.1` only — it is not reachable from outside the host.

To use a different port:

```bash
APP_PORT=8080 docker compose up          # different host port, container still on 3000
APP_PORT=8080 PORT=8080 docker compose up  # both host and container port
```

## Endpoint

### `GET /`

Query param `?force=true` — bypass the cache and hit the network directly.

Example response:

```json
{
  "token": "XRT",
  "decimals": 9,
  "totalSupply": "5119335029711074",
  "breakdown": {
    "robonomics": "4713289129711074",
    "assetHub": "406045900000000"
  },
  "updatedAt": "2026-06-05T10:27:49.689Z",
  "cached": false
}
```

All amounts are returned in **planck** (the smallest unit) as strings.
Use `decimals` (9) to convert to whole XRT — e.g. `5119335029711074 / 10^9 = 5119335.029711074 XRT`.

### `GET /health`

Liveness probe: `{ "status": "ok" }`.

## Configuration (environment variables)

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_PORT` | `3000` | Host port mapped by Docker — bound to `127.0.0.1` (Docker only) |
| `PORT` | `3000` | HTTP server port (inside the container or local) |
| `HOST` | `0.0.0.0` | Bind address |
| `ROBONOMICS_WS` | `wss://polkadot.rpc.robonomics.network/` | Robonomics RPC |
| `ASSET_HUB_WS` | `wss://polkadot-asset-hub-rpc.polkadot.io` | Asset Hub RPC |
| `CACHE_TTL_MS` | `10000` | Response cache TTL (ms) |

Copy `.env.example` to `.env` and edit as needed. All variables are optional — defaults work out of the box.

## Structure

```
index.js          — entry point
src/config.js     — configuration
src/polkadot.js   — parachain connections and queries
src/supply.js     — total supply calculation + cache
src/format.js     — planck summation helper (BigInt)
src/server.js     — Express app and endpoints
```
