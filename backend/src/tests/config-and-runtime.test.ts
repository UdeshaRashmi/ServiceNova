import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { readConfig } from '../config.js';
import { UnavailableRepository } from '../repositories/unavailable.js';
import { hashPassword, verifyPassword } from '../utils/passwords.js';

const env = {
  JWT_SECRET: 'test-only-random-secret-with-at-least-32-characters',
};
describe('configuration and staged runtime', () => {
  it('requires a secret and validates deployment settings', () => {
    expect(() => readConfig({})).toThrow('JWT_SECRET');
    expect(() => readConfig({ ...env, PORT: 'not-a-port' })).toThrow('PORT');
    expect(() => readConfig({ ...env, FRONTEND_ORIGINS: '*' })).toThrow(
      'FRONTEND_ORIGINS',
    );
    expect(() =>
      readConfig({
        ...env,
        NODE_ENV: 'production',
        FRONTEND_ORIGINS: 'http://example.com',
      }),
    ).toThrow('HTTPS');
    expect(
      readConfig({
        ...env,
        NODE_ENV: 'production',
        FRONTEND_ORIGINS: 'https://example.com',
      }).frontendOrigins,
    ).toEqual(['https://example.com']);
  });
  it('keeps liveness separate from database readiness', async () => {
    const app = createApp(new UnavailableRepository(), readConfig(env));
    await request(app).get('/api/health').expect(200);
    const response = await request(app).get('/api/ready').expect(503);
    expect(response.body.error.code).toBe('PERSISTENCE_UNAVAILABLE');
    await request(app)
      .post('/api/auth/register')
      .set('Origin', 'http://localhost:5173')
      .send({
        name: 'New Member',
        email: 'new@example.com',
        password: 'new-password',
      })
      .expect(503);
    await request(app).get('/api/unknown').expect(404);
  });
  it('does not silently truncate passwords after 72 bytes', async () => {
    const first = 'a'.repeat(90) + 'first';
    const second = 'a'.repeat(90) + 'second';
    const hash = await hashPassword(first);
    expect(await verifyPassword(first, hash)).toBe(true);
    expect(await verifyPassword(second, hash)).toBe(false);
  });
  it('serves Swagger and the shared specification without requiring a database', async () => {
    const app = createApp(new UnavailableRepository(), readConfig(env));
    const spec = await request(app).get('/api/openapi.json').expect(200);
    expect(spec.body.openapi).toBe('3.0.3');
    expect(spec.body.paths['/requests/{id}/history'].get).toBeDefined();
    const docs = await request(app).get('/api/docs/').expect(200);
    expect(docs.text).toContain('ServiceNova API documentation');
    expect(docs.headers['content-security-policy']).toContain(
      "script-src 'self'",
    );
    expect(docs.headers['content-security-policy']).not.toContain(
      'upgrade-insecure-requests',
    );
    const script = await request(app)
      .get('/api/docs/swagger-ui-init.js')
      .expect(200);
    expect(script.text).toContain('/api/openapi.json');
    expect(script.text).toContain('"withCredentials": true');
    await request(app).get('/api/docs/swagger-ui.css').expect(200);
    await request(app).get('/api/docs/swagger-ui-bundle.js').expect(200);
    // Documentation must not loosen the API's origin protection.
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(403);
  });
});
