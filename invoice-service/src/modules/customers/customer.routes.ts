import { Router } from 'express';
import { CustomerController } from './customer.controller.js';

export const customerRouter = Router();
customerRouter.post('/', CustomerController.create);
customerRouter.get('/', CustomerController.list);
customerRouter.get('/:id', CustomerController.getById);
customerRouter.patch('/:id', CustomerController.update);
customerRouter.delete('/:id', CustomerController.remove);
