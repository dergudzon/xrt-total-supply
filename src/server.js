import express from 'express';
import { config } from './config.js';
import { disconnectAll } from './polkadot.js';
import { getTotalSupply } from './supply.js';

export function createApp() {
  const app = express();

  // Main endpoint: combined XRT total supply (Robonomics + Asset Hub).
  app.get('/', async (req, res) => {
    try {
      const force = req.query.force === 'true';
      const data = await getTotalSupply({ force });
      res.json(data);
    } catch (err) {
      console.error('[server] failed to fetch total supply:', err);
      res.status(502).json({
        error: 'Failed to fetch total supply from parachains',
        message: err?.message || String(err),
      });
    }
  });

  // Liveness probe
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}

export function startServer() {
  const app = createApp();
  const server = app.listen(config.server.port, config.server.host, () => {
    console.log(
      `XRT total-supply API listening on http://${config.server.host}:${config.server.port}`,
    );
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectAll();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}
