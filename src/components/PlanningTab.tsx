import { motion } from 'framer-motion';
import { CheckCircle2, DollarSign, Briefcase, StickyNote } from 'lucide-react';
import type { DetailView } from '@/types/honeymoon';

interface PlanningTabProps {
  onOpenDetail: (view: DetailView) => void;
}

const archCards = [
  { title: 'to-dos', icon: CheckCircle2, view: 'todos' as DetailView },
  { title: 'budget', icon: DollarSign, view: 'budget' as DetailView },
  { title: 'packing', icon: Briefcase, view: 'packing' as DetailView },
  { title: 'notes', icon: StickyNote, view: 'notes' as DetailView },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const PlanningTab = ({ onOpenDetail }: PlanningTabProps) => {
  return (
    <div>
      <p className="font-serif italic text-foreground/40 text-center text-lg sm:text-xl leading-relaxed mb-6 sm:mb-8">
        "you are my greatest adventure yet."
      </p>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 justify-center"
      >
        {archCards.map((card) => (
          <motion.button
            key={card.title}
            variants={item}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onOpenDetail(card.view)}
            className="relative flex flex-col items-center justify-end pb-6 sm:pb-8 w-full aspect-[3/4] bg-primary arch-shape shadow-arch overflow-hidden transition-shadow duration-300 hover:shadow-lift"
          >
            <div className="absolute bottom-[4rem] sm:bottom-[4.5rem] text-primary-foreground/15">
              <card.icon size={40} strokeWidth={1.4} />
            </div>
            <span className="font-serif text-base sm:text-lg text-primary-foreground tracking-wide">{card.title}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default PlanningTab;
