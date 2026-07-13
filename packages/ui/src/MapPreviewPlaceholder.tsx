/**
 * Generic centered map-icon placeholder for panels awaiting a real map
 * integration.
 */
export function MapPreviewPlaceholder() {
  return (
    <div className="flex h-full min-h-[240px] w-full items-center justify-center">
      <svg
        width="72"
        height="72"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#111827"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M9 3 3 5.5v15L9 18l6 2.5 6-2.5v-15l-6 2.5-6-2.5Z" />
        <path d="M9 3v15M15 5.5v15" />
        <circle cx="18" cy="8" r="2.6" fill="#111827" stroke="none" />
      </svg>
    </div>
  );
}
