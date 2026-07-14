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
      className={`
        bg-white
        rounded-[10px]
        px-[20px] py-[18px]
        border border-[#e5e7eb]
        shadow-[0_1px_3px_rgba(0,0,0,0.04)]
        ${className}
      `}
    >
      <div
        className="
          mb-[6px]
          text-[12.5px]
          text-[#6b7280]
        "
      >
        {label}
      </div>

      <div
        className="
          text-[28px]
          font-extrabold
          leading-none
          text-[#111111]
        "
      >
        {value}
      </div>
    </div>
  );
}