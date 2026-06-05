export const config = {
  // HTTP server settings
  server: {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
  },

  // Token metadata
  token: {
    symbol: 'XRT',
    decimals: 9,
  },

  // Parachain RPC endpoints
  endpoints: {
    // Robonomics parachain on Polkadot (paraId = 3388)
    robonomics: process.env.ROBONOMICS_WS || 'wss://polkadot.rpc.robonomics.network/',
    // Polkadot Asset Hub (system parachain, paraId = 1000)
    assetHub: process.env.ASSET_HUB_WS || 'wss://polkadot-asset-hub-rpc.polkadot.io',
  },

  // paraId of the Robonomics parachain
  paraId: 3388,

  // Response cache TTL in ms, to avoid hitting RPC on every request.
  cacheTtlMs: Number(process.env.CACHE_TTL_MS) || 10_000,
};
