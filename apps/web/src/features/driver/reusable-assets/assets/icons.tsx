/* eslint-disable react-refresh/only-export-components */

/* ---------------- ICON PLUMBING ---------------- */
export type IconShape = {
  paths: string[];
  circles?: { cx: number; cy: number; r: number }[];
};

export const Icon = ({ icon, size = 18 }: { icon: IconShape; size?: number }) => (
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

/* ---------------- ICON DATA ---------------- */
export const icons: Record<string, IconShape> = {
  dashboard: {
    paths: ["M4 13h7v7H4v-7zm0-10h7v7H4V3zm9 0h7v7h-7V3zm0 10h7v7h-7v-7z"],
  },
  route: {
    paths: ["M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"],
    circles: [{ cx: 12, cy: 10, r: 2.5 }],
  },
  collections: {
    paths: [
      "M22 12h-6l-2 3h-4l-2-3H2",
      "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
    ],
  },
  tasks: {
    paths: [
      "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
      "M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z",
      "m9 14 2 2 4-4",
    ],
  },
  report: {
    paths: ["M5 3v18", "M5 4h11l-2.5 4L16 12H5"],
  },
  messages: {
    paths: ["M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"],
  },
  settings: {
    paths: [
      "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
    ],
    circles: [{ cx: 12, cy: 12, r: 3 }],
  },
  bell: {
    paths: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  },
  flag: {
    paths: ["M5 3v18", "M5 4h11l-2.5 4L16 12H5"],
  },
  check: {
    paths: ["M20 6 9 17l-5-5"],
  },
  home: {
    paths: ["M3 10.5 12 3l9 7.5", "M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"],
  },
  alert: {
    paths: ["M12 8v5", "M12 16.5v.5"],
    circles: [{ cx: 12, cy: 12, r: 9 }],
  },
  download: {
    paths: ["M12 3v12", "m7 10 5 5 5-5", "M5 21h14"],
  },
  profile: {
    paths: ["M20 21a8 8 0 0 0-16 0"],
    circles: [{ cx: 12, cy: 7, r: 4 }],
  },
  close: {
    paths: ["M18 6 6 18", "M6 6l12 12"],
  },
};
