import logo from "./icons/logo.svg";

export function Logo({
  className,
  alt = "Logo",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={logo}
      alt={alt}
      className={className}
    />
  );
}