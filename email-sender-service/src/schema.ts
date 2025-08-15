import { z } from 'zod';

export const DailyReportSchema = z.object({
  type: z.literal('daily_sales_report'),
  dateRange: z.object({
    from: z.iso.datetime(),
    to: z.iso.datetime(),
    tz: z.string().min(1)
  }),
  totalSalesAmount: z.number(),
  items: z.array(z.object({
    sku: z.string().min(1),
    totalQuantity: z.number().int().min(0)
  }))
});

export type DailyReport = z.infer<typeof DailyReportSchema>;
