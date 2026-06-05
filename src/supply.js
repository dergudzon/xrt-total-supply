import { config } from './config.js';
import { sumPlanck } from './format.js';
import { getAssetHubXrtSupply, getRobonomicsTotalIssuance } from './polkadot.js';

let cache = null; // { data, expiresAt }

/**
 * Computes the combined XRT total supply:
 *   total = totalIssuance(Robonomics) + supply(native XRT on Asset Hub)
 */
export async function getTotalSupply({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache && cache.expiresAt > now) {
    return { ...cache.data, cached: true };
  }

  const [robonomics, assetHub] = await Promise.all([
    getRobonomicsTotalIssuance(),
    getAssetHubXrtSupply(),
  ]);

  const totalPlanck = sumPlanck(robonomics, assetHub);
  const { symbol, decimals } = config.token;

  const data = {
    token: symbol,
    decimals,
    totalSupply: totalPlanck.toString(),
    breakdown: {
      robonomics: robonomics.toString(),
      assetHub: assetHub.toString(),
    },
    updatedAt: new Date(now).toISOString(),
    cached: false,
  };

  cache = { data, expiresAt: now + config.cacheTtlMs };
  return data;
}
