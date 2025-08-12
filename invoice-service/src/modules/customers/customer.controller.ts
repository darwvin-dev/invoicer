import type { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import z from "zod";
import { CustomerModel, type CustomerDoc } from "./customer.model";
import bcrypt from "bcryptjs";

const asyncHandler =
  <T extends (...args: any[]) => Promise<any>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

class AppError extends Error {
  statusCode: number;
  details?: unknown;
  constructor(statusCode: number, message?: string, details?: unknown) {
    super(message || getReasonPhrase(statusCode));
    this.statusCode = statusCode;
    this.details = details;
  }
}

const customerProjection = "-passwordHash" as const;

const sanitizeRegex = (q: string) =>
  new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const createBodySchema = z.object({
  name: z.string().min(2).max(120).trim(),
  email: z.string().email().max(254).trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

const updateBodySchema = z
  .object({
    name: z.string().min(2).max(120).trim().optional(),
    email: z.string().email().max(254).trim().toLowerCase().optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .refine((data) => !("passwordHash" in data), {
    message: "Updating passwordHash is not allowed here",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  q: z.string().trim().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export class CustomerController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const { password, ...rest } = createBodySchema.parse(req.body);

    try {
      const saltRounds = Number(process.env.BCRYPT_ROUNDS || 12);
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const doc = await CustomerModel.create({ ...rest, passwordHash });

      const created = await CustomerModel.findById(doc._id)
        .select(customerProjection)
        .lean();

      return res.status(StatusCodes.CREATED).json({ data: created });
    } catch (err: any) {
      if (
        err?.code === 11000 &&
        (err?.keyPattern?.email || err?.keyValue?.email)
      ) {
        throw new AppError(StatusCodes.CONFLICT, "Email is already in use");
      }
      if (err?.name === "ValidationError") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Validation failed",
          err?.errors
        );
      }
      throw err;
    }
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid id");

    const doc = await CustomerModel.findById(id)
      .select(customerProjection)
      .lean();
    if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Customer not found");

    return res.json({ data: doc });
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, sort, order, q, createdFrom, createdTo } =
      listQuerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (q) {
      const regex = sanitizeRegex(q);
      filter.$or = [{ name: regex }, { email: regex }];
    }
    if (createdFrom || createdTo) {
      filter.createdAt = {};
      if (createdFrom) filter.createdAt.$gte = createdFrom;
      if (createdTo) filter.createdAt.$lte = createdTo;
    }

    const allowedSorts = new Set<keyof CustomerDoc | "_id">([
      "createdAt",
      "name",
      "email",
      "_id",
    ]);
    const sortField = allowedSorts.has(sort as any)
      ? (sort as string)
      : "createdAt";
    const sortSpec: Record<string, 1 | -1> = {
      [sortField]: order === "asc" ? 1 : -1,
      _id: 1,
    };

    const [items, total] = await Promise.all([
      CustomerModel.find(filter)
        .select(customerProjection)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerModel.countDocuments(filter),
    ]);

    return res.json({
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        sort: sortField,
        order,
        q: q ?? null,
      },
    });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid id");

    const body = updateBodySchema.parse(req.body);

    try {
      if (body.password) {
        if (body.password.length < 8) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Password must be at least 8 characters"
          );
        }
        const salt = await bcrypt.genSalt(10);
        body.password = await bcrypt.hash(body.password, salt);
      } else {
        delete body.password;
      }

      const updated = await CustomerModel.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true, runValidators: true, projection: customerProjection }
      ).lean();

      if (!updated)
        throw new AppError(StatusCodes.NOT_FOUND, "Customer not found");
      return res.json({ data: updated });
    } catch (err: any) {
      if (
        err?.code === 11000 &&
        (err?.keyPattern?.email || err?.keyValue?.email)
      ) {
        throw new AppError(StatusCodes.CONFLICT, "Email is already in use");
      }
      if (err?.name === "ValidationError") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Validation failed",
          err?.errors
        );
      }
      throw err;
    }
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid id");

    const deleted = await CustomerModel.findByIdAndDelete(id)
      .select("_id")
      .lean();
    if (!deleted)
      throw new AppError(StatusCodes.NOT_FOUND, "Customer not found");

    return res.status(StatusCodes.NO_CONTENT).send();
  });
}
