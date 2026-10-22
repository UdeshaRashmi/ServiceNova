import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import type { Config } from '../config.js';
import { PrismaRepository } from '../repositories/prisma.js';
import { createDatabase } from '../repositories/client.js';
import { AuthService } from '../services/auth.js';
import { seedAdmin } from '../services/seed-admin.js';
import { hashPassword } from '../utils/passwords.js';
import type { RequestInput, Status, UserRecord } from '../types/domain.js';
import { testDatabase } from './support/test-database.js';

const origin = 'http://localhost:5173';
const config: Config = {
  environment: 'test',
  port: 3000,
  jwtSecret: 'database-test-only-signing-secret-32-characters',
  sessionTtlSeconds: 3600,
  frontendOrigins: [origin],
};
const input: RequestInput = {
  title: 'Billing page is unavailable',
  description: 'Invoice details will not load when I open the billing screen.',
  category: 'BILLING',
  priority: 'HIGH',
};
let database: Awaited<ReturnType<typeof testDatabase>>;
let repository: PrismaRepository;
let app: ReturnType<typeof createApp>;
let member: UserRecord;
let other: UserRecord;
let admin: UserRecord;
let memberCookie: string;
let adminCookie: string;
let passwordHash: string;
beforeAll(async () => {
  database = await testDatabase();
  passwordHash = await hashPassword('database-test-password');
}, 40000);
afterAll(async () => {
  await database?.close();
});
beforeEach(async () => {
  await database.db.serviceRequest.deleteMany();
  await database.db.user.deleteMany();
  member = await database.db.user.create({
    data: { name: 'Alex Morgan', email: 'alex@example.com', passwordHash },
  });
  other = await database.db.user.create({
    data: { name: 'Taylor Lee', email: 'taylor@example.com', passwordHash },
  });
  admin = await database.db.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
    },
  });
  repository = new PrismaRepository(database.db);
  const auth = new AuthService(repository, config);
  memberCookie = `servicenova_session=${auth.issueToken(member)}`;
  adminCookie = `servicenova_session=${auth.issueToken(admin)}`;
  app = createApp(repository, config);
});
const get = (path: string, cookie = memberCookie) =>
  request(app).get(path).set('Cookie', cookie);
const post = (path: string, cookie = memberCookie) =>
  request(app).post(path).set('Origin', origin).set('Cookie', cookie);
const patch = (path: string, cookie = memberCookie) =>
  request(app).patch(path).set('Origin', origin).set('Cookie', cookie);

describe('migrated SQLite API integration', () => {
  it('reports database readiness after real migrations', async () => {
    await request(app).get('/api/ready').expect(200);
  });
  it('registers, logs in, resolves the current user, and revokes logout persistently', async () => {
    const values = {
      name: 'New Account',
      email: 'new@example.com',
      password: 'a-strong-password',
    };
    const registered = await post('/api/auth/register')
      .send(values)
      .expect(201);
    const stored = await database.db.user.findUniqueOrThrow({
      where: { email: values.email },
    });
    expect(stored.role).toBe('USER');
    expect(stored.passwordHash).not.toBe(values.password);
    expect(registered.body.data).not.toHaveProperty('passwordHash');
    await post('/api/auth/register').send(values).expect(409);
    await post('/api/auth/login')
      .send({ email: values.email, password: 'wrong-password' })
      .expect(401);
    const login = await post('/api/auth/login')
      .send({ email: values.email, password: values.password })
      .expect(200);
    const cookies = login.headers['set-cookie'] as unknown as string[];
    await request(app).get('/api/auth/me').set('Cookie', cookies).expect(200);
    await request(app)
      .post('/api/auth/logout')
      .set('Origin', origin)
      .set('Cookie', cookies)
      .expect(204);
    await request(app).get('/api/auth/me').set('Cookie', cookies).expect(401);
    expect(
      (await database.db.user.findUniqueOrThrow({ where: { id: stored.id } }))
        .sessionVersion,
    ).toBe(1);
  });
  it('creates, reads and updates a real stored request', async () => {
    const response = await post('/api/requests').send(input).expect(201);
    const id: string = response.body.data.id;
    expect(
      (await database.db.serviceRequest.findUniqueOrThrow({ where: { id } }))
        .userId,
    ).toBe(member.id);
    const detail = await get(`/api/requests/${id}`).expect(200);
    expect(detail.body.data.status).toBe('PENDING');
    expect(detail.body.data.user).not.toHaveProperty('passwordHash');
    await patch(`/api/requests/${id}`)
      .send({ title: 'Updated real request title' })
      .expect(200);
    expect((await repository.findRequest(id))?.title).toBe(
      'Updated real request title',
    );
  });
  it('keeps records after disconnecting and reconnecting a client', async () => {
    const created = await repository.createRequest(member.id, input);
    const secondClient = createDatabase(database.url);
    try {
      expect(
        (await new PrismaRepository(secondClient).findRequest(created.id))
          ?.title,
      ).toBe(input.title);
    } finally {
      await secondClient.$disconnect();
    }
  });
  it('protects ownership for list, read, update and cancellation', async () => {
    const created = await repository.createRequest(other.id, input);
    expect(
      (await get('/api/requests').expect(200)).body.pagination.totalItems,
    ).toBe(0);
    await get(`/api/requests/${created.id}`).expect(404);
    await patch(`/api/requests/${created.id}`)
      .send({ title: 'Forbidden edit' })
      .expect(404);
    await request(app)
      .delete(`/api/requests/${created.id}`)
      .set('Origin', origin)
      .set('Cookie', memberCookie)
      .expect(404);
    await get(`/api/requests/${created.id}`, adminCookie).expect(200);
    expect(
      (await get('/api/requests', adminCookie).expect(200)).body.data,
    ).toHaveLength(1);
  });
  it.each<[Status, Status]>([
    ['PENDING', 'IN_PROGRESS'],
    ['PENDING', 'CANCELLED'],
    ['IN_PROGRESS', 'RESOLVED'],
    ['IN_PROGRESS', 'CANCELLED'],
  ])('persists valid transition %s → %s', async (from, to) => {
    const created = await database.db.serviceRequest.create({
      data: { ...input, userId: member.id, status: from },
    });
    await patch(`/api/requests/${created.id}/status`, adminCookie)
      .send({ status: to })
      .expect(200);
    expect((await repository.findRequest(created.id))?.status).toBe(to);
  });
  it.each<[Status, Status]>([
    ['RESOLVED', 'PENDING'],
    ['CANCELLED', 'IN_PROGRESS'],
  ])('rejects terminal transition %s → %s', async (from, to) => {
    const created = await database.db.serviceRequest.create({
      data: { ...input, userId: member.id, status: from },
    });
    await patch(`/api/requests/${created.id}/status`, adminCookie)
      .send({ status: to })
      .expect(409);
    await patch(`/api/requests/${created.id}`)
      .send({ title: 'Invalid member edit' })
      .expect(409);
    await request(app)
      .delete(`/api/requests/${created.id}`)
      .set('Origin', origin)
      .set('Cookie', memberCookie)
      .expect(409);
  });
  it('rejects member edits/cancellation while in progress and direct status changes', async () => {
    const created = await database.db.serviceRequest.create({
      data: { ...input, userId: member.id, status: 'IN_PROGRESS' },
    });
    await patch(`/api/requests/${created.id}`)
      .send({ title: 'Invalid member edit' })
      .expect(409);
    await request(app)
      .delete(`/api/requests/${created.id}`)
      .set('Origin', origin)
      .set('Cookie', memberCookie)
      .expect(409);
    await patch(`/api/requests/${created.id}/status`)
      .send({ status: 'RESOLVED' })
      .expect(403);
    await patch(`/api/requests/${created.id}`)
      .send({ status: 'RESOLVED' })
      .expect(400);
  });
  it('cancels pending requests without hard deletion', async () => {
    const created = await repository.createRequest(member.id, input);
    await request(app)
      .delete(`/api/requests/${created.id}`)
      .set('Origin', origin)
      .set('Cookie', memberCookie)
      .expect(204);
    expect((await repository.findRequest(created.id))?.status).toBe(
      'CANCELLED',
    );
  });
  it('paginates filtered results, searches descriptions, sorts and scopes metrics', async () => {
    for (let i = 0; i < 12; i++)
      await database.db.serviceRequest.create({
        data: {
          ...input,
          title: `Billing request ${i}`,
          userId: member.id,
          createdAt: new Date(Date.UTC(2026, 9, i + 1)),
        },
      });
    await repository.createRequest(other.id, { ...input, category: 'OTHER' });
    const response = await get(
      '/api/requests?search=INVOICE&status=PENDING&category=BILLING&priority=HIGH&sort=oldest&page=2&limit=5',
      adminCookie,
    ).expect(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 5,
      totalItems: 12,
      totalPages: 3,
    });
    expect(response.body.data[0].title).toBe('Billing request 5');
    const newest = await get(
      '/api/requests?category=BILLING&sort=newest&limit=5',
    ).expect(200);
    expect(newest.body.data[0].title).toBe('Billing request 11');
    expect((await get('/api/requests/metrics').expect(200)).body.data).toEqual({
      total: 12,
      pending: 12,
      inProgress: 0,
      resolved: 0,
    });
    expect(
      (await get('/api/requests/metrics', adminCookie).expect(200)).body.data,
    ).toMatchObject({ total: 13, totalUsers: 3 });
  });
  it('manages safe user records with request counts and excludes role escalation', async () => {
    await repository.createRequest(member.id, input);
    await get('/api/users').expect(403);
    const response = await get('/api/users?search=ALEX', adminCookie).expect(
      200,
    );
    expect(response.body.data[0]).toMatchObject({
      id: member.id,
      _count: { requests: 1 },
    });
    expect(response.body.data[0]).not.toHaveProperty('passwordHash');
    await patch(`/api/users/${member.id}`, adminCookie)
      .send({ name: 'Updated Member' })
      .expect(200);
    expect(
      (await get(`/api/users/${member.id}`, adminCookie).expect(200)).body.data
        .name,
    ).toBe('Updated Member');
    await patch(`/api/users/${member.id}`, adminCookie)
      .send({ role: 'ADMIN' })
      .expect(400);
    await post('/api/auth/register')
      .send({
        name: 'Bad Admin',
        email: 'bad@example.com',
        password: 'test-password',
        role: 'ADMIN',
      })
      .expect(400);
  });
  it('rejects invalid fields and IDs without storing records', async () => {
    for (const invalid of [
      { title: '' },
      { priority: 'URGENT' },
      { category: 'BAD' },
    ])
      await post('/api/requests')
        .send({ ...input, ...invalid })
        .expect(400);
    await post('/api/requests').send({}).expect(400);
    await get('/api/requests/invalid-id').expect(400);
    await get(`/api/requests/${randomUUID()}`).expect(404);
    expect(await database.db.serviceRequest.count()).toBe(0);
  });
});

describe('database constraints and conditional writes', () => {
  it('resolves a unique-email race safely at the database boundary', async () => {
    const values = {
      name: 'Racing Member',
      email: 'race@example.com',
      passwordHash,
      role: 'USER' as const,
    };
    const results = await Promise.allSettled([
      repository.createUser(values),
      repository.createUser(values),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected'),
    ).toMatchObject({ reason: { status: 409, code: 'EMAIL_EXISTS' } });
    expect(
      await database.db.user.count({ where: { email: values.email } }),
    ).toBe(1);
  });
  it('allows only one competing transition from the same expected state', async () => {
    const created = await repository.createRequest(member.id, input);
    const results = await Promise.all([
      repository.transitionRequest(
        created.id,
        'PENDING',
        'IN_PROGRESS',
        admin.id,
      ),
      repository.transitionRequest(
        created.id,
        'PENDING',
        'CANCELLED',
        admin.id,
      ),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(
      await repository.updatePendingRequest(created.id, member.id, {
        title: 'Stale edit rejected',
      }),
    ).toBeNull();
    expect(
      await repository.transitionRequest(
        created.id,
        'PENDING',
        'CANCELLED',
        other.id,
        other.id,
      ),
    ).toBeNull();
  });
  it('enforces foreign keys and SQL enum checks', async () => {
    await expect(
      database.db
        .$executeRaw`UPDATE "User" SET "role" = 'OWNER' WHERE "id" = ${member.id}`,
    ).rejects.toThrow();
    const created = await repository.createRequest(member.id, input);
    await expect(
      database.db
        .$executeRaw`UPDATE "ServiceRequest" SET "status" = 'UNKNOWN' WHERE "id" = ${created.id}`,
    ).rejects.toThrow();
    await expect(
      database.db.user.delete({ where: { id: member.id } }),
    ).rejects.toThrow();
  });
  it('seeds an administrator idempotently without changing credentials or promoting members', async () => {
    const values = {
      name: 'Seed Admin',
      email: 'seed@example.com',
      password: 'seed-only-test-password',
    };
    expect(await seedAdmin(database.db, values)).toEqual({ created: true });
    const stored = await database.db.user.findUniqueOrThrow({
      where: { email: values.email },
    });
    expect(stored.role).toBe('ADMIN');
    expect(
      await seedAdmin(database.db, {
        ...values,
        password: 'different-test-password',
      }),
    ).toEqual({ created: false });
    expect(
      (
        await database.db.user.findUniqueOrThrow({
          where: { email: values.email },
        })
      ).passwordHash,
    ).toBe(stored.passwordHash);
    await expect(
      seedAdmin(database.db, { ...values, email: member.email }),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      (await database.db.user.findUniqueOrThrow({ where: { id: member.id } }))
        .role,
    ).toBe('USER');
  });
});

describe('persistent request history', () => {
  it('records actual changes in order with safe actor details', async () => {
    const created = await post('/api/requests').send(input).expect(201);
    const id = created.body.data.id;
    await patch(`/api/requests/${id}`)
      .send({ title: 'Updated billing problem' })
      .expect(200);
    await patch(`/api/requests/${id}`)
      .send({ title: 'Updated billing problem' })
      .expect(200);
    await patch(`/api/requests/${id}/status`, adminCookie)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
    const result = await get(`/api/requests/${id}/history`).expect(200);
    expect(result.body.data.map((item: { type: string }) => item.type)).toEqual(
      ['STATUS_CHANGED', 'UPDATED', 'CREATED'],
    );
    expect(result.body.data[0]).toMatchObject({
      fromStatus: 'PENDING',
      toStatus: 'IN_PROGRESS',
      actor: { id: admin.id, name: admin.name },
    });
    expect(Object.keys(result.body.data[0].actor).sort()).toEqual([
      'id',
      'name',
    ]);
    expect(result.body.data[1].changedFields).toBe('title');
  });
  it('requires authentication, ownership and valid pagination', async () => {
    const created = await repository.createRequest(other.id, input);
    await request(app).get(`/api/requests/${created.id}/history`).expect(401);
    await get(`/api/requests/${created.id}/history`).expect(404);
    await get(`/api/requests/${randomUUID()}/history`, adminCookie).expect(404);
    await get(`/api/requests/${created.id}/history?page=0`, adminCookie).expect(
      400,
    );
    await get(
      `/api/requests/${created.id}/history?limit=100`,
      adminCookie,
    ).expect(400);
    await get(`/api/requests/${created.id}/history`, adminCookie).expect(200);
  });
  it('paginates newest first and excludes rejected actions', async () => {
    const created = await repository.createRequest(member.id, input);
    for (let n = 0; n < 6; n++)
      await repository.updatePendingRequest(created.id, member.id, {
        title: `Changed request ${n}`,
      });
    await patch(`/api/requests/${created.id}/status`, adminCookie)
      .send({ status: 'RESOLVED' })
      .expect(409);
    const first = await get(
      `/api/requests/${created.id}/history?limit=5`,
    ).expect(200);
    const second = await get(
      `/api/requests/${created.id}/history?limit=5&page=2`,
    ).expect(200);
    expect(first.body.data).toHaveLength(5);
    expect(second.body.data).toHaveLength(2);
    expect(first.body.pagination).toMatchObject({
      totalItems: 7,
      totalPages: 2,
    });
    expect(first.body.data[4].id).toBeGreaterThan(second.body.data[0].id);
  });
  it('records member cancellation without logging rejected terminal changes', async () => {
    const created = await repository.createRequest(member.id, input);
    await request(app)
      .delete(`/api/requests/${created.id}`)
      .set('Origin', origin)
      .set('Cookie', memberCookie)
      .expect(204);
    await patch(`/api/requests/${created.id}/status`, adminCookie)
      .send({ status: 'IN_PROGRESS' })
      .expect(409);
    const history = await repository.listHistory(created.id, {
      page: 1,
      limit: 10,
    });
    expect(history.data).toHaveLength(2);
    expect(history.data[0]).toMatchObject({
      type: 'STATUS_CHANGED',
      actorId: member.id,
      fromStatus: 'PENDING',
      toStatus: 'CANCELLED',
    });
  });
  it('rolls back the status if recording history fails', async () => {
    const created = await repository.createRequest(member.id, input);
    await database.db.$executeRawUnsafe(
      `CREATE TRIGGER reject_history BEFORE INSERT ON RequestActivity BEGIN SELECT RAISE(ABORT, 'history write failed'); END`,
    );
    try {
      await expect(
        repository.transitionRequest(
          created.id,
          'PENDING',
          'IN_PROGRESS',
          admin.id,
        ),
      ).rejects.toThrow();
      expect((await repository.findRequest(created.id))?.status).toBe(
        'PENDING',
      );
      expect(
        (await repository.listHistory(created.id, { page: 1, limit: 10 })).data,
      ).toHaveLength(1);
    } finally {
      await database.db.$executeRawUnsafe('DROP TRIGGER reject_history');
    }
  });
});
