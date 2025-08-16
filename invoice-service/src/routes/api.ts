import { Router } from 'express';
import { reportRouter } from '@/modules/reports/report.routes.js';
import { customerRouter } from '@/modules/customers/customer.routes.js';
import { authRouter } from '@/modules/auth/auth.routes.js';
import { invoiceRouter } from '@/modules/invoices/invoice.routes.js';

const api = Router();

api.use('/customers', customerRouter);
api.use('/invoices', invoiceRouter);
api.use('/auth', authRouter);
api.use('/reports', reportRouter);

export default api;
