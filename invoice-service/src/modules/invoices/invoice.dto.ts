import { z } from 'zod';

export const InvoiceItemDto = z.object({
  sku: z.string().trim().min(1),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
});

export const CreateInvoiceDto = z.object({
  customerId: z.string().trim().min(1),
  createdAt: z.iso.datetime({ offset: true }).optional(),
  currency: z.string().trim().min(1),
  items: z.array(InvoiceItemDto).min(1),
});
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceDto>;

export const UpdateInvoiceDto = CreateInvoiceDto.partial().strict().refine(
  (data) => !('invoiceTotal' in (data as any)),
  { message: 'invoiceTotal is computed and cannot be set manually.' }
);
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceDto>;

export const ListQueryDto = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  to:   z.iso.datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit:z.coerce.number().int().min(1).max(100).default(20),
});
export type ListQueryInput = z.infer<typeof ListQueryDto>;
