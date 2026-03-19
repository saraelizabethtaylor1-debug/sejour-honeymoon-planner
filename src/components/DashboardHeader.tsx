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

  return (
    <div className="bg-background z-10">
      <header className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onMenuToggle} className="mt-1 shrink-0">
            <Menu className="text-foreground/70" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="font-script text-2xl sm:text-3xl text-foreground/80 leading-none text-left whitespace-nowrap">
            honeymoon planner
          </h1>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] uppercase tracking-[0.18em] text-foreground/45 leading-tight">
            {tripData.destination}
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

      <div className="flex px-4 sm:px-6 lg:px-8 gap-8 sm:gap-12 border-b border-foreground/5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`pb-4 text-[10px] uppercase tracking-[0.25em] relative transition-colors duration-200 ${
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
