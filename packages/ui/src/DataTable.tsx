import React from "react";

// ---------------------------------------------------------------------------
// DataTable.tsx — generic typed table
// ---------------------------------------------------------------------------

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * DataTable — generic, fully typed table component.
 * Supports custom cell rendering, sortable columns, and an empty state.
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: "id", header: "Eco-Aide ID", sortable: true },
 *       { key: "name", header: "Name" },
 *       { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
 *     ]}
 *     data={ecoAides}
 *     sortKey="id"
 *     sortDirection="asc"
 *     onSort={handleSort}
 *   />
 */
function DataTable<T extends object>({
  columns,
  data,
  sortKey,
  sortDirection = "asc",
  onSort,
  emptyMessage = "No records found.",
  className = "",
}: DataTableProps<T>) {
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    const isActive = sortKey === columnKey;
    return (
      <span className="inline-flex flex-col ml-1 -translate-y-px">
        <svg className={`w-3 h-3 ${isActive && sortDirection === "asc" ? "text-white" : "text-green-300"}`} viewBox="0 0 10 6" fill="currentColor">
          <path d="M0 6l5-6 5 6H0z" />
        </svg>
        <svg className={`w-3 h-3 mt-0.5 ${isActive && sortDirection === "desc" ? "text-white" : "text-green-300"}`} viewBox="0 0 10 6" fill="currentColor">
          <path d="M0 0l5 6 5-6H0z" />
        </svg>
      </span>
    );
  };

  return (
    <div className={`w-full overflow-x-auto border border-gray-200 rounded-lg ${className}`}>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-[#1E4D2B] text-white">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                onClick={col.sortable && onSort ? () => onSort(String(col.key)) : undefined}
                className={`px-4 py-3 font-medium whitespace-nowrap ${col.sortable && onSort ? "cursor-pointer select-none hover:bg-[#2a6337] transition-colors" : ""} ${col.className ?? ""}`}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && <SortIcon columnKey={String(col.key)} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={String(col.key)} className={`px-4 py-3 text-gray-700 ${col.className ?? ""}`}>
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;