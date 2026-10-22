import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestService } from '../services/requests.js';
import type { Repository } from '../repositories/repository.js';
import {
  statuses,
  type PublicUser,
  type RequestInput,
  type RequestView,
  type Status,
} from '../types/domain.js';

const member: PublicUser = {
  id: 'member',
  name: 'Member',
  email: 'member@example.com',
  role: 'USER',
  createdAt: new Date(0),
  updatedAt: new Date(0),
};
const admin: PublicUser = { ...member, id: 'admin', role: 'ADMIN' };
const input: RequestInput = {
  title: 'Cannot open account',
  description: 'The account page fails to load after signing in.',
  category: 'ACCOUNT',
  priority: 'MEDIUM',
};
const stored: RequestView = {
  ...input,
  id: 'request',
  userId: member.id,
  user: member,
  status: 'PENDING',
  createdAt: new Date(0),
  updatedAt: new Date(0),
};
const repository = {
  findRequest: vi.fn<Repository['findRequest']>(),
  listRequests: vi.fn<Repository['listRequests']>(),
  metrics: vi.fn<Repository['metrics']>(),
  listHistory: vi.fn<Repository['listHistory']>(),
  createRequest: vi.fn<Repository['createRequest']>(),
  updatePendingRequest: vi.fn<Repository['updatePendingRequest']>(),
  transitionRequest: vi.fn<Repository['transitionRequest']>(),
};
// Only the service's persistence boundary is mocked. No HTTP server or database.
const service = new RequestService(repository as unknown as Repository);
beforeEach(() => {
  vi.resetAllMocks();
  repository.findRequest.mockResolvedValue(stored);
  repository.transitionRequest.mockResolvedValue(stored);
  repository.updatePendingRequest.mockResolvedValue(stored);
});

describe('request service authorization and workflow units', () => {
  const allowed: Record<Status, Status[]> = {
    PENDING: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
    RESOLVED: [],
    CANCELLED: [],
  };
  it.each(
    statuses.flatMap((from) => statuses.map((to) => [from, to] as const)),
  )('enforces admin transition %s -> %s', async (from, to) => {
    repository.findRequest.mockResolvedValue({ ...stored, status: from });
    if (allowed[from].includes(to)) {
      await service.transition(admin, stored.id, to);
      expect(repository.transitionRequest).toHaveBeenCalledExactlyOnceWith(
        stored.id,
        from,
        to,
        admin.id,
      );
    } else {
      await expect(
        service.transition(admin, stored.id, to),
      ).rejects.toMatchObject({ status: 409, code: 'INVALID_TRANSITION' });
      expect(repository.transitionRequest).not.toHaveBeenCalled();
    }
  });
  it('rejects member status changes before looking up a request', async () => {
    await expect(
      service.transition(member, stored.id, 'IN_PROGRESS'),
    ).rejects.toMatchObject({ status: 403 });
    expect(repository.findRequest).not.toHaveBeenCalled();
  });
  it.each(['get', 'history', 'update', 'cancel'] as const)(
    'hides another owner from %s and never mutates',
    async (action) => {
      repository.findRequest.mockResolvedValue({
        ...stored,
        userId: 'another-member',
      });
      const actions = {
        get: () => service.get(member, stored.id),
        history: () =>
          service.history(member, stored.id, { page: 1, limit: 10 }),
        update: () =>
          service.update(member, stored.id, { title: 'Changed title' }),
        cancel: () => service.cancel(member, stored.id),
      };
      await expect(actions[action]()).rejects.toMatchObject({
        status: 404,
        code: 'REQUEST_NOT_FOUND',
      });
      expect(repository.listHistory).not.toHaveBeenCalled();
      expect(repository.updatePendingRequest).not.toHaveBeenCalled();
      expect(repository.transitionRequest).not.toHaveBeenCalled();
    },
  );
  it('returns the same not-found error for missing resources', async () => {
    repository.findRequest.mockResolvedValue(null);
    await expect(service.get(admin, 'missing')).rejects.toMatchObject({
      status: 404,
      code: 'REQUEST_NOT_FOUND',
    });
  });
  it('scopes member lists and metrics while allowing admin-wide reads', async () => {
    const query = { page: 2, limit: 5, sort: 'oldest' as const };
    await service.list(member, query);
    expect(repository.listRequests).toHaveBeenLastCalledWith({
      ...query,
      userId: member.id,
    });
    await service.list(admin, query);
    expect(repository.listRequests).toHaveBeenLastCalledWith({
      ...query,
      userId: undefined,
    });
    await service.metrics(member);
    expect(repository.metrics).toHaveBeenLastCalledWith(member.id);
    await service.metrics(admin);
    expect(repository.metrics).toHaveBeenLastCalledWith(undefined);
  });
  it('authorizes history before reading the page', async () => {
    await service.history(admin, stored.id, { page: 2, limit: 5 });
    expect(repository.listHistory).toHaveBeenCalledExactlyOnceWith(stored.id, {
      page: 2,
      limit: 5,
    });
  });
  it('uses the authenticated member as creator and owner of writes', async () => {
    await service.create(member, input);
    expect(repository.createRequest).toHaveBeenCalledExactlyOnceWith(
      member.id,
      input,
    );
    await service.update(member, stored.id, { priority: 'HIGH' });
    expect(repository.updatePendingRequest).toHaveBeenCalledExactlyOnceWith(
      stored.id,
      member.id,
      { priority: 'HIGH' },
    );
    await service.cancel(member, stored.id);
    expect(repository.transitionRequest).toHaveBeenCalledExactlyOnceWith(
      stored.id,
      'PENDING',
      'CANCELLED',
      member.id,
      member.id,
    );
  });
  it.each(['IN_PROGRESS', 'RESOLVED', 'CANCELLED'] as const)(
    'rejects member editing/cancellation when %s',
    async (status) => {
      repository.findRequest.mockResolvedValue({ ...stored, status });
      await expect(
        service.update(member, stored.id, input),
      ).rejects.toMatchObject({ status: 409, code: 'REQUEST_CHANGED' });
      await expect(service.cancel(member, stored.id)).rejects.toMatchObject({
        status: 409,
        code: 'REQUEST_CHANGED',
      });
      expect(repository.updatePendingRequest).not.toHaveBeenCalled();
      expect(repository.transitionRequest).not.toHaveBeenCalled();
    },
  );
  it('rejects admin member-only writes', async () => {
    expect(() => service.create(admin, input)).toThrow('member account');
    await expect(service.update(admin, stored.id, input)).rejects.toMatchObject(
      { status: 403 },
    );
    await expect(service.cancel(admin, stored.id)).rejects.toMatchObject({
      status: 403,
    });
    expect(repository.createRequest).not.toHaveBeenCalled();
    expect(repository.findRequest).not.toHaveBeenCalled();
  });
  it('reports a conflict when a conditional write loses a concurrent race', async () => {
    repository.updatePendingRequest.mockResolvedValue(null);
    repository.transitionRequest.mockResolvedValue(null);
    await expect(
      service.update(member, stored.id, input),
    ).rejects.toMatchObject({ status: 409, code: 'REQUEST_CHANGED' });
    await expect(service.cancel(member, stored.id)).rejects.toMatchObject({
      status: 409,
      code: 'REQUEST_CHANGED',
    });
    await expect(
      service.transition(admin, stored.id, 'IN_PROGRESS'),
    ).rejects.toMatchObject({ status: 409, code: 'REQUEST_CHANGED' });
  });
});
