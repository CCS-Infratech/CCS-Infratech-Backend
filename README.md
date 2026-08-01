
# 🚀 CCS Infratech

---

## 🛠️ Features

- ⚙️ Express.js with TypeScript
- 🧠 Zod for schema validation
- 🛡️ Secure headers (Helmet, HPP, CORS)
- 🧱 Prisma ORM with PostgreSQL
- 🔐 JWT-based Auth (sample-ready)
- 🚦 Rate Limiting support
- 📬 Nodemailer configured
- 📊 Ready to use Email Templates for email service
- 📦 Environment variable management with `dotenv`
- 📊 Swagger API documentation
- 🧪 Pre-configured testing setup (Jest)
- 🧹 Pre-configured ESLint + Prettier + Husky + Lint-Staged
- 🔄 Hot Reload (via `nodemon`, `tsx`, or `ts-node-dev`)

---

## 📂 Folder Structure

```
📁 src
├── 📄 index.ts          # App entry point
├── 📁 config            # Env, DB, and other global configs
├── 📁 middlewares       # Custom middlewares (e.g., validation, error handler)
├── 📁 routes            # All Express routes
├── 📁 controllers       # Business logic for routes
├── 📁 utils             # Helper functions
├── 📁 services          # External services (e.g., mail, token)
├── 📁 schemas           # Zod validation schemas
├── 📁 models            # (Optional) ORM helpers if needed
├── 📁 prisma            # Prisma schema & seed file
│   ├── schema.prisma
│   └── seed.ts
```

---

## 🔧 Useful Commands

| Command                  | Description                                |
| ------------------------ | ------------------------------------------ |
| `npm run dev`            | Start server with hot reload using nodemon |
| `npm run dev:ts-node`    | Start server with ts-node-dev              |
| `npm run dev:tsx`        | Fast dev start with tsx                    |
| `npm run build`          | Compile TypeScript to JavaScript           |
| `npm run lint:fix`       | Auto-fix ESLint issues                     |
| `npm run format`         | Format code using Prettier                 |
| `npm run prisma:migrate` | Create and apply DB migrations             |
| `npm run prisma:studio`  | Open Prisma Studio for DB                  |

---

## 🧪 Lint & Formatting

- ✅ ESLint with Prettier
- ✅ Husky pre-commit hook
- ✅ `lint-staged` for formatting staged files

```bash
npm run lint       # Check lint issues
npm run lint:fix   # Auto-fix issues
```

---

> Coroporate Living @2025

