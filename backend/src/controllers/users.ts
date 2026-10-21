import type { RequestHandler } from 'express';
import type { UserService } from '../services/users.js';
import {
  idSchema,
  updateUserSchema,
  userQuerySchema,
} from '../validators/index.js';

export function userControllers(service: UserService) {
  const list: RequestHandler = async (req, res) => {
    res.json(
      await service.list(res.locals.actor, userQuerySchema.parse(req.query)),
    );
  };
  const get: RequestHandler = async (req, res) => {
    res.json({
      data: await service.get(res.locals.actor, idSchema.parse(req.params.id)),
    });
  };
  const update: RequestHandler = async (req, res) => {
    res.json({
      data: await service.update(
        res.locals.actor,
        idSchema.parse(req.params.id),
        updateUserSchema.parse(req.body).name,
      ),
    });
  };
  return { list, get, update };
}
