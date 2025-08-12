import invoicesRouter from '@/modules/invoices/invoice.routes';
import authRouter from '@/modules/auth/auth.routes';
import customerRoutes from '@/modules/customers/customer.routes';
import { Router } from 'express';

const api = Router();

api.use('/customers', customerRoutes);
api.use('/invoices', invoicesRouter);
api.use('/auth', authRouter);

export default api;
