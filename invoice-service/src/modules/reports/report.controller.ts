import { Request, Response, NextFunction } from "express";
import {
  DailyReportQueryDto,
  ListReportsQueryDto,
} from "./report.dto.js";
import {
  computeDailyReport,
  saveDailyReport,
  listSavedReports,
  getSavedReportById,
} from "./report.service.js";
import { publishJson } from "@/config/rabbit.js";
import {
  BadRequestError,
  NotFoundError,
} from "@/utils/errors.js";

export const ReportController = {
  /** GET /reports/daily?date=YYYY-MM-DD&publish=true */
  getDaily: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = DailyReportQueryDto.safeParse(req.query);
      if (!parsed.success) {
        throw new BadRequestError("Invalid query", parsed.error.issues);
      }
      const { date, publish } = parsed.data;

      const report = await computeDailyReport({ date });

      if (publish) {
        await publishJson(report);
        await saveDailyReport(report);
      }

      return res.json({ data: report });
    } catch (err) {
      next(err);
    }
  },

  /** GET /reports */
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ListReportsQueryDto.safeParse(req.query);
      if (!parsed.success) {
        throw new BadRequestError("Invalid query", parsed.error.issues);
      }
      const data = await listSavedReports(parsed.data);
      return res.json(data); 
    } catch (err) {
      next(err);
    }
  },

  /** GET /reports/:id */
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) throw new NotFoundError("Report not found");

      const data = await getSavedReportById(id);
      if (!data) throw new NotFoundError("Report not found");

      return res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};
