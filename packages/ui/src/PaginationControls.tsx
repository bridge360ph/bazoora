interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Generic prev/current-page/next pagination control.
 */
export function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mt-3.5 flex items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrev}
        aria-label="Previous page"
        className="rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-xl text-gray-600 disabled:opacity-30"
      >
        ‹
      </button>

      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1a3a2e] text-sm font-bold text-white">
        {page}
      </span>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
        aria-label="Next page"
        className="rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-xl text-gray-600 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}
