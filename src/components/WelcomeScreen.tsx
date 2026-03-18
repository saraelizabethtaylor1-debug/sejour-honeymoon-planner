import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TripData } from '@/types/honeymoon';

interface WelcomeScreenProps {
  onComplete: (data: TripData) => void;
}

const WelcomeScreen = ({ onComplete }: WelcomeScreenProps) => {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('');
  const [date, setDate] = useState('');
  const [names, setNames] = useState('');

  const handleSubmit = () => {
    onComplete({
      destination: destination || 'Santorini & Mykonos',
      days: parseInt(days) || 12,
      date: date || 'Sept 14, 2025',
      names: names || 'Elena & Julian',
      quote: '"You are my greatest adventure yet"',
    });
  };

  const inputClass =
    'w-full bg-transparent border-b border-input py-3 font-serif text-xl text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/25';

  return (
    <motion.div
      exit={{ y: -100, opacity: 0 }}
      className="p-8 pt-20 h-screen flex flex-col justify-between bg-subtle-gradient"
    >
      <div className="space-y-14">
        <header className="text-center">
          <h1 className="font-script text-6xl text-primary-foreground leading-none">honeymoon</h1>
          <p className="text-label mt-4">The Planning Suite</p>
        </header>

        <div className="space-y-8">
          <div className="space-y-1.5">
            <label className="text-label pl-1">Destination</label>
            <input
              type="text"
              placeholder="Santorini, Greece"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-8">
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
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 0.98 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleSubmit}
        className="w-full py-5 bg-primary pill-shape font-serif text-lg text-primary-foreground shadow-arch mt-10 transition-shadow hover:shadow-lift"
      >
        Begin the Journey
      </motion.button>
    </motion.div>
  );
};

export default WelcomeScreen;
