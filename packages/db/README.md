# @bazoora/db

Shared database package for Bazoora.

This package contains the database infrastructure used across the monorepo, including the Prisma schema, migrations, generated Prisma Client, and local PostgreSQL development workflow.

## Technology Stack

| Component  | Version                  |
| ---------- | ------------------------ |
| PostgreSQL | 17                       |
| Prisma ORM | 7                        |
| Docker     | Latest supported version |
| Node.js    | 20+                      |

---

## Package Structure

```text
packages/db/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
├── .env
├── .env.example
├── package.json
└── README.md
```

### Responsibilities

This package is responsible for:

* Managing the Prisma schema
* Managing database migrations
* Generating the Prisma Client
* Providing database access utilities
* Maintaining local database configuration

This package is **not responsible for**:

* API routes
* Business logic
* Request validation
* Frontend state management

Those belong in their respective application packages.

---

## Local Development Setup

### Install Dependencies

From the repository root:

```bash
pnpm install
```

### Configure Environment Variables

Create the local environment file:

```bash
cp packages/db/.env.example packages/db/.env
```

Ensure it contains:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bazoora"
```

---

## Starting PostgreSQL

From the repository root:

```bash
docker compose up -d
```

Verify the database container is running:

```bash
docker ps
```

Expected container:

```text
bazoora-db
```

---

## Prisma Workflow

### Generate Prisma Client

Run whenever `schema.prisma` changes:

```bash
pnpm --filter @bazoora/db db:generate
```

### Create and Apply Migrations

After modifying the schema:

```bash
pnpm --filter @bazoora/db db:migrate
```

Provide a descriptive migration name when prompted.

Examples:

```text
init
create-hauling-request
add-request-status
```

---

## Adding New Database Entities

Database entities are defined in:

```text
packages/db/prisma/schema.prisma
```

Example:

```prisma
model HaulingRequest {
  id        String   @id @default(cuid())
  status    String
  createdAt DateTime @default(now())
}
```

After adding or modifying entities:

### 1. Create a Migration

```bash
pnpm --filter @bazoora/db db:migrate
```

### 2. Regenerate Prisma Client

```bash
pnpm --filter @bazoora/db db:generate
```

### 3. Verify Database Changes

Open PostgreSQL:

```bash
docker exec -it bazoora-db psql -U postgres -d bazoora
```

List tables:

```sql
\dt
```

---

## PostgreSQL Shell

Open an interactive PostgreSQL shell:

```bash
docker exec -it bazoora-db psql -U postgres -d bazoora
```

Useful commands:

List tables:

```sql
\dt
```

Describe a table:

```sql
\d "TableName"
```

Show databases:

```sql
\l
```

Exit:

```sql
\q
```

---

## Resetting the Database

⚠️ This deletes all local database data.

```bash
docker compose down -v
docker compose up -d
```

After resetting:

```bash
pnpm --filter @bazoora/db db:migrate
```

---

## Common Commands

Generate Prisma Client:

```bash
pnpm --filter @bazoora/db db:generate
```

Create and apply migrations:

```bash
pnpm --filter @bazoora/db db:migrate
```

Open Prisma Studio:

```bash
pnpm --filter @bazoora/db db:studio
```

Open PostgreSQL shell:

```bash
docker exec -it bazoora-db psql -U postgres -d bazoora
```