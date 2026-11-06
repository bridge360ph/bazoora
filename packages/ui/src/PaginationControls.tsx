interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

/** Previous, current page of total, next. */
export function PaginationControls({ page, totalPages, onPrev, onNext }: PaginationControlsProps) {
  return (
    <div className="mt-3 flex items-center justify-center gap-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrev}
        aria-label="Previous page"
        className="cursor-pointer text-lg text-gray-500 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        ‹
      </button>

      <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-surface-border px-2 text-xs font-semibold text-brand-dark">
        {page}
      </span>
      <span className="-ml-2 text-[10px] text-gray-400">of {Math.max(totalPages, 1)}</span>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
        aria-label="Next page"
        className="cursor-pointer text-lg text-gray-500 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}
