import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";
import { createApp } from "@/app";

describe("Customers E2E", () => {
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

  it("POST /api/v1/customers -> 201", async () => {
    const res = await request(app)
      .post("/api/v1/customers")
      .send({ name: "Ali", email: "ali@example.com", password: "P@ssw0rd123" }) 
      .expect(201);

    const data = res.body?.data || {};
    id = data.id || data._id;
    expect(id).toBeTruthy();
  });

  it("GET /api/v1/customers/:id -> 200", async () => {
    const res = await request(app).get(`/api/v1/customers/${id}`).expect(200);
    const data = res.body?.data || {};
    expect(data.email).toBe("ali@example.com");
  });

  it("GET /api/v1/customers?q=ali -> 200 with filters", async () => {
    const res = await request(app).get("/api/v1/customers?q=ali").expect(200);
    const items = res.body?.data;
    expect(Array.isArray(items)).toBe(true);
    expect(items[0].email).toBe("ali@example.com");
  });

  it("PATCH /api/v1/customers/:id -> 200 name updated", async () => {
    const res = await request(app)
      .patch(`/api/v1/customers/${id}`)
      .send({ name: "Ali Reza" })
      .expect(200);
    const data = res.body?.data || {};
    expect(data.name).toBe("Ali Reza");
  });

  it("DELETE /api/v1/customers/:id -> 204", async () => {
    await request(app).delete(`/api/v1/customers/${id}`).expect(204);
  });

  it("GET /api/v1/customers/:id - afterDelete -> 404", async () => {
    await request(app).get(`/api/v1/customers/${id}`).expect(404);
  });
});
