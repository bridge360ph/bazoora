interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

/** A summary number: small caps label over a large value. */
export function StatCard({ label, value, className = "" }: StatCardProps) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm ${className}`}
    >
      <div className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold leading-none text-gray-800">{value}</div>
    </div>
  );
}
