import { motion } from 'framer-motion';
import { Plane, Building2, Sparkles, CalendarCheck, MapPin } from 'lucide-react';
import type { DetailView } from '@/types/honeymoon';

interface OverviewTabProps {
  onOpenDetail: (view: DetailView) => void;
}

const items: { label: string; view: DetailView; icon: typeof Plane; cost?: string }[] = [
  { label: 'Transportation', view: 'transportation', icon: Plane, cost: '$2,280' },
  { label: 'Accommodations', view: 'accommodations', icon: Building2, cost: '$4,200' },
  { label: 'Activities', view: 'activities', icon: Sparkles, cost: '$800' },
  { label: 'Reservations', view: 'reservations', icon: CalendarCheck, cost: '$0' },
  { label: 'Map', view: 'map', icon: MapPin },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const OverviewTab = ({ onOpenDetail }: OverviewTabProps) => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {items.map((itm) => (
        <motion.button
          key={itm.label}
          variants={item}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpenDetail(itm.view)}
          className="w-full flex items-center justify-between px-6 py-5 bg-secondary pill-shape shadow-soft transition-shadow duration-300 hover:shadow-card"
        >
          <div className="flex items-center gap-4">
            <itm.icon size={18} strokeWidth={1.5} className="text-muted-foreground" />
            <span className="font-serif text-xl tracking-wide text-foreground">{itm.label}</span>
          </div>
          {itm.cost && (
            <span className="text-xs text-muted-foreground font-body">{itm.cost}</span>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
};

export default OverviewTab;
