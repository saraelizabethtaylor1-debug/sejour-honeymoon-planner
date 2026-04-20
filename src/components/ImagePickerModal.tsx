import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Search, Loader2 } from 'lucide-react';

interface ImagePickerModalProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
}

type Tab = 'upload' | 'search';

const ImagePickerModal = ({ onSelect, onClose }: ImagePickerModalProps) => {
  const [tab, setTab] = useState<Tab>('upload');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      onSelect(url);
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = async () => {
  if (!query.trim()) return;
  setSearching(true);
  setSearchError(null);
  setResults([]);
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    // Step 1: Find places matching the search query
    const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.photos,places.displayName'
      },
      body: JSON.stringify({ textQuery: query })
    });
    if (!searchRes.ok) throw new Error(`Search failed (${searchRes.status})`);
    const searchData = await searchRes.json();
    const places = searchData.places ?? [];

    // Step 2: Collect photo URLs from results
    const photoUrls: string[] = [];
    for (const place of places.slice(0, 4)) {
      const photos = place.photos ?? [];
      for (const photo of photos.slice(0, 3)) {
        photoUrls.push(
          `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=false&key=${apiKey}`
        );
      }
    }

    if (photoUrls.length === 0) setSearchError('No results found. Try a different search.');
    setResults(photoUrls);
  } catch (err: any) {
    setSearchError(err.message ?? 'Search failed. Please try again.');
  } finally {
    setSearching(false);
  }
};

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ backgroundColor: 'hsl(0 8% 12% / 0.5)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[560px] rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'hsl(30 20% 97%)', boxShadow: '0 24px 64px -12px hsl(0 16% 20% / 0.2)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-foreground/[0.06]">
            <h2 className="font-serif text-xl" style={{ color: '#52210e', letterSpacing: '0.04em' }}>Choose a Photo</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors">
              <X size={18} strokeWidth={1.5} className="text-foreground/40" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 px-6 pt-4">
            {(['upload', 'search'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative pb-3 pr-6 font-serif text-sm transition-colors"
                style={{ color: tab === t ? '#52210e' : 'hsl(0 8% 50%)' }}
              >
                {t === 'upload' ? 'Upload Photo' : 'Search Google'}
                {tab === t && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-6 h-[2px] rounded-full"
                    style={{ backgroundColor: '#52210e' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {tab === 'upload' && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 transition-colors hover:border-[#52210e]/40 hover:bg-[#52210e]/[0.03]"
                  style={{ borderColor: 'hsl(0 16% 75%)' }}
                >
                  <Upload size={24} strokeWidth={1.2} style={{ color: '#52210e' }} />
                  <span className="font-serif text-sm" style={{ color: '#52210e' }}>Click to choose a file</span>
                  <span className="font-body text-xs text-foreground/35">JPG, PNG, WEBP supported</span>
                </button>
              </div>
            )}

            {tab === 'search' && (
              <div>
                {/* Search bar */}
                <div className="flex gap-2 mb-5">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for images…"
                    className="flex-1 bg-white border border-foreground/10 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none focus:border-[#52210e]/40 transition-colors"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !query.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-serif transition-colors disabled:opacity-40"
                    style={{ backgroundColor: '#52210e', color: 'hsl(30 20% 97%)' }}
                  >
                    {searching ? <Loader2 size={15} strokeWidth={1.5} className="animate-spin" /> : <Search size={15} strokeWidth={1.5} />}
                    Search
                  </button>
                </div>

                {/* Results */}
                {searchError && (
                  <p className="text-center font-body text-sm text-foreground/40 py-6">{searchError}</p>
                )}
                {!searchError && results.length === 0 && !searching && (
                  <p className="text-center font-body text-sm text-foreground/30 py-6">Enter a search term above</p>
                )}
                {searching && (
                  <div className="flex justify-center py-8">
                    <Loader2 size={22} strokeWidth={1.3} className="animate-spin text-foreground/30" />
                  </div>
                )}
                {results.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {results.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => onSelect(url)}
                        className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#52210e] transition-all"
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImagePickerModal;
