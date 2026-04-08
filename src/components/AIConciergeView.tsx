import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Hotel, MapPin, ChevronDown, ChevronUp, Heart, Mountain, Waves, Building2, Wine, Gem } from 'lucide-react';

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

const vibes = [
  { label: 'Romantic', icon: Heart },
  { label: 'Adventure', icon: Mountain },
  { label: 'Relaxation', icon: Waves },
  { label: 'Culture', icon: Building2 },
  { label: 'Foodie', icon: Wine },
  { label: 'Luxury', icon: Gem },
];

interface AIConciergeViewProps {
  onBack: () => void;
  tripData: { destination: string; days: number; names: string };
}

const AIConciergeView = ({ onBack, tripData }: AIConciergeViewProps) => {
  const [budget, setBudget] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ itinerary: string; hotels: string } | null>(null);
  const [expandedSection, setExpandedSection] = useState<'itinerary' | 'hotels' | null>('itinerary');

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const generate = async () => {
    if (!budget || selectedVibes.length === 0) return;
    setLoading(true);
    setResult(null);

    const prompt = `You are a luxury honeymoon concierge. Create a personalized honeymoon plan for the following:

Destination: ${tripData.destination || 'to be decided'}
Duration: ${tripData.days} days
Travelers: ${tripData.names || 'a couple'}
Total Budget: $${budget}
Travel Vibe: ${selectedVibes.join(', ')}

Please respond with EXACTLY this JSON format, no other text:
{
  "itinerary": "A beautiful day-by-day itinerary in flowing prose. For each day write: **Day 1: [Theme]** followed by 2-3 sentences describing the day's experiences, activities, dining, and mood. Make it feel aspirational and romantic.",
  "hotels": "Recommend 3 specific luxury hotels that match the vibe and budget. For each write: **[Hotel Name]** — [Location] — [1-2 sentences on why it's perfect for this couple, what makes it special, approximate nightly rate]."
}`;

    try {
      const response = await fetch('/api/ai-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Edge function error');
      const text = data.content?.map((b: any) => b.text || '').join('') || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setExpandedSection('itinerary');
    } catch (err) {
      setResult({
        itinerary: 'Something went wrong generating your itinerary. Please try again.',
        hotels: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-card border border-foreground/5 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-primary transition-colors';

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

  return (
    <div className="max-w-[680px] mx-auto">
      <DetailHeader title="AI Concierge" onBack={onBack} />

      <div className="mb-6 p-5 bg-primary/20 rounded-2xl">
        <p className="font-script text-2xl mb-1" style={{ color: 'hsl(0 20% 32%)' }}>your perfect honeymoon awaits</p>
        <p className="font-body text-xs text-foreground/50 tracking-wide">Tell us your vision and we'll craft something magical.</p>
      </div>

      <div className="space-y-6">
        {/* Budget */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold pl-1">Total Budget (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="10,000"
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>

        {/* Vibe */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold pl-1">Travel Vibe</label>
          <div className="flex flex-wrap gap-2">
            {vibes.map((v) => {
              const selected = selectedVibes.includes(v.label);
              return (
                <button
                  key={v.label}
                  onClick={() => toggleVibe(v.label)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body tracking-wide transition-all ${
                    selected
                      ? 'bg-primary text-primary-foreground shadow-arch'
                      : 'bg-card text-foreground/60 hover:text-foreground border border-foreground/5'
                  }`}
                >
                  <v.icon size={14} strokeWidth={1.5} />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.96 }}
          onClick={generate}
          disabled={loading || !budget || selectedVibes.length === 0}
          className="w-full py-4 bg-primary pill-shape font-script text-3xl text-primary-foreground shadow-arch transition-opacity disabled:opacity-40 flex items-center justify-center gap-3"
        >
          {loading ? (
            <span className="font-body text-sm tracking-widest uppercase animate-pulse">crafting your journey...</span>
          ) : (
            'plan my honeymoon'
          )}
        </motion.button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-4"
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
                    <div className="px-5 pb-5 border-t border-foreground/5 pt-4">
                      {renderMarkdown(result.itinerary)}
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
