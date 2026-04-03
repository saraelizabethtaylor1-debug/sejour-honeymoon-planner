import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Wallet, Briefcase, PenLine, Camera } from 'lucide-react';
import type { DetailView, TripData } from '@/types/honeymoon';

interface PlanningTabProps {
  onOpenDetail: (view: DetailView) => void;
  tripData: TripData;
  onUpdateCoverImage?: (url: string) => void;
}

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
    <div className="flex justify-center" style={{ marginTop: '24px' }}>
      <div style={{ width: '100%', maxWidth: 1000 }} className="mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-center" style={{ gap: 28 }}>
          {/* Arched Cover Image — 460px wide */}
          <div className="flex-shrink-0 w-full" style={{ maxWidth: 460 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <div
              className="w-full h-[280px] md:h-[clamp(320px,55vh,500px)] lg:h-[clamp(360px,70vh,600px)] arch-shape overflow-hidden border-[8px] border-card cursor-pointer"
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

          {/* Right Content — 480px wide */}
          <div className="flex flex-col justify-end md:justify-start items-center md:items-start gap-4 lg:gap-3" style={{ width: 480, maxWidth: '100%' }}>
            {/* Headline — left-aligned to card grid */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center md:text-left max-w-full leading-[1.1] whitespace-nowrap mb-2 lg:mb-8"
            >
              <span className="font-script text-3xl sm:text-4xl lg:text-[3.4rem]" style={{ color: 'hsl(0 20% 32%)' }}>
                happily ever after
              </span>
              <span
                className="font-serif text-xl sm:text-2xl lg:text-[2.4rem] text-foreground/50 ml-2 inline"
                style={{ letterSpacing: '0.08em', fontWeight: 300 }}
              >
                starts here.
              </span>
            </motion.div>

            {/* 2x2 Card Grid — 480px wide */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 w-full"
              style={{ gap: 16 }}
            >
              {[
                { title: 'to-dos', icon: Heart, view: 'todos' as const },
                { title: 'budget', icon: Wallet, view: 'budget' as const },
                { title: 'packing', icon: Briefcase, view: 'packing' as const },
                { title: 'notes', icon: PenLine, view: 'notes' as const },
              ].map((card) => (
                <motion.button
                  key={card.title}
                  variants={item}
                  whileHover={{ scale: 1.02, boxShadow: '0 6px 24px -4px hsl(0 16% 43% / 0.12)', transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onOpenDetail(card.view)}
                  className="planning-card flex flex-col items-center justify-center gap-2.5 bg-primary/50 rounded-xl transition-shadow duration-200 h-[110px] sm:h-[120px] lg:h-[140px]"
                  style={{ boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.08)' }}
                >
                  <card.icon size={22} strokeWidth={1} className="text-foreground/50" />
                  <span className="font-body text-[10px] uppercase tracking-[0.14em] text-foreground/60">
                    {card.title}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningTab;
