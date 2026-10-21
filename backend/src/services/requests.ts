import type { Repository } from '../repositories/repository.js';
import type {
  PublicUser,
  RequestInput,
  RequestQuery,
  Status,
} from '../types/domain.js';
import { AppError } from '../utils/errors.js';

export const transitions: Record<Status, readonly Status[]> = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
  RESOLVED: [],
  CANCELLED: [],
};
const conflict = () =>
  new AppError(
    409,
    'REQUEST_CHANGED',
    'This request changed or is no longer pending. Refresh and try again.',
  );
export class RequestService {
  constructor(private readonly repository: Repository) {}
  list(actor: PublicUser, query: Omit<RequestQuery, 'userId'>) {
    return this.repository.listRequests({
      ...query,
      userId: actor.role === 'USER' ? actor.id : undefined,
    });
  }
  metrics(actor: PublicUser) {
    return this.repository.metrics(
      actor.role === 'USER' ? actor.id : undefined,
    );
  }
  async get(actor: PublicUser, id: string) {
    const request = await this.repository.findRequest(id);
    if (!request || (actor.role !== 'ADMIN' && request.userId !== actor.id))
      throw new AppError(404, 'REQUEST_NOT_FOUND', 'Request not found.');
    return request;
  }
  create(actor: PublicUser, input: RequestInput) {
    this.memberOnly(actor);
    return this.repository.createRequest(actor.id, input);
  }
  async update(actor: PublicUser, id: string, input: Partial<RequestInput>) {
    this.memberOnly(actor);
    const request = await this.get(actor, id);
    if (request.status !== 'PENDING') throw conflict();
    const updated = await this.repository.updatePendingRequest(
      id,
      actor.id,
      input,
    );
    if (!updated) throw conflict();
    return updated;
  }
  async cancel(actor: PublicUser, id: string) {
    this.memberOnly(actor);
    const request = await this.get(actor, id);
    if (request.status !== 'PENDING') throw conflict();
    const updated = await this.repository.transitionRequest(
      id,
      'PENDING',
      'CANCELLED',
      actor.id,
    );
    if (!updated) throw conflict();
    return updated;
  }
  async transition(actor: PublicUser, id: string, next: Status) {
    if (actor.role !== 'ADMIN')
      throw new AppError(403, 'FORBIDDEN', 'Administrator access is required.');
    const request = await this.get(actor, id);
    if (!transitions[request.status].includes(next))
      throw new AppError(
        409,
        'INVALID_TRANSITION',
        `Cannot change ${request.status} to ${next}.`,
      );
    const updated = await this.repository.transitionRequest(
      id,
      request.status,
      next,
    );
    if (!updated) throw conflict();
    return updated;
  }
  private memberOnly(actor: PublicUser) {
    if (actor.role !== 'USER')
      throw new AppError(
        403,
        'FORBIDDEN',
        'Submit and edit requests from a member account.',
      );
  }
}
