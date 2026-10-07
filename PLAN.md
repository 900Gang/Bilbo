# Bilbo: Build Plan and Status

This file started as the build plan. It now records what was planned, what was built, and where the build changed course.

## 1. Goal
A deployed, multi-user task manager. Each user signs up, logs in, and manages only their own tasks. Demonstrates frontend, backend, database, and authentication skills.

## 2. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite + TypeScript | Fast, common, easy to deploy |
| Styling | Tailwind CSS | Responsive utilities, theming through CSS variables |
| Data fetching | TanStack Query + Axios | Caching, optimistic updates |
| Drag and drop | dnd-kit | Accessible: mouse, touch, keyboard, screen reader messages |
| Backend | Node.js + Express + TypeScript | Clear REST API, shows real backend work |
| Validation | Zod | Request validation |
| Database | PostgreSQL (Neon, free tier) | Relational fit for users to tasks |
| ORM | Prisma | Typed queries, migrations |
| Auth | JWT in httpOnly cookie + bcrypt | Secure, standard, no third-party lock-in |
| CI | GitHub Actions | Lint, build, and run the API tests on every push |
| Hosting | Render (one web service), Neon (database) | Free tiers |

## 3. Data Model

**User**: `id (uuid)`, `email (unique)`, `passwordHash`, `name`, `createdAt`

**Task**: `id (uuid)`, `userId (FK, indexed)`, `title`, `description`, `status (todo | in_progress | done)`, `priority (low | medium | high)`, `dueDate`, `tags (text[])`, `position (int)`, `createdAt`, `updatedAt`

Rule: every Task query filters by `userId` from the verified token. This gives user-specific data.

`position` stores the manual order. New tasks take the lowest position so they appear first. Migrations are additive so a deploy never breaks the running version.

## 4. API Design (REST, prefix `/api`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/auth/register` | no | Create account |
| POST | `/auth/login` | no | Set auth cookie |
| POST | `/auth/logout` | yes | Clear cookie |
| GET | `/auth/me` | yes | Current user |
| GET | `/tasks?search=&status=&priority=&tag=&sort=&order=` | yes | List own tasks (search, filters, sort) |
| POST | `/tasks` | yes | Create task |
| PATCH | `/tasks/:id` | yes | Edit task |
| DELETE | `/tasks/:id` | yes | Delete task |
| POST | `/tasks/reorder` | yes | Save manual order |

Security: bcrypt hashing, Zod validation, auth middleware, ownership check on every task route (404 for other users' tasks), rate limit on auth routes, Helmet.

## 5. Frontend Structure

Pages: `/login`, `/register`, `/` (dashboard, protected).

Design: a single list of rows rather than a card grid. Moss-green accent, Fraunces for the wordmark and greeting, Instrument Sans for the interface. Light and dark themes share one set of colour variables.

Responsive plan: mobile-first. Bottom-sheet form and horizontally scrolling status tabs on phones.

## 6. Milestones

All nine milestones are done.

| Milestone | Result |
|-----------|--------|
| M1 Setup | `client/` and `server/`, TypeScript, Neon, Prisma |
| M2 Database and auth | Schema, migrations, register, login, logout, me |
| M3 Task API | CRUD scoped to the user, Zod validation, Vitest and Supertest tests |
| M4 Frontend auth | Login and register forms, auth context, protected routes |
| M5 Task UI | Dashboard, create and edit, delete confirmation, optimistic updates |
| M6 Responsive polish | Checked at 375, 768, and 1024 px |
| M7 Bonus features | Search, filters, sorting, dark mode |
| M8 Deploy | Live on Render, migrations run on every deploy |
| M9 Docs | README with screenshots |

Added after the original plan:

- Rename to Bilbo and a full UI redesign.
- GitHub Actions CI: client lint and build, server type-check and build, API tests against a throwaway PostgreSQL container.
- Separate Neon branches: `production` for the live app, `dev` for local work.
- Task tags, with `#tag` shortcuts in the quick-add bar.
- Drag-and-drop manual ordering.
- Due-today and overdue reminders (in-app summary, a "Due or overdue" view, and optional browser notifications).

## 7. Where the build changed course

- **One Render service instead of Vercel plus Render.** The API also serves the built client, so the browser sees one origin. That keeps the auth cookie first-party and avoids cross-site cookie problems.
- **Prisma overrides entry.** `deepmerge-ts` is pinned to a patched version in `server/package.json` to clear an audit finding in Prisma's build tooling. Remove the override when Prisma ships a fixed release.
- **Reminders stay in the browser.** Email reminders need an email provider and a scheduled job, which the free Render tier cannot run.

## 8. Definition of Done
- [x] Create, edit, delete tasks work
- [x] User A cannot see or change user B's tasks (tested)
- [x] Usable on phone, tablet, desktop
- [x] Search, filters, dark mode work
- [x] Live URL and repo link in README
- [x] No secrets committed
- [x] CI runs lint, build, and tests on every push
- [ ] Sign up, log in, log out checked by hand on the live site

## 9. Risks
- Render free tier sleeps: the first request is slow. The README mentions it.
- Browser notifications only show while Bilbo is open in a tab.
- Scope creep: keep new features behind tests and keep migrations additive.
