import { Icon, HamburgerIcon, icons } from "../assets/icons";
import {
  header,
  leftHeader,
  headerTitle,
  rightHeader,
  bellWrap,
  topAvatar,
} from "../assets/layoutStyles";

export function Header({
  isMobile,
  title,
  mobileTitle = "BAZOORA",
  userInitials = "JD",
  onToggleNav,
}: {
  isMobile: boolean;
  title: string;
  mobileTitle?: string;
  userInitials?: string;
  onToggleNav?: () => void;
}) {
  return (
    <header style={header}>
      <div style={leftHeader} onClick={() => !isMobile && onToggleNav?.()}>
        {!isMobile && <HamburgerIcon />}
      </div>

      <div style={headerTitle}>{isMobile ? mobileTitle : title}</div>

      <div style={rightHeader}>
        <div style={bellWrap}>
          <Icon icon={icons.bell} />
        </div>
        {/* Profile lives in the mobile FAB, so the header avatar is
            desktop-only. */}
        {!isMobile && <div style={topAvatar}>{userInitials}</div>}
      </div>
    </header>
  );
}
