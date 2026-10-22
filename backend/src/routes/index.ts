import { Router } from 'express';
import type { Config } from '../config.js';
import type { Repository } from '../repositories/repository.js';
import { AuthService } from '../services/auth.js';
import { RequestService } from '../services/requests.js';
import { UserService } from '../services/users.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { limiter } from '../middleware/security.js';
import { authControllers } from '../controllers/auth.js';
import { requestControllers } from '../controllers/requests.js';
import { userControllers } from '../controllers/users.js';

export function apiRoutes(repository: Repository, config: Config) {
  const router = Router();
  const auth = new AuthService(repository, config);
  const requireAuth = authenticate(auth, config);
  const authController = authControllers(auth, config);
  const requests = requestControllers(new RequestService(repository));
  const users = userControllers(new UserService(repository));
  const authLimiter = limiter(20);

  router.post('/auth/register', authLimiter, authController.register);
  router.post('/auth/login', authLimiter, authController.login);
  router.post('/auth/logout', authController.logout);
  router.get('/auth/me', requireAuth, authController.me);

  const requestRouter = Router();
  requestRouter.use(requireAuth);
  requestRouter.get('/metrics', requests.metrics);
  requestRouter.get('/', requests.list);
  requestRouter.post('/', requests.create);
  requestRouter.get('/:id', requests.get);
  requestRouter.get('/:id/history', requests.history);
  requestRouter.patch('/:id', requests.update);
  requestRouter.delete('/:id', requests.cancel);
  requestRouter.patch('/:id/status', adminOnly, requests.transition);
  router.use('/requests', requestRouter);

  const userRouter = Router();
  userRouter.use(requireAuth, adminOnly);
  userRouter.get('/', users.list);
  userRouter.get('/:id', users.get);
  userRouter.patch('/:id', users.update);
  router.use('/users', userRouter);
  return router;
}
