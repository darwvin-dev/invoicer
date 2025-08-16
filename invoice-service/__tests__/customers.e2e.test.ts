import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";

describe("Customers E2E", () => {
  let app: any;
  let createdId: string;

  beforeAll(async () => {
    await startInMemoryMongo();
    const { createApp } = await import("@/app");
    app = createApp();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it("POST /api/v1/customers -> 201", async () => {
    const res = await request(app)
      .post("/api/v1/customers")
      .send({ name: "Alice", email: "alice@example.com", password: "Secret123!" })
      .expect(201);

    expect(res.body?.data?.email).toBe("alice@example.com");
    expect(res.body?.data?.passwordHash).toBeUndefined();
    createdId = res.body.data.id || res.body.data._id;
  });

  it("GET /api/v1/customers/:id -> 200", async () => {
    const res = await request(app).get(`/api/v1/customers/${createdId}`).expect(200);
    expect(res.body?.data?.email).toBe("alice@example.com");
  });

  it("GET /api/v1/customers?q=ali -> 200 with filter", async () => {
    const res = await request(app).get("/api/v1/customers?q=ali").expect(200);
    expect(res.body?.data?.length).toBeGreaterThanOrEqual(1);
    expect(res.body?.meta?.page).toBe(1);
  });

  it("PATCH /api/v1/customers/:id -> 200 (update name)", async () => {
    const res = await request(app)
      .patch(`/api/v1/customers/${createdId}`)
      .send({ name: "Alice Updated" })
      .expect(200);

    expect(res.body?.data?.name).toBe("Alice Updated");
  });

  it("DELETE /api/v1/customers/:id -> 204", async () => {
    await request(app).delete(`/api/v1/customers/${createdId}`).expect(204);
  });

  it("GET /api/v1/customers/:id -> 404 after delete", async () => {
    await request(app).get(`/api/v1/customers/${createdId}`).expect(404);
  });
});
