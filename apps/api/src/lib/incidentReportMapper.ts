import type { IncidentReport as PrismaIncidentReport, User } from "@bazoora/db";
import type { IncidentReport as SharedIncidentReport } from "@bazoora/shared";

type IncidentWithReporter = PrismaIncidentReport & {
  reporter?: Pick<User, "name"> | null;
};

export function mapIncidentReport(
  report: IncidentWithReporter,
): SharedIncidentReport {
  return {
    id: report.id,
    reportNumber: report.reportNumber,
    reporterId: report.reporterId,
    category: report.category,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    ...(report.reporter?.name && {
      reporterName: report.reporter.name,
    }),
    ...(report.routeId !== null && {
      routeId: report.routeId,
    }),
    ...(report.stopName !== null && {
      stopName: report.stopName,
    }),
    ...(report.imageUrl !== null && {
      imageUrl: report.imageUrl,
    }),
    ...(report.adminNotes !== null && {
      adminNotes: report.adminNotes,
    }),
    ...(report.resolvedAt !== null && {
      resolvedAt: report.resolvedAt.toISOString(),
    }),
  };
}