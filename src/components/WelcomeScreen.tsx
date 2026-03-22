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
      quote: '"You are my greatest adventure yet"',
      coverImage,
      clockFormat,
    });
  };

  const inputClass =
    'w-full bg-transparent border-b border-input py-3 font-serif text-lg sm:text-xl text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/25';

  return (
    <motion.div
      exit={{ y: -100, opacity: 0 }}
      className="p-6 sm:p-8 pt-16 sm:pt-20 min-h-screen flex flex-col justify-between bg-subtle-gradient"
    >
      <div className="space-y-10 sm:space-y-14">
        <header className="text-center">
          <h1 className="font-script text-5xl sm:text-6xl text-primary-foreground leading-none">honeymoon</h1>
          <p className="text-label mt-4">The Planning Suite</p>
        </header>

        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-1.5">
            <label className="text-label pl-1">Destination</label>
            <input
              type="text"
              placeholder="Where are you going?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-1.5">
              <label className="text-label pl-1">Date</label>
              <input
                type="text"
                placeholder="09.14.25"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-label pl-1">Days</label>
              <input
                type="text"
                placeholder="12"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-label pl-1">Travelers</label>
            <input
              type="text"
              placeholder="Elena & Julian"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Cover Photo */}
          <div className="space-y-1.5">
            <label className="text-label pl-1">Trip inspiration cover photo</label>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 border-b border-input py-3 text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              {coverImage ? (
                <div className="flex items-center gap-3">
                  <img src={coverImage} alt="Cover" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="font-serif text-lg text-foreground">Photo selected</span>
                </div>
              ) : (
                <>
                  <Camera size={18} strokeWidth={1.5} />
                  <span className="font-serif text-lg">Choose a photo</span>
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
          <div className="space-y-1.5">
            <label className="text-label pl-1">Clock Format</label>
            <div className="flex items-center gap-4 py-3">
              <Clock size={18} strokeWidth={1.5} className="text-foreground/40" />
              <button
                onClick={() => setClockFormat('12h')}
                className={`font-serif text-lg px-4 py-1.5 pill-shape transition-all ${
                  clockFormat === '12h'
                    ? 'bg-primary text-primary-foreground shadow-arch'
                    : 'text-foreground/40 hover:text-foreground/60'
                }`}
              >
                12-hour
              </button>
              <button
                onClick={() => setClockFormat('24h')}
                className={`font-serif text-lg px-4 py-1.5 pill-shape transition-all ${
                  clockFormat === '24h'
                    ? 'bg-primary text-primary-foreground shadow-arch'
                    : 'text-foreground/40 hover:text-foreground/60'
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
        className="w-full py-5 bg-primary pill-shape font-serif text-lg text-primary-foreground shadow-arch mt-10 transition-shadow hover:shadow-lift"
      >
        Plan your adventure
      </motion.button>
    </motion.div>
  );
};

export default WelcomeScreen;
