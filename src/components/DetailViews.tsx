import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Check, Pencil } from 'lucide-react';
import type { DetailView, TodoItem, BudgetItem, PackingItem, NoteItem, TransportItem, AccommodationItem, ActivityItem, ReservationItem, TravelerInfo } from '@/types/honeymoon';
import { sampleTodos, sampleBudget, samplePacking, sampleNotes, sampleTransport, sampleAccommodations, sampleActivities, sampleReservations } from '@/data/sampleData';

interface DetailViewProps {
  view: DetailView;
  onBack: () => void;
}

const DetailHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <div className="flex items-center gap-4 mb-8">
    <button onClick={onBack} className="p-2 -ml-2">
      <ArrowLeft size={20} strokeWidth={1.5} className="text-foreground/70" />
    </button>
    <h2 className="font-serif text-2xl sm:text-3xl text-foreground">{title}</h2>
  </div>
);

const formatCost = (val: number) => `$${val.toLocaleString()}`;

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
const BudgetView = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<BudgetItem[]>(sampleBudget);
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalBudgetOverride, setTotalBudgetOverride] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'estimated' | 'actual' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const totalEst = totalBudgetOverride ?? items.reduce((s, i) => s + i.estimated, 0);
  const totalAct = items.reduce((s, i) => s + i.actual, 0);

  const updateItem = (id: string, field: 'estimated' | 'actual', value: number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const startEdit = (id: string, field: 'estimated' | 'actual', currentValue: number) => {
    setEditingCell({ id, field });
    setEditValue(currentValue.toString());
  };

  const commitEdit = () => {
    if (editingCell) {
      updateItem(editingCell.id, editingCell.field, parseInt(editValue) || 0);
      setEditingCell(null);
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
            value={totalBudgetOverride ?? items.reduce((s, i) => s + i.estimated, 0)}
            onChange={(e) => setTotalBudgetOverride(parseInt(e.target.value) || 0)}
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

      {/* Column headers */}
      <div className="flex items-center justify-between px-4 sm:px-5 pb-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        <span>Category</span>
        <div className="flex gap-6 sm:gap-8">
          <span>Estimated</span>
          <span>Actual</span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 sm:px-5 py-4 bg-card pill-shape shadow-soft">
            <span className="font-serif text-foreground">{item.category}</span>
            <div className="flex gap-4 sm:gap-6 items-center">
              {editingCell?.id === item.id && editingCell.field === 'estimated' ? (
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  autoFocus
                  className="w-20 text-sm text-right bg-transparent border-b border-primary focus:outline-none font-body"
                />
              ) : (
                <button onClick={() => startEdit(item.id, 'estimated', item.estimated)} className="text-sm text-foreground hover:text-primary transition-colors">
                  {formatCost(item.estimated)}
                </button>
              )}
              {editingCell?.id === item.id && editingCell.field === 'actual' ? (
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  autoFocus
                  className="w-20 text-sm text-right bg-transparent border-b border-primary focus:outline-none font-body"
                />
              ) : (
                <button onClick={() => startEdit(item.id, 'actual', item.actual)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {formatCost(item.actual)}
                </button>
              )}
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
const TransportView = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<TransportItem[]>(sampleTransport);
  const add = () => {
    setItems([...items, { id: Date.now().toString(), type: '', details: '', confirmation: '', time: '', cost: 0 }]);
  };
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));
  const update = (id: string, field: keyof TransportItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };
  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Transportation" onBack={onBack} />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
            <button onClick={() => remove(item.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <input value={item.type} onChange={(e) => update(item.id, 'type', e.target.value)} placeholder="Type (Flight, Ferry...)" className={inputClass} />
                <input value={item.confirmation} onChange={(e) => update(item.id, 'confirmation', e.target.value)} placeholder="Confirmation #" className={inputClass} />
              </div>
              <input value={item.details} onChange={(e) => update(item.id, 'details', e.target.value)} placeholder="Details" className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <input value={item.time} onChange={(e) => update(item.id, 'time', e.target.value)} placeholder="Date & Time" className={inputClass} />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                  <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} />
        <span className="font-body">Add transportation</span>
      </button>
    </div>
  );
};

// ── Accommodations ──
const AccommodationsView = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<AccommodationItem[]>(sampleAccommodations);
  const add = () => {
    setItems([...items, { id: Date.now().toString(), name: '', address: '', checkIn: '', checkOut: '', confirmation: '', cost: 0 }]);
  };
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));
  const update = (id: string, field: keyof AccommodationItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };
  const inputClass = 'w-full bg-background border border-foreground/5 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-primary transition-colors';

  return (
    <div>
      <DetailHeader title="Accommodations" onBack={onBack} />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
            <button onClick={() => remove(item.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-2.5">
              <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Hotel name" className={inputClass} />
              <input value={item.address} onChange={(e) => update(item.id, 'address', e.target.value)} placeholder="Address" className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <input value={item.checkIn} onChange={(e) => update(item.id, 'checkIn', e.target.value)} placeholder="Check-in" className={inputClass} />
                <input value={item.checkOut} onChange={(e) => update(item.id, 'checkOut', e.target.value)} placeholder="Check-out" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input value={item.confirmation} onChange={(e) => update(item.id, 'confirmation', e.target.value)} placeholder="Confirmation #" className={inputClass} />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                  <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} />
        <span className="font-body">Add accommodation</span>
      </button>
    </div>
  );
};

// ── Activities ──
const ActivitiesView = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<ActivityItem[]>(sampleActivities);
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
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
            <button onClick={() => remove(item.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-2.5">
              <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Activity name" className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <input value={item.time} onChange={(e) => update(item.id, 'time', e.target.value)} placeholder="Date & Time" className={inputClass} />
                <input value={item.confirmation} onChange={(e) => update(item.id, 'confirmation', e.target.value)} placeholder="Confirmation #" className={inputClass} />
              </div>
              <input value={item.notes} onChange={(e) => update(item.id, 'notes', e.target.value)} placeholder="Notes" className={inputClass} />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} />
        <span className="font-body">Add activity</span>
      </button>
    </div>
  );
};

// ── Reservations ──
const ReservationsView = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<ReservationItem[]>(sampleReservations);
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
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="px-4 sm:px-5 py-5 bg-card rounded-2xl shadow-soft relative">
            <button onClick={() => remove(item.id)} className="absolute top-4 right-4">
              <Trash2 size={14} className="text-foreground/20 hover:text-destructive transition-colors" />
            </button>
            <div className="space-y-2.5">
              <input value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} placeholder="Restaurant / Venue" className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <input value={item.date} onChange={(e) => update(item.id, 'date', e.target.value)} placeholder="Date" className={inputClass} />
                <input value={item.time} onChange={(e) => update(item.id, 'time', e.target.value)} placeholder="Time" className={inputClass} />
              </div>
              <input value={item.confirmation} onChange={(e) => update(item.id, 'confirmation', e.target.value)} placeholder="Confirmation #" className={inputClass} />
              <input value={item.notes} onChange={(e) => update(item.id, 'notes', e.target.value)} placeholder="Notes" className={inputClass} />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">$</span>
                <input type="number" value={item.cost || ''} onChange={(e) => update(item.id, 'cost', parseInt(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-8`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} strokeWidth={1.5} />
        <span className="font-body">Add reservation</span>
      </button>
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
    { id: '1', name: 'Elena', passportNumber: '', passportExpiry: '', dateOfBirth: '', notes: '' },
    { id: '2', name: 'Julian', passportNumber: '', passportExpiry: '', dateOfBirth: '', notes: '' },
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
const DetailViewComponent = ({ view, onBack }: DetailViewProps) => {
  if (!view) return null;
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-background z-30 overflow-y-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 bg-subtle-gradient"
    >
      {view === 'todos' && <TodosView onBack={onBack} />}
      {view === 'budget' && <BudgetView onBack={onBack} />}
      {view === 'packing' && <PackingView onBack={onBack} />}
      {view === 'notes' && <NotesView onBack={onBack} />}
      {view === 'transportation' && <TransportView onBack={onBack} />}
      {view === 'accommodations' && <AccommodationsView onBack={onBack} />}
      {view === 'activities' && <ActivitiesView onBack={onBack} />}
      {view === 'reservations' && <ReservationsView onBack={onBack} />}
      {view === 'map' && <MapView onBack={onBack} />}
      {view === 'travelerInfo' && <TravelerInfoView onBack={onBack} />}
    </motion.div>
  );
};

export default DetailViewComponent;
