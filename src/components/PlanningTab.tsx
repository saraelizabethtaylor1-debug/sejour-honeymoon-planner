import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Wallet, Briefcase, PenLine, Camera, Check, Circle } from 'lucide-react';
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
      <div className="w-full max-w-[80%] xl:max-w-[78%]">
        <div className="planning-layout flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 lg:gap-10">
          {/* Arched Cover Image */}
          <div className="planning-arch-photo flex-shrink-0 w-full max-w-[280px] md:min-w-[300px] md:max-w-[320px] lg:min-w-[360px] lg:max-w-[380px]">
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

          {/* Right Content */}
          <div className="flex-1 flex flex-col justify-end md:justify-start items-center md:items-start gap-4 sm:gap-5 lg:gap-3 pr-0 md:pr-4 overflow-visible w-full">
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center lg:text-left max-w-full leading-[1.1] whitespace-nowrap mb-2 lg:mb-8"
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

            {/* 2x2 Card Grid — landscape cards with previews */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-3 lg:gap-4 w-full"
            >
              {/* To-Dos Card */}
              <motion.button
                variants={item}
                whileHover={{ scale: 1.01, boxShadow: '0 6px 24px -4px hsl(0 16% 43% / 0.12)', transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenDetail('todos')}
                className="planning-card flex flex-col items-start p-4 lg:p-5 bg-primary/50 rounded-xl transition-shadow duration-200 h-[110px] sm:h-[120px] lg:h-[140px] text-left"
                style={{ boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.08)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Heart size={16} strokeWidth={1.2} className="text-foreground/50" />
                  <span className="font-body text-[10px] uppercase tracking-[0.14em] text-foreground/60">to-dos</span>
                </div>
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center gap-2">
                    <Check size={11} strokeWidth={2} className="text-foreground/30" />
                    <span className="text-[11px] text-foreground/35 line-through">Book flights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle size={11} strokeWidth={1.5} className="text-foreground/25" />
                    <span className="text-[11px] text-foreground/40">Reserve restaurant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle size={11} strokeWidth={1.5} className="text-foreground/25" />
                    <span className="text-[11px] text-foreground/40">Pack sunscreen</span>
                  </div>
                </div>
              </motion.button>

              {/* Budget Card */}
              <motion.button
                variants={item}
                whileHover={{ scale: 1.01, boxShadow: '0 6px 24px -4px hsl(0 16% 43% / 0.12)', transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenDetail('budget')}
                className="planning-card flex flex-col items-start p-4 lg:p-5 bg-primary/50 rounded-xl transition-shadow duration-200 h-[110px] sm:h-[120px] lg:h-[140px] text-left"
                style={{ boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.08)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Wallet size={16} strokeWidth={1.2} className="text-foreground/50" />
                  <span className="font-body text-[10px] uppercase tracking-[0.14em] text-foreground/60">budget</span>
                </div>
                <div className="w-full mt-auto">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[18px] font-serif text-foreground/55 tracking-wide">$0</span>
                    <span className="text-[10px] text-foreground/30 uppercase tracking-wider">spent</span>
                  </div>
                  <div className="w-full h-[4px] rounded-full bg-foreground/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-foreground/15" style={{ width: '0%' }} />
                  </div>
                </div>
              </motion.button>

              {/* Packing Card */}
              <motion.button
                variants={item}
                whileHover={{ scale: 1.01, boxShadow: '0 6px 24px -4px hsl(0 16% 43% / 0.12)', transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenDetail('packing')}
                className="planning-card flex flex-col items-start p-4 lg:p-5 bg-primary/50 rounded-xl transition-shadow duration-200 h-[110px] sm:h-[120px] lg:h-[140px] text-left"
                style={{ boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.08)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={16} strokeWidth={1.2} className="text-foreground/50" />
                  <span className="font-body text-[10px] uppercase tracking-[0.14em] text-foreground/60">packing</span>
                </div>
                <div className="mt-auto">
                  <span className="text-[22px] font-serif text-foreground/50 tracking-wide">0</span>
                  <span className="text-[11px] text-foreground/30 ml-1">of 24 packed</span>
                </div>
              </motion.button>

              {/* Notes Card */}
              <motion.button
                variants={item}
                whileHover={{ scale: 1.01, boxShadow: '0 6px 24px -4px hsl(0 16% 43% / 0.12)', transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenDetail('notes')}
                className="planning-card flex flex-col items-start p-4 lg:p-5 bg-primary/50 rounded-xl transition-shadow duration-200 h-[110px] sm:h-[120px] lg:h-[140px] text-left"
                style={{ boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.08)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <PenLine size={16} strokeWidth={1.2} className="text-foreground/50" />
                  <span className="font-body text-[10px] uppercase tracking-[0.14em] text-foreground/60">notes</span>
                </div>
                <div className="mt-auto w-full space-y-1.5">
                  <div className="h-[3px] rounded-full bg-foreground/[0.06] w-[85%]" />
                  <div className="h-[3px] rounded-full bg-foreground/[0.06] w-[60%]" />
                  <div className="h-[3px] rounded-full bg-foreground/[0.06] w-[70%]" />
                </div>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningTab;
