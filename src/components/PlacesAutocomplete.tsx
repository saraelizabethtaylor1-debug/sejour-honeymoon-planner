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

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place) {
      const address = place.formatted_address || place.name || '';
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();
      onChange(address);
      onPlaceSelect?.({
        address,
        lat,
        lng,
        placeId: place.place_id,
      });
    }
  }, [onChange, onPlaceSelect]);

  useEffect(() => {
    if (!isReady || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'name', 'geometry', 'place_id'],
    });

    autocompleteRef.current.addListener('place_changed', handlePlaceChanged);
  }, [isReady, handlePlaceChanged]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default PlacesAutocomplete;
