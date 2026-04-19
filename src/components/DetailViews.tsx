import AIConciergeView from "@/components/AIConciergeView";
import { parse as parseDateFns, isValid as isValidDate } from 'date-fns';
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Check, Pencil, Plane, Ship, TrainFront, Car, Loader2, Sparkles, Bed, Star, CalendarDays } from 'lucide-react';
import type { ItineraryDay } from '@/types/honeymoon';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { CustomTimePicker } from '@/components/ui/custom-time-picker';

const SaveButton = ({ label, onSave, disabled }: { label: string; onSave?: () => void; disabled?: boolean }) => {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);

  const handleSave = useCallback(() => {
    setSaved(true);
    setToast(true);
    onSave?.();
    setTimeout(() => setSaved(false), 2000);
    setTimeout(() => setToast(false), 2500);
  }, [onSave]);

  return (
    <>
      <button
        onClick={handleSave}
        disabled={disabled}
        className={`w-full mt-1 py-2.5 rounded-xl text-white text-sm font-serif tracking-wide transition-colors shadow-soft disabled:opacity-40 disabled:cursor-not-allowed ${
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
import type { ItemCallbacks } from '@/hooks/useTripData';

interface DetailViewProps {
  view: DetailView;
  onBack: () => void;
  transportItems: TransportItem[];
  setTransportItems: React.Dispatch<React.SetStateAction<TransportItem[]>>;
  transportCallbacks?: ItemCallbacks;
  accommodationItems: AccommodationItem[];
  setAccommodationItems: React.Dispatch<React.SetStateAction<AccommodationItem[]>>;
  accommodationCallbacks?: ItemCallbacks;
  activityItems: ActivityItem[];
  setActivityItems: React.Dispatch<React.SetStateAction<ActivityItem[]>>;
  activityCallbacks?: ItemCallbacks;
  reservationItems: ReservationItem[];
  setReservationItems: React.Dispatch<React.SetStateAction<ReservationItem[]>>;
  reservationCallbacks?: ItemCallbacks;
  tripData?: { destination: string; days: number; names: string; date?: string };
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
  const { user } = useAuth();
  const [items, setItems] = useState<TodoItem[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('todo_items').select('*').eq('user_id', user.id).order('created_at')
      .then(({ data, error }: { data: any[] | null; error: any }) => {
        if (error) { console.error('Failed to load todos:', error); return; }
        if (data) setItems(data.map((r: any) => ({ id: r.id, text: r.text, completed: r.completed })));
      });
  }, [user]);

  const toggle = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const completed = !item.completed;
    setItems(prev => prev.map(i => i.id === id ? { ...i, completed } : i));
    const { error } = await (supabase as any).from('todo_items').update({ completed }).eq('id', id);
    if (error) console.error('Failed to update todo:', error);
  };

  const remove = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    const { error } = await (supabase as any).from('todo_items').delete().eq('id', id);
    if (error) console.error('Failed to delete todo:', error);
  };

  const add = async () => {
    if (!newItem.trim() || !user) return;
    const newTodo: TodoItem = { id: crypto.randomUUID(), text: newItem, completed: false };
    setItems(prev => [...prev, newTodo]);
    setNewItem('');
    console.log('[todos] inserting:', { id: newTodo.id, text: newTodo.text });
    const { data, error } = await (supabase as any).from('todo_items').insert({ id: newTodo.id, user_id: user.id, text: newTodo.text, completed: false }).select();
    if (error) console.error('[todos] insert error — message:', error.message, '| code:', error.code, '| details:', error.details);
    else console.log('[todos] insert success:', data);
  };

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
  const { user } = useAuth();
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

  // Load saved budget from profiles on mount
  useEffect(() => {
    if (!user) return;
    (supabase as any).from('profiles').select('budget').eq('user_id', user.id).single()
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) { console.error('[BudgetView] load error:', error); return; }
        if (data?.budget != null) setTotalBudgetOverride(data.budget);
      });
  }, [user]);

  const saveBudget = async (value: number) => {
    if (!user) return;
    const { error } = await (supabase as any).from('profiles').update({ budget: value }).eq('user_id', user.id);
    if (error) console.error('[BudgetView] save error:', error);
  };

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
        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-body mb-1.5">Total Spent</p>
        <span className="font-serif text-4xl text-foreground">{formatCost(totalAct)}</span>
        <div className="mb-3" />
        {editingTotal ? (
          <input
            type="text"
            inputMode="decimal"
            value={totalBudgetOverride !== null ? String(totalBudgetOverride) : String(categories.reduce((s, c) => s + estimatedBudgets[c], 0))}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, '');
              setTotalBudgetOverride(raw === '' ? 0 : parseFloat(raw) || 0);
            }}
            onBlur={() => { setEditingTotal(false); saveBudget(totalBudgetOverride ?? categories.reduce((s, c) => s + estimatedBudgets[c], 0)); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { setEditingTotal(false); saveBudget(totalBudgetOverride ?? categories.reduce((s, c) => s + estimatedBudgets[c], 0)); } }}
            autoFocus
            className="font-body text-sm text-foreground/60 bg-transparent border-b border-primary/40 text-center focus:outline-none w-36"
          />
        ) : (
          <button onClick={() => setEditingTotal(true)} className="group flex items-center gap-1.5 mx-auto">
            <span className="text-xs font-body uppercase tracking-[0.15em] text-muted-foreground">
              Budget {formatCost(totalEst)}
            </span>
            <Pencil size={11} strokeWidth={1.5} className="text-foreground/25 group-hover:text-foreground/50 transition-colors" />
          </button>
        )}
        {totalEst > 0 && (
          <div className="mt-4 mx-auto max-w-[280px]">
            <div className="h-1.5 bg-foreground/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((totalAct / totalEst) * 100, 100)}%`,
                  background: totalAct > totalEst
                    ? 'hsl(0 28% 68% / 0.85)'
                    : 'hsl(var(--primary) / 0.55)',
                }}
              />
            </div>
            <p className="text-[10px] font-body text-foreground/30 mt-1.5">
              {Math.round((totalAct / totalEst) * 100)}% of budget
            </p>
          </div>
        )}
      </div>

      {/* Column labels */}
      <div className="flex items-center justify-between px-5 pb-2.5 text-[10px] uppercase tracking-[0.18em] text-foreground/35 font-body">
        <span>Category</span>
        <div className="flex gap-8">
          <span>Budget</span>
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
  const { user } = useAuth();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [newTraveler, setNewTraveler] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('packing_items').select('*').eq('user_id', user.id).order('created_at')
      .then(({ data, error }: { data: any[] | null; error: any }) => {
        if (error) { console.error('Failed to load packing items:', error); return; }
        if (data) setItems(data.map((r: any) => ({ id: r.id, text: r.text, packed: r.packed, traveler: r.traveler ?? undefined })));
      });
  }, [user]);

  const toggle = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const packed = !item.packed;
    setItems(prev => prev.map(i => i.id === id ? { ...i, packed } : i));
    const { error } = await (supabase as any).from('packing_items').update({ packed }).eq('id', id);
    if (error) console.error('Failed to update packing item:', error);
  };

  const add = async () => {
    if (!newItem.trim() || !user) return;
    const newPacking: PackingItem = { id: crypto.randomUUID(), text: newItem, packed: false, traveler: newTraveler || undefined };
    setItems(prev => [...prev, newPacking]);
    setNewItem(''); setNewTraveler('');
    console.log('[packing] inserting:', { id: newPacking.id, text: newPacking.text });
    const { data, error } = await (supabase as any).from('packing_items').insert({ id: newPacking.id, user_id: user.id, text: newPacking.text, packed: false, traveler: newPacking.traveler ?? null }).select();
    if (error) console.error('[packing] insert error — message:', error.message, '| code:', error.code, '| details:', error.details);
    else console.log('[packing] insert success:', data);
  };
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
      const aiItems: PackingItem[] = parsed.map((item) => ({
        id: crypto.randomUUID(),
        text: item,
        packed: false,
      }));
      setItems(prev => [...prev, ...aiItems]);
      if (user) {
        const { error } = await (supabase as any).from('packing_items').insert(aiItems.map(i => ({ id: i.id, user_id: user.id, text: i.text, packed: false, traveler: null })));
        if (error) console.error('Failed to save AI packing items:', error);
      }
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
  const { user } = useAuth();
  const [items, setItems] = useState<NoteItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('note_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data, error }: { data: any[] | null; error: any }) => {
        if (error) { console.error('Failed to load notes:', error); return; }
        if (data) setItems(data.map((r: any) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          createdAt: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        })));
      });
  }, [user]);

  const add = async () => {
    if (!newTitle.trim() || !user) return;
    const id = crypto.randomUUID();
    const createdAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newNote: NoteItem = { id, title: newTitle, content: newContent, createdAt };
    setItems(prev => [newNote, ...prev]);
    setNewTitle(''); setNewContent('');
    console.log('[notes] inserting:', { id, title: newTitle });
    const { data, error } = await (supabase as any).from('note_items').insert({ id, user_id: user.id, title: newTitle, content: newContent }).select();
    if (error) console.error('[notes] insert error — message:', error.message, '| code:', error.code, '| details:', error.details);
    else console.log('[notes] insert success:', data);
  };

  const remove = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    const { error } = await (supabase as any).from('note_items').delete().eq('id', id);
    if (error) console.error('Failed to delete note:', error);
  };

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

// ── Shared summary card primitives ──
const CardStripe = () => (
  <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg, hsl(0 20% 78%), hsl(0 12% 88%))' }} />
);

const CardIconBadge = ({ Icon }: { Icon: React.ElementType }) => (
  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
    <Icon size={18} strokeWidth={1.3} className="text-primary-foreground" />
  </div>
);

const CardField = ({ label, value }: { label: string; value?: string | number }) => {
  if (!value && value !== 0) return null;
  const display = typeof value === 'number' ? (value > 0 ? formatCost(value) : null) : value;
  if (!display) return null;
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-foreground/30 mb-0.5">{label}</p>
      <p className="font-body text-sm text-foreground/65 leading-snug">{display}</p>
    </div>
  );
};

// ── Transportation ──
const transportIconMap: Record<string, React.ElementType> = {
  Plane, Ferry: Ship, Train: TrainFront, Car,
};

const TransportView = ({ onBack, items, setItems, callbacks, tripStartDate }: { onBack: () => void; items: TransportItem[]; setItems: React.Dispatch<React.SetStateAction<TransportItem[]>>; callbacks?: ItemCallbacks; tripStartDate?: Date }) => {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(items.map(i => i.id)));
  const didInitSavedRef = useRef(false);
  useEffect(() => {
    if (didInitSavedRef.current) return;
    if (items.length > 0) {
      didInitSavedRef.current = true;
      console.log('[TransportView] mount — loaded', items.length, 'items from Supabase, marking as saved');
      setSavedIds(prev => { const next = new Set(prev); items.forEach(i => next.add(i.id)); return next; });
    }
  }, [items]);
  const add = () => {
    const newItem: TransportItem = { id: crypto.randomUUID(), type: '', details: '', confirmation: '', date: '', time: '', cost: 0 };
    setItems(prev => [...prev, newItem]);
    callbacks?.onAdd(newItem);
  };
  const remove = (id: string) => { setItems(items.filter(i => i.id !== id)); setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); callbacks?.onDelete(id); };
  // update only touches local state; Supabase write fires on SaveButton click via save()
  const update = (id: string, field: keyof TransportItem, value: string | number) => { setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i)); };
  const save = (id: string) => { setSavedIds(prev => new Set(prev).add(id)); callbacks?.onUpdate(id); };
  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Transportation" onBack={onBack} />
      <div className="max-w-[820px] mx-auto">
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = transportIconMap[item.type] || Plane;
          const route = [item.departureLocation, item.arrivalLocation].filter(Boolean).join(' → ') || item.details || item.type;
          if (savedIds.has(item.id)) return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl shadow-soft p-6 relative overflow-hidden">
              <CardStripe />
              <button onClick={() => setSavedIds(prev => { const n = new Set(prev); n.delete(item.id); return n; })}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors">
                <Pencil size={13} strokeWidth={1.5} />
              </button>
              <div className="flex items-start gap-4">
                <CardIconBadge Icon={Icon} />
                <div className="flex-1 min-w-0 space-y-3">
                  <h3 className="font-serif text-xl text-foreground/85 leading-tight pr-8">{route}</h3>
                  <div className="border-t border-foreground/[0.07]" />
                  <div className="grid grid-cols-2 gap-3">
                    <CardField label="Date" value={item.date} />
                    <CardField label="Time" value={item.time} />
                    <CardField label="Details" value={item.details} />
                    <CardField label="Cost" value={item.cost} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
          return (
            <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
              <button onClick={() => remove(item.id)} className="absolute top-4 right-4"><Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" /></button>
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
                <input value={item.details} onChange={(e) => update(item.id, 'details', e.target.value)} placeholder="Details (flight number, etc.)" className={inputClass} />
                <PlacesAutocomplete value={item.departureLocation || ''} onChange={(v) => update(item.id, 'departureLocation' as any, v)}
                  onPlaceSelect={(r) => { const loc = r.name || r.address; update(item.id, 'departureLocation' as any, loc); if (r.lat != null) update(item.id, 'departureLat' as any, r.lat); if (r.lng != null) update(item.id, 'departureLng' as any, r.lng); update(item.id, 'location', loc); if (r.lat != null) update(item.id, 'lat' as any, r.lat); if (r.lng != null) update(item.id, 'lng' as any, r.lng); }}
                  placeholder={item.type === 'Plane' ? 'Departing airport' : 'Departure location'} className={inputClass} />
                <PlacesAutocomplete value={item.arrivalLocation || ''} onChange={(v) => update(item.id, 'arrivalLocation' as any, v)}
                  onPlaceSelect={(r) => { const loc = r.name || r.address; update(item.id, 'arrivalLocation' as any, loc); if (r.lat != null) update(item.id, 'arrivalLat' as any, r.lat); if (r.lng != null) update(item.id, 'arrivalLng' as any, r.lng); }}
                  placeholder={item.type === 'Plane' ? 'Arrival airport' : 'Arrival location'} className={inputClass} />
                <div className="grid grid-cols-2 gap-2.5">
                  <CustomDatePicker value={item.takeoffDate || ''} onChange={(v) => { update(item.id, 'takeoffDate' as any, v); update(item.id, 'date', v); }} placeholder="Departure date" triggerClassName={inputClass} defaultMonth={tripStartDate} />
                  <CustomTimePicker value={item.takeoffTime || ''} onChange={(v) => { update(item.id, 'takeoffTime' as any, v); update(item.id, 'time', v); }} placeholder="Departure time" triggerClassName={inputClass} defaultScrollTo="08:00" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <CustomDatePicker value={item.landingDate || ''} onChange={(v) => update(item.id, 'landingDate' as any, v)} placeholder="Arrival date" triggerClassName={inputClass} defaultMonth={tripStartDate} />
                  <CustomTimePicker value={item.landingTime || ''} onChange={(v) => update(item.id, 'landingTime' as any, v)} placeholder="Arrival time" triggerClassName={inputClass} defaultScrollTo="08:00" />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                  <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
                </div>
                <input value={item.confirmation} onChange={(e) => update(item.id, 'confirmation', e.target.value)} placeholder="Add any notes here…" className={inputClass} />
                <SaveButton label="Transportation" disabled={!item.type} onSave={() => save(item.id)} />
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} /><span className="font-body">Add transportation</span>
      </button>
      </div>
    </div>
  );
};

// ── Accommodations ──
const AccommodationsView = ({ onBack, items, setItems, callbacks, tripStartDate }: { onBack: () => void; items: AccommodationItem[]; setItems: React.Dispatch<React.SetStateAction<AccommodationItem[]>>; callbacks?: ItemCallbacks; tripStartDate?: Date }) => {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(items.map(i => i.id)));
  const didInitSavedRef = useRef(false);
  useEffect(() => {
    if (didInitSavedRef.current) return;
    if (items.length > 0) {
      didInitSavedRef.current = true;
      console.log('[AccommodationsView] mount — loaded', items.length, 'items from Supabase, marking as saved');
      setSavedIds(prev => { const next = new Set(prev); items.forEach(i => next.add(i.id)); return next; });
    }
  }, [items]);

  const add = () => {
    const newItem: AccommodationItem = { id: crypto.randomUUID(), name: '', address: '', checkIn: '', checkInTime: '', checkOut: '', checkOutTime: '', confirmation: '', cost: 0 };
    setItems(prev => [...prev, newItem]);
    callbacks?.onAdd(newItem);
  };
  const remove = (id: string) => { setItems(items.filter(i => i.id !== id)); setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); callbacks?.onDelete(id); };
  const update = (id: string, field: keyof AccommodationItem, value: string | number) => { setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i)); callbacks?.onUpdate(id); };

  const autofill = async (id: string, name: string) => {
    if (!name.trim()) return;
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 512, messages: [{ role: 'user', content: `You are a luxury travel assistant. Return ONLY a JSON object — no markdown, no extra text — with details for the hotel "${name}":\n{\n  "address": "full street address",\n  "checkInTime": "standard check-in time, e.g. 3:00 PM",\n  "checkOutTime": "standard check-out time, e.g. 12:00 PM",\n  "notes": "one sentence luxury description of the property"\n}\nIf the hotel is not found, use reasonable luxury defaults.` }] }),
      });
      const data = await response.json();
      const text = data.content?.map((b: any) => b.text || '').join('') || '';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...(parsed.address && { address: parsed.address }), ...(parsed.checkInTime && { checkInTime: parsed.checkInTime }), ...(parsed.checkOutTime && { checkOutTime: parsed.checkOutTime }), ...(parsed.notes && { confirmation: parsed.notes }) } : i));
      callbacks?.onUpdate(id);
    } catch { /* silently fail */ } finally {
      setLoadingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Accommodations" onBack={onBack} />
      <div className="max-w-[820px] mx-auto">
      <div className="space-y-4">
        {items.map((item) => {
          if (savedIds.has(item.id)) {
            const stayLine = [item.checkIn, item.checkOut].filter(Boolean).join(' → ');
            const timesLine = [item.checkInTime && `In ${item.checkInTime}`, item.checkOutTime && `Out ${item.checkOutTime}`].filter(Boolean).join(' · ');
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl shadow-soft p-6 relative overflow-hidden">
                <CardStripe />
                <button onClick={() => setSavedIds(prev => { const n = new Set(prev); n.delete(item.id); return n; })}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors">
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
                <div className="flex items-start gap-4">
                  <CardIconBadge Icon={Bed} />
                  <div className="flex-1 min-w-0 space-y-3">
                    <h3 className="font-serif text-xl text-foreground/85 leading-tight pr-8">{item.name}</h3>
                    {item.address && <p className="font-body text-xs text-foreground/45 -mt-1">{item.address}</p>}
                    <div className="border-t border-foreground/[0.07]" />
                    <div className="grid grid-cols-2 gap-3">
                      <CardField label="Stay" value={stayLine} />
                      <CardField label="Times" value={timesLine} />
                      <CardField label="Cost" value={item.cost} />
                      {item.confirmation && <CardField label="Notes" value={item.confirmation.slice(0, 80) + (item.confirmation.length > 80 ? '…' : '')} />}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }
          return (
            <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
              <button onClick={() => remove(item.id)} className="absolute top-4 right-4"><Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" /></button>
              <div className="space-y-2.5">
                <div className="relative">
                  <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Hotel name" className={`${inputClass} pr-9`} />
                  <button onClick={() => autofill(item.id, item.name)} disabled={loadingIds.has(item.id) || !item.name.trim()} title="Autofill with AI"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all disabled:opacity-30 text-foreground/30 hover:text-primary hover:bg-primary/10 disabled:hover:text-foreground/30 disabled:hover:bg-transparent">
                    {loadingIds.has(item.id) ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" /> : <Sparkles size={13} strokeWidth={1.5} />}
                  </button>
                </div>
                <PlacesAutocomplete value={item.address} onChange={(v) => update(item.id, 'address', v)} onPlaceSelect={(r) => { update(item.id, 'address', r.address); if (r.lat != null) update(item.id, 'lat' as any, r.lat); if (r.lng != null) update(item.id, 'lng' as any, r.lng); }} placeholder="Address (search or type)" className={inputClass} />
                <div className="grid grid-cols-2 gap-2.5">
                  <CustomDatePicker value={item.checkIn} onChange={(v) => update(item.id, 'checkIn', v)} placeholder="Check-in date" triggerClassName={inputClass} defaultMonth={tripStartDate} />
                  <CustomTimePicker value={item.checkInTime} onChange={(v) => update(item.id, 'checkInTime', v)} placeholder="Check-in time" triggerClassName={inputClass} defaultScrollTo="08:00" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <CustomDatePicker value={item.checkOut} onChange={(v) => update(item.id, 'checkOut', v)} placeholder="Check-out date" triggerClassName={inputClass} defaultMonth={tripStartDate} />
                  <CustomTimePicker value={item.checkOutTime} onChange={(v) => update(item.id, 'checkOutTime', v)} placeholder="Check-out time" triggerClassName={inputClass} defaultScrollTo="08:00" />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                  <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
                </div>
                <input value={item.confirmation} onChange={(e) => update(item.id, 'confirmation', e.target.value)} placeholder="Add any notes here…" className={inputClass} />
                <SaveButton label="Accommodations" disabled={!item.name.trim()} onSave={() => setSavedIds(prev => new Set(prev).add(item.id))} />
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} /><span className="font-body">Add accommodation</span>
      </button>
      </div>
    </div>
  );
};

// ── Activities ──
const ActivitiesView = ({ onBack, items, setItems, callbacks, tripStartDate }: { onBack: () => void; items: ActivityItem[]; setItems: React.Dispatch<React.SetStateAction<ActivityItem[]>>; callbacks?: ItemCallbacks; tripStartDate?: Date }) => {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(items.map(i => i.id)));
  const didInitSavedRef = useRef(false);
  useEffect(() => {
    if (didInitSavedRef.current) return;
    if (items.length > 0) {
      didInitSavedRef.current = true;
      console.log('[ActivitiesView] mount — loaded', items.length, 'items from Supabase, marking as saved');
      setSavedIds(prev => { const next = new Set(prev); items.forEach(i => next.add(i.id)); return next; });
    }
  }, [items]);
  const add = () => {
    const newItem: ActivityItem = { id: crypto.randomUUID(), name: '', notes: '', time: '', confirmation: '', cost: 0 };
    setItems(prev => [...prev, newItem]);
    callbacks?.onAdd(newItem);
  };
  const remove = (id: string) => { setItems(items.filter(i => i.id !== id)); setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); callbacks?.onDelete(id); };
  const update = (id: string, field: keyof ActivityItem, value: string | number) => { setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i)); callbacks?.onUpdate(id); };
  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Activities" onBack={onBack} />
      <div className="max-w-[820px] mx-auto">
      <div className="space-y-3">
        {items.map((item) => {
          if (savedIds.has(item.id)) {
            const datePart = item.time?.split(',')[0]?.trim();
            const timePart = item.confirmation;
            const dateTimeLine = [datePart, timePart].filter(Boolean).join(' · ');
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl shadow-soft p-6 relative overflow-hidden">
                <CardStripe />
                <button onClick={() => setSavedIds(prev => { const n = new Set(prev); n.delete(item.id); return n; })}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors">
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
                <div className="flex items-start gap-4">
                  <CardIconBadge Icon={Star} />
                  <div className="flex-1 min-w-0 space-y-3">
                    <h3 className="font-serif text-xl text-foreground/85 leading-tight pr-8">{item.name}</h3>
                    {item.location && <p className="font-body text-xs text-foreground/45 -mt-1">{item.location}</p>}
                    <div className="border-t border-foreground/[0.07]" />
                    <div className="grid grid-cols-2 gap-3">
                      <CardField label="Date & Time" value={dateTimeLine} />
                      <CardField label="Cost" value={item.cost} />
                      {item.notes && <CardField label="Notes" value={item.notes.slice(0, 80) + (item.notes.length > 80 ? '…' : '')} />}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }
          return (
            <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
              <button onClick={() => remove(item.id)} className="absolute top-4 right-4"><Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" /></button>
              <div className="space-y-2.5">
                <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Activity name" className={inputClass} />
                <PlacesAutocomplete value={item.location || ''} onChange={(v) => update(item.id, 'location', v)} onPlaceSelect={(r) => { update(item.id, 'location', r.address); if (r.lat != null) update(item.id, 'lat' as any, r.lat); if (r.lng != null) update(item.id, 'lng' as any, r.lng); }} placeholder="Location (search or type address)" className={inputClass} />
                <div className="grid grid-cols-2 gap-2.5">
                  <CustomDatePicker value={item.time?.split(',')[0]?.trim() || ''} onChange={(v) => { const timePart = item.time?.match(/,\s*(.+)/)?.[1] || ''; update(item.id, 'time', timePart ? `${v}, ${timePart}` : v); }} placeholder="Date" triggerClassName={inputClass} defaultMonth={tripStartDate} />
                  <CustomTimePicker value={item.confirmation || ''} onChange={(v) => update(item.id, 'confirmation', v)} placeholder="Time" triggerClassName={inputClass} defaultScrollTo="08:00" />
                </div>
                <input value={item.notes} onChange={(e) => update(item.id, 'notes', e.target.value)} placeholder="Notes" className={inputClass} />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                  <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
                </div>
                <SaveButton label="Activities" disabled={!item.name.trim()} onSave={() => setSavedIds(prev => new Set(prev).add(item.id))} />
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} /><span className="font-body">Add activity</span>
      </button>
      </div>
    </div>
  );
};

// ── Reservations ──
const ReservationsView = ({ onBack, items, setItems, callbacks, tripStartDate }: { onBack: () => void; items: ReservationItem[]; setItems: React.Dispatch<React.SetStateAction<ReservationItem[]>>; callbacks?: ItemCallbacks; tripStartDate?: Date }) => {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(items.map(i => i.id)));
  const didInitSavedRef = useRef(false);
  useEffect(() => {
    if (didInitSavedRef.current) return;
    if (items.length > 0) {
      didInitSavedRef.current = true;
      console.log('[ReservationsView] mount — loaded', items.length, 'items from Supabase, marking as saved');
      setSavedIds(prev => { const next = new Set(prev); items.forEach(i => next.add(i.id)); return next; });
    }
  }, [items]);
  const add = () => {
    const newItem: ReservationItem = { id: crypto.randomUUID(), name: '', date: '', time: '', confirmation: '', notes: '', cost: 0 };
    setItems(prev => [...prev, newItem]);
    callbacks?.onAdd(newItem);
  };
  const remove = (id: string) => { setItems(items.filter(i => i.id !== id)); setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); callbacks?.onDelete(id); };
  const update = (id: string, field: keyof ReservationItem, value: string | number) => { setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i)); callbacks?.onUpdate(id); };
  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Reservations" onBack={onBack} />
      <div className="max-w-[820px] mx-auto">
      <div className="space-y-3">
        {items.map((item) => {
          if (savedIds.has(item.id)) {
            const dateTimeLine = [item.date, item.time].filter(Boolean).join(' · ');
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl shadow-soft p-6 relative overflow-hidden">
                <CardStripe />
                <button onClick={() => setSavedIds(prev => { const n = new Set(prev); n.delete(item.id); return n; })}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors">
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
                <div className="flex items-start gap-4">
                  <CardIconBadge Icon={CalendarDays} />
                  <div className="flex-1 min-w-0 space-y-3">
                    <h3 className="font-serif text-xl text-foreground/85 leading-tight pr-8">{item.name}</h3>
                    {item.location && <p className="font-body text-xs text-foreground/45 -mt-1">{item.location}</p>}
                    <div className="border-t border-foreground/[0.07]" />
                    <div className="grid grid-cols-2 gap-3">
                      <CardField label="Date & Time" value={dateTimeLine} />
                      <CardField label="Cost" value={item.cost} />
                      {item.confirmation && <CardField label="Confirmation" value={item.confirmation} />}
                      {item.notes && <CardField label="Notes" value={item.notes.slice(0, 80) + (item.notes.length > 80 ? '…' : '')} />}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }
          return (
            <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
              <button onClick={() => remove(item.id)} className="absolute top-4 right-4"><Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" /></button>
              <div className="space-y-2.5">
                <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Restaurant / Venue" className={inputClass} />
                <PlacesAutocomplete value={item.location || ''} onChange={(v) => update(item.id, 'location', v)} onPlaceSelect={(r) => { update(item.id, 'location', r.address); if (r.lat != null) update(item.id, 'lat' as any, r.lat); if (r.lng != null) update(item.id, 'lng' as any, r.lng); }} placeholder="Location (search or type address)" className={inputClass} />
                <div className="grid grid-cols-2 gap-2.5">
                  <CustomDatePicker value={item.date} onChange={(v) => update(item.id, 'date', v)} placeholder="Date" triggerClassName={inputClass} defaultMonth={tripStartDate} />
                  <CustomTimePicker value={item.time} onChange={(v) => update(item.id, 'time', v)} placeholder="Time" triggerClassName={inputClass} defaultScrollTo="08:00" />
                </div>
                <input value={item.confirmation} onChange={(e) => update(item.id, 'confirmation', e.target.value)} placeholder="Confirmation #" className={inputClass} />
                <input value={item.notes} onChange={(e) => update(item.id, 'notes', e.target.value)} placeholder="Notes" className={inputClass} />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                  <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
                </div>
                <SaveButton label="Reservations" disabled={!item.name.trim()} onSave={() => setSavedIds(prev => new Set(prev).add(item.id))} />
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} /><span className="font-body">Add reservation</span>
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

const fromDbTraveler = (row: Record<string, unknown>): TravelerInfo => ({
  id: row.id as string,
  name: (row.name as string) || '',
  passportNumber: (row.passport_number as string) || '',
  passportExpiry: (row.passport_expiry as string) || '',
  dateOfBirth: (row.date_of_birth as string) || '',
  nationality: (row.nationality as string) || '',
  dietaryRestrictions: (row.dietary_restrictions as string) || '',
  emergencyContactName: (row.emergency_contact_name as string) || '',
  emergencyContactPhone: (row.emergency_contact_phone as string) || '',
  preferredAirline: (row.preferred_airline as string) || '',
  seatPreference: (row.seat_preference as string) || '',
  notes: (row.notes as string) || '',
});

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatDOB = (dob: string) => {
  if (!dob) return '';
  // Try to parse MM/DD/YYYY or YYYY-MM-DD
  const iso = dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const mdy = dob.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  let date: Date | null = null;
  if (iso) date = new Date(`${iso[1]}-${iso[2]}-${iso[3]}`);
  else if (mdy) date = new Date(`${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`);
  if (!date || isNaN(date.getTime())) return dob;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const PassportPill = ({ label, value }: { label: string; value: string }) => (
  value ? (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl bg-background border border-foreground/[0.06]" style={{ minWidth: 80 }}>
      <span className="text-[9px] uppercase tracking-widest text-foreground/35">{label}</span>
      <span className="font-body text-xs text-foreground/65 text-center leading-tight">{value}</span>
    </div>
  ) : null
);

const TravelerCard = ({ traveler, onEdit }: { traveler: TravelerInfo; onEdit: () => void }) => {
  const initials = getInitials(traveler.name);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-card rounded-2xl shadow-soft p-6 relative overflow-hidden"
    >
      {/* Subtle decorative stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg, hsl(0 20% 78%), hsl(0 12% 88%))' }} />

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="absolute top-5 right-5 p-1.5 rounded-lg text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors"
      >
        <Pencil size={13} strokeWidth={1.5} />
      </button>

      {/* Header: initials circle + name/nationality */}
      <div className="flex items-center gap-5 mb-5">
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, background: 'linear-gradient(135deg, hsl(0 20% 90%), hsl(0 12% 84%))', border: '1px solid hsl(0 20% 82%)' }}
        >
          <span className="font-serif text-xl text-foreground/60" style={{ letterSpacing: '0.05em' }}>{initials}</span>
        </div>
        <div>
          <h3 className="font-serif text-xl text-foreground/85 leading-tight">{traveler.name}</h3>
          {traveler.nationality && (
            <p className="text-[11px] uppercase tracking-widest text-foreground/40 mt-0.5">{traveler.nationality}</p>
          )}
          {traveler.dateOfBirth && (
            <p className="font-body text-xs text-foreground/45 mt-1">{formatDOB(traveler.dateOfBirth)}</p>
          )}
        </div>
      </div>

      {/* Thin divider */}
      <div className="border-t border-foreground/[0.07] mb-4" />

      {/* Passport row */}
      {(traveler.passportNumber || traveler.passportExpiry) && (
        <div className="mb-4">
          <p className="text-[9px] uppercase tracking-widest text-foreground/30 mb-2">Passport</p>
          <div className="flex gap-4">
            {traveler.passportNumber && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-foreground/30">Number</p>
                <p className="font-body text-sm text-foreground/65 tracking-widest mt-0.5">{traveler.passportNumber}</p>
              </div>
            )}
            {traveler.passportExpiry && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-foreground/30">Expires</p>
                <p className="font-body text-sm text-foreground/65 mt-0.5">{traveler.passportExpiry}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pills row */}
      {(traveler.dietaryRestrictions || traveler.seatPreference || traveler.preferredAirline) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <PassportPill label="Diet" value={traveler.dietaryRestrictions} />
          <PassportPill label="Seat" value={traveler.seatPreference} />
          <PassportPill label="Airline" value={traveler.preferredAirline} />
        </div>
      )}

      {/* Emergency contact */}
      {(traveler.emergencyContactName || traveler.emergencyContactPhone) && (
        <div className="border-t border-foreground/[0.07] pt-3 mt-1">
          <p className="text-[9px] uppercase tracking-widest text-foreground/30 mb-1.5">Emergency Contact</p>
          <p className="font-body text-xs text-foreground/55">
            {[traveler.emergencyContactName, traveler.emergencyContactPhone].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {/* Notes */}
      {traveler.notes && (
        <div className="border-t border-foreground/[0.07] pt-3 mt-3">
          <p className="font-body text-xs text-foreground/45 italic leading-relaxed">{traveler.notes}</p>
        </div>
      )}
    </motion.div>
  );
};

const TravelerInfoView = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const db = supabase as any;

  const [travelers, setTravelers] = useState<TravelerInfo[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const travelersRef = useRef<TravelerInfo[]>([]);
  travelersRef.current = travelers;
  const updateTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load from DB on mount; fall back to 2 empty forms if no data yet
  useEffect(() => {
    if (!user) {
      setTravelers([emptyTraveler(crypto.randomUUID()), emptyTraveler(crypto.randomUUID())]);
      return;
    }
    (async () => {
      const { data, error } = await db
        .from('traveler_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');
      if (error) {
        console.error('[TravelerInfoView] load error:', error);
        setTravelers([emptyTraveler(crypto.randomUUID()), emptyTraveler(crypto.randomUUID())]);
        return;
      }
      if (data?.length) {
        setTravelers(data.map(fromDbTraveler));
        setSavedIds(new Set(data.map((r: any) => r.id as string)));
      } else {
        setTravelers([emptyTraveler(crypto.randomUUID()), emptyTraveler(crypto.randomUUID())]);
      }
    })();
  }, [user]);

  const toDbRow = (t: TravelerInfo, sortOrder: number) => ({
    id: t.id,
    user_id: user!.id,
    name: t.name,
    passport_number: t.passportNumber,
    passport_expiry: t.passportExpiry,
    date_of_birth: t.dateOfBirth,
    nationality: t.nationality,
    dietary_restrictions: t.dietaryRestrictions,
    emergency_contact_name: t.emergencyContactName,
    emergency_contact_phone: t.emergencyContactPhone,
    preferred_airline: t.preferredAirline,
    seat_preference: t.seatPreference,
    notes: t.notes,
    sort_order: sortOrder,
  });

  const updateTraveler = (id: string, field: keyof TravelerInfo, value: string) => {
    setTravelers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    if (!user) return;
    const existing = updateTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      const t = travelersRef.current.find(t => t.id === id);
      const sortOrder = travelersRef.current.findIndex(t => t.id === id);
      if (!t) return;
      const { error } = await db.from('traveler_profiles').upsert(toDbRow(t, sortOrder)).select();
      if (error) console.error('[TravelerInfoView] upsert error:', error);
    }, 1000);
    updateTimers.current.set(id, timer);
  };

  const saveTraveler = async (id: string) => {
    const t = travelersRef.current.find(t => t.id === id);
    if (!t?.name.trim()) return;
    setSavedIds(prev => new Set(prev).add(id));
    if (!user) return;
    const existing = updateTimers.current.get(id);
    if (existing) { clearTimeout(existing); updateTimers.current.delete(id); }
    const sortOrder = travelersRef.current.findIndex(t => t.id === id);
    const { error } = await db.from('traveler_profiles').upsert(toDbRow(t, sortOrder)).select();
    if (error) console.error('[TravelerInfoView] save error:', error);
  };

  const editTraveler = (id: string) => {
    setSavedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const addTraveler = () => {
    setTravelers(prev => [...prev, emptyTraveler(crypto.randomUUID())]);
  };

  const removeTraveler = async (id: string) => {
    setTravelers(prev => prev.filter(t => t.id !== id));
    setSavedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    const existing = updateTimers.current.get(id);
    if (existing) { clearTimeout(existing); updateTimers.current.delete(id); }
    if (!user) return;
    const { error } = await db.from('traveler_profiles').delete().eq('id', id).eq('user_id', user.id);
    if (error) console.error('[TravelerInfoView] delete error:', error);
  };

  const inputClass = 'w-full bg-card border border-foreground/5 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-primary transition-colors';
  const sectionLabel = 'text-[10px] uppercase tracking-widest text-foreground/35 mt-4 mb-2 block';

  return (
    <div className="max-w-[640px] mx-auto">
      <DetailHeader title="Traveler Profiles" onBack={onBack} />
      <div className="space-y-6">
        {travelers.map((traveler) => (
          savedIds.has(traveler.id) ? (
            <TravelerCard key={traveler.id} traveler={traveler} onEdit={() => editTraveler(traveler.id)} />
          ) : (
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
              <button
                onClick={() => saveTraveler(traveler.id)}
                disabled={!traveler.name.trim()}
                className="w-full mt-4 py-2.5 rounded-xl text-white text-sm font-serif tracking-wide transition-colors shadow-soft bg-[#d4b5b0] hover:bg-[#c9a8a2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Profile
              </button>
            </div>
          )
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
const DetailViewComponent = ({ view, onBack, transportItems, setTransportItems, transportCallbacks, accommodationItems, setAccommodationItems, accommodationCallbacks, activityItems, setActivityItems, activityCallbacks, reservationItems, setReservationItems, reservationCallbacks, tripData, onAddToItinerary }: DetailViewProps) => {
  if (!view) return null;
  const tripStartDate: Date | undefined = (() => {
    if (!tripData?.date) return undefined;
    const d = parseDateFns(tripData.date, 'yyyy-MM-dd', new Date());
    return isValidDate(d) ? d : undefined;
  })();
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
      {view === 'transportation' && <TransportView onBack={onBack} items={transportItems} setItems={setTransportItems} callbacks={transportCallbacks} tripStartDate={tripStartDate} />}
      {view === 'accommodations' && <AccommodationsView onBack={onBack} items={accommodationItems} setItems={setAccommodationItems} callbacks={accommodationCallbacks} tripStartDate={tripStartDate} />}
      {view === 'activities' && <ActivitiesView onBack={onBack} items={activityItems} setItems={setActivityItems} callbacks={activityCallbacks} tripStartDate={tripStartDate} />}
      {view === 'reservations' && <ReservationsView onBack={onBack} items={reservationItems} setItems={setReservationItems} callbacks={reservationCallbacks} tripStartDate={tripStartDate} />}
      {view === 'map' && <MapView onBack={onBack} />}
      {view === 'travelerInfo' && <TravelerInfoView onBack={onBack} />}
      {view === 'concierge' && <AIConciergeView onBack={onBack} tripData={tripData} onAddToItinerary={onAddToItinerary} />}
    </motion.div>
  );
};

export default DetailViewComponent;
