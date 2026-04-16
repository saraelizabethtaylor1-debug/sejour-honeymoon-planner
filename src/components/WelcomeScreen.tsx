import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Clock } from 'lucide-react';
import type { TripData } from '@/types/honeymoon';

interface WelcomeScreenProps {
  onComplete: (data: TripData) => void;
}

const WelcomeScreen = ({ onComplete }: WelcomeScreenProps) => {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('');
  const [date, setDate] = useState('');
  const [names, setNames] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [clockFormat, setClockFormat] = useState<'12h' | '24h'>('12h');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setCoverImage(url);
  };

  const handleSubmit = () => {
    onComplete({
      destination: destination || 'My Trip',
      days: parseInt(days) || 7,
      date: date || '',
      names: names || '',
      quote: '"you are my greatest adventure yet"',
      coverImage,
      clockFormat,
    });
  };

  const inputClass =
    'w-full bg-transparent border-b border-input py-1.5 font-serif text-base sm:text-lg text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/40';

  return (
    <motion.div
      exit={{ y: -100, opacity: 0 }}
      className="p-5 sm:p-6 pt-6 sm:pt-8 h-screen overflow-hidden flex flex-col justify-between bg-subtle-gradient"
    >
      <div className="max-w-[680px] mx-auto w-full flex flex-col flex-1 justify-between">
        <div className="space-y-5 sm:space-y-6">
          <header className="text-center">
            <span
              className="font-serif"
              style={{ fontSize: "34px", letterSpacing: "0.4em", fontWeight: 300, color: '#52210e' }}
            >
              SÉJOUR
            </span>
            <p className="text-label mt-2 font-semibold">The Honeymoon Planning Suite</p>
          </header>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-label pl-1 text-muted-foreground font-semibold">Destination</label>
              <input
                type="text"
                placeholder="Where are you going?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1">
                <label className="text-label pl-1 font-semibold">Date</label>
                <input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-label pl-1 font-semibold">Days</label>
                <input
                  type="text"
                  placeholder="How many?"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label pl-1 font-semibold">Travelers</label>
              <input
                type="text"
                placeholder="Your names"
                value={names}
                onChange={(e) => setNames(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Cover Photo */}
            <div className="space-y-1">
              <label className="text-label pl-1 font-semibold">Trip inspiration cover photo</label>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center gap-3 border-b border-input py-1.5 text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                {coverImage ? (
                  <div className="flex items-center gap-3">
                    <img src={coverImage} alt="Cover" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="font-serif text-base text-foreground">Photo selected</span>
                  </div>
                ) : (
                  <>
                    <Camera size={16} strokeWidth={1.5} />
                    <span className="font-serif text-base">Choose a photo</span>
                  </>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                }}
              />
            </div>

            {/* Clock Format */}
            <div className="space-y-1">
              <label className="text-label pl-1 font-semibold">Clock Format</label>
              <div className="flex items-center gap-4 py-1.5">
                <Clock size={16} strokeWidth={1.5} className="text-foreground/40" />
                <button
                  onClick={() => setClockFormat('12h')}
                  className={`font-serif text-base px-3 py-1 pill-shape transition-all ${
                    clockFormat === '12h'
                      ? 'bg-primary text-primary-foreground shadow-arch'
                      : 'text-foreground/40 hover:text-[#52210e]'
                  }`}
                >
                  12-hour
                </button>
                <button
                  onClick={() => setClockFormat('24h')}
                  className={`font-serif text-base px-3 py-1 pill-shape transition-all ${
                    clockFormat === '24h'
                      ? 'bg-primary text-primary-foreground shadow-arch'
                      : 'text-foreground/40 hover:text-[#52210e]'
                  }`}
                >
                  24-hour
                </button>
              </div>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleSubmit}
          className="w-full py-3.5 bg-primary pill-shape font-script text-3xl text-primary-foreground shadow-arch transition-shadow hover:shadow-lift px-0 mb-4"
          style={{ color: '#52210e' }}
        >
          plan your adventure
        </motion.button>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
