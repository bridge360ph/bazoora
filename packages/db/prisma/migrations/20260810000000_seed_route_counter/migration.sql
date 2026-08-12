-- Seed the shared display-ID counter for routes.
--
-- Route numbers used to be derived from a row count. Now that they are issued
-- by the Counter table, the counter must start above any routeNumber that
-- already exists, otherwise the first counter-issued number would collide with
-- an existing row on the unique index.
--
-- Data only, no schema change. Idempotent: safe to run against an empty
-- database and against one that already has a route counter.
INSERT INTO "Counter" ("entity", "sequence")
SELECT 'route', COALESCE(MAX("routeNumber"), 0) FROM "Route"
ON CONFLICT ("entity") DO UPDATE
SET "sequence" = GREATEST("Counter"."sequence", EXCLUDED."sequence");
