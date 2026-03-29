import { Menu } from 'lucide-react';
import type { TripData, DashboardTab } from '@/types/honeymoon';
import { motion } from 'framer-motion';
import { getDaysUntilTrip, getFormattedDate } from '@/lib/dateUtils';
import moonLogo from '@/assets/moon-logo.png';

interface DashboardHeaderProps {
  tripData: TripData;
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onMenuToggle: () => void;
}

const tabs: { key: DashboardTab; label: string }[] = [
  { key: 'planning', label: 'Planning' },
  { key: 'overview', label: 'Trip Overview' },
  { key: 'itinerary', label: 'Itinerary' },
];

const DashboardHeader = ({ tripData, tab, onTabChange, onMenuToggle }: DashboardHeaderProps) => {
  const countdown = getDaysUntilTrip(tripData.date);
  const formattedDate = getFormattedDate(tripData.date);

  const initials = (() => {
    const parts = tripData.names.split('&').map((s) => s.trim());
    return parts.length === 2
      ? `${parts[0].charAt(0).toUpperCase()} ${parts[1].charAt(0).toUpperCase()}`
      : tripData.names.substring(0, 2).toUpperCase();
  })();

  const dateLine = [formattedDate, countdown].filter(Boolean).join(' · ');

  return (
    <div className="bg-background z-10">
      <header className="px-4 sm:px-6 lg:px-8 flex items-center gap-4 border-b border-foreground/5">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={onMenuToggle} className="shrink-0">
            <Menu className="text-foreground/70" size={20} strokeWidth={1.8} />
          </button>
          <div className="relative w-[102px] h-[102px] sm:w-[114px] sm:h-[114px] shrink-0">
            <img src={moonLogo} alt="Logo" className="w-full h-full object-contain" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-xs sm:text-sm tracking-wider text-foreground/70 -translate-x-[1px]">
                {initials}
              </span>
            </div>
          </div>
        </div>

        {/* Center: navigation tabs */}
        <div className="flex items-center gap-6 sm:gap-10 md:gap-12">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`text-base uppercase tracking-[0.28em] relative transition-colors duration-200 text-sidebar-foreground py-5 ${
                tab === t.key ? 'text-foreground/80' : 'text-foreground/20'
              }`}
            >
              {t.label}
              {tab === t.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-foreground/15"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Right: destination + date */}
        <div className="text-right shrink-0 ml-auto">
          <p className="font-script sm:text-3xl font-light lowercase leading-tight truncate max-w-[180px] sm:max-w-none ml-auto text-5xl py-[2px]" style={{ color: 'hsl(0 20% 32%)' }}>
            {tripData.destination}
          </p>
          {dateLine && (
            <p className="text-[8px] uppercase tracking-[0.14em] leading-tight mt-0.5 sm:text-xs" style={{ color: 'hsl(10 8% 28%)' }}>
              {dateLine}
            </p>
          )}
        </div>
      </header>
    </div>
  );
};

export default DashboardHeader;
