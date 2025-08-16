import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import request from "supertest";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";
import { createApp } from "@/app";

describe("Reports E2E", () => {
  let app: any;
  let customerId = "";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.TZ = "UTC";
    process.env.DISABLE_JOBS = "1";

    await startInMemoryMongo();
    app = createApp();

    const cust = await request(app)
      .post("/api/v1/customers")
      .send({
        name: "Ali Report",
        email: `ali_report_${Date.now()}@test.com`,
        password: "StrongPass123!",
      })
      .expect(201);

    customerId = String(cust.body?.data?._id);

    await request(app)
      .post("/api/v1/invoices")
      .send({
        customerId,
        currency: "EUR",
        items: [{ sku: "A", quantity: 3, unitPrice: 5 }],
      })
      .expect(201);
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it("GET /api/v1/reports/daily -> 200 (compute)", async () => {
    const res = await request(app).get("/api/v1/reports/daily").expect(200);

    expect(res.body).toBeTruthy();
    expect(res.body.data).toBeTruthy();
    expect(typeof res.body.data).toBe("object");
  });

  it("GET /api/v1/reports/daily?publish=true -> 200 and calls publish", async () => {
    const rabbit = await import("@/config/rabbit.js");
    const publishMock = jest.spyOn(rabbit, "publishJson").mockResolvedValue(undefined);

    const reportSvc = await import("@/modules/reports/report.service.js");
    const saveMock = jest
      .spyOn(reportSvc, "saveDailyReport")
      .mockResolvedValue(undefined as any);

    const res = await request(app).get("/api/v1/reports/daily?publish=true").expect(200);

    expect(res.body?.data).toBeTruthy();
    expect(publishMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledTimes(1);

    publishMock.mockRestore();
    saveMock.mockRestore();
  });
});
