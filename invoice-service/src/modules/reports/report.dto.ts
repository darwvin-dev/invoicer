import { z } from 'zod';

export const DailyReportQueryDto = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), 
  publish: z.coerce.boolean().optional().default(false),
});

export type DailyReportQuery = z.infer<typeof DailyReportQueryDto>;

export const ListReportsQueryDto = z.object({
  from: z.iso.datetime().optional(), 
  to: z.iso.datetime().optional(),   
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListReportsQuery = z.infer<typeof ListReportsQueryDto>;
