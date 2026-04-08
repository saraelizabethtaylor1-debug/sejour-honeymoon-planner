import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Hotel, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { ItineraryDay, ItineraryActivity } from '@/types/honeymoon';

const DetailHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <div className="flex items-center gap-4 mb-8">
    <button onClick={onBack} className="p-2 -ml-2">
      <ArrowLeft size={20} strokeWidth={1.5} className="text-foreground/70" />
    </button>
    <div className="flex items-center gap-2">
      <h2 className="font-serif text-2xl sm:text-3xl text-foreground">{title}</h2>
      <Sparkles size={16} strokeWidth={1.5} style={{ color: 'hsl(0 20% 56%)' }} />
    </div>
  </div>
);

const vibes = ['Romantic', 'Adventure', 'Relaxation', 'Culture', 'Foodie', 'Luxury'];

interface ParsedDay {
  dayNumber: number;
  theme: string;
  bullets: string[];
}

function parseItineraryDays(text: string): ParsedDay[] {
  const blocks = text.split(/(?=Day \d+:)/i).map(b => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const header = lines[0] || '';
    const match = header.match(/Day\s+(\d+):\s*(.*)/i);
    const dayNumber = match ? parseInt(match[1]) : 0;
    const theme = match ? match[2].trim() : header;
    const bullets = lines
      .slice(1)
      .filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))
      .map(l => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean);
    return { dayNumber, theme, bullets };
  }).filter(d => d.dayNumber > 0);
}

function buildItineraryDays(parsed: ParsedDay[], destination: string): ItineraryDay[] {
  return parsed.map((d) => ({
    id: String(d.dayNumber),
    dayLabel: `Day ${d.dayNumber}`,
    date: '',
    destination,
    activities: d.bullets.map<ItineraryActivity>((bullet) => ({
      time: '',
      title: bullet,
      location: '',
      notes: '',
      iconType: 'activity',
    })),
  }));
}

interface AIConciergeViewProps {
  onBack: () => void;
  tripData: { destination: string; days: number; names: string };
  onAddToItinerary?: (days: ItineraryDay[]) => void;
}

const AIConciergeView = ({ onBack, tripData, onAddToItinerary }: AIConciergeViewProps) => {
  const [destination, setDestination] = useState(tripData.destination || '');
  const [budget, setBudget] = useState('');
  const [days, setDays] = useState(String(tripData.days || ''));
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ itinerary: string; hotels: string } | null>(null);
  const [parsedDays, setParsedDays] = useState<ParsedDay[]>([]);
  const [expandedSection, setExpandedSection] = useState<'itinerary' | 'hotels' | null>('itinerary');
  const [added, setAdded] = useState(false);

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const generate = async () => {
    if (budget === '' && selectedVibes.length === 0) return;
    setLoading(true);
    setResult(null);
    setParsedDays([]);
    setAdded(false);

    const numDays = days || String(tripData.days);
    const dest = destination || tripData.destination || 'to be decided';

    const prompt = `You are a luxury honeymoon concierge. Create a personalized honeymoon plan.

Destination: ${dest}
Duration: ${numDays} days
Travelers: ${tripData.names || 'a couple'}
Total Budget: $${budget}
Travel Vibe: ${selectedVibes.join(', ')}

Respond with EXACTLY this plain-text format — no JSON, no markdown code fences:

ITINERARY
Day 1: [Evocative Theme Name]
• [Short memorable activity or experience, 10–15 words]
• [Short memorable activity or experience, 10–15 words]
• [Short memorable activity or experience, 10–15 words]

Day 2: [Evocative Theme Name]
• [bullet]
• [bullet]
• [bullet]

(Repeat for all ${numDays} days)

HOTELS
**[Hotel Name]** — [City/Area] — [Why it's perfect for this couple. Approx nightly rate.]
**[Hotel Name]** — [City/Area] — [Why it's perfect for this couple. Approx nightly rate.]
**[Hotel Name]** — [City/Area] — [Why it's perfect for this couple. Approx nightly rate.]`;

    try {
      const response = await fetch('/api/ai-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      console.log('[AIConcierge] HTTP status:', response.status);
      console.log('[AIConcierge] Raw text:', data.content?.[0]?.text);

      if (!response.ok) throw new Error(data.error ?? 'API error');

      const text: string = data.content?.[0]?.text || '';
      const itinerary = text.match(/ITINERARY\s*([\s\S]*?)(?=\nHOTELS|$)/i)?.[1]?.trim() ?? text;
      const hotels = text.match(/HOTELS\s*([\s\S]*?)$/i)?.[1]?.trim() ?? '';

      const parsed = parseItineraryDays(itinerary);
      setParsedDays(parsed);
      setResult({ itinerary, hotels });
      setExpandedSection('itinerary');
    } catch (err) {
      console.error('[AIConcierge] Error:', err);
      setResult({
        itinerary: 'Something went wrong generating your itinerary. Please try again.',
        hotels: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToItinerary = () => {
    if (!onAddToItinerary || parsedDays.length === 0) return;
    const itinDays = buildItineraryDays(parsedDays, tripData.destination);
    onAddToItinerary(itinDays);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.includes('**')) {
        const parts = line.split('**').filter(Boolean);
        return (
          <p key={i} className="mt-4 mb-1">
            <span className="font-serif text-base" style={{ color: 'hsl(0 20% 32%)' }}>{parts[0]}</span>
            {parts[1] && <span className="font-body text-sm text-foreground/70">{parts[1]}</span>}
          </p>
        );
      }
      return line ? <p key={i} className="font-body text-sm text-foreground/70 leading-relaxed mb-2">{line}</p> : null;
    });
  };

  const labelClass = 'block text-[10px] uppercase tracking-widest text-foreground/40 mb-2';
  const bareInputClass = 'w-full bg-transparent border-b border-foreground/20 py-2 text-sm font-body text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/40 transition-colors';

  return (
    <div className="max-w-[680px] mx-auto">
      <DetailHeader title="AI Concierge" onBack={onBack} />

      {/* Hero */}
      <div className="text-center py-8 mb-8">
        <p className="font-script text-5xl mb-3" style={{ color: 'hsl(0 20% 32%)' }}>
          your perfect honeymoon awaits
        </p>
        <p className="font-body text-sm text-foreground/40">
          Tell us your vision and we'll craft something magical.
        </p>
      </div>

      <div className="space-y-10">
        {/* Destination */}
        <div>
          <label className={labelClass}>Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where are you dreaming of?"
            className={bareInputClass}
          />
        </div>

        {/* Budget + Days — side by side */}
        <div className="flex gap-8">
          <div className="flex-1">
            <label className={labelClass}>Total Budget (USD)</label>
            <div className="relative">
              <span className="absolute left-0 top-2 text-sm text-foreground/30">$</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="10,000"
                className={`${bareInputClass} pl-4`}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Number of Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder={String(tripData.days || 7)}
              className={bareInputClass}
            />
          </div>
        </div>

        {/* Travel Vibe */}
        <div>
          <label className={labelClass}>Travel Vibe</label>
          <div className="flex items-center">
            {vibes.map((v, idx) => {
              const selected = selectedVibes.includes(v);
              return (
                <div key={v} className="flex items-center">
                  <button
                    onClick={() => toggleVibe(v)}
                    className="relative transition-colors px-3 py-1"
                  >
                    <span
                      className={`font-serif text-sm tracking-wide transition-colors ${
                        selected ? 'text-foreground font-semibold' : 'text-foreground/30 hover:text-foreground/60'
                      }`}
                    >
                      {v}
                    </span>
                    {selected && (
                      <span className="absolute bottom-0 left-3 right-3 border-b border-foreground/60" />
                    )}
                  </button>
                  {idx < vibes.length - 1 && (
                    <span className="border-r border-foreground/15 h-3 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.96 }}
          onClick={generate}
          disabled={loading || (budget === '' && selectedVibes.length === 0)}
          className="w-full py-4 bg-primary pill-shape font-script text-3xl text-primary-foreground shadow-arch transition-opacity disabled:opacity-40"
        >
          {loading ? (
            <span className="font-body text-sm tracking-widest uppercase animate-pulse">crafting your journey...</span>
          ) : (
            'plan my honeymoon'
          )}
        </motion.button>
      </div>

      {/* Results — unchanged */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 space-y-4"
          >
            {/* Itinerary */}
            <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'itinerary' ? null : 'itinerary')}
                className="w-full flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <MapPin size={16} strokeWidth={1.5} className="text-foreground/40" />
                  <span className="font-serif text-lg text-foreground">Your Itinerary</span>
                </div>
                {expandedSection === 'itinerary' ? <ChevronUp size={16} className="text-foreground/40" /> : <ChevronDown size={16} className="text-foreground/40" />}
              </button>
              <AnimatePresence>
                {expandedSection === 'itinerary' && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-5 pt-1 border-t border-foreground/5 flex flex-col gap-3">
                      {parsedDays.length > 0 ? (
                        parsedDays.map((day) => (
                          <div key={day.dayNumber} className="bg-background rounded-2xl shadow-soft p-5">
                            <p
                              className="font-serif uppercase text-foreground/75"
                              style={{ fontSize: 11, letterSpacing: '0.22em', fontWeight: 400 }}
                            >
                              Day {day.dayNumber} · {day.theme}
                            </p>
                            <div className="border-t border-foreground/10 my-3" />
                            <ul className="space-y-2">
                              {day.bullets.map((bullet, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                  <span className="text-foreground/25 mt-0.5 flex-shrink-0" style={{ fontSize: 12 }}>—</span>
                                  <span className="font-body text-sm text-foreground/65 leading-snug">{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <div className="pt-3">{renderMarkdown(result.itinerary)}</div>
                      )}

                      {parsedDays.length > 0 && onAddToItinerary && (
                        <button
                          onClick={handleAddToItinerary}
                          className={`w-full mt-1 py-2.5 rounded-xl text-sm font-serif tracking-wide transition-colors shadow-soft ${
                            added ? 'bg-[#b8948f] text-white' : 'bg-[#d4b5b0] hover:bg-[#c9a8a2] text-white'
                          }`}
                        >
                          {added ? '✓ Added to Itinerary' : 'Add to Itinerary'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hotels */}
            {result.hotels && (
              <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'hotels' ? null : 'hotels')}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <Hotel size={16} strokeWidth={1.5} className="text-foreground/40" />
                    <span className="font-serif text-lg text-foreground">Curated Hotels</span>
                  </div>
                  {expandedSection === 'hotels' ? <ChevronUp size={16} className="text-foreground/40" /> : <ChevronDown size={16} className="text-foreground/40" />}
                </button>
                <AnimatePresence>
                  {expandedSection === 'hotels' && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-foreground/5 pt-4">
                        {renderMarkdown(result.hotels)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Regenerate */}
            <button
              onClick={generate}
              className="w-full py-2.5 rounded-xl text-sm font-serif tracking-wide text-foreground/50 hover:text-foreground transition-colors border border-foreground/10"
            >
              ↺ Generate new suggestions
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIConciergeView;
