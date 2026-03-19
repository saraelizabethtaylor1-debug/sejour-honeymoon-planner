import { motion } from 'framer-motion';
import { Plane, Hotel, Sparkles, CalendarHeart, MapPin } from 'lucide-react';
import type { DetailView } from '@/types/honeymoon';

interface OverviewTabProps {
  onOpenDetail: (view: DetailView) => void;
}

const items: { label: string; view: DetailView; icon: typeof Plane }[] = [
  { label: 'Transportation', view: 'transportation', icon: Plane },
  { label: 'Accommodations', view: 'accommodations', icon: Bed },
  { label: 'Activities', view: 'activities', icon: Sparkles },
  { label: 'Reservations', view: 'reservations', icon: CalendarCheck },
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
      className="space-y-3 sm:space-y-4"
    >
      {items.map((itm) => (
        <motion.button
          key={itm.label}
          variants={item}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpenDetail(itm.view)}
          className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5 bg-primary/60 pill-shape shadow-soft transition-shadow duration-300 hover:shadow-card"
        >
          <itm.icon size={18} strokeWidth={1.5} className="text-primary-foreground" />
          <span className="font-serif text-lg sm:text-xl tracking-wide text-foreground">{itm.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default OverviewTab;
