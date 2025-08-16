import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("@/config/rabbit", () => ({
  __esModule: true,
  publishJson: jest.fn(),
}));

const scheduleMock = jest.fn((_expr: string, _cb: () => void) => {
  return { start: jest.fn(), stop: jest.fn() };
});
jest.mock("node-cron", () => ({
  __esModule: true,
  default: { schedule: scheduleMock },
  schedule: scheduleMock,
}));

jest.mock("@/modules/reports/report.service", () => ({
  __esModule: true,
  computeDailyReport: jest.fn(),
  saveDailyReport: jest.fn(),
  listSavedReports: jest.fn(),
  getSavedReportById: jest.fn(),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

type DailyReport = {
  type: "daily_sales_report";
  dateRange: { from: string; to: string; tz: string };
  totalSalesAmount: number;
  items: { sku: string; totalQuantity: number }[];
};
type ComputeOpts = { tz?: string; date?: string };

describe("scheduleDailyReport()", () => {
  it("runOnce -> computeDailyReport سپس publishJson", async () => {
    const reportSvc = await import("@/modules/reports/report.service");
    const computeMock = reportSvc.computeDailyReport as unknown as
      jest.MockedFunction<(arg?: ComputeOpts) => Promise<DailyReport>>;

    const fakeReport: DailyReport = {
      type: "daily_sales_report",
      dateRange: { from: "2025-01-01", to: "2025-01-01", tz: "UTC" },
      totalSalesAmount: 123,
      items: [{ sku: "A", totalQuantity: 5 }],
    };
    computeMock.mockResolvedValue(fakeReport);

    const rabbit = await import("@/config/rabbit");
    const publishMock = rabbit.publishJson as unknown as
      jest.MockedFunction<(data: unknown) => Promise<void>>;

    const cronJob = await import("@/jobs/dailyReport.cron");
    const { runOnce } = cronJob.scheduleDailyReport();

    await runOnce();

    expect(computeMock).toHaveBeenCalledTimes(1);
    expect(publishMock).toHaveBeenCalledWith(fakeReport);
  });
});
