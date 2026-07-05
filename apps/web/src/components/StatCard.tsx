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
      className={className}
      style={{
        background: "#ffffff",
        borderRadius: 10,
        padding: "18px 20px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 12.5,
          color: "#6b7280",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#111111",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}