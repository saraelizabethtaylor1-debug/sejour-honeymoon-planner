import { motion } from 'framer-motion';
import { CheckCircle2, DollarSign, Briefcase } from 'lucide-react';
import type { DetailView } from '@/types/honeymoon';

interface PlanningTabProps {
  onOpenDetail: (view: DetailView) => void;
}

const archCards = [
  { title: 'to-dos', icon: CheckCircle2, view: 'todos' as DetailView },
  { title: 'budget', icon: DollarSign, view: 'budget' as DetailView },
  { title: 'packing', icon: Briefcase, view: 'packing' as DetailView },
];

const PlanningTab = ({ onOpenDetail }: PlanningTabProps) => {
  return (
    <div className="flex gap-4 justify-center">
      {archCards.map((card) => (
        <motion.button
          key={card.title}
          whileHover={{ scale: 0.97 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onOpenDetail(card.view)}
          className="relative flex flex-col items-center justify-end pb-6 w-full max-w-[140px] aspect-[3/4] bg-primary arch-shape shadow-arch overflow-hidden"
        >
          <div className="absolute top-10 text-primary-foreground/30">
            <card.icon size={40} strokeWidth={1} />
          </div>
          <span className="font-serif text-lg text-primary-foreground">{card.title}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default PlanningTab;
