import { readFileSync } from 'node:fs';
import { Router } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import type { Config } from './config.js';

// Keep docs/openapi.json as the only source. The build copies it beside the
// compiled module, so a deployed backend does not depend on the repository tree.
const specificationUrl = new URL(
  import.meta.url.endsWith('.ts')
    ? '../../docs/openapi.json'
    : './openapi.json',
  import.meta.url,
);

export function swaggerRoutes(config: Config) {
  const router = Router();
  const specification = JSON.parse(readFileSync(specificationUrl, 'utf8'));
  router.get('/openapi.json', (_req, res) => res.json(specification));

  const options = {
    customSiteTitle: 'ServiceNova API documentation',
    customCss: '.swagger-ui .topbar { display: none; }',
    swaggerOptions: {
      url: '/api/openapi.json',
      withCredentials: true,
      validatorUrl: null,
      persistAuthorization: false,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'list',
    },
  };
  router.use(
    '/docs',
    helmet.contentSecurityPolicy({
      directives: {
        // Swagger renders inline styles; scripts and API calls stay same-origin.
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        upgradeInsecureRequests:
          config.environment === 'production' ? [] : null,
      },
    }),
    swaggerUi.serveFiles(undefined, options),
    swaggerUi.setup(undefined, options),
  );
  return router;
}
