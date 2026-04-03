import { Heart, Map, CalendarDays } from "lucide-react";
import type { DashboardTab } from "@/types/honeymoon";

interface BottomNavProps {
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const navItems: { key: DashboardTab; label: string; icon: typeof Heart }[] = [
  { key: "planning", label: "Planning", icon: Heart },
  { key: "overview", label: "Overview", icon: Map },
  { key: "itinerary", label: "Itinerary", icon: CalendarDays },
];

const BottomNav = ({ tab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-foreground/5" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", boxShadow: "0 -1px 6px -2px hsl(10 8% 12% / 0.04)" }}>
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors duration-200 ${
                active ? "text-accent-foreground" : "text-foreground/30"
              }`}
            >
              <item.icon size={20} strokeWidth={active ? 1.6 : 1.2} />
              <span className="text-[9px] uppercase tracking-[0.15em]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
