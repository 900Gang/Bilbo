# Task Manager App: Build Plan

## 1. Goal
A deployed, multi-user task manager. Each user signs up, logs in, and manages only their own tasks. Demonstrates frontend, backend, database, and authentication skills.

## 2. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite + TypeScript | Fast, common, easy to deploy |
| Styling | Tailwind CSS | Responsive utilities, built-in dark mode (`dark:`) |
| Data fetching | TanStack Query + Axios | Caching, optimistic updates |
| Backend | Node.js + Express + TypeScript | Clear REST API, shows real backend work |
| Validation | Zod | Shared request validation |
| Database | PostgreSQL (Neon, free tier) | Relational fit for users to tasks |
| ORM | Prisma | Typed queries, migrations |
| Auth | JWT in httpOnly cookie + bcrypt | Secure, standard, no third-party lock-in |
| Hosting | Vercel (frontend), Render (API), Neon (DB) | All free tiers |

## 3. Data Model

**User**: `id (uuid)`, `email (unique)`, `passwordHash`, `name`, `createdAt`

**Task**: `id (uuid)`, `userId (FK, indexed)`, `title`, `description`, `status (todo | in_progress | done)`, `priority (low | medium | high)`, `dueDate`, `createdAt`, `updatedAt`

Rule: every Task query filters by `userId` from the verified token. This gives user-specific data.

## 4. API Design (REST, prefix `/api`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/auth/register` | no | Create account |
| POST | `/auth/login` | no | Set auth cookie |
| POST | `/auth/logout` | yes | Clear cookie |
| GET | `/auth/me` | yes | Current user |
| GET | `/tasks?search=&status=&priority=&sort=` | yes | List own tasks (search + filters) |
| POST | `/tasks` | yes | Create task |
| PATCH | `/tasks/:id` | yes | Edit task |
| DELETE | `/tasks/:id` | yes | Delete task |

Security: bcrypt hashing, Zod validation, auth middleware, ownership check on `:id` routes (return 404 for other users' tasks), CORS limited to the frontend origin, rate limit on auth routes, Helmet.

## 5. Frontend Structure

Pages: `/login`, `/register`, `/` (dashboard, protected).

Components: `AuthForm`, `ProtectedRoute`, `TaskList`, `TaskCard`, `TaskModal` (create/edit), `SearchBar`, `FilterBar`, `ThemeToggle`, `EmptyState`, `Toast`.

Responsive plan: mobile-first. Single column under 640px, grid on tablet and desktop. Filters collapse into a drawer on mobile.

## 6. Milestones

**M1: Setup (0.5 day)**
- Monorepo folders: `client/`, `server/`
- TypeScript, ESLint, Prettier, `.env.example`
- Neon DB created, Prisma connected

**M2: Database + Auth backend (1 day)**
- Prisma schema and first migration
- Register, login, logout, me endpoints
- Auth middleware, password hashing, cookie settings

**M3: Task API (1 day)**
- CRUD endpoints scoped to user
- Zod validation, error handler
- Basic API tests (Vitest + Supertest): auth, CRUD, cross-user access denied

**M4: Frontend auth (1 day)**
- Login and register forms with validation
- Auth context, protected routes, logout

**M5: Task UI (1.5 days)**
- Dashboard, task list, create/edit modal, delete confirm
- Status toggle, optimistic updates, loading and error states

**M6: Responsive polish (0.5 day)**
- Test at 375px, 768px, 1280px
- Keyboard focus and basic accessibility

**M7: Bonus features (1 day)**
- Search: debounced input, server-side `ILIKE` on title and description
- Filters: status, priority, due date, sort
- Dark mode: Tailwind `class` strategy, saved in `localStorage`, defaults to system preference

**M8: Deploy (0.5 day)**
- DB: Neon production branch, run `prisma migrate deploy`
- API: Render web service, env vars (`DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`)
- Client: Vercel, env var `VITE_API_URL`
- Cookie settings for cross-site: `SameSite=None; Secure`
- Smoke test on live URL

**M9: Docs (0.5 day)**
- README: features, stack, architecture diagram, setup steps, live URL, screenshots, demo account note

Total: about 7 to 8 days part-time.

## 7. Definition of Done
- [ ] Sign up, log in, log out work on the live site
- [ ] Create, edit, delete tasks work
- [ ] User A cannot see or change user B's tasks (tested)
- [ ] Usable on phone, tablet, desktop
- [ ] Search, filters, dark mode work
- [ ] Live URL and repo link in README
- [ ] No secrets committed

## 8. Risks
- Render free tier sleeps: first request is slow. Mention in README or add a loading message.
- Cross-site cookies in deploy: if problematic, serve API and client under one domain or use a Vercel rewrite proxy.
- Scope creep: finish M1 to M6 before bonus work.

## 9. Open Decisions
- Stack alternative: Next.js + Supabase is faster, but hides backend work. Plan above shows each skill separately.
- Optional extras after bonus: drag-and-drop board, due-date reminders, tags.
