import { Request, Response, NextFunction } from 'express';
import { CreateInvoiceDto, ListQueryDto, UpdateInvoiceDto } from './invoice.dto.js';
import { createInvoice, listInvoices, getInvoiceById, updateInvoice, deleteInvoice } from './invoice.service.js';
import { isValidObjectId } from 'mongoose';
import { BadRequestError, NotFoundError, UnprocessableEntityError } from '@/utils/errors.js';

export const InvoiceController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = CreateInvoiceDto.parse(req.body);
      const data = await createInvoice(dto);
      return res.status(201).json({ data });
    } catch (err) {
      if ((err as any).issues) {
        return res.status(422).json({ error: { code: 'VALIDATION', details: (err as any).issues } });
      }
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ListQueryDto.parse(req.query);
      const data = await listInvoices(q);
      return res.json({
        data: data.items,
        meta: {
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: Math.max(1, Math.ceil(data.total / data.limit)),
        },
      });
    } catch (err) {
      if ((err as any).issues) {
        return res.status(400).json({ error: { code: 'BAD_QUERY', details: (err as any).issues } });
      }
      next(err);
    }
  },

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw new BadRequestError("Invalid id");
    }
    const data = await getInvoiceById(id);
    if (!data) throw new NotFoundError("Invoice not found");
    return res.json({ data }); 
  },

  async patch(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw new BadRequestError("Invalid id");
    }
    const parsed = UpdateInvoiceDto.safeParse(req.body);
    if (!parsed.success) {
      throw new UnprocessableEntityError("Validation failed", parsed.error.issues);
    }
    const data = await updateInvoice(id, parsed.data);
    if (!data) throw new NotFoundError("Invoice not found");
    return res.json({ data }); 
  },

  async remove(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        throw new BadRequestError("Invalid id");
      }
      await deleteInvoice(id); 
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};
