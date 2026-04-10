/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';

// ── Module-level PAC blur fix ─────────────────────────────────────────────────
// Prevents .pac-container mousedown from blurring the input before the click
// registers. Attaches in CAPTURE phase on document so it fires even if a
// PAC item calls stopPropagation internally. Bubble-phase listeners on
// .pac-container are blocked by Google's own internal handlers — capture
// is the only reliable interception point.
const _pacBlurHandler = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest?.('.pac-container')) {
    e.preventDefault();
  }
};

let _pacGuardActive = false;

const _ensurePacBlurFix = () => {
  if (_pacGuardActive) return;
  _pacGuardActive = true;
  // true = capture phase: fires before stopPropagation on inner elements
  document.addEventListener('mousedown', _pacBlurHandler, true);
};
// ─────────────────────────────────────────────────────────────────────────────

interface PlaceResult {
  address: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (result: PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

const PlacesAutocomplete = ({ value, onChange, onPlaceSelect, placeholder = 'Search location...', className }: PlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isReady, setIsReady] = useState(!!window.google?.maps?.places);
  const skipNextChangeRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);

  onChangeRef.current = onChange;
  onPlaceSelectRef.current = onPlaceSelect;

  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        setIsReady(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Start the module-level PAC blur fix (idempotent — safe to call per instance)
  useEffect(() => { _ensurePacBlurFix(); }, []);

  useEffect(() => {
    if (!isReady || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'name', 'geometry', 'place_id'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place) {
        const address = place.formatted_address || place.name || '';
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        
        // Skip the next React onChange since Google already set the input value
        skipNextChangeRef.current = true;
        
        onChangeRef.current(address);
        onPlaceSelectRef.current?.({
          address,
          lat,
          lng,
          placeId: place.place_id,
        });
      }
    });
  }, [isReady]);

  // Sync the input value with React state, but don't fight with Google
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      onChange={(e) => {
        if (skipNextChangeRef.current) {
          skipNextChangeRef.current = false;
          return;
        }
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default PlacesAutocomplete;
