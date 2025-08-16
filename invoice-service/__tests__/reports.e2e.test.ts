import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import request from "supertest";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";
import { createApp } from "@/app";

jest.mock("@/config/rabbit", () => ({
  __esModule: true,
  publishJson: jest.fn(),
}));

describe("Reports E2E", () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.TZ = "UTC";
    process.env.DISABLE_JOBS = "1";
    await startInMemoryMongo();
    app = createApp();

    const { InvoiceModel } = await import("@/modules/invoices/invoice.model.js");
    await InvoiceModel.create({
      customerId: "C001",
      currency: "EUR",
      items: [{ sku: "A", quantity: 3, unitPrice: 5 }],
      createdAt: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it("GET /api/v1/reports/daily -> 200 (compute)", async () => {
    const res = await request(app).get("/api/v1/reports/daily").expect(200);
    expect(res.body.type).toBe("daily_sales_report");
  });

  it("GET /api/v1/reports/daily?publish=true -> 200 and calls publish", async () => {
    const rabbit = await import("@/config/rabbit");
    const publishMock = rabbit.publishJson as unknown as jest.Mock;

    const res = await request(app).get("/api/v1/reports/daily?publish=true").expect(200);
    expect(res.body.type).toBe("daily_sales_report");
    expect(publishMock).toHaveBeenCalledTimes(1);
  });
});
