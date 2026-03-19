import { Menu } from 'lucide-react';
import type { TripData, DashboardTab } from '@/types/honeymoon';
import { motion } from 'framer-motion';
import { getDaysUntilTrip } from '@/lib/dateUtils';

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
      ? `${parts[0].charAt(0).toLowerCase()}  &  ${parts[1].charAt(0).toLowerCase()}`
      : tripData.names;
  })();

  return (
    <div className="bg-background z-10">
      <header className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onMenuToggle} className="mt-1">
            <Menu className="text-foreground/70" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="font-script text-3xl sm:text-4xl text-foreground/80 leading-none text-left">
            {initials}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.18em] text-foreground/45 leading-tight">
            Honeymoon
          </p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-foreground/45 leading-tight">
            {tripData.date}
          </p>
          {countdown && (
            <p className="text-[11px] font-medium text-primary-foreground mt-0.5">
              {countdown}
            </p>
          )}
        </div>
      </header>

      <div className="flex px-4 sm:px-6 lg:px-8 gap-6 sm:gap-10 border-b border-foreground/5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`pb-4 text-[10px] uppercase tracking-[0.25em] relative transition-colors duration-200 ${
              tab === t.key ? 'text-foreground' : 'text-foreground/30'
            }`}
          >
            {t.label}
            {tab === t.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary"
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
