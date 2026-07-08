import { type IconShape } from "./iconData";

export const Icon = ({
  icon,
  size = 18,
}: {
  icon: IconShape;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {icon.paths.map((d, i) => (
      <path key={i} d={d} />
    ))}
    {icon.circles?.map((c, i) => (
      <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
    ))}
  </svg>
);

export const HamburgerIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);