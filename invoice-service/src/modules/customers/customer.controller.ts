import type { Request, Response, NextFunction } from "express";
import z from "zod";
import {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "./customer.service.js";
import {
  BadRequestError,
  UnprocessableEntityError,
} from "@/utils/errors.js";

const asyncHandler =
  <T extends (...args: any[]) => Promise<any>>(fn: T) =>
    (req: Request, res: Response, next: NextFunction) =>
      fn(req, res, next).catch(next);

const createBodySchema = z.object({
  name: z.string().min(2).max(120).trim(),
  email: z.email().max(254).trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

const updateBodySchema = z
  .object({
    name: z.string().min(2).max(120).trim().optional(),
    email: z.email().max(254).trim().toLowerCase().optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

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
  static create = asyncHandler(async (req, res) => {
    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new UnprocessableEntityError("Validation failed", parsed.error.issues);
    }
    const data = await createCustomer(parsed.data);
    return res.status(201).json({ data });
  });

  static getById = asyncHandler(async (req, res) => {
    const data = await getCustomerById(req.params.id);
    return res.json({ data });
  });

  static list = asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new BadRequestError("Invalid query", parsed.error.issues);
    }
    const result = await listCustomers(parsed.data);
    return res.json(result); // { data, meta }
  });

  static update = asyncHandler(async (req, res) => {
    const parsed = updateBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new UnprocessableEntityError("Validation failed", parsed.error.issues);
    }
    const data = await updateCustomer(req.params.id, parsed.data);
    return res.json({ data });
  });

  static remove = asyncHandler(async (req, res) => {
    await deleteCustomer(req.params.id);
    return res.status(204).send();
  });
}
