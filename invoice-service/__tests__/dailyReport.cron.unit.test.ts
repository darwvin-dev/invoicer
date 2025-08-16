import { describe, it, expect, beforeEach, jest } from "@jest/globals";

type DailyReport = {
  type: "daily_sales_report";
  dateRange: { from: string; to: string; tz: string };
  totalSalesAmount: number;
  items: { sku: string; totalQuantity: number }[];
};

type ComputeOpts = { tz?: string; date?: string };

jest.mock("@/config/rabbit", () => ({
  __esModule: true,
  publishJson: jest.fn<Promise<void>, [unknown]>(),
}));

jest.mock("node-cron", () => ({
  __esModule: true,
  schedule: jest.fn((_expr: string, _cb: () => void) => {
    return { start: jest.fn(), stop: jest.fn() };
  }),
}));

jest.mock("@/modules/reports/report.service", () => ({
  __esModule: true,
  computeDailyReport: jest.fn<Promise<DailyReport>, [ComputeOpts?]>(),
  saveDailyReport: jest.fn<Promise<void>, [DailyReport]>(),
  listSavedReports: jest.fn(),
  getSavedReportById: jest.fn(),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("scheduleDailyReport()", () => {
  it("runOnce -> ابتدا computeDailyReport و سپس publishJson را صدا می‌زند", async () => {
    const reportSvc = await import("@/modules/reports/report.service");
    const computeSpy = jest.mocked(reportSvc.computeDailyReport);

    const fakeReport: DailyReport = {
      type: "daily_sales_report",
      dateRange: { from: "2025-01-01", to: "2025-01-01", tz: "UTC" },
      totalSalesAmount: 123,
      items: [{ sku: "A", totalQuantity: 5 }],
    };
    computeSpy.mockResolvedValue(fakeReport);

    const rabbit = await import("@/config/rabbit");
    const publishSpy = jest.mocked(rabbit.publishJson);

    const cronJob = await import("@/jobs/dailyReport.cron");
    const { runOnce } = cronJob.scheduleDailyReport();

    await runOnce();

    expect(computeSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith(fakeReport);
  });
});
