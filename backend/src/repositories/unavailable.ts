import { AppError } from '../utils/errors.js';
import type { Repository } from './repository.js';

const unavailable = async (): Promise<never> => {
  throw new AppError(
    503,
    'PERSISTENCE_UNAVAILABLE',
    'Database integration is not configured yet.',
  );
};

/** Honest runtime behavior until the database commit. No in-memory app database. */
export class UnavailableRepository implements Repository {
  ready = unavailable;
  findUserByEmail = unavailable;
  findUserById = unavailable;
  createUser = unavailable;
  invalidateSessions = unavailable;
  listUsers = unavailable;
  getUserDetail = unavailable;
  updateUserName = unavailable;
  listRequests = unavailable;
  metrics = unavailable;
  listHistory = unavailable;
  findRequest = unavailable;
  createRequest = unavailable;
  updatePendingRequest = unavailable;
  transitionRequest = unavailable;
}
