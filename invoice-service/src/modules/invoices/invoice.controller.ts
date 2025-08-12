import { Request, Response, NextFunction } from 'express';
import { CreateInvoiceDto, ListQueryDto, UpdateInvoiceDto } from './invoice.dto.js';
import { createInvoice, listInvoices, getInvoiceById, updateInvoice, deleteInvoice } from './invoice.service.js';

export const InvoiceController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = CreateInvoiceDto.parse(req.body);
      const data = await createInvoice(dto);
      res.status(201).json(data);
    } catch (err) {
      if ((err as any).issues) return res.status(422).json({ error: { code: 'VALIDATION', details: (err as any).issues } });
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ListQueryDto.parse(req.query);
      const data = await listInvoices(q);
      res.json(data);
    } catch (err) {
      if ((err as any).issues) return res.status(400).json({ error: { code: 'BAD_QUERY', details: (err as any).issues } });
      next(err);
    }
  },

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const data = await getInvoiceById(req.params.id);
      res.json(data);
    } catch (err) { next(err); }
  },

  async patch(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const dto = UpdateInvoiceDto.parse(req.body);
      const data = await updateInvoice(req.params.id, dto);
      res.json(data);
    } catch (err) {
      if ((err as any).issues) return res.status(422).json({ error: { code: 'VALIDATION', details: (err as any).issues } });
      next(err);
    }
  },

  async remove(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      await deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  }
};
