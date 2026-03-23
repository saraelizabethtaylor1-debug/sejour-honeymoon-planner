import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Wallet, Briefcase, PenLine, Camera } from 'lucide-react';
import type { DetailView, TripData } from '@/types/honeymoon';

interface PlanningTabProps {
  onOpenDetail: (view: DetailView) => void;
  tripData: TripData;
  onUpdateCoverImage?: (url: string) => void;
}

const archCards = [
  { title: 'to-dos', icon: Heart, view: 'todos' as DetailView },
  { title: 'budget', icon: Wallet, view: 'budget' as DetailView },
  { title: 'packing', icon: Briefcase, view: 'packing' as DetailView },
  { title: 'notes', icon: PenLine, view: 'notes' as DetailView },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const PlanningTab = ({ onOpenDetail, tripData, onUpdateCoverImage }: PlanningTabProps) => {
  const hasCoverImage = !!tripData.coverImage;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onUpdateCoverImage?.(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="planning-layout flex flex-col lg:flex-row items-center lg:items-end gap-6 lg:gap-10" style={{ marginTop: '24px' }}>
      {/* Arched Cover Image or Camera Placeholder */}
      <div className="planning-arch-photo flex-shrink-0 w-full max-w-[280px] lg:min-w-[420px] lg:max-w-[440px]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <div
          className="w-full h-[280px] lg:h-[clamp(360px,70vh,600px)] arch-shape overflow-hidden border-[8px] border-card cursor-pointer"
          style={{
            boxShadow: '0 12px 40px -8px hsl(0 16% 43% / 0.12), 0 4px 16px -4px hsl(0 16% 43% / 0.06)',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {hasCoverImage ? (
            <img
              src={tripData.coverImage}
              className="w-full h-full object-cover"
              alt={tripData.destination}
            />
          ) : (
            <div className="w-full h-full bg-primary/40 flex items-center justify-center">
              <Camera size={40} strokeWidth={1} className="text-foreground/25" />
            </div>
          )}
        </div>
      </div>

      {/* Right Content — aligned to bottom of arch */}
      <div className="flex-1 flex flex-col justify-end items-center lg:items-start gap-4 sm:gap-5 lg:gap-4">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center lg:text-left max-w-full leading-[1.1] whitespace-nowrap"
        >
          <span className="font-script text-3xl sm:text-4xl lg:text-[3.4rem]" style={{ color: 'hsl(0 20% 32%)' }}>
            happily ever after
          </span>
          <span
            className="font-serif text-xl sm:text-2xl md:text-[1.6rem] lg:text-[2.4rem] text-foreground/50 ml-2 inline"
            style={{ letterSpacing: '0.08em', fontWeight: 300 }}
          >
            starts here.
          </span>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-2 lg:gap-3 w-full max-w-[480px] md:max-w-none"
        >
          {archCards.map((card) => (
            <motion.button
              key={card.title}
              variants={item}
              whileHover={{ scale: 1.02, boxShadow: '0 6px 24px -4px hsl(0 16% 43% / 0.12)', transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpenDetail(card.view)}
              className="planning-card flex flex-col items-center justify-end gap-2.5 pb-4 bg-primary/60 rounded-xl transition-shadow duration-200 h-[160px] sm:h-[clamp(140px,28vh,220px)] md:h-[220px] lg:h-[clamp(240px,42vh,380px)] w-full md:w-[180px] md:max-w-[180px] lg:w-[260px] lg:max-w-[260px]"
              style={{
                boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.08)',
              }}
            >
              <card.icon
                size={22}
                strokeWidth={1}
                className="text-primary-foreground/70"
              />
              <span
                className="font-body text-[11px] uppercase"
                style={{ letterSpacing: '0.12em', color: 'hsl(10 8% 22%)' }}
              >
                {card.title}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default PlanningTab;
