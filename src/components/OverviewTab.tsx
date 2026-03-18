import { motion } from 'framer-motion';
import type { DetailView } from '@/types/honeymoon';

interface OverviewTabProps {
  onOpenDetail: (view: DetailView) => void;
}

const items: { label: string; view: DetailView }[] = [
  { label: 'Transportation', view: 'transportation' },
  { label: 'Accommodations', view: 'accommodations' },
  { label: 'Activities', view: 'activities' },
  { label: 'Reservations', view: 'reservations' },
  { label: 'Map', view: 'map' },
];

const OverviewTab = ({ onOpenDetail }: OverviewTabProps) => {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <motion.button
          key={item.label}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpenDetail(item.view)}
          className="w-full flex items-center justify-between px-6 py-5 bg-secondary pill-shape shadow-soft"
        >
          <span className="font-serif text-xl tracking-wide text-foreground">{item.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default OverviewTab;
