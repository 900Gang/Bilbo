import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const status = z.enum(["todo", "in_progress", "done"]);
const priority = z.enum(["low", "medium", "high"]);
const dueDate = z.coerce.date().nullable();

const baseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000),
  status,
  priority,
  dueDate: dueDate.optional(),
});

const createSchema = baseSchema.extend({
  description: baseSchema.shape.description.default(""),
  status: status.default("todo"),
  priority: priority.default("medium"),
});

const updateSchema = baseSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: "No fields to update",
});

const listSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: status.optional(),
  priority: priority.optional(),
  sort: z.enum(["createdAt", "dueDate", "priority", "title"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const uid = (req: unknown) => (req as AuthedRequest).userId;

router.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten().fieldErrors });
  const { search, status, priority, sort, order } = parsed.data;

  const where: Prisma.TaskWhereInput = { userId: uid(req) };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const tasks = await prisma.task.findMany({ where, orderBy: { [sort]: order } });
  res.json({ tasks });
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
  const task = await prisma.task.create({ data: { ...parsed.data, userId: uid(req) } });
  res.status(201).json({ task });
});

router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
  const result = await prisma.task.updateMany({ where: { id: req.params.id, userId: uid(req) }, data: parsed.data });
  if (result.count === 0) return res.status(404).json({ error: "Task not found" });
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  res.json({ task });
});

router.delete("/:id", async (req, res) => {
  const result = await prisma.task.deleteMany({ where: { id: req.params.id, userId: uid(req) } });
  if (result.count === 0) return res.status(404).json({ error: "Task not found" });
  res.status(204).end();
});

export default router;
