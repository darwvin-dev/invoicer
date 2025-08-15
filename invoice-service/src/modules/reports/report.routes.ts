import { Router } from 'express';
import { ReportController } from './report.controller.js';

export const reportRouter = Router();

reportRouter.get('/daily', ReportController.getDaily); 
reportRouter.get('/', ReportController.list);          
reportRouter.get('/:id', ReportController.getById);    
