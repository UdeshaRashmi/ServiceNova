import type { RequestHandler } from 'express';
import type { RequestService } from '../services/requests.js';
import {
  idSchema,
  historyQuerySchema,
  requestQuerySchema,
  requestSchema,
  statusSchema,
  updateRequestSchema,
} from '../validators/index.js';

export function requestControllers(service: RequestService) {
  const list: RequestHandler = async (req, res) => {
    res.json(
      await service.list(res.locals.actor, requestQuerySchema.parse(req.query)),
    );
  };
  const metrics: RequestHandler = async (_req, res) => {
    res.json({ data: await service.metrics(res.locals.actor) });
  };
  const get: RequestHandler = async (req, res) => {
    res.json({
      data: await service.get(res.locals.actor, idSchema.parse(req.params.id)),
    });
  };
  const history: RequestHandler = async (req, res) => {
    res.json(
      await service.history(
        res.locals.actor,
        idSchema.parse(req.params.id),
        historyQuerySchema.parse(req.query),
      ),
    );
  };
  const create: RequestHandler = async (req, res) => {
    const request = await service.create(
      res.locals.actor,
      requestSchema.parse(req.body),
    );
    res
      .location(`/api/requests/${request.id}`)
      .status(201)
      .json({ data: request });
  };
  const update: RequestHandler = async (req, res) => {
    res.json({
      data: await service.update(
        res.locals.actor,
        idSchema.parse(req.params.id),
        updateRequestSchema.parse(req.body),
      ),
    });
  };
  const cancel: RequestHandler = async (req, res) => {
    await service.cancel(res.locals.actor, idSchema.parse(req.params.id));
    res.status(204).end();
  };
  const transition: RequestHandler = async (req, res) => {
    res.json({
      data: await service.transition(
        res.locals.actor,
        idSchema.parse(req.params.id),
        statusSchema.parse(req.body).status,
      ),
    });
  };
  return { list, metrics, history, get, create, update, cancel, transition };
}
