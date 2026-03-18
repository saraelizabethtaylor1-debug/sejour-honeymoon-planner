import { Menu } from 'lucide-react';
import type { TripData, DashboardTab } from '@/types/honeymoon';
import { motion } from 'framer-motion';
import santoriniCover from '@/assets/santorini-cover.jpg';

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
          <Menu className="text-foreground/70" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="font-script text-4xl text-foreground leading-none">honeymoon</h1>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.18em] text-foreground/45 leading-tight">
            {tripData.destination}
          </p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-foreground/45 leading-tight">
            {tripData.date}
          </p>
          <p className="text-[11px] font-medium text-primary-foreground mt-0.5">
            {tripData.days} Days Away
          </p>
        </div>
      </header>

      {/* Subtle hero banner */}
      <div className="mx-6 mb-4 h-20 pill-shape overflow-hidden relative">
        <img
          src={santoriniCover}
          alt="Trip hero"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6">
          <p className="font-serif text-lg text-foreground/80 italic">
            {tripData.names}'s {tripData.destination.split('&')[0].trim()} trip
          </p>
        </div>
      </div>

      <div className="flex px-6 gap-10 border-b border-foreground/5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`pb-4 text-[10px] uppercase tracking-[0.2em] relative transition-colors duration-200 ${
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
