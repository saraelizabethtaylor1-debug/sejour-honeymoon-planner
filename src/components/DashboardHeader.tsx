import { Menu } from 'lucide-react';
import type { TripData, DashboardTab } from '@/types/honeymoon';
import { motion } from 'framer-motion';
import { getDaysUntilTrip } from '@/lib/dateUtils';
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

  const initials = (() => {
    const parts = tripData.names.split('&').map((s) => s.trim());
    return parts.length === 2
      ? `${parts[0].charAt(0).toUpperCase()} ${parts[1].charAt(0).toUpperCase()}`
      : tripData.names.substring(0, 2).toUpperCase();
  })();

  return (
    <div className="bg-background z-10">
      <header className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={onMenuToggle} className="shrink-0">
            <Menu className="text-foreground/70" size={20} strokeWidth={1.8} />
          </button>
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0">
            <img src={moonLogo} alt="Logo" className="w-full h-full object-contain" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-[8px] sm:text-[10px] tracking-wider text-foreground/70 -translate-x-[1px]">
                {initials}
              </span>
            </div>
          </div>
          <h1 className="font-script text-[1.65rem] sm:text-[2rem] md:text-[2.2rem] text-foreground/80 leading-none whitespace-nowrap">
            honeymoon planner
          </h1>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[7px] sm:text-[9px] uppercase tracking-[0.18em] text-foreground/45 leading-tight truncate max-w-[100px] sm:max-w-none ml-auto">
            {tripData.destination}
          </p>
          <p className="text-[7px] sm:text-[9px] uppercase tracking-[0.18em] text-foreground/35 leading-tight">
            {tripData.date}
          </p>
          {countdown && (
            <p className="text-[9px] sm:text-[11px] font-medium text-primary-foreground mt-0.5">
              {countdown}
            </p>
          )}
        </div>
      </header>

      <div className="flex px-4 sm:px-6 lg:px-8 gap-6 sm:gap-10 md:gap-12 border-b border-foreground/5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`pb-3.5 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] relative transition-colors duration-200 ${
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
    </div>
  );
};

export default DashboardHeader;
