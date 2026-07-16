# Bazoora — Local Database Setup

This branch contains the **local development database infrastructure only**. It sets up a PostgreSQL database using Docker for consistent development across all environments.

---

## 📦 What This Includes

* Dockerized PostgreSQL 17 instance
* Preconfigured database (`bazoora`)
* Standardized environment variables
* Persistent database volume

---

## ⚙️ Prerequisites

Make sure you have installed:

* Docker Desktop
* Node.js 20+ (for app development, not required for DB alone)
* pnpm (for full monorepo usage)

---

## 🚀 Getting Started

### 1. Start the database

From the project root:

```bash
docker compose up -d
```

This will start a PostgreSQL container named `bazoora-db`.

---

### 2. Verify the container is running

```bash
docker ps
```

You should see the `bazoora-db` container with status `Up`.

---

### 3. Environment setup

Copy the example environment file:

```bash
cp .env.example .env
```

Then ensure it contains:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bazoora"
```

---

## 🧹 Resetting the Database

To fully reset the database (⚠️ deletes all data):

```bash
docker compose down -v
docker compose up -d
```

---

## 📁 Files Overview

```
.
├── docker-compose.yml   # PostgreSQL container setup
├── .env                 # Local environment variables (ignored in git)
├── .env.example        # Template for environment variables
```

---

## ⚠️ Important Notes

* This setup only provides the database infrastructure.
* No ORM (Prisma), schema, or migrations are included in this branch.
* Application-level database setup will be added separately.
* Data persists unless explicitly removed using `docker compose down -v`.

---

## 🧭 Next Steps (Future Work)

The following will be added in a future database layer:

* Prisma schema setup
* Database models and migrations
* Shared database package (`@bazoora/db`)
* Seed scripts for development data

---

## 🧑‍💻 Purpose of This Branch

This branch ensures all developers can run a **consistent PostgreSQL environment locally** without manual database installation or configuration.