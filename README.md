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

```bash
npm install
npm start          # http://localhost:3000
# or with auto-restart on changes:
npm run dev
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
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | bind address |
| `ROBONOMICS_WS` | `wss://polkadot.rpc.robonomics.network/` | Robonomics RPC |
| `ASSET_HUB_WS` | `wss://polkadot-asset-hub-rpc.polkadot.io` | Asset Hub RPC |
| `CACHE_TTL_MS` | `10000` | response cache TTL |

## Structure

```
index.js          — entry point
src/config.js     — configuration
src/polkadot.js   — parachain connections and queries
src/supply.js     — total supply calculation + cache
src/format.js     — planck summation helper (BigInt)
src/server.js     — Express app and endpoints
```
