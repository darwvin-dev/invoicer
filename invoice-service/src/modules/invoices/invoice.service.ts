import type { Invoice } from '@/types/invoice.js';
import type { CreateInvoiceInput, ListQueryInput, UpdateInvoiceInput } from './invoice.dto.js';
import { InvoiceModel } from './invoice.model.js';
import type { FilterQuery } from 'mongoose';
import type { InvoiceDoc } from './invoice.model.js';

export class NotFoundError extends Error {
  status = 404 as const;
  constructor(message = 'Invoice not found') { super(message); this.name = 'NotFoundError'; }
}

type InvoiceLike = InvoiceDoc & { _id: unknown };

function toDomain(doc: InvoiceLike): Invoice {
  return {
    _id: String(doc._id),
    customerId: doc.customerId,
    createdAt: doc.createdAt,
    currency: doc.currency,
    items: doc.items,
    invoiceTotal: doc.invoiceTotal,
  };
}

export async function createInvoice(dto: CreateInvoiceInput): Promise<Invoice> {
  const created = await InvoiceModel.create({
    ...dto,
    createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
  });
  return toDomain(created.toObject() as InvoiceLike);
}

export async function listInvoices(
  query: ListQueryInput
): Promise<{ page: number; limit: number; total: number; items: Invoice[] }> {
  const { from, to: toDate, page, limit } = query;

  const filter: FilterQuery<InvoiceDoc> = {};
  if (from || toDate) {
    filter.createdAt = {} as any;
    if (from)  (filter.createdAt as any).$gte = new Date(from);
    if (toDate) (filter.createdAt as any).$lte = new Date(toDate);
  }

  const docs = await InvoiceModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec() as InvoiceLike[];

  const total = await InvoiceModel.countDocuments(filter);
  return { page, limit, total, items: docs.map(toDomain) };
}

export async function getInvoiceById(id: string): Promise<Invoice> {
  const doc = await InvoiceModel.findById(id).lean().exec() as InvoiceLike | null;
  if (!doc) throw new NotFoundError();
  return toDomain(doc);
}

export async function updateInvoice(id: string, dto: UpdateInvoiceInput): Promise<Invoice> {
  const doc = await InvoiceModel.findById(id);
  if (!doc) throw new NotFoundError();

  if (dto.customerId !== undefined) doc.customerId = dto.customerId;
  if (dto.currency   !== undefined) doc.currency = dto.currency;
  if (dto.createdAt  !== undefined) doc.createdAt = new Date(dto.createdAt);
  if (dto.items      !== undefined) doc.items = dto.items as any; 

  const saved = await doc.save(); 
  return toDomain(saved.toObject() as InvoiceLike);
}

/** DELETE /invoices/:id */
export async function deleteInvoice(id: string): Promise<void> {
  const res = await InvoiceModel.findByIdAndDelete(id).lean().exec();
  if (!res) throw new NotFoundError();
}
