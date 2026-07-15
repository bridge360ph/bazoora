export function Logo({
  className,
  alt = "Logo",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/logo.svg"
      alt={alt}
      className={className}
    />
  );
}