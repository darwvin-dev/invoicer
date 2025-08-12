import { Router } from 'express';
import { CustomerController } from './customer.controller';

const router = Router();
router.post('/', CustomerController.create);
router.get('/', CustomerController.list);
router.get('/:id', CustomerController.getById);
router.patch('/:id', CustomerController.update);
router.delete('/:id', CustomerController.remove);

export default router;
