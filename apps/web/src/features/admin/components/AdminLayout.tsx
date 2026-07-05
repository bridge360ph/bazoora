import type { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import Navbar from "../../../components/Navbar";

interface AdminLayoutUser {
  name: string;
  unitId: string;
  avatarInitials: string;
}

interface AdminLayoutProps {
  title: string;
  activePath: string;
  onNavigate: (path: string) => void;
  user: AdminLayoutUser;
  onSettingsClick: () => void;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  onMenuToggle?: () => void;
  avatarUrl?: string;
  onAvatarClick?: () => void;
  children: ReactNode;
}

/**
 * AdminLayout — composes AdminSidebar + Navbar around page content.
 *
 * NOTE: assumes AdminSidebar.tsx and Navbar.tsx live in src/components/.
 * Adjust the two import paths above if your project places them elsewhere.
 */
export function AdminLayout({
  title,
  activePath,
  onNavigate,
  user,
  onSettingsClick,
  notificationCount = 0,
  onNotificationsClick,
  onMenuToggle,
  avatarUrl,
  onAvatarClick,
  children,
}: AdminLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f3f5f4]">
      <AdminSidebar
        activePath={activePath}
        onNavigate={onNavigate}
        user={user}
        onSettingsClick={onSettingsClick}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar
          title={title}
          notificationCount={notificationCount}
          onMenuToggle={onMenuToggle}
          onNotificationsClick={onNotificationsClick}
          avatarUrl={avatarUrl}
          avatarInitials={user.avatarInitials}
          onAvatarClick={onAvatarClick}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}