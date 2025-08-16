import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";
import { startInMemoryMongo, stopInMemoryMongo } from "../test/utils/db";

import { createApp } from "@/app";
import { CustomerModel } from "@/modules/customers/customer.model";

jest.setTimeout(120_000);

describe("Auth E2E", () => {
    let app: any;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        process.env.TZ = "UTC";
        process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
        process.env.REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || "test_refresh_secret";
        process.env.AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "refresh_token";
        process.env.DISABLE_JOBS = "1"; 

        await startInMemoryMongo();

        app = createApp();

        await CustomerModel.deleteMany({ email: "test@example.com" });
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

        const cookieName = process.env.AUTH_COOKIE_NAME || "refresh_token";
        const scHeader = res.headers["set-cookie"] as unknown as string[] | string | undefined;
        const sc = Array.isArray(scHeader) ? scHeader.join(";") : (scHeader ?? "");
        expect(sc).toContain(`${cookieName}=`);
        expect(sc).toContain("HttpOnly");
    });

    function pickCookiePair(setCookie: string[] | string, name = 'refresh_token') {
        const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
        for (const c of arr) {
            const pair = c.split(';')[0]; // فقط name=value
            if (pair.trim().startsWith(`${name}=`)) return pair;
        }
        return '';
    }

    it("POST /api/v1/auth/logout -> clears cookie (204)", async () => {
        const login = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "test@example.com", password: "P@ssw0rd123" })
            .expect(200);

        const cookies = login.headers["set-cookie"];
        await request(app).post("/api/v1/auth/logout").set("Cookie", cookies).expect(204);
    });
});
