import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app.js";
import { prisma } from "./db.js";

const email = `test-${Date.now()}@example.com`;
const password = "password123";

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

describe("auth", () => {
  const agent = request.agent(app);

  it("rejects invalid register input", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "bad", password: "x" });
    expect(res.status).toBe(400);
  });

  it("registers and sets cookie", async () => {
    const res = await agent.post("/api/auth/register").send({ name: "Test", email, password });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers["set-cookie"]?.[0]).toMatch(/HttpOnly/);
  });

  it("rejects duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "Test", email, password });
    expect(res.status).toBe(409);
  });

  it("returns current user with cookie", async () => {
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it("blocks /me without cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("logs in and out", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    const out = await agent.post("/api/auth/logout");
    expect(out.status).toBe(200);
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(401);
  });
});
