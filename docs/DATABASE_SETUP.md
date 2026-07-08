# Bazoora — Local Database Setup Guide

This guide walks you through setting up your local PostgreSQL database for Bazoora using Docker. Follow every step in order before running the app.

---

## Prerequisites

You will need the following installed before starting:

- [Node.js](https://nodejs.org/) v20 or higher
- [pnpm](https://pnpm.io/) v9 or higher
- Docker Desktop (see installation steps below)

---

## Step 1 — Install Docker Desktop

Docker lets everyone on the team run the same database version without installing Postgres directly on your machine.

### Windows
1. Go to [https://docs.docker.com/desktop/install/windows-install/](https://docs.docker.com/desktop/install/windows-install/)
2. Download and run the **Docker Desktop Installer.exe**
3. During installation, make sure **"Use WSL 2 instead of Hyper-V"** is checked (recommended)
4. Restart your machine when prompted
5. Open Docker Desktop and wait for it to finish starting up (the whale icon in your taskbar should stop animating)

### macOS
1. Go to [https://docs.docker.com/desktop/install/mac-install/](https://docs.docker.com/desktop/install/mac-install/)
2. Download the installer for your chip — **Apple Silicon** (M1/M2/M3) or **Intel**, depending on your Mac
3. Open the `.dmg` file and drag Docker into your Applications folder
4. Launch Docker from Applications and follow the onboarding prompts
5. Wait until the Docker menu bar icon is steady (not animated)

### Linux (Ubuntu / Debian)
Run the following in your terminal:

```bash
# Remove any old versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add the Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow running Docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

### Verify Docker is installed correctly
Run this in your terminal. You should see a version number, not an error:

```bash
docker --version
docker compose version
```

---

## Step 2 — Set Up the Database with Docker Compose

The repo includes a `docker-compose.yml` at the root. This starts a Postgres container with the correct settings for local development.

From the **root of the monorepo**, run:

```bash
docker compose up -d
```

The `-d` flag runs the container in the background. You only need to run this once — Docker will remember the container between restarts.

To confirm the database is running:

```bash
docker ps
```

You should see a container named `bazoora-db` with a status of `Up`.

**To stop the database** (without deleting data):

```bash
docker compose stop
```

**To start it again later:**

```bash
docker compose start
```

**To fully reset the database** (deletes all data — use with caution):

```bash
docker compose down -v
docker compose up -d
```

---

## Step 3 — Configure Your Environment Variables

In the `packages/db` directory, copy the example environment file:

```bash
cp packages/db/.env.example packages/db/.env
```

Open `packages/db/.env` and confirm it contains the following. Do not change these values for local development:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bazoora"
```

> **Note:** Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Step 4 — Install Dependencies

From the monorepo root, install all workspace dependencies:

```bash
pnpm install
```

---

## Step 5 — Run Migrations

This applies the Prisma schema to your local database and creates all the tables:

```bash
pnpm --filter @bazoora/db db:migrate
```

You should see output confirming each migration was applied. If you see an error about the database not being reachable, make sure your Docker container is running (`docker ps`).

---

## Step 6 — Generate the Prisma Client

This generates the type-safe Prisma client your app uses to query the database:

```bash
pnpm --filter @bazoora/db db:generate
```

Run this command any time the Prisma schema (`schema.prisma`) is updated.

---

## Step 7 — Seed the Database (Optional)

To populate the database with sample data for development:

```bash
pnpm --filter @bazoora/db db:seed
```

This creates test accounts for each user role (Super Admin, Government Admin, Eco-Aide, etc.) so you can test the full application flow without creating records manually.

---

## Quick Reference

| Task | Command |
|------|---------|
| Start the database | `docker compose start` |
| Stop the database | `docker compose stop` |
| Reset the database | `docker compose down -v && docker compose up -d` |
| Run migrations | `pnpm --filter @bazoora/db db:migrate` |
| Regenerate Prisma client | `pnpm --filter @bazoora/db db:generate` |
| Seed sample data | `pnpm --filter @bazoora/db db:seed` |
| Open Prisma Studio (DB GUI) | `pnpm --filter @bazoora/db db:studio` |

---

## Troubleshooting

**`docker: command not found`**
Docker Desktop is not installed or not running. Go back to Step 1.

**`Error: connect ECONNREFUSED 127.0.0.1:5432`**
The database container is not running. Run `docker compose start` and try again.

**`Migration failed` or schema errors**
Try resetting the database and re-running migrations:
```bash
docker compose down -v
docker compose up -d
pnpm --filter @bazoora/db db:migrate
```

**Port 5432 is already in use**
You may have a local Postgres installation running. Stop it first:
- macOS: `brew services stop postgresql`
- Ubuntu: `sudo service postgresql stop`
- Windows: Stop the PostgreSQL service in Task Manager → Services

Then run `docker compose up -d` again.

**Permission denied (Linux)**
If you get a permission error running Docker commands, make sure you ran `sudo usermod -aG docker $USER` and opened a new terminal session after.

---

## Notes for Interns

- You do **not** need to install PostgreSQL directly on your machine. Docker handles it.
- The database data persists between `docker compose stop` / `start` cycles. It is only wiped when you run `docker compose down -v`.
- When you pull new changes that include a schema update, always re-run `db:migrate` and `db:generate` before running the app.
- Use **Prisma Studio** (`db:studio`) if you want a visual interface to browse and edit database records during development. It opens in your browser at `http://localhost:5555`.
- When the team moves to a shared staging environment, you will receive a new `DATABASE_URL` to put in your `.env`. No other changes are needed.
