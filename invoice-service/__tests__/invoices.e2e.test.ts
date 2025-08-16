import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";

describe("Invoices E2E", () => {
  let app: any;
  let id: string;

  beforeAll(async () => {
    await startInMemoryMongo();
    const { createApp } = await import("@/app.js");
    app = createApp();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it("POST /api/v1/invoices -> 201", async () => {
    const res = await request(app).post("/api/v1/invoices").send({
      customerId: "000000000000000000000001",
      currency: "EUR",
      items: [
        { sku: "SKU1", quantity: 2, unitPrice: 10 },
        { sku: "SKU2", quantity: 1, unitPrice: 20 }
      ],
      createdAt: new Date().toISOString()
    }).expect(201);

    expect(res.body?.invoiceTotal).toBe(40);
    id = res.body?.id || res.body?._id;
  });

  it("GET /api/v1/invoices -> 200 (list, pagination)", async () => {
    const res = await request(app).get("/api/v1/invoices?page=1&limit=10").expect(200);
    expect(Array.isArray(res.body?.items || res.body?.data)).toBe(true);
  });

  it("GET /api/v1/invoices/:id -> 200", async () => {
    const res = await request(app).get(`/api/v1/invoices/${id}`).expect(200);
    expect(res.body?.id || res.body?._id).toBeDefined();
  });

  it("PATCH /api/v1/invoices/:id -> 200", async () => {
    const res = await request(app).patch(`/api/v1/invoices/${id}`).send({
      items: [{ sku: "SKU1", quantity: 3, unitPrice: 10 }]
    }).expect(200);

    expect(res.body?.invoiceTotal).toBe(30);
  });

  it("DELETE /api/v1/invoices/:id -> 204", async () => {
    await request(app).delete(`/api/v1/invoices/${id}`).expect(204);
  });
});
