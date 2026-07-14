interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({
  label,
  value,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`rounded-[10px] border border-gray-200 bg-white px-5 py-[18px] shadow-sm ${className}`}
    >
      <div className="mb-1.5 text-xs text-gray-500">{label}</div>
      <div className="text-3xl font-extrabold leading-none text-gray-900">
        {value}
      </div>
    </div>
  );
}