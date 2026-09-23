// CLIENT-SIDE CSV EXPORT UTILITY

export interface CsvColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

export function exportToCsv<T>(
  filename: string,
  data: T[],
  columns: CsvColumn<T>[]
): void {
  // ESCAPE VALUES AND WRAP STRINGS CONTAINING COMMAS, NEWLINES, OR QUOTES
  const escapeCsvValue = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const stringVal = String(val);
    const escaped = stringVal.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  // BUILD HEADER ROW
  const headerRow = columns.map((col) => escapeCsvValue(col.header)).join(",");

  // BUILD DATA ROWS
  const dataRows = data.map((item) =>
    columns.map((col) => escapeCsvValue(col.accessor(item))).join(",")
  );
  
  // PREPEND UTF-8 BOM FOR ACCURATE CHARACTER ENCODING IN EXCEL
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}