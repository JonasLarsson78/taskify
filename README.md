# Taskify

Taskify is a task management application built with Next.js, React and Prisma.
The app includes support for organizations, spaces, goals, archive, login flow and role-based access (for example admin-only actions in selected flows).

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma 7
- MySQL
- Zustand

## Main Features

- Login with JWT-based session flow
- Organization and user handling
- Spaces with configurable task sections/colors
- Task views for list, board and box modes
- Goals page with linked tasks and progress handling
- Archive page for restoring or deleting archived tasks
- Localization support (Swedish and English content)

## Requirements

- Node.js 20+
- npm 10+
- A running MySQL database

## Environment Variables

Create an `.env` file in the project root:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
JWT_SECRET="replace-with-a-strong-secret"
MYSQL_POOL_LIMIT="2"
```

Notes:

- `DATABASE_URL` is required by Prisma and the MySQL pool.
- `JWT_SECRET` defaults to `dev-secret` if missing, but should always be set outside local quick tests.
- `MYSQL_POOL_LIMIT` is optional and is clamped internally.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Generate Prisma client:

   ```bash
   npx prisma generate
   ```

3. Run migrations in development:

   ```bash
   npx prisma migrate dev
   ```

4. Start dev server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Available Scripts

- `npm run dev` - Start Next.js dev server
- `npm run dev:webpack` - Start dev server with webpack mode
- `npm run dev:turbo` - Start dev server with turbopack mode
- `npm run build` - Generate Prisma client and build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run clear` - Remove build/cache/dependencies artifacts and reinstall
- `npm run dev:clean` - Run clear and then start dev server

## Project Structure (high-level)

- `app/` - UI pages, client hooks and API route handlers
- `app/api/` - Route handlers for login, user, organization, task, goal, space, verify and realtime
- `lib/` - Shared auth, Prisma, MySQL, state and content utilities
- `prisma/` - Prisma schema and migrations
- `public/` - Static assets

## Development Notes

- The root route (`/`) redirects users to `/login` or `/home` based on client session state.
- API routes are implemented under `app/api/*/route.ts`.
- Prisma is configured via `prisma.config.ts` and reads `DATABASE_URL` from environment variables.

## API Route Examples

Base URL (local):

```bash
http://localhost:3000
```

Authenticate first and store the returned token from `/api/login` in `TOKEN`.

### 1) Login

```bash
curl -X POST http://localhost:3000/api/login \
   -H "Content-Type: application/json" \
   -d '{
      "email": "admin@example.com",
      "password": "secret123"
   }'
```

Example response:

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "email": "admin@example.com"
  },
  "token": "<jwt>"
}
```

### 2) Verify token (Authorization header)

```bash
curl http://localhost:3000/api/verify \
   -H "Authorization: Bearer $TOKEN"
```

### 3) List spaces for an organization

```bash
curl "http://localhost:3000/api/space?organizationId=1" \
   -H "Authorization: Bearer $TOKEN"
```

### 4) Create space (admin)

```bash
curl -X POST http://localhost:3000/api/space \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer $TOKEN" \
   -d '{
      "organizationId": 1,
      "name": "Engineering",
      "memberIds": [1, 2, 3]
   }'
```

### 5) List tasks for a space

```bash
curl "http://localhost:3000/api/task?organizationId=1&spaceId=2" \
   -H "Authorization: Bearer $TOKEN"
```

### 6) Create task

```bash
curl -X POST http://localhost:3000/api/task \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer $TOKEN" \
   -d '{
      "title": "Prepare sprint plan",
      "meta": "Collect team estimates and timeline.",
      "dueDate": "2026-04-15",
      "stage": "Planning",
      "priority": "High",
      "section": "Review",
      "color": "#49a4ff",
      "assigneeIds": [2, 3],
      "organizationId": 1,
      "spaceId": 2
   }'
```

### 7) Update task

```bash
curl -X PUT http://localhost:3000/api/task/10 \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer $TOKEN" \
   -d '{
      "section": "Ready",
      "priority": "Normal"
   }'
```

### 8) Create goal

```bash
curl -X POST http://localhost:3000/api/goal \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer $TOKEN" \
   -d '{
      "title": "Ship onboarding improvements",
      "description": "Reduce drop-off in first session",
      "targetDate": "2026-05-01",
      "organizationId": 1,
      "spaceId": 2,
      "taskIds": [10, 11],
      "manualProgress": 40
   }'
```

### 9) Update organization name (admin)

```bash
curl -X PUT http://localhost:3000/api/organization/1 \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer $TOKEN" \
   -d '{
      "name": "Taskify Labs"
   }'
```

Notes:

- Most routes require `Authorization: Bearer <token>`.
- Role checks are enforced server-side (`admin`, `user`, `guest`).
- For non-admin users, access is scoped to organization and space membership.

## Deployment

This project can be deployed on any platform that supports Next.js and access to MySQL.
For Vercel deployments, make sure environment variables are configured in the project settings.
