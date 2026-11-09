-- Backfill for the truck branch and waste type columns added in
-- 20261105121931_add_truck_branch_and_waste_type. Data only, no schema change.
--
-- 1. Routes with map stops get the branch nearest the middle of their stops.
-- 2. Trucks on a route take that route's waste type and branch.
-- Trucks on no route, and routes with no map stops, stay unset. An admin sets
-- those trucks in Fleet Management, and such a route takes the branch of the
-- truck it is given.
--
-- Branch positions match BRANCH_LIST in packages/shared/src/branches.ts. The
-- head office uses its default position (Makati).

-- 1. Route branch from the middle of its map stops.
WITH branches (id, lat, lng) AS (
  VALUES
    ('hq', 14.5547, 121.0244),
    ('quezon-city', 14.676, 121.0437),
    ('manila', 14.5995, 120.9842),
    ('caloocan', 14.6507, 120.9676),
    ('valenzuela', 14.7011, 120.983),
    ('pasig', 14.5764, 121.0851),
    ('paranaque', 14.4793, 121.0198),
    ('malolos', 14.8527, 120.816),
    ('san-fernando-pampanga', 15.0286, 120.6898),
    ('angeles', 15.145, 120.5887),
    ('olongapo', 14.8292, 120.2828),
    ('tarlac', 15.4755, 120.5963),
    ('cabanatuan', 15.4865, 120.9667),
    ('imus', 14.4297, 120.9367),
    ('calamba', 14.2117, 121.1653),
    ('antipolo', 14.5865, 121.1753),
    ('batangas', 13.7565, 121.0583),
    ('lipa', 13.9411, 121.1631),
    ('lucena', 13.9373, 121.617),
    ('dagupan', 16.0433, 120.3333),
    ('baguio', 16.4023, 120.596),
    ('san-fernando-la-union', 16.6159, 120.3166),
    ('vigan', 17.5747, 120.3869),
    ('laoag', 18.196, 120.5927),
    ('santiago', 16.688, 121.5487),
    ('tuguegarao', 17.6132, 121.727),
    ('naga', 13.6218, 123.1948),
    ('legazpi', 13.1391, 123.7438)
),
centres AS (
  SELECT
    r."id",
    AVG((stop->>'lat')::double precision) AS lat,
    AVG((stop->>'lng')::double precision) AS lng
  FROM "Route" r
  CROSS JOIN LATERAL jsonb_array_elements(r."stopLocations") AS stop
  WHERE r."startBranchId" IS NULL
    AND r."stopLocations" IS NOT NULL
    AND jsonb_typeof(r."stopLocations") = 'array'
    AND stop ? 'lat'
    AND stop ? 'lng'
  GROUP BY r."id"
)
UPDATE "Route" r
SET "startBranchId" = (
  SELECT b.id
  FROM branches b
  ORDER BY
    power(b.lat - c.lat, 2) + power((b.lng - c.lng) * cos(radians(c.lat)), 2)
  LIMIT 1
)
FROM centres c
WHERE r."id" = c."id";

-- 2a. A truck on a route carries that route's waste type.
UPDATE "Truck" t
SET "wasteType" = r."wasteType"
FROM "Route" r
WHERE r."assignedTruckId" = t."id"
  AND t."wasteType" IS NULL
  AND r."wasteType" IN ('BIODEGRADABLE', 'RESIDUAL', 'NON_BIODEGRADABLE', 'HAZARDOUS');

-- 2b. A truck on a route works from that route's branch.
UPDATE "Truck" t
SET "branchId" = r."startBranchId"
FROM "Route" r
WHERE r."assignedTruckId" = t."id"
  AND t."branchId" IS NULL
  AND r."startBranchId" IS NOT NULL;
