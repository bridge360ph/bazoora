import { Icon, HamburgerIcon } from "./icons";
import { icons } from "./iconData";

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
    <header className="h-[60px] bg-[#0f2a1f] text-white flex items-center justify-between px-[18px] flex-shrink-0">
      <div className="flex-1 flex items-center cursor-pointer" onClick={() => !isMobile && onToggleNav?.()}>
        {!isMobile && <HamburgerIcon />}
      </div>

      <div className="flex-1 text-center font-extrabold">{isMobile ? mobileTitle : title}</div>

      <div className="flex-1 flex items-center justify-end gap-3">
        <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center bg-white/10">
          <Icon icon={icons.bell} />
        </div>
        {/* Avatar stays visible on mobile too instead of disappearing —
            tapping it can route to Profile just like the FAB's shortcut. */}
        <div className="w-[34px] h-[34px] rounded-full bg-[#e0983f] text-white flex items-center justify-center font-bold text-[13px] flex-shrink-0">
          {userInitials}
        </div>
      </div>
    </header>
  );
}