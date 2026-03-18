import { Menu } from 'lucide-react';
import type { TripData, DashboardTab } from '@/types/honeymoon';
import { motion } from 'framer-motion';

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
  return (
    <div className="bg-background z-10">
      <header className="px-6 pt-12 pb-4 flex items-start justify-between">
        <button onClick={onMenuToggle} className="mt-1">
          <Menu className="text-foreground" size={24} strokeWidth={2.5} />
        </button>
        <h1 className="font-script text-4xl text-foreground leading-none">honeymoon</h1>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.15em] text-foreground/50 leading-tight">
            {tripData.destination}
          </p>
          <p className="text-[9px] uppercase tracking-[0.15em] text-foreground/50 leading-tight">
            {tripData.date}
          </p>
          <p className="text-[11px] font-medium text-primary-foreground">
            {tripData.days} Days Away
          </p>
        </div>
      </header>

      <div className="flex px-6 gap-8 border-b border-foreground/5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`pb-4 text-[10px] uppercase tracking-[0.15em] relative transition-colors ${
              tab === t.key ? 'text-foreground' : 'text-foreground/35'
            }`}
          >
            {t.label}
            {tab === t.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;
