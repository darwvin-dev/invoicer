import { DateTime } from 'luxon';
import { InvoiceModel } from '../invoices/invoice.model.js';
import { ReportModel, type ReportDoc } from './report.model.js';

export type DailyReport = {
  type: 'daily_sales_report';
  dateRange: { from: string; to: string; tz: string };
  totalSalesAmount: number;
  items: { sku: string; totalQuantity: number }[];
};

export type ComputeOpts = { tz?: string; date?: string };

export const getDayRangeUTC = ({ tz = process.env.TZ || 'Europe/Berlin', date }: ComputeOpts) => {
  const base = date
    ? DateTime.fromISO(date, { zone: tz })
    : DateTime.now().setZone(tz).minus({ days: 1 });
  const start = base.startOf('day');
  const end   = base.endOf('day');
  return {
    tz,
    startUTC: start.toUTC().toJSDate(),
    endUTC: end.toUTC().toJSDate(),
    startISO: start.toUTC().toISO(),
    endISO: end.toUTC().toISO(),
  };
};

export const computeDailyReport = async (opts: ComputeOpts = {}): Promise<DailyReport> => {
  const { tz, startUTC, endUTC, startISO, endISO } = getDayRangeUTC(opts);

  const rows = await InvoiceModel.aggregate([
    { $match: { createdAt: { $gte: startUTC, $lte: endUTC } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.sku',
        totalQuantity: { $sum: '$items.quantity' },
        totalAmount: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
      }
    }
  ]);

  const totalSalesAmount = Number(
    rows.reduce((s: number, r: any) => s + (r.totalAmount || 0), 0).toFixed(2)
  );

  const items = rows.map((r: any) => ({
    sku: r._id as string,
    totalQuantity: r.totalQuantity as number,
  }));

  return {
    type: 'daily_sales_report',
    dateRange: { from: startISO!, to: endISO!, tz: tz! },
    totalSalesAmount,
    items,
  };
};

export const saveDailyReport = async (report: DailyReport): Promise<ReportDoc> => {
  const query = ReportModel.findOneAndUpdate(
    { 'dateRange.from': report.dateRange.from },
    report,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const saved = await query.lean().exec(); 
  return saved as ReportDoc;
};

export const listSavedReports = async (params: {
  from?: string;
  to?: string;
  page: number;
  limit: number;
}): Promise<{ page: number; limit: number; total: number; items: ReportDoc[] }> => {
  const { from, to, page, limit } = params;
  const filter: Record<string, any> = {};
  if (from || to) {
    filter['dateRange.from'] = {};
    if (from) filter['dateRange.from'].$gte = from;
    if (to)   filter['dateRange.from'].$lte = to;
  }

  const q = ReportModel.find(filter)
    .sort({ 'dateRange.from': -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const [rows, total] = await Promise.all([
    q.lean().exec(),
    ReportModel.countDocuments(filter),
  ]);

  return { page, limit, total, items: rows as ReportDoc[] };
};

export const getSavedReportById = async (id: string): Promise<ReportDoc> => {
  const doc = await ReportModel.findById(id).lean().exec();
  if (!doc) {
    const err = new Error('Report not found') as any;
    err.status = 404;
    throw err;
  }
  return doc as ReportDoc;
};
