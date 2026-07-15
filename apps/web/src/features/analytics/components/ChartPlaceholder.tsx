type ChartPlaceholderProps = {
  height?: string;
};

export function ChartPlaceholder({
  height = "h-64",
}: ChartPlaceholderProps) {
  return (
    <div
      className={`${height} flex items-center justify-center rounded-lg bg-[#DDE1E6]`}
    >
      <span className="text-sm text-gray-500">
        Chart unavailable
      </span>
    </div>
  );
}