import { ApiPromise, WsProvider } from '@polkadot/api';
import { config } from './config.js';

// Reusable parachain connections.
// Connections are opened once (lazily) and kept alive so we don't reconnect on
// every HTTP request. WsProvider auto-reconnects on a dropped connection.
const apis = new Map();

async function getApi(url) {
  if (apis.has(url)) return apis.get(url);

  const provider = new WsProvider(url); // autoReconnect is enabled by default
  const promise = ApiPromise.create({ provider, noInitWarn: true });
  apis.set(url, promise);

  try {
    const api = await promise;
    api.on('disconnected', () => console.warn(`[polkadot] disconnected: ${url}`));
    api.on('error', (e) => console.warn(`[polkadot] error: ${url}: ${e?.message || e}`));
    return api;
  } catch (err) {
    apis.delete(url); // allow a fresh connection attempt on the next request
    throw err;
  }
}

/** Total issuance of the Robonomics parachain native token (in planck). */
export async function getRobonomicsTotalIssuance() {
  const api = await getApi(config.endpoints.robonomics);
  const total = await api.query.balances.totalIssuance();
  return total.toBigInt();
}

/**
 * Supply of XRT issued as a foreign asset on Polkadot Asset Hub
 * (native XRT teleported from the Robonomics parachain), in planck.
 * Returns 0n if the asset is, for some reason, not registered.
 */
export async function getAssetHubXrtSupply() {
  const api = await getApi(config.endpoints.assetHub);
  const xrtForeignAssetLocation = {
    parents: 1,
    interior: { X1: [{ Parachain: config.paraId }] },
  }
  const asset = await api.query.foreignAssets.asset(xrtForeignAssetLocation);
  if (asset.isNone === true || asset.isEmpty) return 0n;
  const json = asset.unwrapOr?.(null)?.toJSON?.() ?? asset.toJSON();
  return BigInt(json?.supply ?? 0);
}

/** Gracefully close all connections (for graceful shutdown). */
export async function disconnectAll() {
  for (const promise of apis.values()) {
    try {
      const api = await promise;
      await api.disconnect();
    } catch {
      /* ignore */
    }
  }
  apis.clear();
}
