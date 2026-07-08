import { Icon } from "./icons";
import { mobileNavItems } from "./navConfig";

export function BottomNav({
  activeKey,
  onNavigate,
}: {
  activeKey: string;
  onNavigate?: (key: string) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0f2a1f] flex justify-around items-center border-t border-white/10 z-20">
      {mobileNavItems.map((item) => (
        <div
          key={item.key}
          className={
            item.key === activeKey
              ? "flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer text-white"
              : "flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer text-white/60"
          }
          onClick={() => onNavigate?.(item.key)}
        >
          <Icon icon={item.icon} size={20} />
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}