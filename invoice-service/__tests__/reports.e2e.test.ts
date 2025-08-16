jest.mock("@/config/rabbit", () => ({
  publishJson: jest.fn().mockResolvedValue(undefined),
}));

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { DateTime } from "luxon";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";

describe("Reports E2E", () => {
  let app: any;

  beforeAll(async () => {
    await startInMemoryMongo();

    const { InvoiceModel } = await import("@/modules/invoices/invoice.model.js");
    const tz = process.env.TZ || "Europe/Amsterdam";
    const prev = DateTime.now().setZone(tz).minus({ days: 1 });
    const createdAt = prev.set({ hour: 12 }).toJSDate();

    await InvoiceModel.create({
      customerId: new mongoose.Types.ObjectId(),
      createdAt,
      currency: "EUR",
      items: [{ sku: "SKU1", quantity: 4, unitPrice: 5 }],
      invoiceTotal: 20
    });

    const { createApp } = await import("@/app.js");
    app = createApp();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it("GET /api/v1/reports/daily -> 200 (compute)", async () => {
    const res = await request(app).get("/api/v1/reports/daily").expect(200);
    expect(res.body?.totalSalesAmount).toBeGreaterThanOrEqual(20);
  });

  it("GET /api/v1/reports/daily?publish=true -> 200 and calls publish/save", async () => {
    const rabbit = await import("@/config/rabbit.js");
    const publishSpy = rabbit.publishJson as unknown as jest.Mock;

    const svc = await import("@/modules/reports/report.service.js");
    const saveSpy = jest.spyOn(svc, "saveDailyReport");

    const res = await request(app).get("/api/v1/reports/daily?publish=true").expect(200);
    expect(res.body?.items?.length).toBeGreaterThan(0);

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});
