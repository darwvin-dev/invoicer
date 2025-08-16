import type { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import z from 'zod';
import { CustomerModel, type CustomerDoc } from './customer.model.js';

/**
 * Helpers
 */
const asyncHandler = <T extends (...args: any[]) => Promise<any>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

class AppError extends Error {
  statusCode: number;
  details?: unknown;
  constructor(statusCode: number, message?: string, details?: unknown) {
    super(message || getReasonPhrase(statusCode));
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Ensure we never leak passwordHash
const customerProjection = '-passwordHash' as const;

// Schemas
const createBodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  passwordHash: z.string().min(20), // already hashed
});

const updateBodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().max(254).optional(),
  // passwordHash updates should be via a dedicated endpoint; block here on purpose
}).refine((data) => !('passwordHash' in data), {
  message: 'Updating passwordHash is not allowed here',
});

const listQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  q: z.string().trim().optional(),
});

/**
 * Controller
 */
export class CustomerController {
  /** Create */
  static create = asyncHandler(async (req: Request, res: Response) => {
    const body = createBodySchema.parse(req.body);

    try {
      const doc = await CustomerModel.create(body);
      const created = await CustomerModel.findById(doc._id).select(customerProjection).lean();
      return res.status(StatusCodes.CREATED).json({
        data: created,
      });
    } catch (err: any) {
      // Handle duplicate email (E11000)
      if (err?.code === 11000 && err?.keyPattern?.email) {
        throw new AppError(StatusCodes.CONFLICT, 'Email is already in use');
      }
      throw err;
    }
  });

  /** Get by id */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid id');

    const doc = await CustomerModel.findById(id).select(customerProjection).lean();
    if (!doc) throw new AppError(StatusCodes.NOT_FOUND, 'Customer not found');

    return res.json({ data: doc });
  });

  /** List with pagination, search, sort */
  static list = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, sort, order, q } = listQuerySchema.parse(req.query as any);

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    // Ensure sort field is safe (whitelist)
    const allowedSorts = new Set(['createdAt', 'name', 'email', '_id']);
    const sortField = allowedSorts.has(sort) ? sort : 'createdAt';

    const [items, total] = await Promise.all([
      CustomerModel.find(filter)
        .select(customerProjection)
        .sort({ [sortField]: order === 'asc' ? 1 : -1, _id: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CustomerModel.countDocuments(filter),
    ]);

    return res.json({
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        sort: sortField,
        order,
        q: q || null,
      },
    });
  });

  /** Update (partial) */
  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid id');

    const body = updateBodySchema.parse(req.body);

    try {
      const updated = await CustomerModel.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true, runValidators: true, projection: customerProjection },
      ).lean();

      if (!updated) throw new AppError(StatusCodes.NOT_FOUND, 'Customer not found');
      return res.json({ data: updated });
    } catch (err: any) {
      if (err?.code === 11000 && err?.keyPattern?.email) {
        throw new AppError(StatusCodes.CONFLICT, 'Email is already in use');
      }
      throw err;
    }
  });

  /** Delete (hard delete) */
  static remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid id');

    const deleted = await CustomerModel.findByIdAndDelete(id).select(customerProjection).lean();
    if (!deleted) throw new AppError(StatusCodes.NOT_FOUND, 'Customer not found');

    return res.status(StatusCodes.NO_CONTENT).send();
  });
}