-- Routes now use the same four waste types as hauling requests.
-- Data only: the column stays a String, so there is no schema change.
UPDATE "Route"
SET "wasteType" = CASE "wasteType"
  WHEN 'Regular' THEN 'BIODEGRADABLE'
  WHEN 'Recyclable' THEN 'NON_BIODEGRADABLE'
  WHEN 'Regular/Non-Recyclable' THEN 'RESIDUAL'
  ELSE "wasteType"
END
WHERE "wasteType" IN ('Regular', 'Recyclable', 'Regular/Non-Recyclable');
