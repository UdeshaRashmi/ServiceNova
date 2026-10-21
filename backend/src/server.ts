import { createApp } from './app.js';
import { readConfig } from './config.js';
import { UnavailableRepository } from './repositories/unavailable.js';

try {
  const config = readConfig();
  const repository = new UnavailableRepository();
  const server = createApp(repository, config).listen(config.port, () => {
    console.log(`ServiceNova API listening on http://localhost:${config.port}`);
    console.log(
      'Database integration pending: /api/health is live; /api/ready returns 503.',
    );
  });
  server.on('error', () => {
    console.error('Unable to start API listener. Check PORT and permissions.');
    process.exitCode = 1;
  });
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Unable to configure API.',
  );
  process.exitCode = 1;
}
