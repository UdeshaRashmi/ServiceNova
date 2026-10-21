import { randomUUID } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import type { Config } from '../config.js';
import { AuthService } from '../services/auth.js';
import { hashPassword } from '../utils/passwords.js';
import { MemoryRepository } from './support/memory-repository.js';
import type { RequestInput, Status, UserRecord } from '../types/domain.js';

const origin = 'http://localhost:5173';
const config: Config = {
  environment: 'test',
  port: 3000,
  jwtSecret: 'test-only-secret-with-at-least-32-characters',
  sessionTtlSeconds: 3600,
  frontendOrigins: [origin],
};
const validRequest: RequestInput = {
  title: 'Cannot access billing',
  description: 'The billing page does not open when I select invoices.',
  category: 'BILLING',
  priority: 'HIGH',
};
let passwordHash: string;
let repository: MemoryRepository;
let app: ReturnType<typeof createApp>;
let member: UserRecord;
let other: UserRecord;
let admin: UserRecord;
let memberCookie: string;
let otherCookie: string;
let adminCookie: string;
beforeAll(async () => {
  passwordHash = await hashPassword('test-password-123');
});
beforeEach(() => {
  repository = new MemoryRepository();
  member = repository.seedUser({
    name: 'Alex Morgan',
    email: 'alex@example.com',
    passwordHash,
  });
  other = repository.seedUser({
    name: 'Taylor Lee',
    email: 'taylor@example.com',
    passwordHash,
  });
  admin = repository.seedUser({
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash,
    role: 'ADMIN',
  });
  const auth = new AuthService(repository, config);
  memberCookie = `servicenova_session=${auth.issueToken(member)}`;
  otherCookie = `servicenova_session=${auth.issueToken(other)}`;
  adminCookie = `servicenova_session=${auth.issueToken(admin)}`;
  app = createApp(repository, config);
});
const post = (path: string, cookie = memberCookie) =>
  request(app).post(path).set('Origin', origin).set('Cookie', cookie);
const patch = (path: string, cookie = memberCookie) =>
  request(app).patch(path).set('Origin', origin).set('Cookie', cookie);
const cancel = (id: string, cookie = memberCookie) =>
  request(app)
    .delete(`/api/requests/${id}`)
    .set('Origin', origin)
    .set('Cookie', cookie);
const get = (path: string, cookie = memberCookie) =>
  request(app).get(path).set('Cookie', cookie);
const createFixture = () => repository.createRequest(member.id, validRequest);

describe('authentication', () => {
  it('registers a member, hashes the password and establishes a cookie session', async () => {
    const response = await post('/api/auth/register')
      .send({
        name: 'New Member',
        email: 'NEW@example.com',
        password: 'a-secure-password',
      })
      .expect(201);
    expect(response.body.data).toMatchObject({
      name: 'New Member',
      email: 'new@example.com',
      role: 'USER',
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(response.body.data).not.toHaveProperty('sessionVersion');
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
    await request(app).get('/api/auth/me').set('Cookie', cookies).expect(200);
    const stored = await repository.findUserByEmail('new@example.com');
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored?.passwordHash).not.toContain('a-secure-password');
  });
  it('rejects duplicate email case-insensitively', async () => {
    await post('/api/auth/register')
      .send({
        name: 'Another Alex',
        email: 'ALEX@example.com',
        password: 'new-password',
      })
      .expect(409);
  });
  it('rejects public administrator assignment', async () => {
    await post('/api/auth/register')
      .send({
        name: 'Bad Role',
        email: 'bad@example.com',
        password: 'new-password',
        role: 'ADMIN',
      })
      .expect(400);
    expect(await repository.findUserByEmail('bad@example.com')).toBeNull();
  });
  it('logs in with valid credentials', async () => {
    const response = await post('/api/auth/login')
      .send({ email: 'ALEX@example.com', password: 'test-password-123' })
      .expect(200);
    expect(response.body.data.id).toBe(member.id);
    expect(response.headers['set-cookie']).toBeDefined();
  });
  it.each(['alex@example.com', 'missing@example.com'])(
    'uses the same safe error for invalid credentials: %s',
    async (email) => {
      const response = await post('/api/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401);
      expect(response.body.error.message).toBe(
        'Email or password is incorrect.',
      );
    },
  );
  it('requires authentication on protected routes', async () => {
    await request(app).get('/api/requests').expect(401);
  });
  it('rejects tampered, expired and incorrect-algorithm cookies', async () => {
    await get('/api/auth/me', `${memberCookie}tampered`).expect(401);
    const expired = jwt.sign({ version: 0 }, config.jwtSecret, {
      subject: member.id,
      issuer: 'servicenova',
      audience: 'servicenova-web',
      expiresIn: -1,
    });
    await get('/api/auth/me', `servicenova_session=${expired}`).expect(401);
    const wrongAlgorithm = jwt.sign({ version: 0 }, config.jwtSecret, {
      algorithm: 'HS384',
      subject: member.id,
      issuer: 'servicenova',
      audience: 'servicenova-web',
      expiresIn: 60,
    });
    await get('/api/auth/me', `servicenova_session=${wrongAlgorithm}`).expect(
      401,
    );
  });
  it('logs out, clears the cookie and rejects replay of the original token', async () => {
    const response = await post('/api/auth/logout').expect(204);
    expect(response.headers['set-cookie'][0]).toContain(
      'Expires=Thu, 01 Jan 1970',
    );
    await get('/api/auth/me', memberCookie).expect(401);
    await post('/api/auth/logout').expect(204);
    await request(app)
      .post('/api/auth/logout')
      .set('Origin', origin)
      .expect(204);
  });
  it('reads the latest role from storage rather than relying on the session token', async () => {
    admin.role = 'USER';
    await get('/api/users', adminCookie).expect(403);
  });
  it('sets Secure host-only cookies in production', async () => {
    app = createApp(repository, { ...config, environment: 'production' });
    const response = await post('/api/auth/login')
      .send({ email: member.email, password: 'test-password-123' })
      .expect(200);
    expect(response.headers['set-cookie'][0]).toContain(
      '__Host-servicenova_session=',
    );
    expect(response.headers['set-cookie'][0]).toContain('Secure');
    expect(response.headers['set-cookie'][0]).toContain('Path=/');
    expect(response.headers['set-cookie'][0]).not.toContain('Domain=');
  });
});

describe('request ownership and CRUD', () => {
  it('creates a pending request owned by the session user', async () => {
    const response = await post('/api/requests').send(validRequest).expect(201);
    expect(response.body.data).toMatchObject({
      ...validRequest,
      status: 'PENDING',
      userId: member.id,
    });
    expect(response.headers.location).toBe(
      `/api/requests/${response.body.data.id}`,
    );
    const detail = await get(`/api/requests/${response.body.data.id}`).expect(
      200,
    );
    expect(detail.body.data.user).not.toHaveProperty('passwordHash');
  });
  it.each([
    { userId: 'another-id' },
    { status: 'RESOLVED' },
    { createdAt: '2000-01-01' },
  ])('rejects server-owned field injection: %j', async (injection) => {
    await post('/api/requests')
      .send({ ...validRequest, ...injection })
      .expect(400);
    expect(repository.requests.size).toBe(0);
  });
  it('hides other members’ requests from listing and detail', async () => {
    const fixture = await createFixture();
    const list = await get('/api/requests', otherCookie).expect(200);
    expect(list.body.data).toEqual([]);
    expect(list.body.pagination.totalItems).toBe(0);
    await get(`/api/requests/${fixture.id}`, otherCookie).expect(404);
    await patch(`/api/requests/${fixture.id}`, otherCookie)
      .send({ title: 'Unauthorized update' })
      .expect(404);
    await cancel(fixture.id, otherCookie).expect(404);
  });
  it('allows administrators to read all requests', async () => {
    const fixture = await createFixture();
    expect(
      (await get('/api/requests', adminCookie).expect(200)).body.data,
    ).toHaveLength(1);
    await get(`/api/requests/${fixture.id}`, adminCookie).expect(200);
  });
  it('updates only the fields supplied on an own pending request', async () => {
    const fixture = await createFixture();
    const response = await patch(`/api/requests/${fixture.id}`)
      .send({ title: 'Updated billing issue' })
      .expect(200);
    expect(response.body.data).toMatchObject({
      title: 'Updated billing issue',
      description: validRequest.description,
      userId: member.id,
      status: 'PENDING',
    });
  });
  it('rejects direct status changes through general updates', async () => {
    const fixture = await createFixture();
    await patch(`/api/requests/${fixture.id}`)
      .send({ status: 'RESOLVED' })
      .expect(400);
  });
  it.each(['IN_PROGRESS', 'RESOLVED', 'CANCELLED'] as Status[])(
    'does not edit or cancel a %s request',
    async (status) => {
      const fixture = await createFixture();
      repository.requests.get(fixture.id)!.status = status;
      await patch(`/api/requests/${fixture.id}`)
        .send({ title: 'Updated billing issue' })
        .expect(409);
      await cancel(fixture.id).expect(409);
    },
  );
  it('cancels instead of deleting a pending request', async () => {
    const fixture = await createFixture();
    await cancel(fixture.id).expect(204);
    expect(repository.requests.get(fixture.id)?.status).toBe('CANCELLED');
    await get(`/api/requests/${fixture.id}`).expect(200);
  });
  it('detects a concurrent edit conflict from a conditional write', async () => {
    const fixture = await createFixture();
    vi.spyOn(repository, 'updatePendingRequest').mockResolvedValueOnce(null);
    await patch(`/api/requests/${fixture.id}`)
      .send({ title: 'Concurrent edit test' })
      .expect(409);
  });
});

describe('status transitions', () => {
  it.each<[Status, Status]>([
    ['PENDING', 'IN_PROGRESS'],
    ['PENDING', 'CANCELLED'],
    ['IN_PROGRESS', 'RESOLVED'],
    ['IN_PROGRESS', 'CANCELLED'],
  ])('allows %s → %s for administrators', async (from, to) => {
    const fixture = await createFixture();
    repository.requests.get(fixture.id)!.status = from;
    const response = await patch(
      `/api/requests/${fixture.id}/status`,
      adminCookie,
    )
      .send({ status: to })
      .expect(200);
    expect(response.body.data.status).toBe(to);
  });
  it.each<[Status, Status]>([
    ['RESOLVED', 'PENDING'],
    ['CANCELLED', 'IN_PROGRESS'],
    ['PENDING', 'RESOLVED'],
    ['IN_PROGRESS', 'PENDING'],
    ['PENDING', 'PENDING'],
  ])('rejects %s → %s', async (from, to) => {
    const fixture = await createFixture();
    repository.requests.get(fixture.id)!.status = from;
    await patch(`/api/requests/${fixture.id}/status`, adminCookie)
      .send({ status: to })
      .expect(409);
    expect(repository.requests.get(fixture.id)?.status).toBe(from);
  });
  it('rejects member use of the administrator status endpoint', async () => {
    const fixture = await createFixture();
    await patch(`/api/requests/${fixture.id}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(403);
  });
  it('reports a concurrent status conflict rather than overwriting it', async () => {
    const fixture = await createFixture();
    vi.spyOn(repository, 'transitionRequest').mockResolvedValueOnce(null);
    await patch(`/api/requests/${fixture.id}/status`, adminCookie)
      .send({ status: 'IN_PROGRESS' })
      .expect(409);
  });
});

describe('querying and dashboard metrics', () => {
  it('paginates, filters, searches descriptions, and orders oldest first', async () => {
    for (let i = 0; i < 12; i++) {
      const fixture = await repository.createRequest(member.id, {
        ...validRequest,
        title: `Billing request ${i}`,
      });
      repository.requests.get(fixture.id)!.createdAt = new Date(
        Date.UTC(2026, 9, i + 1),
      );
    }
    await repository.createRequest(other.id, {
      ...validRequest,
      category: 'OTHER',
    });
    const response = await get(
      '/api/requests?search=invoices&category=BILLING&priority=HIGH&status=PENDING&sort=oldest&page=2&limit=5',
      adminCookie,
    ).expect(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 5,
      totalItems: 12,
      totalPages: 3,
    });
    expect(response.body.data).toHaveLength(5);
    expect(response.body.data[0].title).toBe('Billing request 5');
  });
  it('keeps member metrics private and independent of list pagination', async () => {
    for (let i = 0; i < 6; i++) await createFixture();
    await repository.createRequest(other.id, validRequest);
    const memberMetrics = await get('/api/requests/metrics').expect(200);
    expect(memberMetrics.body.data).toEqual({
      total: 6,
      pending: 6,
      inProgress: 0,
      resolved: 0,
    });
    const adminMetrics = await get('/api/requests/metrics', adminCookie).expect(
      200,
    );
    expect(adminMetrics.body.data).toMatchObject({ total: 7, totalUsers: 3 });
  });
});

describe('user management', () => {
  it.each(['/api/users', `/api/users/${randomUUID()}`])(
    'rejects member access to %s',
    async (path) => {
      await get(path).expect(403);
    },
  );
  it('lists safe user records with request counts and name/email search', async () => {
    await createFixture();
    const response = await get(
      '/api/users?search=alex&limit=5',
      adminCookie,
    ).expect(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: member.id,
      _count: { requests: 1 },
    });
    expect(response.body.data[0]).not.toHaveProperty('passwordHash');
    expect(response.body.data[0]).not.toHaveProperty('sessionVersion');
  });
  it('allows an administrator to update only a display name', async () => {
    await patch(`/api/users/${member.id}`, adminCookie)
      .send({ name: 'Alex Updated' })
      .expect(200);
    expect(
      (await get(`/api/users/${member.id}`, adminCookie).expect(200)).body.data
        .name,
    ).toBe('Alex Updated');
    await patch(`/api/users/${member.id}`, adminCookie)
      .send({ name: 'Alex', role: 'ADMIN' })
      .expect(400);
    await patch(`/api/users/${member.id}`)
      .send({ name: 'Forbidden Name' })
      .expect(403);
    expect(member.role).toBe('USER');
  });
  it('reports missing users', async () => {
    await get(`/api/users/${randomUUID()}`, adminCookie).expect(404);
  });
});

describe('validation and security boundaries', () => {
  it.each([
    { title: '' },
    { priority: 'URGENT' },
    { category: 'UNKNOWN' },
    { description: '' },
    { title: 42 },
  ])('rejects invalid request input: %j', async (invalid) => {
    await post('/api/requests')
      .send({ ...validRequest, ...invalid })
      .expect(400);
  });
  it('rejects missing fields, empty patches, invalid IDs and bad queries', async () => {
    await post('/api/requests').send({}).expect(400);
    const fixture = await createFixture();
    await patch(`/api/requests/${fixture.id}`).send({}).expect(400);
    await get('/api/requests/not-an-id').expect(400);
    await get(`/api/requests/${randomUUID()}`).expect(404);
    for (const query of [
      'page=0',
      'limit=500',
      'status=BAD',
      'sort=title',
      'userId=attacker',
      'page=1&page=2',
    ])
      await get(`/api/requests?${query}`).expect(400);
  });
  it('rejects cross-origin and missing-Origin changes including login and logout', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: member.email, password: 'test-password-123' })
      .expect(403);
    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', memberCookie)
      .set('Origin', 'https://evil.example')
      .expect(403);
    await request(app)
      .post('/api/requests')
      .set('Cookie', memberCookie)
      .set('Origin', 'null')
      .send(validRequest)
      .expect(403);
  });
  it('returns credentialed CORS headers only for the configured origin', async () => {
    const response = await request(app)
      .options('/api/requests')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.example')
      .expect(403);
  });
  it('handles malformed JSON, oversized JSON, and unsupported content types', async () => {
    await post('/api/requests')
      .set('Content-Type', 'application/json')
      .send('{bad')
      .expect(400);
    await post('/api/requests')
      .send({ ...validRequest, description: 'x'.repeat(40000) })
      .expect(413);
    await post('/api/requests').type('form').send('title=invalid').expect(415);
  });
  it('limits repeated authentication attempts', async () => {
    for (let i = 0; i < 20; i++)
      await post('/api/auth/login').send({}).expect(400);
    const response = await post('/api/auth/login').send({}).expect(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
    expect(response.headers['retry-after']).toBeDefined();
  });
  it('returns safe generic failures and security headers', async () => {
    vi.spyOn(repository, 'listRequests').mockRejectedValueOnce(
      new Error('database secret: do-not-expose'),
    );
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await get('/api/requests').expect(500);
    expect(response.text).not.toContain('do-not-expose');
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-powered-by']).toBeUndefined();
    logger.mockRestore();
  });
});
