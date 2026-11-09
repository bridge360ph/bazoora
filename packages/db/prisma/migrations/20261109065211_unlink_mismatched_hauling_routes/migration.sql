-- Data only, no schema change.
--
-- 20261105063841_unify_route_waste_types renamed every route's waste type,
-- and a request now only fits a route of exactly its own waste type. Before,
-- a "Regular" route also carried Residual and Hazardous requests, so some
-- approved requests are now on a route of another waste type and would still
-- be handed to its driver.
--
-- This takes each of those requests off its route, so an admin can schedule
-- it again, and tells the requester the same way as when an admin removes a
-- request from a route. Every request it touches is listed in the migration
-- output (RAISE NOTICE).
DO $$
DECLARE
  item RECORD;
  author TEXT;
  notification_id TEXT;
  touched INTEGER := 0;
BEGIN
  FOR item IN
    SELECT
      h."requestId",
      h."requestNumber",
      h."userId",
      h."wasteType"::text AS request_waste,
      h."approvedBy",
      r."routeNumber",
      r."wasteType" AS route_waste
    FROM "HaulingRequest" h
    JOIN "Route" r ON r."id" = h."routeId"
    WHERE h."status"::text = 'APPROVED'
      AND h."wasteType"::text <> r."wasteType"
  LOOP
    UPDATE "HaulingRequest"
    SET "routeId" = NULL, "routeAssignedAt" = NULL
    WHERE "requestId" = item."requestId";

    -- The admin who approved it, or the first super admin.
    author := COALESCE(
      item."approvedBy",
      (SELECT "id" FROM "User" WHERE "role"::text = 'SUPER_ADMIN' ORDER BY "createdAt" LIMIT 1)
    );

    IF author IS NOT NULL THEN
      notification_id := gen_random_uuid()::text;

      INSERT INTO "Notification" ("id", "type", "audience", "title", "message", "createdById", "createdAt")
      VALUES (
        notification_id,
        'HAULING_REQUEST_SCHEDULED',
        'Direct',
        'Collection schedule removed',
        item."requestNumber" || ' is no longer on a collection route. You will be notified once it is scheduled again.',
        author,
        now()
      );

      INSERT INTO "NotificationReceipt" ("id", "notificationId", "userId", "createdAt")
      VALUES (gen_random_uuid()::text, notification_id, item."userId", now());
    END IF;

    RAISE NOTICE 'Took % (%) off RT-% (% route)',
      item."requestNumber", item.request_waste, lpad(item."routeNumber"::text, 3, '0'), item.route_waste;
    touched := touched + 1;
  END LOOP;

  RAISE NOTICE 'Hauling requests taken off a route of another waste type: %', touched;
END $$;
