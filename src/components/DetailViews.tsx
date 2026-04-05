import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Check, Pencil, Plane, Ship, TrainFront, Car } from 'lucide-react';

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
}

interface BudgetViewProps {
  onBack: () => void;
  transportItems: TransportItem[];
  accommodationItems: AccommodationItem[];
  activityItems: ActivityItem[];
  reservationItems: ReservationItem[];
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
    <div>
      <DetailHeader title="To-Dos" onBack={onBack} />
      <div className="flex gap-2 mb-6">
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Add a new task..." className="flex-1 bg-card border border-foreground/5 pill-shape px-4 sm:px-5 py-3.5 text-sm font-body focus:outline-none focus:border-primary transition-colors" />
        <button onClick={add} className="w-12 h-12 bg-primary pill-shape flex items-center justify-center shadow-arch"><Plus size={16} strokeWidth={1.8} className="text-primary-foreground" /></button>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <motion.div key={item.id} layout whileHover={{ y: -1 }} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-card pill-shape shadow-soft">
            <button onClick={() => toggle(item.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${item.completed ? 'bg-primary border-primary' : 'border-foreground/15'}`}>{item.completed && <Check size={12} className="text-primary-foreground" />}</button>
            <span className={`flex-1 font-body text-sm ${item.completed ? 'line-through text-foreground/35' : 'text-foreground'}`}>{item.text}</span>
            <button onClick={() => remove(item.id)}><Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" /></button>
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
    <div>
      <DetailHeader title="Budget" onBack={onBack} />
      <div className="bg-primary/30 pill-shape p-6 sm:p-7 mb-6 text-center">
        <p className="text-label mb-1">Total Budget</p>
        {editingTotal ? (
          <input
            type="number"
            value={totalBudgetOverride ?? categories.reduce((s, c) => s + estimatedBudgets[c], 0)}
            onChange={(e) => setTotalBudgetOverride(parseFloat(e.target.value) || 0)}
            onBlur={() => setEditingTotal(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingTotal(false)}
            autoFocus
            className="font-serif text-3xl text-foreground bg-transparent border-b border-primary text-center focus:outline-none w-40"
          />
        ) : (
          <button onClick={() => setEditingTotal(true)} className="flex items-center gap-2 mx-auto">
            <span className="font-serif text-3xl text-foreground">{formatCost(totalEst)}</span>
            <Pencil size={14} className="text-muted-foreground" />
          </button>
        )}
        <p className="text-sm text-foreground/45 mt-1.5">Spent: {formatCost(totalAct)}</p>
      </div>
      <div className="flex items-center justify-between px-4 sm:px-5 pb-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        <span>Category</span>
        <div className="flex gap-6 sm:gap-8">
          <span>Estimated</span>
          <span>Actual</span>
        </div>
      </div>
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category} className="flex items-center justify-between px-4 sm:px-5 py-4 bg-card pill-shape shadow-soft">
            <span className="font-serif text-foreground">{category}</span>
            <div className="flex gap-4 sm:gap-6 items-center">
              {editingCategory === category ? (
                <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => e.key === 'Enter' && commitEdit()} autoFocus className="w-24 text-sm text-right bg-transparent border-b border-primary focus:outline-none font-body" />
              ) : (
                <button onClick={() => startEdit(category)} className="text-sm text-foreground hover:text-primary transition-colors">{formatCost(estimatedBudgets[category])}</button>
              )}
              <span className="text-sm text-muted-foreground w-24 text-right">{formatCost(actualsByCategory[category])}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Packing ──
const PackingView = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<PackingItem[]>(samplePacking);
  const [newItem, setNewItem] = useState('');
  const [newTraveler, setNewTraveler] = useState('');
  const toggle = (id: string) => setItems(items.map(i => i.id === id ? { ...i, packed: !i.packed } : i));
  const add = () => { if (!newItem.trim()) return; setItems([...items, { id: Date.now().toString(), text: newItem, packed: false, traveler: newTraveler || undefined }]); setNewItem(''); setNewTraveler(''); };
  const packed = items.filter(i => i.packed).length;
  const travelers = [...new Set(items.map(i => i.traveler).filter(Boolean))];

  return (
    <div>
      <DetailHeader title="Packing" onBack={onBack} />
      <p className="text-sm text-muted-foreground mb-4">{packed} of {items.length} packed</p>
      <div className="space-y-2 mb-6">
        <div className="flex gap-2">
          <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Add item..." className="flex-1 bg-card border border-foreground/5 pill-shape px-4 sm:px-5 py-3.5 text-sm font-body focus:outline-none focus:border-primary transition-colors" />
          <button onClick={add} className="w-12 h-12 bg-primary pill-shape flex items-center justify-center shadow-arch"><Plus size={16} strokeWidth={1.8} className="text-primary-foreground" /></button>
        </div>
        <input value={newTraveler} onChange={(e) => setNewTraveler(e.target.value)} placeholder="Assign to traveler (optional)" className="w-full bg-card border border-foreground/5 pill-shape px-4 sm:px-5 py-3 text-xs font-body focus:outline-none focus:border-primary transition-colors" />
      </div>
      {travelers.length > 0 ? (
        <>
          {[...travelers, undefined].map((traveler) => {
            const travelerItems = items.filter(i => i.traveler === traveler);
            if (travelerItems.length === 0) return null;
            return (
              <div key={traveler ?? 'unassigned'} className="mb-5">
                <p className="text-label mb-2">{traveler ?? 'Unassigned'}</p>
                <div className="space-y-2.5">
                  {travelerItems.map((item) => (
                    <button key={item.id} onClick={() => toggle(item.id)} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-card pill-shape shadow-soft text-left">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${item.packed ? 'bg-primary border-primary' : 'border-foreground/15'}`}>{item.packed && <Check size={12} className="text-primary-foreground" />}</div>
                      <span className={`font-body text-sm ${item.packed ? 'line-through text-foreground/35' : 'text-foreground'}`}>{item.text}</span>
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
            <button key={item.id} onClick={() => toggle(item.id)} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-card pill-shape shadow-soft text-left">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${item.packed ? 'bg-primary border-primary' : 'border-foreground/15'}`}>{item.packed && <Check size={12} className="text-primary-foreground" />}</div>
              <span className={`font-body text-sm ${item.packed ? 'line-through text-foreground/35' : 'text-foreground'}`}>{item.text}</span>
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
    <div>
      <DetailHeader title="Notes" onBack={onBack} />
      <div className="space-y-3 mb-6">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Note title..." className="w-full bg-card border border-foreground/5 pill-shape px-4 sm:px-5 py-3.5 text-sm font-body focus:outline-none focus:border-primary" />
        <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Write your note..." rows={3} className="w-full bg-card border border-foreground/5 rounded-2xl px-4 sm:px-5 py-3.5 text-sm font-body focus:outline-none focus:border-primary resize-none" />
        <button onClick={add} className="bg-primary pill-shape px-6 py-3 font-serif text-sm text-primary-foreground shadow-arch">Add Note</button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
            <button onClick={() => remove(item.id)} className="absolute top-4 right-4"><Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" /></button>
            <p className="text-label mb-1">{item.createdAt}</p>
            <h3 className="font-serif text-lg text-foreground mb-1">{item.title}</h3>
            <p className="text-sm text-foreground/60 font-body leading-relaxed">{item.content}</p>
          </div>
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
                <input
                  type="date"
                  value={item.date || ''}
                  onChange={(e) => update(item.id, 'date', e.target.value)}
                  className={inputClass}
                />
                <input
                  type="time"
                  value={item.time || ''}
                  onChange={(e) => update(item.id, 'time', e.target.value)}
                  className={inputClass}
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
  const add = () => {
    setItems([...items, { id: Date.now().toString(), name: '', address: '', checkIn: '', checkInTime: '', checkOut: '', checkOutTime: '', confirmation: '', cost: 0 }]);
  };
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));
  const update = (id: string, field: keyof AccommodationItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
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
              <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Hotel name" className={inputClass} />
              <PlacesAutocomplete value={item.address} onChange={(v) => update(item.id, 'address', v)} onPlaceSelect={(r) => { update(item.id, 'address', r.address); if (r.lat != null) update(item.id, 'lat' as any, r.lat); if (r.lng != null) update(item.id, 'lng' as any, r.lng); }} placeholder="Address (search or type)" className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <input value={item.checkIn} onChange={(e) => update(item.id, 'checkIn', e.target.value)} placeholder="Check-in date (e.g. Sept 15)" className={inputClass} />
                <input value={item.checkInTime} onChange={(e) => update(item.id, 'checkInTime', e.target.value)} placeholder="Check-in time (e.g. 2:00 PM)" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input value={item.checkOut} onChange={(e) => update(item.id, 'checkOut', e.target.value)} placeholder="Check-out date (e.g. Sept 20)" className={inputClass} />
                <input value={item.checkOutTime} onChange={(e) => update(item.id, 'checkOutTime', e.target.value)} placeholder="Check-out time (e.g. 11:00 AM)" className={inputClass} />
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
                <input value={item.time} onChange={(e) => update(item.id, 'time', e.target.value)} placeholder="Date & Time (e.g. Sept 16, 4:00 PM)" className={inputClass} />
                <input value={item.confirmation} onChange={(e) => update(item.id, 'confirmation', e.target.value)} placeholder="Confirmation #" className={inputClass} />
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
                <input value={item.date} onChange={(e) => update(item.id, 'date', e.target.value)} placeholder="Date (e.g. Sept 16)" className={inputClass} />
                <input value={item.time} onChange={(e) => update(item.id, 'time', e.target.value)} placeholder="Time (e.g. 7:30 PM)" className={inputClass} />
              </div>
              <input value={item.notes} onChange={(e) => update(item.id, 'notes', e.target.value)} placeholder="Notes" className={inputClass} />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
              </div>
              <button
                onClick={() => {}}
                className="w-full mt-1 py-2.5 rounded-xl bg-[#d4b5b0] hover:bg-[#c9a8a2] text-white text-sm font-serif tracking-wide transition-colors shadow-soft"
              >
                Save
              </button>
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
const TravelerInfoView = ({ onBack }: { onBack: () => void }) => {
  const [travelers, setTravelers] = useState<TravelerInfo[]>([
    { id: '1', name: '', passportNumber: '', passportExpiry: '', dateOfBirth: '', notes: '' },
    { id: '2', name: '', passportNumber: '', passportExpiry: '', dateOfBirth: '', notes: '' },
  ]);

  const updateTraveler = (id: string, field: keyof TravelerInfo, value: string) => {
    setTravelers(travelers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addTraveler = () => {
    setTravelers([...travelers, { id: Date.now().toString(), name: '', passportNumber: '', passportExpiry: '', dateOfBirth: '', notes: '' }]);
  };

  const removeTraveler = (id: string) => {
    setTravelers(travelers.filter(t => t.id !== id));
  };

  const inputClass = 'w-full bg-card border border-foreground/5 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Traveler Info" onBack={onBack} />
      <div className="space-y-6">
        {travelers.map((traveler) => (
          <div key={traveler.id} className="bg-card rounded-2xl p-4 sm:p-5 shadow-soft relative">
            <button onClick={() => removeTraveler(traveler.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-3">
              <div>
                <label className="text-label mb-1 block">Name</label>
                <input value={traveler.name} onChange={(e) => updateTraveler(traveler.id, 'name', e.target.value)} placeholder="Full name" className={inputClass} />
              </div>
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
              <div>
                <label className="text-label mb-1 block">Date of Birth</label>
                <input value={traveler.dateOfBirth} onChange={(e) => updateTraveler(traveler.id, 'dateOfBirth', e.target.value)} placeholder="MM/DD/YYYY" className={inputClass} />
              </div>
              <div>
                <label className="text-label mb-1 block">Notes</label>
                <textarea value={traveler.notes} onChange={(e) => updateTraveler(traveler.id, 'notes', e.target.value)} placeholder="Allergies, preferences, etc." rows={2} className={`${inputClass} resize-none`} />
              </div>
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
const DetailViewComponent = ({ view, onBack, transportItems, setTransportItems, accommodationItems, setAccommodationItems, activityItems, setActivityItems, reservationItems, setReservationItems }: DetailViewProps) => {
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
      {view === 'packing' && <PackingView onBack={onBack} />}
      {view === 'notes' && <NotesView onBack={onBack} />}
      {view === 'transportation' && <TransportView onBack={onBack} items={transportItems} setItems={setTransportItems} />}
      {view === 'accommodations' && <AccommodationsView onBack={onBack} items={accommodationItems} setItems={setAccommodationItems} />}
      {view === 'activities' && <ActivitiesView onBack={onBack} items={activityItems} setItems={setActivityItems} />}
      {view === 'reservations' && <ReservationsView onBack={onBack} items={reservationItems} setItems={setReservationItems} />}
      {view === 'map' && <MapView onBack={onBack} />}
      {view === 'travelerInfo' && <TravelerInfoView onBack={onBack} />}
    </motion.div>
  );
};

export default DetailViewComponent;
