import { useMemo, useState, type ReactNode } from "react";
import type {
  IncidentReport,
  IncidentStatus,
  UpdateIncidentReportInput,
} from "@bazoora/shared";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MapPin,
  RefreshCw,
  Search,
  User,
} from "lucide-react";

import { formatDateTime } from "@/features/hauling-requests/haulingRequestFormat";
import { useIncidentReports, useUpdateIncidentReport } from "./hooks";
import {
  IncidentStatusBadge,
  incidentBorderClass,
  isClosedIncident,
} from "./components/IncidentStatusBadge";
import { IncidentReviewModal } from "./components/IncidentReviewModal";

type StatusTab = "ALL" | IncidentStatus;

const STATUS_TABS: { value: StatusTab; label: string; highlight?: boolean }[] = [
  { value: "PENDING", label: "PENDING", highlight: true },
  { value: "INVESTIGATING", label: "INVESTIGATING" },
  { value: "RESOLVED", label: "RESOLVED" },
  { value: "DENIED", label: "DENIED" },
  { value: "ALL", label: "ALL" },
];

const PAGE_SIZE = 8;
const ALL_CATEGORIES = "";

// Open reports need action, so they sort first; newest first within each group.
function compareReports(a: IncidentReport, b: IncidentReport): number {
  const aOpen = isClosedIncident(a.status) ? 1 : 0;
  const bOpen = isClosedIncident(b.status) ? 1 : 0;
  if (aOpen !== bOpen) return aOpen - bOpen;
  return b.createdAt.localeCompare(a.createdAt);
}

function matchesSearch(report: IncidentReport, query: string): boolean {
  if (!query) return true;
  return [
    report.reportNumber,
    report.reporterName,
    report.description,
    report.routeName,
    report.stopName,
  ].some((value) => value?.toLowerCase().includes(query));
}

/**
 * Admin review queue for incident reports filed by eco-aides and drivers.
 * Rendered through /admin/incidents inside AdminLayout, styled like the
 * hauling request management screen.
 */
export function AdminIncidentReportsPage(): ReactNode {
  const {
    data: reports,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
  } = useIncidentReports();
  const updateMutation = useUpdateIncidentReport();

  const [statusTab, setStatusTab] = useState<StatusTab>("PENDING");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      [...new Set((reports ?? []).map((report) => report.category))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [reports],
  );

  // Category and search apply before the status tabs so the tab counts
  // reflect what the admin would see on each tab.
  const filteredByAttributes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...(reports ?? [])]
      .sort(compareReports)
      .filter(
        (report) =>
          (category === ALL_CATEGORIES || report.category === category) &&
          matchesSearch(report, query),
      );
  }, [reports, category, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = {
      ALL: filteredByAttributes.length,
      PENDING: 0,
      INVESTIGATING: 0,
      RESOLVED: 0,
      DENIED: 0,
    };
    for (const report of filteredByAttributes) counts[report.status] += 1;
    return counts;
  }, [filteredByAttributes]);

  const visibleReports =
    statusTab === "ALL"
      ? filteredByAttributes
      : filteredByAttributes.filter((report) => report.status === statusTab);

  const totalReports = visibleReports.length;
  const totalPages = Math.max(1, Math.ceil(totalReports / PAGE_SIZE));
  // Keeps the page valid if the list shrinks after a report changes status.
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalReports);
  const pageReports = visibleReports.slice(startIndex, endIndex);

  // Look the report up from the latest data so the modal shows fresh values.
  const selectedReport = reports?.find((report) => report.id === selectedId) ?? null;

  function closeModal() {
    setSelectedId(null);
    updateMutation.reset();
  }

  function handleSave(input: UpdateIncidentReportInput) {
    if (!selectedReport) return;
    updateMutation.mutate(
      { id: selectedReport.id, input },
      { onSuccess: closeModal },
    );
  }

  return (
    <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-surface p-5">
      <div className="mx-auto flex h-full w-full max-w-350 flex-col">
        <section className="flex h-full min-h-0 w-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Status tabs */}
          <div className="relative flex shrink-0 items-end border-b border-gray-100 pt-6">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto px-3 sm:justify-center sm:gap-8 sm:px-14">
              {STATUS_TABS.map((tab) => (
                <TabButton
                  key={tab.value}
                  isActive={statusTab === tab.value}
                  count={statusCounts[tab.value]}
                  highlight={tab.highlight ?? false}
                  onClick={() => {
                    setStatusTab(tab.value);
                    setCurrentPage(1);
                  }}
                >
                  {tab.label}
                </TabButton>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh reports"
              title="Refresh"
              className="mb-2 mr-3 shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 sm:absolute sm:right-5 sm:top-5 sm:m-0"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex shrink-0 flex-col gap-3 px-6 pt-5 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search reports</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by report ID, reporter, route or description"
                className="h-9 w-full rounded-md border border-surface-border bg-white pl-9 pr-3 text-xs text-gray-700 outline-none placeholder:text-[#6d8b7b] focus:border-brand-secondary"
              />
            </label>

            <label className="sm:w-56">
              <span className="sr-only">Filter by category</span>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-700 outline-none focus:border-brand-secondary"
              >
                <option value={ALL_CATEGORIES}>All categories</option>
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* List */}
          <div className="flex min-h-0 flex-auto flex-col px-6 pb-6 pt-4">
            {isLoading && (
              <div className="flex flex-auto flex-col gap-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-md border border-gray-100 bg-gray-50"
                  />
                ))}
              </div>
            )}

            {isError && (
              <EmptySlot>
                <div className="flex flex-col items-center gap-3">
                  <p className="text-red-600">
                    {error instanceof Error
                      ? error.message
                      : "Couldn't load incident reports."}
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="rounded-md border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Retry
                  </button>
                </div>
              </EmptySlot>
            )}

            {!isLoading && !isError && (
              <>
                <div className="flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto pr-1">
                  {pageReports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onSelect={() => setSelectedId(report.id)}
                    />
                  ))}

                  {totalReports === 0 && (
                    <EmptySlot>
                      {statusTab === "PENDING"
                        ? "No pending reports. You're all caught up."
                        : "No incident reports to display."}
                    </EmptySlot>
                  )}
                </div>

                <div className="mt-3 flex shrink-0 items-center justify-between gap-4">
                  <p className="text-[10px] text-gray-500" aria-live="polite">
                    {totalReports > 0 &&
                      `Showing ${startIndex + 1}–${endIndex} of ${totalReports}`}
                  </p>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setCurrentPage(page - 1)}
                      className="text-gray-500 hover:text-gray-800 disabled:opacity-30"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-surface-border px-2 text-xs font-semibold text-brand-dark">
                      {page}
                    </span>
                    <span className="-ml-2 text-[10px] text-gray-400">of {totalPages}</span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setCurrentPage(page + 1)}
                      className="text-gray-500 hover:text-gray-800 disabled:opacity-30"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {selectedReport && (
        <IncidentReviewModal
          // Remount when a different report opens so the form resets.
          key={selectedReport.id}
          report={selectedReport}
          onClose={closeModal}
          onSave={handleSave}
          isSubmitting={updateMutation.isPending}
          errorMessage={
            updateMutation.error instanceof Error
              ? updateMutation.error.message
              : undefined
          }
        />
      )}
    </div>
  );
}

function TabButton({
  isActive,
  count,
  highlight,
  onClick,
  children,
}: {
  isActive: boolean;
  count: number;
  highlight: boolean;
  onClick: () => void;
  children: ReactNode;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 pb-3 text-xs font-bold sm:px-4 ${
        isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
      <span
        className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
          highlight && count > 0
            ? "bg-orange-100 text-orange-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-px bg-brand-dark" />
      )}
    </button>
  );
}

function ReportCard({
  report,
  onSelect,
}: {
  report: IncidentReport;
  onSelect: () => void;
}): ReactNode {
  const isOpen = !isClosedIncident(report.status);
  const location = [report.routeName, report.stopName].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex min-h-20 w-full shrink-0 items-center justify-between gap-4 rounded-md border border-l-2 border-gray-200 bg-white px-5 py-3 text-left transition hover:border-gray-300 hover:shadow-sm ${incidentBorderClass(report.status)}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-bold text-gray-800">{report.category}</p>
          {report.imageUrl && (
            <ImageIcon className="h-3.5 w-3.5 text-gray-400" aria-label="Has photo" />
          )}
        </div>

        <p className="mt-0.5 truncate text-[11px] text-gray-600">{report.description}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
          <span>ID: {report.reportNumber}</span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-gray-400" />
            {report.reporterName ?? "Unknown user"}
          </span>
          {location && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="truncate">{location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3 text-gray-400" />
            {formatDateTime(report.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <IncidentStatusBadge status={report.status} />
        <span
          className={`flex items-center text-[11px] font-semibold ${
            isOpen
              ? "text-brand-secondary group-hover:text-brand-dark"
              : "text-gray-500 group-hover:text-gray-800"
          }`}
        >
          {isOpen ? "Review" : "Details"}
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

function EmptySlot({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex min-h-20 flex-auto items-center justify-center rounded-md border border-dashed border-gray-200 px-4 text-center text-xs text-gray-400">
      {children}
    </div>
  );
}
