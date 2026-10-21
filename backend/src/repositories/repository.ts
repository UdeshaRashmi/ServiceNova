import type {
  Metrics,
  Page,
  PageQuery,
  PublicUser,
  RequestInput,
  RequestQuery,
  RequestRecord,
  RequestView,
  Status,
  UserRecord,
} from '../types/domain.js';

/** Persistence boundary. The Prisma adapter is implemented in the database phase.
 * Conditional updates MUST be atomic to protect against concurrent status changes.
 * List metadata and data should be read from one consistent database snapshot.
 */
export interface Repository {
  ready(): Promise<void>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'USER';
  }): Promise<UserRecord>;
  invalidateSessions(userId: string): Promise<void>;
  listUsers(
    query: PageQuery,
  ): Promise<Page<PublicUser & { _count: { requests: number } }>>;
  getUserDetail(
    id: string,
  ): Promise<(PublicUser & { _count: { requests: number } }) | null>;
  updateUserName(id: string, name: string): Promise<PublicUser | null>;
  listRequests(query: RequestQuery): Promise<Page<RequestView>>;
  metrics(userId?: string): Promise<Metrics>;
  findRequest(id: string): Promise<RequestView | null>;
  createRequest(userId: string, input: RequestInput): Promise<RequestRecord>;
  updatePendingRequest(
    id: string,
    userId: string,
    input: Partial<RequestInput>,
  ): Promise<RequestRecord | null>;
  transitionRequest(
    id: string,
    expected: Status,
    next: Status,
    ownerId?: string,
  ): Promise<RequestRecord | null>;
}
