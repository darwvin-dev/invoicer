import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";
import { createApp } from "@/app";

describe("Invoices E2E", () => {
  let app: any;
  let id = "";
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
        name: "Ali Invoice",
        email: `ali_invoice_${Date.now()}@test.com`,
        password: "StrongPass123!",
      })
      .expect(201);

    customerId = String(cust.body?.data?._id);
    expect(customerId).toMatch(/^[0-9a-fA-F]{24}$/);
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it("POST /api/v1/invoices -> 201", async () => {
    const res = await request(app)
      .post("/api/v1/invoices")
      .send({
        customerId,
        currency: "EUR",
        items: [{ sku: "A", quantity: 2, unitPrice: 10 }],
      })
      .expect(201);

    const data = res.body?.data || {};
    id = String(data._id || data.id || "");
    expect(id).toMatch(/^[0-9a-fA-F]{24}$/);

    expect(data.invoiceTotal).toBeDefined();
  });

  it("GET /api/v1/invoices -> 200 (list, pagination)", async () => {
    const res = await request(app).get("/api/v1/invoices?page=1&limit=10").expect(200);
    const items = res.body?.data;
    expect(Array.isArray(items)).toBe(true);
  });

  it("GET /api/v1/invoices/:id -> 200", async () => {
    const res = await request(app).get(`/api/v1/invoices/${id}`).expect(200);
    const data = res.body?.data || {};
    expect(String(data._id || data.id)).toBe(id);
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
