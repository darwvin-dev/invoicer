import { Router } from 'express';
import { reportRouter } from '@/modules/reports/report.routes';
import { customerRouter } from '@/modules/customers/customer.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { invoiceRouter } from '@/modules/invoices/invoice.routes';

const api = Router();

api.use('/customers', customerRouter);
api.use('/invoices', invoiceRouter);
api.use('/auth', authRouter);
api.use('/reports', reportRouter);

export default api;
