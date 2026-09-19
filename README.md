# CCS Infratech Backend

REST API for [CCS Infratech](https://ccsinfratech.com) — projects, blogs, media, leads, site settings, and admin auth.

**Repository:** [github.com/CCS-Infratech/CCS-Infratech-Backend](https://github.com/CCS-Infratech/CCS-Infratech-Backend)

Related apps:

- Public site — [CCS-Infratech-Frontend](https://github.com/CCS-Infratech/CCS-Infratech-Frontend)
- Admin dashboard — [CCS-Infratech-Admin](https://github.com/CCS-Infratech/CCS-Infratech-Admin)

---

## What it includes

- JWT cookie auth with role-based access (`admin` / `user`)
- Project catalog with groups, categories, amenities, plans, and galleries
- Blogs, press coverage, and event / campaign galleries
- Walkthrough CMS (title, description, video URL, thumbnail, publish flag)
- Lead intake (`CONTACT`, `LEAD`, `SITE_VISIT`) with status tracking
- Site settings and leadership team records for the public website
- Image uploads to Amazon S3 (Sharp + Multer)
- Zod request validation, Helmet / HPP / CORS, rate limiting
- Prisma + PostgreSQL

---

## Architecture

```
Admin (Next.js :3002)  ─┐
                        ├─►  Express API  ─►  PostgreSQL (Prisma)
Public site (:3000)    ─┘         │
                                  └─►  Amazon S3
```

Request flow:

1. `src/index.ts` boots Express, CORS, cookies, and JSON parsing.
2. Routes live under `/api/v1/*` and call controllers.
3. Admin writes go through `authenticate` + `authorize('admin')`.
4. Public reads use `/published` endpoints (no auth).
5. Prisma talks to PostgreSQL. Media files go to S3.

```
src/
├── index.ts              # App entry, route mounting
├── configs/              # Env, DB, CORS, CSP
├── controllers/          # Route handlers
├── routes/               # Express routers
├── middlewares/          # Auth, validation, errors, rate limit
├── schemas/              # Zod schemas
├── utils/                # Prisma client, S3, Multer, helpers
└── types/

prisma/
├── schema.prisma
├── migrations/
└── userseed.ts           # Seeds the first admin user
```

### API surface

| Prefix | Purpose |
| --- | --- |
| `GET /` | Liveness check |
| `GET /api/v1/health` | Health + uptime |
| `/api/v1/auth` | Login, logout, `/me`, admin-only register |
| `/api/v1/projects` | Projects (public: `/published`) |
| `/api/v1/project-groups` | Collections of projects |
| `/api/v1/blog` | Blog posts |
| `/api/v1/press` | Press coverage |
| `/api/v1/gallary` | Event / campaign galleries |
| `/api/v1/walkthrough` | Project video walkthroughs (public: `/published`) |
| `/api/v1/images` | S3 media listing and uploads |
| `/api/v1/leads` | Enquiries and site visits |
| `/api/v1/settings` | Global site settings |
| `/api/v1/leadership` | Leadership / team members |

Default port is `8000` (`PORT` in `.env`). CORS allows localhost `3000`–`3002` plus `ccsinfratech.com` and `admin.ccsinfratech.com`.

---

## How to run

**Requirements:** Node.js 20+, PostgreSQL, an S3 bucket (for uploads).

```bash
git clone https://github.com/CCS-Infratech/CCS-Infratech-Backend.git
cd CCS-Infratech-Backend
npm install
```

Create a `.env` in the project root:

```env
PORT=8000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace-with-a-long-random-string

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

Then generate the Prisma client, apply migrations, and seed an admin user:

```bash
npx prisma generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run dev
```

The API should respond at [http://localhost:8000](http://localhost:8000) and [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health).

### Production

```bash
npm run build
npm start
```

Or run migrations on the production database first:

```bash
npm run prisma:migrate:deploy
```

---

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled / tsx entry |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create and apply a local migration |
| `npm run prisma:migrate:deploy` | Apply existing migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed the first admin user |
| `npx tsx scripts/seed-walkthrough-dummy.ts` | Seed sample walkthrough videos |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` | Prettier |

---

CCS Infratech
