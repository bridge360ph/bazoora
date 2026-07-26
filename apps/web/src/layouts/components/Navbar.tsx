import React from "react";

interface NavbarProps {
  title: string;
  notificationCount?: number;
  onMenuToggle?: () => void;
  onNotificationsClick?: () => void;
  avatarUrl?: string;
  /** Fallback initials rendered when no avatarUrl is provided */
  avatarInitials?: string;
  onAvatarClick?: () => void;
}

/**
 * Navbar — dark green top bar shared across all user roles.
 *
 * Left:   hamburger menu toggle
 * Center: page title
 * Right:  notification bell (with badge) + user avatar
 *
 * The border-b uses the same dark green as AdminSidebar's border-r so
 * they meet cleanly at the top-left corner of the content area.
 *
 * Usage:
 *   <Navbar
 *     title="Dashboard"
 *     notificationCount={3}
 *     avatarInitials="JD"
 *     onNotificationsClick={() => navigate("/notifications")}
 *   />
 */

const Navbar: React.FC<NavbarProps> = ({
  title,
  notificationCount = 0,
  onMenuToggle,
  onNotificationsClick,
  avatarUrl,
  avatarInitials = "",
  onAvatarClick,
}) => (
  <header className="flex items-center h-14 px-5 bg-brand-dark border-b border-[#0f2417]">
    {/* Hamburger */}
    <button
      onClick={onMenuToggle}
      className="text-green-200 hover:text-white transition-colors mr-4"
      aria-label="Toggle menu"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    {/* Title */}
    <h1 className="flex-1 text-center text-white text-sm font-semibold tracking-wide">
      {title}
    </h1>

    {/* Right - bell + avatar */}
    <div className="flex items-center gap-3 ml-4">
      <button
        onClick={onNotificationsClick}
        className="relative text-green-200 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>

      <button
        onClick={onAvatarClick}
        className="w-8 h-8 rounded-full overflow-hidden border-2 border-green-600 hover:border-green-400 transition-colors shrink-0"
        aria-label="User profile"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#4a9e5c] text-white text-xs font-semibold">
            {avatarInitials}
          </div>
        )}
      </button>
    </div>
  </header>
);

export default Navbar;