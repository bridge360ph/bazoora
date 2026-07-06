import { Icon } from "../assets/icons";
import { mobileNavItems } from "../assets/navConfig";
import {
  bottomNav,
  bottomNavItem,
  bottomNavItemActive,
} from "../assets/layoutStyles";

export function BottomNav({
  activeKey,
  onNavigate,
}: {
  activeKey: string;
  onNavigate?: (key: string) => void;
}) {
  return (
    <nav style={bottomNav}>
      {mobileNavItems.map((item) => (
        <div
          key={item.key}
          style={item.key === activeKey ? bottomNavItemActive : bottomNavItem}
          onClick={() => onNavigate?.(item.key)}
        >
          <Icon icon={item.icon} size={20} />
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}
