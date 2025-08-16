import bcrypt from "bcryptjs";
import { isValidObjectId, type FilterQuery } from "mongoose";
import { CustomerModel, type CustomerDoc } from "./customer.model.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  AppError,
} from "@/utils/errors.js";

export type CreateCustomerInput = {
  name: string;
  email: string;
  password: string;
};

export type UpdateCustomerInput = Partial<{
  name: string;
  email: string;
  password: string;
}>;

export type ListQueryInput = {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  q?: string;
  createdFrom?: Date;
  createdTo?: Date;
};

const projection = "-passwordHash" as const;

const sanitizeRegex = (q: string) =>
  new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

export const createCustomer = async(input: CreateCustomerInput) => {
  const saltRounds = Number(process.env.BCRYPT_ROUNDS || 12);
  const passwordHash = await bcrypt.hash(input.password, saltRounds);

  try {
    const doc = await CustomerModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return await CustomerModel.findById(doc._id).select(projection).lean();
  } catch (err: any) {
    if (err?.code === 11000 && (err?.keyPattern?.email || err?.keyValue?.email)) {
      throw new ConflictError("Email is already in use");
    }
    if (err?.name === "ValidationError") {
      throw new BadRequestError("Validation failed", err?.errors);
    }
    throw err as AppError;
  }
}

export const getCustomerById = async(id: string) => {
  if (!isValidObjectId(id)) throw new BadRequestError("Invalid id");

  const doc = await CustomerModel.findById(id).select(projection).lean();
  if (!doc) throw new NotFoundError("Customer not found");
  return doc;
}

export const listCustomers = async(q: ListQueryInput) => {
  const { page, limit, sort, order, q: query, createdFrom, createdTo } = q;

  const filter: FilterQuery<CustomerDoc> = {};
  if (query) {
    const rx = sanitizeRegex(query);
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (createdFrom || createdTo) {
    filter.createdAt = {};
    if (createdFrom) (filter.createdAt as any).$gte = createdFrom;
    if (createdTo) (filter.createdAt as any).$lte = createdTo;
  }

  const allowedSorts = new Set<keyof CustomerDoc | "_id">([
    "createdAt",
    "name",
    "email",
    "_id",
  ]);
  const sortField = allowedSorts.has(sort as any) ? (sort as string) : "createdAt";
  const sortSpec: Record<string, 1 | -1> = {
    [sortField]: order === "asc" ? 1 : -1,
    _id: 1,
  };

  const [items, total] = await Promise.all([
    CustomerModel.find(filter)
      .select(projection)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CustomerModel.countDocuments(filter),
  ]);

  return {
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      sort: sortField,
      order,
      q: query ?? null,
    },
  };
}

export const updateCustomer = async(id: string, input: UpdateCustomerInput) => {
  if (!isValidObjectId(id)) throw new BadRequestError("Invalid id");

  const update: any = { ...input };

  if (update.password) {
    const salt = await bcrypt.genSalt(10);
    update.passwordHash = await bcrypt.hash(update.password, salt);
    delete update.password;
  }

  try {
    const updated = await CustomerModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true, projection }
    ).lean();

    if (!updated) throw new NotFoundError("Customer not found");
    return updated;
  } catch (err: any) {
    if (err?.code === 11000 && (err?.keyPattern?.email || err?.keyValue?.email)) {
      throw new ConflictError("Email is already in use");
    }
    if (err?.name === "ValidationError") {
      throw new BadRequestError("Validation failed", err?.errors);
    }
    throw err as AppError;
  }
}

export const deleteCustomer = async(id: string) => {
  if (!isValidObjectId(id)) throw new BadRequestError("Invalid id");

  const { deletedCount } = await CustomerModel.deleteOne({ _id: id }).lean();
  if (!deletedCount) throw new NotFoundError("Customer not found");
}
