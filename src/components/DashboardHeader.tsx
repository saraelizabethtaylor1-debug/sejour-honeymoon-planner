import type { TripData, DashboardTab } from "@/types/honeymoon";
import { motion } from "framer-motion";
import { getDaysUntilTrip, getFormattedDate } from "@/lib/dateUtils";
import moonLogo from "@/assets/moon-logo.png";

interface DashboardHeaderProps {
  tripData: TripData;
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  initials?: string;
}

const tabs: { key: DashboardTab; label: string }[] = [
  { key: "planning", label: "Planning" },
  { key: "overview", label: "Trip Overview" },
  { key: "itinerary", label: "Itinerary" },
];

const DashboardHeader = ({ tripData, tab, onTabChange, initials }: DashboardHeaderProps) => {
  const countdown = getDaysUntilTrip(tripData.date);
  const formattedDate = getFormattedDate(tripData.date);
  const dateLine = [tripData.destination, countdown].filter(Boolean).join(" · ");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-foreground/5" style={{ boxShadow: "0 1px 8px -2px hsl(10 8% 12% / 0.04)" }}>
      {/* Top row: logo + wordmark */}
      <div className="flex items-center justify-center gap-4 pt-6 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
          <img src={moonLogo} alt="Logo" className="w-full h-full object-contain" />
          {initials && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-foreground/70" style={{ fontSize: "9px", letterSpacing: "0.15em", transform: "translateX(-0.5px)" }}>
                {initials}
              </span>
            </div>
          )}
        </div>
        <span
          className="font-serif text-foreground/80"
          style={{ fontSize: "32px", letterSpacing: "0.4em", fontWeight: 300 }}
        >
          SÉJOUR
        </span>
      </div>

      {/* Tab navigation — hidden on mobile */}
      <nav className="hidden md:flex items-center justify-center gap-12 pb-2.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`relative text-[12px] uppercase tracking-[0.25em] pb-2 transition-colors duration-200 ${
              tab === t.key ? "text-foreground/80" : "text-foreground/25 hover:text-foreground/45"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[1px] bg-foreground/25"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Destination + countdown — hidden on mobile */}
      {dateLine && (
        <div className="hidden md:block text-center pb-3">
          <p className="text-[9px] uppercase tracking-[0.2em] text-foreground/35">
            {dateLine}
          </p>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
