/**
 * Works out when a hauling request is actually collected once it is on a
 * route.
 *
 * The resident's pickup date is a preference. The truck comes when its route
 * runs, so the scheduled collection is the route's next run on or after the
 * preferred date, at the route's start time. Dates are compared in Philippine
 * time (UTC+8, no daylight saving), which is where routes run.
 *
 * `notBefore` is when the request was put on the route. A request approved
 * after its preferred date is scheduled for the route's next run from that
 * day instead, so it never names a collection that has already passed. It is
 * a fixed moment, so the scheduled date does not move as time goes on.
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
  route: {
    collectionDay: string;
    startTime: string;
    /** Set on Paid (one-time) routes: they run on this calendar day only. */
    collectionDate?: Date | null;
  },
  notBefore: Date | null = null,
): Date | null {
  const time = START_TIME_PATTERN.exec(route.startTime.trim());

  if (!time) {
    return null;
  }

  const hours = Number(time[1]);
  const minutes = Number(time[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  // A one-time route is collected on its date, whatever was preferred.
  if (route.collectionDate) {
    return new Date(
      Date.UTC(
        route.collectionDate.getUTCFullYear(),
        route.collectionDate.getUTCMonth(),
        route.collectionDate.getUTCDate(),
        hours - MANILA_OFFSET_HOURS,
        minutes,
      ),
    );
  }

  if (!preferredPickup) {
    return null;
  }

  const routeWeekday = WEEKDAYS.indexOf(route.collectionDay);

  if (routeWeekday === -1) {
    return null;
  }

  // The preferred date is the earliest acceptable day, not always the start.
  const anchor =
    notBefore && notBefore.getTime() > preferredPickup.getTime() ? notBefore : preferredPickup;

  // Shift into Manila time so getUTC* reads the Philippine calendar day.
  const manila = new Date(anchor.getTime() + MANILA_OFFSET_HOURS * 60 * 60 * 1000);
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

/** The calendar day in Philippine time, as YYYY-MM-DD. */
export function toManilaDateKey(date: Date): string {
  const manila = new Date(date.getTime() + MANILA_OFFSET_HOURS * 60 * 60 * 1000);
  return manila.toISOString().slice(0, 10);
}
