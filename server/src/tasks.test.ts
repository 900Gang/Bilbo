import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app.js";
import { prisma } from "./db.js";

const stamp = Date.now();
const emailA = `task-a-${stamp}@example.com`;
const emailB = `task-b-${stamp}@example.com`;
const password = "password123";
const a = request.agent(app);
const b = request.agent(app);
let taskId: string;

beforeAll(async () => {
  await a.post("/api/auth/register").send({ name: "A", email: emailA, password });
  await b.post("/api/auth/register").send({ name: "B", email: emailB, password });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
  await prisma.$disconnect();
});

describe("tasks", () => {
  it("requires auth", async () => {
    expect((await request(app).get("/api/tasks")).status).toBe(401);
  });

  it("rejects empty title", async () => {
    expect((await a.post("/api/tasks").send({ title: "  " })).status).toBe(400);
  });

  it("creates with defaults", async () => {
    const res = await a.post("/api/tasks").send({ title: "Write report", description: "Quarterly numbers" });
    expect(res.status).toBe(201);
    expect(res.body.task.status).toBe("todo");
    expect(res.body.task.priority).toBe("medium");
    taskId = res.body.task.id;
  });

  it("lists only own tasks", async () => {
    expect((await a.get("/api/tasks")).body.tasks).toHaveLength(1);
    expect((await b.get("/api/tasks")).body.tasks).toHaveLength(0);
  });

  it("searches and filters", async () => {
    await a.post("/api/tasks").send({ title: "Buy milk", priority: "high", status: "done" });
    expect((await a.get("/api/tasks?search=REPORT")).body.tasks).toHaveLength(1);
    expect((await a.get("/api/tasks?search=quarterly")).body.tasks).toHaveLength(1);
    expect((await a.get("/api/tasks?priority=high")).body.tasks).toHaveLength(1);
    expect((await a.get("/api/tasks?status=done")).body.tasks[0].title).toBe("Buy milk");
    expect((await a.get("/api/tasks?sort=title&order=asc")).body.tasks[0].title).toBe("Buy milk");
    expect((await a.get("/api/tasks?status=bogus")).status).toBe(400);
  });

  it("updates own task", async () => {
    const res = await a.patch(`/api/tasks/${taskId}`).send({ status: "in_progress", dueDate: "2030-01-01" });
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe("in_progress");
    expect(res.body.task.dueDate).toContain("2030-01-01");
  });

  it("rejects empty update", async () => {
    expect((await a.patch(`/api/tasks/${taskId}`).send({})).status).toBe(400);
  });

  it("blocks other user from update and delete", async () => {
    expect((await b.patch(`/api/tasks/${taskId}`).send({ title: "hacked" })).status).toBe(404);
    expect((await b.delete(`/api/tasks/${taskId}`)).status).toBe(404);
    const still = await a.get("/api/tasks?search=report");
    expect(still.body.tasks[0].title).toBe("Write report");
  });

  it("deletes own task", async () => {
    expect((await a.delete(`/api/tasks/${taskId}`)).status).toBe(204);
    expect((await a.delete(`/api/tasks/${taskId}`)).status).toBe(404);
  });
});

describe("partial update", () => {
  it("does not reset untouched fields", async () => {
    const reg = request.agent(app);
    const email = `task-c-${stamp}@example.com`;
    await reg.post("/api/auth/register").send({ name: "C", email, password });
    try {
      const created = await reg.post("/api/tasks").send({ title: "Keep", description: "desc", status: "done", priority: "high" });
      const res = await reg.patch(`/api/tasks/${created.body.task.id}`).send({ title: "Renamed" });
      expect(res.body.task).toMatchObject({ title: "Renamed", description: "desc", status: "done", priority: "high" });
    } finally {
      await prisma.user.deleteMany({ where: { email } });
    }
  });
});
