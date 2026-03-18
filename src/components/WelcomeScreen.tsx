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
  const [quote, setQuote] = useState('"You are my greatest adventure yet"');

  const handleSubmit = () => {
    onComplete({
      destination: destination || 'Santorini & Mykonos',
      days: parseInt(days) || 12,
      date: date || 'Sept 14, 2025',
      names: names || 'Elena & Julian',
      quote: quote || '"You are my greatest adventure yet"',
    });
  };

  return (
    <motion.div
      exit={{ y: -100, opacity: 0 }}
      className="p-8 pt-20 h-screen flex flex-col justify-between"
    >
      <div className="space-y-12">
        <header className="text-center">
          <h1 className="font-script text-6xl text-primary-foreground leading-none">honeymoon</h1>
          <p className="text-label mt-3">The Planning Suite</p>
        </header>

        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-label pl-1">Destination</label>
            <input
              type="text"
              placeholder="Santorini, Greece"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent border-b border-input py-2 font-serif text-xl text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-label pl-1">Days</label>
              <input
                type="text"
                placeholder="12"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-transparent border-b border-input py-2 font-serif text-xl text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-label pl-1">Date</label>
              <input
                type="text"
                placeholder="09.14.25"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent border-b border-input py-2 font-serif text-xl text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/30"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-label pl-1">Travelers</label>
            <input
              type="text"
              placeholder="Elena & Julian"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              className="w-full bg-transparent border-b border-input py-2 font-serif text-xl text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-label pl-1">Your Quote</label>
            <input
              type="text"
              placeholder='"You are my greatest adventure yet"'
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full bg-transparent border-b border-input py-2 font-serif text-lg italic text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/30"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-5 bg-primary pill-shape font-serif text-lg text-primary-foreground shadow-arch mt-8"
      >
        Begin the Journey
      </button>
    </motion.div>
  );
};

export default WelcomeScreen;
