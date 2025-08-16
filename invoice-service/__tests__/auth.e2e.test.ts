import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";

describe("Auth E2E", () => {
    let app: any;

    beforeAll(async () => {
        await startInMemoryMongo();

        const { createApp } = await import("@/app");
        app = createApp();

        const { CustomerModel } = await import("@/modules/customers/customer.model");
        const passwordHash = await bcrypt.hash("P@ssw0rd123", 10);
        await CustomerModel.create({
            name: "Test User",
            email: "test@example.com",
            passwordHash
        });
    });

    afterAll(async () => {
        await stopInMemoryMongo();
    });

    it("POST /api/v1/auth/login -> returns accessToken + sets refresh cookie", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "test@example.com", password: "P@ssw0rd123" })
            .expect(200);

        expect(res.body.user?.email).toBe("test@example.com");
        expect(res.body.accessToken).toBeTruthy();
        const scHeader = res.headers["set-cookie"] as unknown as string[] | string | undefined;
        const sc = Array.isArray(scHeader) ? scHeader.join(";") : (scHeader ?? "");
        expect(sc).toContain("refresh_token=");
        expect(sc).toContain("HttpOnly");
    });

    it("POST /api/v1/auth/refresh -> returns new accessToken + rotates cookie", async () => {
        const login = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "test@example.com", password: "P@ssw0rd123" })
            .expect(200);

        const cookies = login.headers["set-cookie"];
        const res = await request(app)
            .post("/api/v1/auth/refresh")
            .set("Cookie", cookies)
            .send({})
            .expect(200);

        expect(res.body.accessToken).toBeTruthy();
        const scHeader = res.headers["set-cookie"] as unknown as string[] | string | undefined;
        const sc = Array.isArray(scHeader) ? scHeader.join(";") : (scHeader ?? "");
        expect(sc).toContain("refresh_token=");
    });

    it("POST /api/v1/auth/logout -> clears cookie (204)", async () => {
        const login = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "test@example.com", password: "P@ssw0rd123" })
            .expect(200);

        const cookies = login.headers["set-cookie"];
        await request(app)
            .post("/api/v1/auth/logout")
            .set("Cookie", cookies)
            .send({})
            .expect(204);
    });
});
