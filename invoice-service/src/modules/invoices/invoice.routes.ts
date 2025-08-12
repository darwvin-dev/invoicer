import { InvoiceController } from '@/modules/invoices/invoice.controller';
import { Router, type RequestHandler } from 'express';

type getIdType = RequestHandler<{ id: string }>;

const r = Router();

r.post('/', InvoiceController.create as RequestHandler);
r.get('/', InvoiceController.list as RequestHandler);
r.get('/:id', InvoiceController.getById as getIdType);
r.patch('/:id', InvoiceController.patch as getIdType);
r.delete('/:id', InvoiceController.remove as getIdType);

export default r;
