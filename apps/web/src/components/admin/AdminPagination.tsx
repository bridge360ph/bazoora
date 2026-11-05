import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const ADMIN_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

/** Page maths for a list: keeps the page valid when the list shrinks. */
export function paginate<T>(items: T[], currentPage: number, rowsPerPage: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, total);

  return {
    page,
    totalPages,
    total,
    startIndex,
    endIndex,
    pageItems: items.slice(startIndex, endIndex),
  };
}

/** "Showing 1–5 of 12", page number with arrows, and rows per page. */
export function AdminPagination({
  page,
  totalPages,
  total,
  startIndex,
  endIndex,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  pageSizeOptions = ADMIN_PAGE_SIZE_OPTIONS,
}: {
  page: number;
  totalPages: number;
  total: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rows: number) => void;
  pageSizeOptions?: readonly number[];
}): ReactNode {
  return (
    <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="min-w-32 text-[10px] text-gray-500" aria-live="polite">
        {total > 0 && `Showing ${startIndex + 1}–${endIndex} of ${total}`}
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="cursor-pointer text-gray-500 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
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
          onClick={() => onPageChange(page + 1)}
          className="cursor-pointer text-gray-500 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {rowsPerPage !== undefined && onRowsPerPageChange ? (
        <label className="flex min-w-32 items-center justify-end gap-2 text-[10px] text-gray-500">
          Rows per page
          <select
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            className="h-7 rounded-md border border-gray-200 bg-white px-2 text-[10px] text-gray-700 outline-none"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span className="min-w-32" />
      )}
    </div>
  );
}
