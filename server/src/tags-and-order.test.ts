import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app.js";
import { prisma } from "./db.js";

const stamp = Date.now();
const emailA = `order-a-${stamp}@example.com`;
const emailB = `order-b-${stamp}@example.com`;
const password = "password123";
const a = request.agent(app);
const b = request.agent(app);

const titles = (res: request.Response) => res.body.tasks.map((t: { title: string }) => t.title);

beforeAll(async () => {
  await a.post("/api/auth/register").send({ name: "A", email: emailA, password });
  await b.post("/api/auth/register").send({ name: "B", email: emailB, password });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
  await prisma.$disconnect();
});

describe("tags", () => {
  it("normalizes, trims and de-duplicates tags on create", async () => {
    const res = await a.post("/api/tasks").send({ title: "Tagged", tags: [" Work ", "work", "Home_1", "urgent-now"] });
    expect(res.status).toBe(201);
    expect(res.body.task.tags).toEqual(["work", "home_1", "urgent-now"]);
  });

  it("defaults to no tags", async () => {
    const res = await a.post("/api/tasks").send({ title: "Untagged" });
    expect(res.body.task.tags).toEqual([]);
  });

  it("rejects invalid tags and too many tags", async () => {
    expect((await a.post("/api/tasks").send({ title: "x", tags: ["bad tag"] })).status).toBe(400);
    expect((await a.post("/api/tasks").send({ title: "x", tags: ["#hash"] })).status).toBe(400);
    expect((await a.post("/api/tasks").send({ title: "x", tags: ["a".repeat(25)] })).status).toBe(400);
    const nine = Array.from({ length: 9 }, (_, i) => `t${i}`);
    expect((await a.post("/api/tasks").send({ title: "x", tags: nine })).status).toBe(400);
  });

  it("filters by tag, case-insensitively, and only among own tasks", async () => {
    expect(titles(await a.get("/api/tasks?tag=Work"))).toEqual(["Tagged"]);
    expect((await a.get("/api/tasks?tag=nothing")).body.tasks).toHaveLength(0);
    expect((await b.get("/api/tasks?tag=work")).body.tasks).toHaveLength(0);
  });

  it("updates tags and keeps them on a partial update", async () => {
    const created = await a.post("/api/tasks").send({ title: "Edit tags", tags: ["one"] });
    const id = created.body.task.id;
    const renamed = await a.patch(`/api/tasks/${id}`).send({ title: "Edit tags 2" });
    expect(renamed.body.task.tags).toEqual(["one"]);
    const retagged = await a.patch(`/api/tasks/${id}`).send({ tags: ["two", "three"] });
    expect(retagged.body.task.tags).toEqual(["two", "three"]);
    const cleared = await a.patch(`/api/tasks/${id}`).send({ tags: [] });
    expect(cleared.body.task.tags).toEqual([]);
  });
});

describe("manual order", () => {
  const ids: Record<string, string> = {};

  it("puts new tasks at the top of the manual order", async () => {
    await prisma.task.deleteMany({ where: { user: { email: emailB } } });
    for (const title of ["first", "second", "third"]) {
      const res = await b.post("/api/tasks").send({ title });
      ids[title] = res.body.task.id;
    }
    const list = await b.get("/api/tasks?sort=position&order=asc");
    expect(titles(list)).toEqual(["third", "second", "first"]);
  });

  it("reorders and persists the new order", async () => {
    const order = [ids.first, ids.third, ids.second];
    expect((await b.post("/api/tasks/reorder").send({ ids: order })).status).toBe(204);
    expect(titles(await b.get("/api/tasks?sort=position&order=asc"))).toEqual(["first", "third", "second"]);
  });

  it("keeps a new task on top after a reorder", async () => {
    await b.post("/api/tasks").send({ title: "fourth" });
    expect(titles(await b.get("/api/tasks?sort=position&order=asc"))[0]).toBe("fourth");
  });

  it("rejects duplicate ids and malformed input", async () => {
    expect((await b.post("/api/tasks/reorder").send({ ids: [ids.first, ids.first] })).status).toBe(400);
    expect((await b.post("/api/tasks/reorder").send({ ids: ["not-a-uuid"] })).status).toBe(400);
    expect((await b.post("/api/tasks/reorder").send({ ids: [] })).status).toBe(400);
  });

  it("cannot reorder another user's tasks", async () => {
    const before = titles(await b.get("/api/tasks?sort=position&order=asc"));
    const res = await a.post("/api/tasks/reorder").send({ ids: [ids.first, ids.second] });
    expect(res.status).toBe(404);
    expect(titles(await b.get("/api/tasks?sort=position&order=asc"))).toEqual(before);
  });

  it("requires login to reorder", async () => {
    expect((await request(app).post("/api/tasks/reorder").send({ ids: [ids.first] })).status).toBe(401);
  });

  it("breaks ties by newest first when sorting by priority", async () => {
    const res = await b.get("/api/tasks?sort=priority&order=desc");
    const created = res.body.tasks.map((t: { createdAt: string }) => t.createdAt);
    expect(created).toEqual([...created].sort().reverse());
  });
});
