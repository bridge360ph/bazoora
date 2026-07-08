/* Shared Tailwind class strings used by every driver page.
   These replace the old CSSProperties objects — same visual result,
   just expressed as utility classes instead of inline styles. */

export const layout = "flex h-screen bg-[#f3f6f4] font-sans relative";

export const mainWrap = "flex-1 flex flex-col min-w-0 overflow-y-auto";

/* ---------------- GENERIC STAT CARD SHELLS ---------------- */
export const topCards = "grid grid-cols-3 gap-3 mb-4";
export const topCardsMobile = "grid grid-cols-2 gap-2.5 mb-4";

export const smallCard = "bg-white rounded-2xl p-3.5 border border-gray-200 min-w-0";
export const smallCardRow =
  "bg-white rounded-2xl p-3.5 border border-gray-200 flex justify-between items-center min-w-0";

export const smallLabel = "text-xs opacity-60 whitespace-nowrap overflow-hidden text-ellipsis";
export const smallValue = "text-lg font-extrabold";

export const rowBetween = "flex items-baseline justify-between";

export const pillOrangeSmall = "text-[11px] font-bold bg-orange-100 text-orange-800 px-2.5 py-1 rounded-full flex-shrink-0";
export const pillGreenSmall = "text-[11px] font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full flex-shrink-0";