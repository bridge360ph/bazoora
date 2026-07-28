import React from "react";

interface NavbarProps {
  title: string;
  notificationCount?: number;
  onMenuToggle?: () => void;
  onNotificationsClick?: () => void;
  avatarUrl?: string;
  avatarInitials?: string;
  onAvatarClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  title,
  notificationCount = 0,
  onMenuToggle,
  onNotificationsClick,
  avatarUrl,
  avatarInitials = "",
  onAvatarClick,
}) => (
  <header className="flex h-14 items-center border-b border-[#0f2417] bg-brand-dark px-4 sm:px-5">
    {/* Hamburger */}
    <button
      type="button"
      onClick={onMenuToggle}
      className="mr-3 text-green-200 transition-colors hover:text-white md:hidden"
      aria-label="Toggle menu"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold tracking-wide text-white">
      {title}
    </h1>

    <div className="ml-3 flex items-center gap-3">
      <button
        type="button"
        onClick={onNotificationsClick}
        className="relative text-green-200 transition-colors hover:text-white"
        aria-label="Notifications"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {notificationCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onAvatarClick}
        className="h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-green-600 transition-colors hover:border-green-400"
        aria-label="User profile"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="User avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#4a9e5c] text-xs font-semibold text-white">
            {avatarInitials}
          </div>
        )}
      </button>
    </div>
  </header>
);

export default Navbar;
