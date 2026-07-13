interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  Available: "text-[#166534] bg-[#dcfce7]",
  Completed: "text-[#166534] bg-[#dcfce7]",
  Approved: "text-[#166534] bg-[#dcfce7]",

  Pending: "text-[#92400e] bg-[#fef3c7]",
  "On Route": "text-[#92400e] bg-[#fef3c7]",
  "In Progress": "text-[#92400e] bg-[#fef3c7]",

  Assigned: "text-[#1d4ed8] bg-[#dbeafe]",

  Denied: "text-[#991b1b] bg-[#fee2e2]",
  "Off Duty": "text-[#991b1b] bg-[#fee2e2]",
};

const baseStyle = `
  inline-flex
  items-center
  justify-center
  whitespace-nowrap
  rounded-xl
  px-[10px]
  py-[2px]
  text-[12.5px]
  font-medium
`;

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`
        ${baseStyle}
        ${statusStyles[status] ?? "text-[#6b7280] bg-[#f3f4f6]"}
      `}
    >
      {status}
    </span>
  );
}