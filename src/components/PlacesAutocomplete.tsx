/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useCallback } from 'react';

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

  // Prevent the Google .pac-container from triggering input blur.
  // mousedown fires before blur; preventDefault on it stops the focus shift
  // so Google's click handler can still fire and select the item.
  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault();

    const attach = () => {
      const pac = document.querySelector('.pac-container');
      if (pac && !pac.dataset.blurFixed) {
        pac.addEventListener('mousedown', prevent);
        pac.dataset.blurFixed = '1';
      }
    };

    // Attach immediately if the container already exists
    attach();

    // Also watch for it appearing (or reappearing) in the DOM
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const pac = document.querySelector('.pac-container');
      if (pac) {
        pac.removeEventListener('mousedown', prevent);
        delete pac.dataset.blurFixed;
      }
    };
  }, []);

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
