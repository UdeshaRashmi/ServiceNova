import type { PrismaClient, Prisma } from '../generated/prisma/client.js';
import type { Repository } from './repository.js';
import { AppError } from '../utils/errors.js';
import {
  pagination,
  type PageQuery,
  type RequestInput,
  type RequestQuery,
  type Status,
} from '../types/domain.js';

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;
const ownerInclude = {
  user: { select: publicUserSelect },
} satisfies Prisma.ServiceRequestInclude;
const userWithCount = {
  ...publicUserSelect,
  _count: { select: { requests: true } },
} satisfies Prisma.UserSelect;

export class PrismaRepository implements Repository {
  constructor(private readonly db: PrismaClient) {}
  async ready() {
    try {
      await this.db.$transaction([
        this.db.$queryRaw`SELECT "id" FROM "User" LIMIT 1`,
        this.db.$queryRaw`SELECT "id" FROM "ServiceRequest" LIMIT 1`,
      ]);
    } catch {
      throw new AppError(
        503,
        'DATABASE_UNAVAILABLE',
        'Database is unavailable or migrations have not been applied.',
      );
    }
  }
  findUserByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }
  findUserById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }
  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'USER';
  }) {
    try {
      return await this.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
          role: 'USER',
        },
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      )
        throw new AppError(
          409,
          'EMAIL_EXISTS',
          'An account with that email already exists.',
        );
      throw error;
    }
  }
  async invalidateSessions(userId: string) {
    await this.db.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    });
  }
  async listUsers(query: PageQuery) {
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search } },
            { email: { contains: query.search } },
          ],
        }
      : {};
    const [data, count] = await this.db.$transaction([
      this.db.user.findMany({
        where,
        select: userWithCount,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.db.user.count({ where }),
    ]);
    return { data, pagination: pagination(query.page, query.limit, count) };
  }
  getUserDetail(id: string) {
    return this.db.user.findUnique({ where: { id }, select: userWithCount });
  }
  updateUserName(id: string, name: string) {
    return this.db.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id },
        data: { name },
      });
      return result.count
        ? tx.user.findUnique({ where: { id }, select: publicUserSelect })
        : null;
    });
  }
  async listRequests(query: RequestQuery) {
    const where: Prisma.ServiceRequestWhereInput = {
      userId: query.userId,
      status: query.status,
      category: query.category,
      priority: query.priority,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search } },
              { description: { contains: query.search } },
            ],
          }
        : {}),
    };
    const order = query.sort === 'oldest' ? 'asc' : 'desc';
    const [data, count] = await this.db.$transaction([
      this.db.serviceRequest.findMany({
        where,
        include: ownerInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: order }, { id: order }],
      }),
      this.db.serviceRequest.count({ where }),
    ]);
    return { data, pagination: pagination(query.page, query.limit, count) };
  }
  metrics(userId?: string) {
    return this.db.$transaction(async (tx) => {
      const groups = await tx.serviceRequest.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      });
      const count = (status: Status) =>
        groups.find((group) => group.status === status)?._count._all || 0;
      return {
        total: groups.reduce((sum, group) => sum + group._count._all, 0),
        pending: count('PENDING'),
        inProgress: count('IN_PROGRESS'),
        resolved: count('RESOLVED'),
        ...(userId ? {} : { totalUsers: await tx.user.count() }),
      };
    });
  }
  findRequest(id: string) {
    return this.db.serviceRequest.findUnique({
      where: { id },
      include: ownerInclude,
    });
  }
  createRequest(userId: string, input: RequestInput) {
    return this.db.serviceRequest.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        userId,
        status: 'PENDING',
      },
    });
  }
  updatePendingRequest(
    id: string,
    userId: string,
    input: Partial<RequestInput>,
  ) {
    return this.db.$transaction(async (tx) => {
      const result = await tx.serviceRequest.updateMany({
        where: { id, userId, status: 'PENDING' },
        data: {
          title: input.title,
          description: input.description,
          category: input.category,
          priority: input.priority,
        },
      });
      return result.count
        ? tx.serviceRequest.findUnique({ where: { id } })
        : null;
    });
  }
  transitionRequest(
    id: string,
    expected: Status,
    next: Status,
    ownerId?: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const result = await tx.serviceRequest.updateMany({
        where: { id, status: expected, userId: ownerId },
        data: { status: next },
      });
      return result.count
        ? tx.serviceRequest.findUnique({ where: { id } })
        : null;
    });
  }
}
