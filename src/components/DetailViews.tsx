import AIConciergeView from "@/components/AIConciergeView";
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Check, Pencil, Plane, Ship, TrainFront, Car, Loader2, Sparkles } from 'lucide-react';
import type { ItineraryDay } from '@/types/honeymoon';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { CustomTimePicker } from '@/components/ui/custom-time-picker';

const SaveButton = ({ label }: { label: string }) => {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);

  const handleSave = useCallback(() => {
    setSaved(true);
    setToast(true);
    setTimeout(() => setSaved(false), 2000);
    setTimeout(() => setToast(false), 2500);
  }, []);

  return (
    <>
      <button
        onClick={handleSave}
        className={`w-full mt-1 py-2.5 rounded-xl text-white text-sm font-serif tracking-wide transition-colors shadow-soft ${
          saved ? 'bg-[#b8948f]' : 'bg-[#d4b5b0] hover:bg-[#c9a8a2]'
        }`}
      >
        {saved ? '✓ Saved' : 'Save'}
      </button>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-xl text-sm font-body shadow-lg"
            style={{ backgroundColor: '#f5ede9', color: '#5c4742' }}
          >
            {label} saved
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DetailView, TodoItem, PackingItem, NoteItem, TransportItem, AccommodationItem, ActivityItem, ReservationItem, TravelerInfo } from '@/types/honeymoon';
import { sampleTodos, samplePacking, sampleNotes } from '@/data/sampleData';
import PlacesAutocomplete from '@/components/PlacesAutocomplete';

interface DetailViewProps {
  view: DetailView;
  onBack: () => void;
  transportItems: TransportItem[];
  setTransportItems: React.Dispatch<React.SetStateAction<TransportItem[]>>;
  accommodationItems: AccommodationItem[];
  setAccommodationItems: React.Dispatch<React.SetStateAction<AccommodationItem[]>>;
  activityItems: ActivityItem[];
  setActivityItems: React.Dispatch<React.SetStateAction<ActivityItem[]>>;
  reservationItems: ReservationItem[];
  setReservationItems: React.Dispatch<React.SetStateAction<ReservationItem[]>>;
  tripData?: { destination: string; days: number; names: string };
  onAddToItinerary?: (days: ItineraryDay[]) => void;
}

interface BudgetViewProps {
  onBack: () => void;
  transportItems: TransportItem[];
  accommodationItems: AccommodationItem[];
  activityItems: ActivityItem[];
  reservationItems: ReservationItem[];
  tripData?: { destination: string; days: number; names: string };
}

const DetailHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <div className="flex items-center gap-4 mb-8">
    <button onClick={onBack} className="p-2 -ml-2">
      <ArrowLeft size={20} strokeWidth={1.5} className="text-foreground/70" />
    </button>
    <h2 className="font-serif text-2xl sm:text-3xl text-foreground">{title}</h2>
  </div>
);

const formatCost = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── To-Dos ──
const TodosView = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<TodoItem[]>(sampleTodos);
  const [newItem, setNewItem] = useState('');
  const toggle = (id: string) => setItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));
  const add = () => { if (!newItem.trim()) return; setItems([...items, { id: Date.now().toString(), text: newItem, completed: false }]); setNewItem(''); };

  return (
    <div className="max-w-[560px] mx-auto">
      <DetailHeader title="To-Dos" onBack={onBack} />
      <div className="flex gap-3 mb-8">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a new task…"
          className="flex-1 bg-card border border-foreground/5 pill-shape px-5 py-3.5 text-sm font-body focus:outline-none focus:border-primary/40 transition-colors"
          style={{ boxShadow: '0 2px 12px -4px hsl(0 16% 43% / 0.08)' }}
        />
        <button
          onClick={add}
          className="w-12 h-12 bg-primary pill-shape flex items-center justify-center shadow-arch flex-shrink-0"
        >
          <Plus size={16} strokeWidth={1.8} className="text-primary-foreground" />
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            whileHover={{ y: -1 }}
            className="group flex items-center gap-4 px-5 py-4 bg-card pill-shape"
            style={{ boxShadow: '0 2px 16px -4px hsl(0 16% 43% / 0.08), 0 1px 4px -2px hsl(0 16% 43% / 0.04)' }}
          >
            <button
              onClick={() => toggle(item.id)}
              className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all flex-shrink-0 ${
                item.completed ? 'bg-primary border-primary shadow-arch' : 'border-foreground/20 hover:border-primary/50'
              }`}
            >
              {item.completed && <Check size={11} strokeWidth={2.5} className="text-primary-foreground" />}
            </button>
            <span className={`flex-1 font-body text-sm leading-relaxed transition-colors ${item.completed ? 'line-through text-foreground/30' : 'text-foreground/80'}`}>
              {item.text}
            </span>
            <button onClick={() => remove(item.id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100">
              <Trash2 size={14} strokeWidth={1.5} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ── Budget ──
const BudgetView = ({ onBack, transportItems, accommodationItems, activityItems, reservationItems }: BudgetViewProps) => {
  const [estimatedBudgets, setEstimatedBudgets] = useState<Record<string, number>>({
    Transportation: 0,
    Accommodations: 0,
    Activities: 0,
    'Reservations / Dining': 0,
  });
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalBudgetOverride, setTotalBudgetOverride] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const actualsByCategory: Record<string, number> = {
    Transportation: transportItems.reduce((s, i) => s + (i.cost || 0), 0),
    Accommodations: accommodationItems.reduce((s, i) => s + (i.cost || 0), 0),
    Activities: activityItems.reduce((s, i) => s + (i.cost || 0), 0),
    'Reservations / Dining': reservationItems.reduce((s, i) => s + (i.cost || 0), 0),
  };

  const categories = Object.keys(estimatedBudgets);
  const totalEst = totalBudgetOverride ?? categories.reduce((s, c) => s + estimatedBudgets[c], 0);
  const totalAct = categories.reduce((s, c) => s + actualsByCategory[c], 0);

  const startEdit = (category: string) => {
    setEditingCategory(category);
    setEditValue(estimatedBudgets[category].toString());
  };

  const commitEdit = () => {
    if (editingCategory) {
      setEstimatedBudgets(prev => ({ ...prev, [editingCategory]: parseFloat(editValue) || 0 }));
      setEditingCategory(null);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto">
      <DetailHeader title="Budget" onBack={onBack} />

      {/* Hero total */}
      <div
        className="rounded-2xl p-7 sm:p-8 mb-8 text-center bg-subtle-gradient"
        style={{ boxShadow: '0 4px 24px -6px hsl(0 16% 43% / 0.10), 0 1px 6px -2px hsl(0 16% 43% / 0.06)' }}
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-body mb-3">Total Budget</p>
        {editingTotal ? (
          <input
            type="number"
            value={totalBudgetOverride ?? categories.reduce((s, c) => s + estimatedBudgets[c], 0)}
            onChange={(e) => setTotalBudgetOverride(parseFloat(e.target.value) || 0)}
            onBlur={() => setEditingTotal(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingTotal(false)}
            autoFocus
            className="font-serif text-4xl text-foreground bg-transparent border-b border-primary/40 text-center focus:outline-none w-48"
          />
        ) : (
          <button onClick={() => setEditingTotal(true)} className="group flex items-center gap-2.5 mx-auto">
            <span className="font-serif text-4xl text-foreground">{formatCost(totalEst)}</span>
            <Pencil size={13} strokeWidth={1.5} className="text-foreground/25 group-hover:text-foreground/50 transition-colors" />
          </button>
        )}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <span className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground">
            Spent {formatCost(totalAct)}
          </span>
          {totalEst > 0 && (
            <span className="text-[10px] font-body text-foreground/30 ml-1">
              ({Math.round((totalAct / totalEst) * 100)}%)
            </span>
          )}
        </div>
      </div>

      {/* Column labels */}
      <div className="flex items-center justify-between px-5 pb-2.5 text-[10px] uppercase tracking-[0.18em] text-foreground/35 font-body">
        <span>Category</span>
        <div className="flex gap-8">
          <span>Estimated</span>
          <span className="w-24 text-right">Actual</span>
        </div>
      </div>

      {/* Category rows */}
      <div className="space-y-3">
        {categories.map((category) => {
          const est = estimatedBudgets[category];
          const act = actualsByCategory[category];
          const pct = est > 0 ? Math.min((act / est) * 100, 100) : 0;
          const overBudget = est > 0 && act > est;
          return (
            <div
              key={category}
              className="bg-card rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 2px 16px -4px hsl(0 16% 43% / 0.07), 0 1px 4px -2px hsl(0 16% 43% / 0.04)' }}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <span className="font-serif text-foreground/80">{category}</span>
                <div className="flex gap-8 items-center">
                  {editingCategory === category ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                      autoFocus
                      className="w-24 text-sm text-right bg-transparent border-b border-primary/40 focus:outline-none font-body"
                    />
                  ) : (
                    <button onClick={() => startEdit(category)} className="group flex items-center gap-1.5 text-sm font-body text-foreground/70 hover:text-foreground transition-colors">
                      {formatCost(est)}
                      <Pencil size={11} strokeWidth={1.5} className="text-foreground/20 group-hover:text-foreground/40 transition-colors" />
                    </button>
                  )}
                  <span className={`text-sm font-body w-24 text-right ${overBudget ? 'text-destructive' : 'text-foreground/50'}`}>
                    {formatCost(act)}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-[3px] bg-foreground/5 mx-5 mb-3.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: overBudget
                      ? 'hsl(0 60% 60% / 0.6)'
                      : 'hsl(var(--primary) / 0.5)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Packing ──
const PackingView = ({ onBack, tripData }: { onBack: () => void; tripData?: { destination: string; days: number } }) => {
  const [items, setItems] = useState<PackingItem[]>(samplePacking);
  const [newItem, setNewItem] = useState('');
  const [newTraveler, setNewTraveler] = useState('');
  const [generating, setGenerating] = useState(false);
  const toggle = (id: string) => setItems(items.map(i => i.id === id ? { ...i, packed: !i.packed } : i));
  const add = () => { if (!newItem.trim()) return; setItems([...items, { id: Date.now().toString(), text: newItem, packed: false, traveler: newTraveler || undefined }]); setNewItem(''); setNewTraveler(''); };
  const packed = items.filter(i => i.packed).length;
  const travelers = [...new Set(items.map(i => i.traveler).filter(Boolean))];

  const generatePackingList = async () => {
    setGenerating(true);
    const destination = tripData?.destination || 'a luxury destination';
    const days = tripData?.days || 7;
    const prompt = `Generate a curated packing list for a ${days}-day luxury honeymoon to ${destination}. Return ONLY a JSON array of strings — no other text, no markdown, no explanation. Each string is one specific item. Include destination-appropriate clothing, toiletries, travel documents, and romantic extras. Aim for 24–30 items.\nExample: ["Passport", "Silk dress", "Sunscreen SPF 50"]`;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((b: any) => b.text || '').join('') || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: string[] = JSON.parse(clean);
      const aiItems: PackingItem[] = parsed.map((item, i) => ({
        id: `ai-${Date.now()}-${i}`,
        text: item,
        packed: false,
      }));
      setItems(prev => [...prev, ...aiItems]);
    } catch (err) {
      console.error('Failed to generate packing list', err);
    } finally {
      setGenerating(false);
    }
  };

  const pct = items.length > 0 ? (packed / items.length) * 100 : 0;

  return (
    <div className="max-w-[560px] mx-auto">
      <DetailHeader title="Packing" onBack={onBack} />

      {/* Progress bar + count */}
      <div className="mb-7">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-serif text-foreground/50 text-sm">
            {packed} <span className="text-foreground/30">of</span> {items.length} packed
          </span>
          {items.length > 0 && (
            <span className="font-body text-[10px] uppercase tracking-[0.18em] text-foreground/30">
              {Math.round(pct)}%
            </span>
          )}
        </div>
        <div className="h-[3px] bg-foreground/6 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'hsl(var(--primary) / 0.55)' }}
          />
        </div>
      </div>

      {/* AI generate button */}
      <button
        onClick={generatePackingList}
        disabled={generating}
        className="flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-foreground/10 text-foreground/45 hover:text-foreground/65 hover:border-foreground/20 transition-all disabled:opacity-40"
        style={{ boxShadow: '0 1px 6px -2px hsl(0 16% 43% / 0.06)' }}
      >
        {generating ? (
          <>
            <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
            <span className="font-serif text-sm">generating…</span>
          </>
        ) : (
          <span className="font-serif text-sm">✦ Generate packing list with AI</span>
        )}
      </button>

      {/* Add form */}
      <div className="space-y-2.5 mb-8">
        <div className="flex gap-3">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add item…"
            className="flex-1 bg-card border border-foreground/5 pill-shape px-5 py-3.5 text-sm font-body focus:outline-none focus:border-primary/40 transition-colors"
            style={{ boxShadow: '0 2px 12px -4px hsl(0 16% 43% / 0.08)' }}
          />
          <button onClick={add} className="w-12 h-12 bg-primary pill-shape flex items-center justify-center shadow-arch flex-shrink-0">
            <Plus size={16} strokeWidth={1.8} className="text-primary-foreground" />
          </button>
        </div>
        <input
          value={newTraveler}
          onChange={(e) => setNewTraveler(e.target.value)}
          placeholder="Assign to traveler (optional)"
          className="w-full bg-card border border-foreground/5 pill-shape px-5 py-3 text-xs font-body focus:outline-none focus:border-primary/40 transition-colors text-foreground/60"
          style={{ boxShadow: '0 2px 12px -4px hsl(0 16% 43% / 0.06)' }}
        />
      </div>

      {/* Item lists */}
      {travelers.length > 0 ? (
        <>
          {[...travelers, undefined].map((traveler) => {
            const travelerItems = items.filter(i => i.traveler === traveler);
            if (travelerItems.length === 0) return null;
            return (
              <div key={traveler ?? 'unassigned'} className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/35 font-body mb-3 pl-1">
                  {traveler ?? 'Unassigned'}
                </p>
                <div className="space-y-2.5">
                  {travelerItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 bg-card pill-shape text-left transition-all"
                      style={{ boxShadow: '0 2px 16px -4px hsl(0 16% 43% / 0.07), 0 1px 4px -2px hsl(0 16% 43% / 0.04)' }}
                    >
                      <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all flex-shrink-0 ${item.packed ? 'bg-primary border-primary shadow-arch' : 'border-foreground/20'}`}>
                        {item.packed && <Check size={11} strokeWidth={2.5} className="text-primary-foreground" />}
                      </div>
                      <span className={`font-body text-sm leading-relaxed transition-colors ${item.packed ? 'line-through text-foreground/30' : 'text-foreground/80'}`}>
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="w-full flex items-center gap-4 px-5 py-4 bg-card pill-shape text-left transition-all"
              style={{ boxShadow: '0 2px 16px -4px hsl(0 16% 43% / 0.07), 0 1px 4px -2px hsl(0 16% 43% / 0.04)' }}
            >
              <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all flex-shrink-0 ${item.packed ? 'bg-primary border-primary shadow-arch' : 'border-foreground/20'}`}>
                {item.packed && <Check size={11} strokeWidth={2.5} className="text-primary-foreground" />}
              </div>
              <span className={`font-body text-sm leading-relaxed transition-colors ${item.packed ? 'line-through text-foreground/30' : 'text-foreground/80'}`}>
                {item.text}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Notes ──
const NotesView = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<NoteItem[]>(sampleNotes);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const add = () => {
    if (!newTitle.trim()) return;
    setItems([...items, { id: Date.now().toString(), title: newTitle, content: newContent, createdAt: 'Today' }]);
    setNewTitle(''); setNewContent('');
  };
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));

  return (
    <div className="max-w-[560px] mx-auto">
      <DetailHeader title="Notes" onBack={onBack} />

      {/* New note form */}
      <div className="mb-8 space-y-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          placeholder="Note title…"
          className="w-full bg-transparent border-b border-foreground/15 pb-2 font-serif text-xl text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-primary/50 transition-colors"
        />
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Write your note…"
          rows={5}
          className="w-full bg-card border border-foreground/8 rounded-2xl px-5 py-4 text-sm font-body text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:border-primary/30 transition-colors resize-none leading-relaxed"
          style={{ boxShadow: '0 2px 12px -4px hsl(0 16% 43% / 0.06)' }}
        />
        <motion.button
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.96 }}
          onClick={add}
          className="w-full py-3.5 bg-primary pill-shape font-script text-2xl text-primary-foreground shadow-arch transition-shadow hover:shadow-lift"
        >
          Add Note
        </motion.button>
      </div>

      {/* Notes list */}
      <div className="space-y-4">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-card rounded-2xl px-6 py-5"
            style={{ boxShadow: '0 2px 16px -4px hsl(0 16% 43% / 0.08), 0 1px 4px -2px hsl(0 16% 43% / 0.04)' }}
          >
            <button
              onClick={() => remove(item.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} strokeWidth={1.5} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/35 font-body mb-2">{item.createdAt}</p>
            <h3 className="font-serif text-xl text-foreground mb-2 leading-snug pr-6">{item.title}</h3>
            {item.content && (
              <p className="font-body text-sm text-foreground/55 leading-relaxed">{item.content}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ── Transportation ──
const TransportView = ({ onBack, items, setItems }: { onBack: () => void; items: TransportItem[]; setItems: React.Dispatch<React.SetStateAction<TransportItem[]>> }) => {
  const add = () => {
    setItems([...items, { id: Date.now().toString(), type: '', details: '', confirmation: '', date: '', time: '', cost: 0 }]);
  };
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));
  const update = (id: string, field: keyof TransportItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };
  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Transportation" onBack={onBack} />
      <div className="max-w-[820px] mx-auto">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
            <button onClick={() => remove(item.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-2.5">
              <Select value={item.type || ''} onValueChange={(v) => update(item.id, 'type', v)}>
                <SelectTrigger className="w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors h-auto">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="Plane"><span className="flex items-center gap-2"><Plane size={14} strokeWidth={1.4} /> Plane</span></SelectItem>
                  <SelectItem value="Ferry"><span className="flex items-center gap-2"><Ship size={14} strokeWidth={1.4} /> Ferry</span></SelectItem>
                  <SelectItem value="Train"><span className="flex items-center gap-2"><TrainFront size={14} strokeWidth={1.4} /> Train</span></SelectItem>
                  <SelectItem value="Car"><span className="flex items-center gap-2"><Car size={14} strokeWidth={1.4} /> Car</span></SelectItem>
                </SelectContent>
              </Select>
              <input value={item.details} onChange={(e) => update(item.id, 'details', e.target.value)} placeholder="Details" className={inputClass} />
              <PlacesAutocomplete
                value={item.departureLocation || ''}
                onChange={(v) => update(item.id, 'departureLocation' as any, v)}
                onPlaceSelect={(r) => {
                  update(item.id, 'departureLocation' as any, r.address);
                  if (r.lat != null) update(item.id, 'departureLat' as any, r.lat);
                  if (r.lng != null) update(item.id, 'departureLng' as any, r.lng);
                  update(item.id, 'location', r.address);
                  if (r.lat != null) update(item.id, 'lat' as any, r.lat);
                  if (r.lng != null) update(item.id, 'lng' as any, r.lng);
                }}
                placeholder="Departure location"
                className={inputClass}
              />
              <PlacesAutocomplete
                value={item.arrivalLocation || ''}
                onChange={(v) => update(item.id, 'arrivalLocation' as any, v)}
                onPlaceSelect={(r) => {
                  update(item.id, 'arrivalLocation' as any, r.address);
                  if (r.lat != null) update(item.id, 'arrivalLat' as any, r.lat);
                  if (r.lng != null) update(item.id, 'arrivalLng' as any, r.lng);
                }}
                placeholder="Arrival location"
                className={inputClass}
              />
              <div className="grid grid-cols-3 gap-2.5">
                <CustomDatePicker
                  value={item.date || ''}
                  onChange={(v) => update(item.id, 'date', v)}
                  placeholder="Date"
                />
                <CustomTimePicker
                  value={item.time || ''}
                  onChange={(v) => update(item.id, 'time', v)}
                  placeholder="Time"
                />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                  <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
                </div>
              </div>
              <SaveButton label="Transportation" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} />
        <span className="font-body">Add transportation</span>
      </button>
      </div>
    </div>
  );
};

// ── Accommodations ──
const AccommodationsView = ({ onBack, items, setItems }: { onBack: () => void; items: AccommodationItem[]; setItems: React.Dispatch<React.SetStateAction<AccommodationItem[]>> }) => {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const add = () => {
    setItems([...items, { id: Date.now().toString(), name: '', address: '', checkIn: '', checkInTime: '', checkOut: '', checkOutTime: '', confirmation: '', cost: 0 }]);
  };
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));
  const update = (id: string, field: keyof AccommodationItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const autofill = async (id: string, name: string) => {
    if (!name.trim()) return;
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: `You are a luxury travel assistant. Return ONLY a JSON object — no markdown, no extra text — with details for the hotel "${name}":
{
  "address": "full street address",
  "checkInTime": "standard check-in time, e.g. 3:00 PM",
  "checkOutTime": "standard check-out time, e.g. 12:00 PM",
  "notes": "one sentence luxury description of the property"
}
If the hotel is not found, use reasonable luxury defaults.`,
          }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((b: any) => b.text || '').join('') || '';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setItems(prev => prev.map(i => i.id === id ? {
        ...i,
        ...(parsed.address && { address: parsed.address }),
        ...(parsed.checkInTime && { checkInTime: parsed.checkInTime }),
        ...(parsed.checkOutTime && { checkOutTime: parsed.checkOutTime }),
        ...(parsed.notes && { confirmation: parsed.notes }),
      } : i));
    } catch {
      // silently fail — user can fill manually
    } finally {
      setLoadingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Accommodations" onBack={onBack} />
      <div className="max-w-[820px] mx-auto">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
            <button onClick={() => remove(item.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-2.5">
              <div className="relative">
                <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Hotel name" className={`${inputClass} pr-9`} />
                <button
                  onClick={() => autofill(item.id, item.name)}
                  disabled={loadingIds.has(item.id) || !item.name.trim()}
                  title="Autofill hotel details with AI"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all disabled:opacity-30 text-foreground/30 hover:text-primary hover:bg-primary/10 disabled:hover:text-foreground/30 disabled:hover:bg-transparent"
                >
                  {loadingIds.has(item.id)
                    ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                    : <Sparkles size={13} strokeWidth={1.5} />}
                </button>
              </div>
              <PlacesAutocomplete value={item.address} onChange={(v) => update(item.id, 'address', v)} onPlaceSelect={(r) => { update(item.id, 'address', r.address); if (r.lat != null) update(item.id, 'lat' as any, r.lat); if (r.lng != null) update(item.id, 'lng' as any, r.lng); }} placeholder="Address (search or type)" className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <CustomDatePicker value={item.checkIn} onChange={(v) => update(item.id, 'checkIn', v)} placeholder="Check-in date" />
                <CustomTimePicker value={item.checkInTime} onChange={(v) => update(item.id, 'checkInTime', v)} placeholder="Check-in time" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <CustomDatePicker value={item.checkOut} onChange={(v) => update(item.id, 'checkOut', v)} placeholder="Check-out date" />
                <CustomTimePicker value={item.checkOutTime} onChange={(v) => update(item.id, 'checkOutTime', v)} placeholder="Check-out time" />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
              </div>
              <input value={item.confirmation} onChange={(e) => update(item.id, 'confirmation', e.target.value)} placeholder="Notes" className={inputClass} />
              <SaveButton label="Accommodations" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} />
        <span className="font-body">Add accommodation</span>
      </button>
      </div>
    </div>
  );
};

// ── Activities ──
const ActivitiesView = ({ onBack, items, setItems }: { onBack: () => void; items: ActivityItem[]; setItems: React.Dispatch<React.SetStateAction<ActivityItem[]>> }) => {
  const add = () => {
    setItems([...items, { id: Date.now().toString(), name: '', notes: '', time: '', confirmation: '', cost: 0 }]);
  };
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));
  const update = (id: string, field: keyof ActivityItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };
  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Activities" onBack={onBack} />
      <div className="max-w-[820px] mx-auto">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
            <button onClick={() => remove(item.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-2.5">
              <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Activity name" className={inputClass} />
              <PlacesAutocomplete value={item.location || ''} onChange={(v) => update(item.id, 'location', v)} onPlaceSelect={(r) => { update(item.id, 'location', r.address); if (r.lat != null) update(item.id, 'lat' as any, r.lat); if (r.lng != null) update(item.id, 'lng' as any, r.lng); }} placeholder="Location (search or type address)" className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <CustomDatePicker value={item.time?.split(',')[0]?.trim() || ''} onChange={(v) => {
                  const timePart = item.time?.match(/,\s*(.+)/)?.[1] || '';
                  update(item.id, 'time', timePart ? `${v}, ${timePart}` : v);
                }} placeholder="Date" />
                <CustomTimePicker value={item.confirmation || ''} onChange={(v) => update(item.id, 'confirmation', v)} placeholder="Time" />
              </div>
              <input value={item.notes} onChange={(e) => update(item.id, 'notes', e.target.value)} placeholder="Notes" className={inputClass} />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
              </div>
              <SaveButton label="Activities" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} />
        <span className="font-body">Add activity</span>
      </button>
      </div>
    </div>
  );
};

// ── Reservations ──
const ReservationsView = ({ onBack, items, setItems }: { onBack: () => void; items: ReservationItem[]; setItems: React.Dispatch<React.SetStateAction<ReservationItem[]>> }) => {
  const add = () => {
    setItems([...items, { id: Date.now().toString(), name: '', date: '', time: '', confirmation: '', notes: '', cost: 0 }]);
  };
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));
  const update = (id: string, field: keyof ReservationItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };
  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Reservations" onBack={onBack} />
      <div className="max-w-[820px] mx-auto">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
            <button onClick={() => remove(item.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-2.5">
              <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Restaurant / Venue" className={inputClass} />
              <PlacesAutocomplete value={item.location || ''} onChange={(v) => update(item.id, 'location', v)} onPlaceSelect={(r) => { update(item.id, 'location', r.address); if (r.lat != null) update(item.id, 'lat' as any, r.lat); if (r.lng != null) update(item.id, 'lng' as any, r.lng); }} placeholder="Location (search or type address)" className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <CustomDatePicker value={item.date} onChange={(v) => update(item.id, 'date', v)} placeholder="Date" />
                <CustomTimePicker value={item.time} onChange={(v) => update(item.id, 'time', v)} placeholder="Time" />
              </div>
              <input value={item.notes} onChange={(e) => update(item.id, 'notes', e.target.value)} placeholder="Notes" className={inputClass} />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
              </div>
              <SaveButton label="Reservations" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} />
        <span className="font-body">Add reservation</span>
      </button>
      </div>
    </div>
  );
};

// ── Map ──
const MapView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div>
      <DetailHeader title="Map" onBack={onBack} />
      <div className="bg-secondary rounded-2xl aspect-square flex items-center justify-center shadow-soft">
        <div className="text-center">
          <p className="font-serif text-xl text-foreground/35">Map View</p>
          <p className="text-sm text-muted-foreground mt-2">Saved locations will appear here</p>
        </div>
      </div>
    </div>
  );
};

// ── Traveler Info ──
const emptyTraveler = (id: string): TravelerInfo => ({
  id, name: '', passportNumber: '', passportExpiry: '', dateOfBirth: '',
  nationality: '', dietaryRestrictions: '', emergencyContactName: '',
  emergencyContactPhone: '', preferredAirline: '', seatPreference: '', notes: '',
});

const TravelerInfoView = ({ onBack }: { onBack: () => void }) => {
  const [travelers, setTravelers] = useState<TravelerInfo[]>([
    emptyTraveler('1'),
    emptyTraveler('2'),
  ]);

  const updateTraveler = (id: string, field: keyof TravelerInfo, value: string) => {
    setTravelers(travelers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addTraveler = () => {
    setTravelers([...travelers, emptyTraveler(Date.now().toString())]);
  };

  const removeTraveler = (id: string) => {
    setTravelers(travelers.filter(t => t.id !== id));
  };

  const inputClass = 'w-full bg-card border border-foreground/5 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-primary transition-colors';
  const sectionLabel = 'text-[10px] uppercase tracking-widest text-foreground/35 mt-4 mb-2 block';

  return (
    <div>
      <DetailHeader title="Traveler Profiles" onBack={onBack} />
      <div className="space-y-6">
        {travelers.map((traveler) => (
          <div key={traveler.id} className="bg-card rounded-2xl p-4 sm:p-5 shadow-soft relative">
            <button onClick={() => removeTraveler(traveler.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-3">
              {/* Identity */}
              <div>
                <label className="text-label mb-1 block">Full Name</label>
                <input value={traveler.name} onChange={(e) => updateTraveler(traveler.id, 'name', e.target.value)} placeholder="Full legal name" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label mb-1 block">Date of Birth</label>
                  <input value={traveler.dateOfBirth} onChange={(e) => updateTraveler(traveler.id, 'dateOfBirth', e.target.value)} placeholder="MM/DD/YYYY" className={inputClass} />
                </div>
                <div>
                  <label className="text-label mb-1 block">Nationality</label>
                  <input value={traveler.nationality} onChange={(e) => updateTraveler(traveler.id, 'nationality', e.target.value)} placeholder="e.g. American" className={inputClass} />
                </div>
              </div>

              {/* Passport */}
              <span className={sectionLabel}>Passport</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label mb-1 block">Passport #</label>
                  <input value={traveler.passportNumber} onChange={(e) => updateTraveler(traveler.id, 'passportNumber', e.target.value)} placeholder="Passport number" className={inputClass} />
                </div>
                <div>
                  <label className="text-label mb-1 block">Expiry</label>
                  <input value={traveler.passportExpiry} onChange={(e) => updateTraveler(traveler.id, 'passportExpiry', e.target.value)} placeholder="MM/YYYY" className={inputClass} />
                </div>
              </div>

              {/* Travel preferences */}
              <span className={sectionLabel}>Travel Preferences</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label mb-1 block">Preferred Airline</label>
                  <input value={traveler.preferredAirline} onChange={(e) => updateTraveler(traveler.id, 'preferredAirline', e.target.value)} placeholder="e.g. Delta, United" className={inputClass} />
                </div>
                <div>
                  <label className="text-label mb-1 block">Seat Preference</label>
                  <input value={traveler.seatPreference} onChange={(e) => updateTraveler(traveler.id, 'seatPreference', e.target.value)} placeholder="e.g. Window, Aisle" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-label mb-1 block">Dietary Restrictions / Allergies</label>
                <input value={traveler.dietaryRestrictions} onChange={(e) => updateTraveler(traveler.id, 'dietaryRestrictions', e.target.value)} placeholder="e.g. Vegetarian, nut allergy" className={inputClass} />
              </div>

              {/* Emergency contact */}
              <span className={sectionLabel}>Emergency Contact</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label mb-1 block">Contact Name</label>
                  <input value={traveler.emergencyContactName} onChange={(e) => updateTraveler(traveler.id, 'emergencyContactName', e.target.value)} placeholder="Full name" className={inputClass} />
                </div>
                <div>
                  <label className="text-label mb-1 block">Phone</label>
                  <input value={traveler.emergencyContactPhone} onChange={(e) => updateTraveler(traveler.id, 'emergencyContactPhone', e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} />
                </div>
              </div>

              {/* Notes */}
              <span className={sectionLabel}>Notes</span>
              <div>
                <textarea value={traveler.notes} onChange={(e) => updateTraveler(traveler.id, 'notes', e.target.value)} placeholder="Any other notes or preferences..." rows={2} className={`${inputClass} resize-none`} />
              </div>
            </div>
            <div className="mt-4">
              <SaveButton label="Traveler profile" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addTraveler} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} />
        <span className="font-body">Add traveler</span>
      </button>
    </div>
  );
};

// ── Main ──
const DetailViewComponent = ({ view, onBack, transportItems, setTransportItems, accommodationItems, setAccommodationItems, activityItems, setActivityItems, reservationItems, setReservationItems, tripData, onAddToItinerary }: DetailViewProps) => {
  if (!view) return null;
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-background z-[60] overflow-y-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 bg-subtle-gradient"
    >
      {view === 'todos' && <TodosView onBack={onBack} />}
      {view === 'budget' && <BudgetView onBack={onBack} transportItems={transportItems} accommodationItems={accommodationItems} activityItems={activityItems} reservationItems={reservationItems} />}
      {view === 'packing' && <PackingView onBack={onBack} tripData={tripData} />}
      {view === 'notes' && <NotesView onBack={onBack} />}
      {view === 'transportation' && <TransportView onBack={onBack} items={transportItems} setItems={setTransportItems} />}
      {view === 'accommodations' && <AccommodationsView onBack={onBack} items={accommodationItems} setItems={setAccommodationItems} />}
      {view === 'activities' && <ActivitiesView onBack={onBack} items={activityItems} setItems={setActivityItems} />}
      {view === 'reservations' && <ReservationsView onBack={onBack} items={reservationItems} setItems={setReservationItems} />}
      {view === 'map' && <MapView onBack={onBack} />}
      {view === 'travelerInfo' && <TravelerInfoView onBack={onBack} />}
      {view === 'concierge' && <AIConciergeView onBack={onBack} tripData={tripData} onAddToItinerary={onAddToItinerary} />}
    </motion.div>
  );
};

export default DetailViewComponent;
