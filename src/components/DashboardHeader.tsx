import { Menu } from "lucide-react";
import type { TripData, DashboardTab } from "@/types/honeymoon";
import { motion } from "framer-motion";
import { getDaysUntilTrip, getFormattedDate } from "@/lib/dateUtils";
import moonLogo from "@/assets/moon-logo.png";

interface DashboardHeaderProps {
  tripData: TripData;
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onMenuToggle: () => void;
}

const tabs: { key: DashboardTab; label: string }[] = [
  { key: "planning", label: "Planning" },
  { key: "overview", label: "Trip Overview" },
  { key: "itinerary", label: "Itinerary" },
];

const DashboardHeader = ({ tripData, tab, onTabChange, onMenuToggle }: DashboardHeaderProps) => {
  const countdown = getDaysUntilTrip(tripData.date);
  const formattedDate = getFormattedDate(tripData.date);
  const dateLine = [formattedDate, countdown].filter(Boolean).join(" · ");

  return (
    <div className="bg-background z-10">
      <header
        className="px-4 sm:px-6 lg:px-8 border-b border-foreground/5"
        style={{ display: "flex", alignItems: "flex-end", height: "96px", paddingBottom: "12px" }}
      >
        {/* Left: hamburger + logo */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexShrink: 0 }}>
          <button onClick={onMenuToggle} style={{ marginBottom: "4px" }}>
            <Menu className="text-foreground/70" size={20} strokeWidth={1.8} />
          </button>
          <div style={{ position: "relative", width: 80, height: 80, marginBottom: -24, flexShrink: 0 }}>
            <img src={moonLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        </div>

        {/* Center: navigation tabs */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "48px", paddingBottom: "0px", marginLeft: "24px" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`text-base uppercase tracking-[0.28em] relative transition-colors duration-200 ${
                tab === t.key ? "text-foreground/80" : "text-foreground/20"
              }`}
            >
              {t.label}
              {tab === t.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-foreground/15"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Right: destination + date */}
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "auto", paddingBottom: "0px" }}>
          <p className="font-script text-4xl font-light lowercase leading-tight text-primary-foreground">
            {tripData.destination}
          </p>
          {dateLine && (
            <p
              className="text-[10px] uppercase tracking-[0.14em] leading-tight mt-0.5"
              style={{ color: "hsl(10 8% 28%)" }}
            >
              {dateLine}
            </p>
          )}
        </div>
      </header>
    </div>
  );
};

export default DashboardHeader;
