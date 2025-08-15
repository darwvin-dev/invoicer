import { Request, Response, NextFunction } from 'express';
import { DailyReportQueryDto, ListReportsQueryDto } from './report.dto.js';
import { computeDailyReport, saveDailyReport, listSavedReports, getSavedReportById } from './report.service.js';
import { publishJson } from '@/config/rabbit.js';

export const ReportController = {
    // GET /reports/daily?date=YYYY-MM-DD&publish=true
    async getDaily(req: Request, res: Response, next: NextFunction) {
        try {
            const { date, publish } = DailyReportQueryDto.parse(req.query);
            const report = await computeDailyReport({ date });

            if (publish) {
                await publishJson(report);
                await saveDailyReport(report);
            }

            res.json(report);
        } catch (err) {
            if ((err as any).issues) {
                return res.status(400).json({ error: { code: 'BAD_QUERY', details: (err as any).issues } });
            }
            next(err);
        }
    },

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const q = ListReportsQueryDto.parse(req.query);
            const data = await listSavedReports(q);
            res.json(data);
        } catch (err) {
            if ((err as any).issues) {
                return res.status(400).json({ error: { code: 'BAD_QUERY', details: (err as any).issues } });
            }
            next(err);
        }
    },  

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) return res.status(404).json({ message: "Nof Found." })
            const data = await getSavedReportById(req.params.id);
            res.json(data);
        } catch (err: any) {
            if (err?.status === 404) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } });
            next(err);
        }
    },
};
