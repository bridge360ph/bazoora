/**
 * Works out when a hauling request is actually collected once it is on a
 * route.
 *
 * The resident's pickup date is a preference. The truck comes when its route
 * runs, so the scheduled collection is the route's next run on or after the
 * preferred date, at the route's start time. Dates are compared in Philippine
 * time (UTC+8, no daylight saving), which is where routes run.
 */

const MANILA_OFFSET_HOURS = 8;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const START_TIME_PATTERN = /^(\d{1,2}):(\d{2})/;

export function getScheduledCollectionAt(
  preferredPickup: Date | null,
  route: { collectionDay: string; startTime: string },
): Date | null {
  if (!preferredPickup) {
    return null;
  }

  const routeWeekday = WEEKDAYS.indexOf(route.collectionDay);
  const time = START_TIME_PATTERN.exec(route.startTime.trim());

  if (routeWeekday === -1 || !time) {
    return null;
  }

  const hours = Number(time[1]);
  const minutes = Number(time[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  // Shift into Manila time so getUTC* reads the Philippine calendar day.
  const manila = new Date(
    preferredPickup.getTime() + MANILA_OFFSET_HOURS * 60 * 60 * 1000,
  );
  const daysUntilRoute = (routeWeekday - manila.getUTCDay() + 7) % 7;

  return new Date(
    Date.UTC(
      manila.getUTCFullYear(),
      manila.getUTCMonth(),
      manila.getUTCDate() + daysUntilRoute,
      hours - MANILA_OFFSET_HOURS,
      minutes,
    ),
  );
}
