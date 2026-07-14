interface StatusBadgeProps {
  status: string;
}

const baseClasses =
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2.5 py-0.5 text-[12.5px] font-medium";

function getStatusClasses(status: string): string {
  if (
    status === "Available" ||
    status === "Completed" ||
    status === "Approved"
  ) {
    return "bg-green-100 text-green-800";
  }

  if (
    status === "Pending" ||
    status === "On Route" ||
    status === "In Progress"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "Assigned") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "Denied" || status === "Off Duty") {
    return "bg-red-100 text-red-800";
  }

  return "bg-gray-100 text-gray-500";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${baseClasses} ${getStatusClasses(status)}`}>
      {status}
    </span>
  );
}