\# Database \& Authentication Environment Variables


\## Purpose

This document describes the environment variables required for the database connection and authentication system used by the Bazoora API.


\## Database Variables


\### DATABASE\_URL
PostgreSQL connection string used by Prisma and the application.



Example:
DATABASE\_URL="postgresql://postgres:bazoorabatch3@localhost:5432/bazoora"

Components:
\* postgres → database user
\* bazoorabatch3 → PostgreSQL password
\* localhost → database host
\* 5432 → PostgreSQL default port
\* bazoora → database name


Notes:
\* Each developer should use their own local PostgreSQL instance.
\* Do not commit actual database credentials.
\* Store real values only in `.env`.


\---

\## Authentication Variables
\### AUTH\_SECRET

Secret key used to sign and verify authentication tokens and sessions.



Example:
AUTH\_SECRET="032026"

Notes:
\* Must be unique per environment.
\* Never commit production secrets.
\* Use a strong random value.

\### AUTH\_TRUST\_HOST
Indicates whether the authentication system should trust forwarded host headers.



Example:
AUTH\_TRUST\_HOST=true

Notes:
\* Commonly enabled during development.
\* May vary depending on deployment environment.

\---

\## Example .env
DATABASE\_URL="postgresql://postgres:bazoorabatch3@localhost:5432/bazoora"
AUTH\_SECRET="032026"
AUTH\_TRUST\_HOST=true

\---

\## Related Files
\* apps/api/prisma/schema.prisma
\* apps/api/prisma.config.ts
\* apps/api/.env



