import { InvoiceController } from '@/modules/invoices/invoice.controller.js';
import { Router, type RequestHandler } from 'express';

type getIdType = RequestHandler<{ id: string }>;

export const invoiceRouter = Router();

invoiceRouter.post('/', InvoiceController.create as RequestHandler);
invoiceRouter.get('/', InvoiceController.list as RequestHandler);
invoiceRouter.get('/:id', InvoiceController.getById as getIdType);
invoiceRouter.patch('/:id', InvoiceController.patch as getIdType);
invoiceRouter.delete('/:id', InvoiceController.remove as getIdType);
