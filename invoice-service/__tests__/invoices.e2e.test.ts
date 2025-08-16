import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";
import { createApp } from "@/app";

describe("Invoices E2E", () => {
  let app: any;
  let id = "";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.TZ = "UTC";
    process.env.DISABLE_JOBS = "1";
    await startInMemoryMongo();
    app = createApp();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it("POST /api/v1/invoices -> 201", async () => {
    const res = await request(app)
      .post("/api/v1/invoices")
      .send({
        customerId: "C001",
        currency: "EUR",
        items: [{ sku: "A", quantity: 2, unitPrice: 10 }],
      })
      .expect(201);

    const data = res.body?.data || {};
    id = data._id || data.id;
    expect(id).toBeTruthy();

    expect(data.invoiceTotal).toBeDefined();
  });

  it("GET /api/v1/invoices -> 200 (list, pagination)", async () => {
    const res = await request(app).get("/api/v1/invoices?page=1&pageSize=10").expect(200);
    const items = res.body?.data;
    expect(Array.isArray(items)).toBe(true);
  });

  it("GET /api/v1/invoices/:id -> 200", async () => {
    const res = await request(app).get(`/api/v1/invoices/${id}`).expect(200);
    const data = res.body?.data || {};
    expect(data._id || data.id).toBe(id);
  });

  it("PATCH /api/v1/invoices/:id -> 200 (update currency)", async () => {
    const res = await request(app)
      .patch(`/api/v1/invoices/${id}`)
      .send({ currency: "USD" })
      .expect(200);

    const data = res.body?.data || {};
    expect(data.currency).toBe("USD");
  });

  it("DELETE /api/v1/invoices/:id -> 204", async () => {
    await request(app).delete(`/api/v1/invoices/${id}`).expect(204);
  });
});
