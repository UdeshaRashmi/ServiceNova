import { randomUUID } from 'node:crypto';
import type { Repository } from '../../repositories/repository.js';
import {
  pagination,
  publicUser,
  type PageQuery,
  type RequestInput,
  type RequestQuery,
  type RequestRecord,
  type Status,
  type UserRecord,
} from '../../types/domain.js';
import { AppError } from '../../utils/errors.js';

/** Test double ONLY. The runtime server never imports this implementation. */
export class MemoryRepository implements Repository {
  readonly users = new Map<string, UserRecord>();
  readonly requests = new Map<string, RequestRecord>();
  async ready() {}
  async findUserByEmail(email: string) {
    return (
      [...this.users.values()].find((user) => user.email === email) || null
    );
  }
  async findUserById(id: string) {
    return this.users.get(id) || null;
  }
  seedUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role?: 'USER' | 'ADMIN';
  }) {
    const user: UserRecord = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      sessionVersion: 0,
      role: 'USER',
      ...input,
    };
    this.users.set(user.id, user);
    return user;
  }
  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'USER';
  }) {
    if ([...this.users.values()].some((user) => user.email === input.email))
      throw new AppError(
        409,
        'EMAIL_EXISTS',
        'An account with that email already exists.',
      );
    return this.seedUser(input);
  }
  async invalidateSessions(id: string) {
    const user = this.users.get(id);
    if (user) user.sessionVersion++;
  }
  async listUsers(query: PageQuery) {
    const search = query.search?.toLowerCase();
    const all = [...this.users.values()].filter(
      (user) =>
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.includes(search),
    );
    return {
      data: all
        .slice((query.page - 1) * query.limit, query.page * query.limit)
        .map((user) => ({
          ...publicUser(user),
          _count: {
            requests: [...this.requests.values()].filter(
              (request) => request.userId === user.id,
            ).length,
          },
        })),
      pagination: pagination(query.page, query.limit, all.length),
    };
  }
  async getUserDetail(id: string) {
    const user = this.users.get(id);
    return user
      ? {
          ...publicUser(user),
          _count: {
            requests: [...this.requests.values()].filter(
              (request) => request.userId === id,
            ).length,
          },
        }
      : null;
  }
  async updateUserName(id: string, name: string) {
    const user = this.users.get(id);
    if (!user) return null;
    user.name = name;
    user.updatedAt = new Date();
    return publicUser(user);
  }
  private view(request: RequestRecord) {
    const user = this.users.get(request.userId);
    if (!user) throw new Error('Test fixture owner missing');
    return { ...request, user: publicUser(user) };
  }
  async listRequests(query: RequestQuery) {
    const search = query.search?.toLowerCase();
    const all = [...this.requests.values()]
      .filter(
        (request) =>
          (!query.userId || request.userId === query.userId) &&
          (!query.status || request.status === query.status) &&
          (!query.category || request.category === query.category) &&
          (!query.priority || request.priority === query.priority) &&
          (!search ||
            request.title.toLowerCase().includes(search) ||
            request.description.toLowerCase().includes(search)),
      )
      .sort(
        (a, b) =>
          (a.createdAt.getTime() - b.createdAt.getTime() ||
            a.id.localeCompare(b.id)) * (query.sort === 'oldest' ? 1 : -1),
      );
    return {
      data: all
        .slice((query.page - 1) * query.limit, query.page * query.limit)
        .map((request) => this.view(request)),
      pagination: pagination(query.page, query.limit, all.length),
    };
  }
  async metrics(userId?: string) {
    const all = [...this.requests.values()].filter(
      (request) => !userId || request.userId === userId,
    );
    return {
      total: all.length,
      pending: all.filter((request) => request.status === 'PENDING').length,
      inProgress: all.filter((request) => request.status === 'IN_PROGRESS')
        .length,
      resolved: all.filter((request) => request.status === 'RESOLVED').length,
      ...(userId ? {} : { totalUsers: this.users.size }),
    };
  }
  async findRequest(id: string) {
    const request = this.requests.get(id);
    return request ? this.view(request) : null;
  }
  async createRequest(userId: string, input: RequestInput) {
    const request: RequestRecord = {
      id: randomUUID(),
      userId,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...input,
    };
    this.requests.set(request.id, request);
    return { ...request };
  }
  async updatePendingRequest(
    id: string,
    userId: string,
    input: Partial<RequestInput>,
  ) {
    const request = this.requests.get(id);
    if (!request || request.userId !== userId || request.status !== 'PENDING')
      return null;
    Object.assign(request, input, { updatedAt: new Date() });
    return { ...request };
  }
  async transitionRequest(
    id: string,
    expected: Status,
    next: Status,
    ownerId?: string,
  ) {
    const request = this.requests.get(id);
    if (
      !request ||
      request.status !== expected ||
      (ownerId && request.userId !== ownerId)
    )
      return null;
    request.status = next;
    request.updatedAt = new Date();
    return { ...request };
  }
}
