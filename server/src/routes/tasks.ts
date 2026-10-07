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

const tag = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(24)
  .regex(/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u, "Tags can use letters, numbers, - and _");
const tags = z.array(tag).max(8, "Use at most 8 tags").transform((list) => [...new Set(list)]);

const baseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000),
  status,
  priority,
  dueDate: dueDate.optional(),
  tags,
});

const createSchema = baseSchema.extend({
  description: baseSchema.shape.description.default(""),
  status: status.default("todo"),
  priority: priority.default("medium"),
  tags: tags.default([]),
});

const updateSchema = baseSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: "No fields to update",
});

const listSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: status.optional(),
  priority: priority.optional(),
  tag: z.string().trim().toLowerCase().max(24).optional(),
  sort: z.enum(["createdAt", "dueDate", "priority", "title", "position"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const reorderSchema = z
  .object({ ids: z.array(z.string().uuid()).min(1).max(500) })
  .refine((v) => new Set(v.ids).size === v.ids.length, { message: "Duplicate task ids" });

const uid = (req: unknown) => (req as AuthedRequest).userId;

router.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten().fieldErrors });
  const { search, status, priority, tag, sort, order } = parsed.data;

  const where: Prisma.TaskWhereInput = { userId: uid(req) };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Tie-break on creation time so equal values (for example the same priority) keep a stable order.
  const orderBy: Prisma.TaskOrderByWithRelationInput[] = [{ [sort]: order }];
  if (sort !== "createdAt") orderBy.push({ createdAt: "desc" });

  const tasks = await prisma.task.findMany({ where, orderBy });
  res.json({ tasks });
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });

  // New tasks go to the top of the manual order.
  const { _min } = await prisma.task.aggregate({ where: { userId: uid(req) }, _min: { position: true } });
  const task = await prisma.task.create({
    data: { ...parsed.data, userId: uid(req), position: (_min.position ?? 0) - 1 },
  });
  res.status(201).json({ task });
});

router.post("/reorder", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
  const { ids } = parsed.data;

  const owned = await prisma.task.count({ where: { id: { in: ids }, userId: uid(req) } });
  if (owned !== ids.length) return res.status(404).json({ error: "Task not found" });

  await prisma.$transaction(
    ids.map((id, index) => prisma.task.updateMany({ where: { id, userId: uid(req) }, data: { position: index } })),
  );
  res.status(204).end();
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
