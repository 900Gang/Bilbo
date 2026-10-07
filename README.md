# Bilbo

[![CI](https://github.com/900Gang/Bilbo/actions/workflows/ci.yml/badge.svg)](https://github.com/900Gang/Bilbo/actions/workflows/ci.yml)

A full-stack task manager. Users sign up, log in, and manage their own tasks. Each user only ever sees their own data.

**Live app:** https://task-manager-zjur.onrender.com

> The app runs on Render's free tier, which sleeps after about 15 minutes of inactivity. The first request after a quiet period can take around 30 seconds.

## Screenshots

| Light mode | Dark mode |
|:----------:|:---------:|
| ![Dashboard in light mode](docs/screenshots/dashboard-light.jpg) | ![Dashboard in dark mode](docs/screenshots/dashboard-dark.jpg) |

| Edit task with tags | Mobile |
|:-------------------:|:------:|
| ![Edit task dialog](docs/screenshots/edit-task.jpg) | <img src="docs/screenshots/mobile.jpg" alt="Mobile layout in dark mode" width="260"> |

## Features

- **Authentication:** register, log in, log out. Passwords are hashed with bcrypt. Sessions use a JWT stored in an httpOnly cookie.
- **Tasks:** create, edit, delete, and tick off. Each task has a title, notes, status (To do, In progress, Done), priority (Low, Medium, High), an optional due date, and tags.
- **Quick add:** type a task and press Enter. Write `#tags` inline, for example `Buy milk #groceries #home`, and they become tags.
- **Tags:** up to 8 per task. Click a tag on any task to filter by it, or pick one from the tag filter.
- **Drag-and-drop ordering:** choose "My order" to arrange tasks yourself. It works with a mouse, with touch, and from the keyboard (Space to pick up, arrow keys to move, Space to drop), and screen readers hear task names. The order is saved on the server.
- **Due-today reminders:** the summary line shows what is due today and overdue, a "Due or overdue" view lists those tasks, and you can opt in to one browser notification per day. Notifications appear while Bilbo is open in a tab, because there is no background service.
- **User-specific data:** every task query is scoped to the logged-in user. Another user's task returns a 404, and this is covered by tests.
- **Search, filters, and sorting:** debounced search over title and description, filters for status, priority, and tag, and six sort orders.
- **Dark mode:** follows your system setting until you choose. The choice is saved, and the page loads without a light flash.
- **Responsive UI:** mobile-first layout, a bottom-sheet form on phones, horizontally scrolling status tabs, and touch-friendly tap targets.
- **Optimistic updates:** ticking, deleting, and reordering appear instantly and roll back if the server rejects them.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Axios, dnd-kit |
| Fonts | Fraunces and Instrument Sans, self-hosted through Fontsource |
| Backend | Node.js, Express 5, TypeScript, Zod, Helmet, express-rate-limit |
| Database | PostgreSQL (Neon) with Prisma |
| Auth | JWT in httpOnly cookie, bcryptjs |
| Tests | Vitest, Supertest |
| CI | GitHub Actions |
| Hosting | Render (single web service), Neon (database) |

## Architecture

```
Browser
  |
  |  one origin: https://task-manager-zjur.onrender.com
  v
Express server (Render)
  |-- /api/auth/*    register, login, logout, me
  |-- /api/tasks/*   task CRUD, search, filters, reorder
  |-- /*             built React app (static files, SPA fallback)
  |
  v
PostgreSQL (Neon) via Prisma
  User 1 --- * Task
```

In production the Express server also serves the built React app. The browser talks to one origin, so the auth cookie is first-party and no cross-site cookie setup is needed. In development the client (port 5173) and API (port 4000) run separately.

## API

All `/api/tasks` routes require a logged-in user.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create an account and log in |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Current user |
| GET | `/api/tasks` | List your tasks |
| POST | `/api/tasks` | Create a task (it goes to the top of your manual order) |
| PATCH | `/api/tasks/:id` | Update a task (partial) |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/tasks/reorder` | Save a manual order. Body: `{ "ids": ["<task id>", ...] }` |
| GET | `/api/health` | Health check |

`GET /api/tasks` accepts these query parameters:

| Parameter | Values |
|-----------|--------|
| `search` | Text matched against title and description (case-insensitive) |
| `status` | `todo`, `in_progress`, `done` |
| `priority` | `low`, `medium`, `high` |
| `tag` | A single tag, matched case-insensitively |
| `sort` | `createdAt`, `dueDate`, `priority`, `title`, `position` (your manual order) |
| `order` | `asc`, `desc` |

Tags are lower-cased, trimmed, and de-duplicated by the server. A tag can use letters, numbers, `-` and `_`, up to 24 characters, with at most 8 per task.

## Project structure

```
client/           React app
  src/components  TaskRow, SortableTaskRow, QuickAdd, TaskModal, TagInput, FilterBar,
                  ReminderPrompt, ThemeToggle, Logo, AuthForm, ProtectedRoute
  src/context     AuthContext
  src/hooks       useTasks, useReminders, useTheme, useDebounce
  src/lib         types, filters, dates, tags
  src/pages       Login, Register, Dashboard
server/           Express API
  prisma/         schema and migrations
  src/routes      auth.ts, tasks.ts
  src/middleware  auth.ts (JWT check)
docs/             screenshots
render.yaml       Render deployment blueprint
```

## Run it locally

You need Node.js 22 or newer and a PostgreSQL database. A free [Neon](https://neon.tech) database works well.

Use a separate database for development. In Neon, create a branch of your project (for example `dev`) and use its connection string locally. Your live app keeps using the production branch, and local migrations and test data never touch it.

1. Install dependencies:

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. Create the environment files from the examples:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Then edit `server/.env`:

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string for your development database |
   | `JWT_SECRET` | A long random string, for example from `openssl rand -hex 32` |
   | `CLIENT_URL` | `http://localhost:5173` |
   | `PORT` | `4000` |

3. Create the database tables:

   ```bash
   cd server && npx prisma migrate dev
   ```

4. Start both servers in two terminals:

   ```bash
   cd server && npm run dev
   ```

   ```bash
   cd client && npm run dev
   ```

5. Open http://localhost:5173.

## Tests

The API tests run against the database in `DATABASE_URL`. They create temporary users and delete them afterwards, so use a development database.

```bash
cd server && npm test
```

They cover registration, login and logout, input validation, task CRUD, search and filters, partial updates, tags (normalizing, limits, filtering), manual ordering, and blocking one user from reading, changing, or reordering another user's tasks.

## Continuous integration

GitHub Actions runs on every push to `main` and on every pull request (`.github/workflows/ci.yml`) with three jobs:

- **Client:** install, lint, and production build.
- **Server:** install, generate the Prisma client, type-check and build, and validate the schema.
- **API tests:** start a throwaway PostgreSQL container, apply every migration to the empty database, and run the full test suite.

No secrets are needed. The test database exists only for the length of the job, and applying the migrations from scratch on every run proves they work on a new database.

## Deployment

The app deploys to Render as one web service defined in `render.yaml`.

1. Push the repository to GitHub.
2. In the Render dashboard, create a **New Blueprint Instance** and select the repository.
3. Enter `DATABASE_URL` when prompted, using your production database. Render generates `JWT_SECRET` itself.

On each deploy, Render builds the client, generates the Prisma client, applies pending migrations with `prisma migrate deploy`, builds the server, and starts it. Pushes to `main` redeploy automatically. Migrations are written to be additive, so the previous version keeps working while a new one deploys.

## Security notes

- Passwords are hashed with bcrypt and never returned by the API.
- The auth cookie is `httpOnly`, and `Secure` in production.
- Request bodies are validated with Zod. Login and register routes are rate limited.
- Helmet sets security headers, including a content security policy.
- Task routes check ownership in the database query, so users cannot reach each other's data.

## License

See [LICENSE](LICENSE).
