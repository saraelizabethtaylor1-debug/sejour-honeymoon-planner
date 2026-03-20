/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useCallback } from 'react';
import type { AccommodationItem, ActivityItem, ReservationItem, TransportItem } from '@/types/honeymoon';

declare global {
  interface Window {
    google?: typeof google;
  }
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCc4A2sU57cT4ICbxwqv4f9NP_fgbu-Iyg';

const mapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f1ee' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9e8e82' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1ee' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#e0d6cf' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#c4b5a9' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#f0ebe6' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eae3dc' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#a89888' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#e2ddd6' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ede7e0' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0d8d0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8e0d8' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#ddd4cb' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e0d8d0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d4dce4' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#a0b0c0' }] },
];

// Destination fallback coordinates (no geocoding needed)
const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  'santorini': { lat: 36.3932, lng: 25.4615 },
  'mykonos': { lat: 37.4467, lng: 25.3289 },
  'santorini & mykonos': { lat: 36.8, lng: 25.4 },
};

function getDestinationCenter(destination: string): { lat: number; lng: number } {
  const key = destination.toLowerCase().trim();
  for (const [k, v] of Object.entries(DESTINATION_COORDS)) {
    if (key.includes(k)) return v;
  }
  return { lat: 36.4618, lng: 25.3753 }; // Default Santorini
}

interface CategoryMarker {
  category: 'accommodations' | 'activities' | 'reservations' | 'transportation';
  name: string;
  details: string;
  address: string;
  lat: number;
  lng: number;
}

interface GoogleMapProps {
  destination: string;
  accommodations: AccommodationItem[];
  activities: ActivityItem[];
  reservations: ReservationItem[];
  transportItems?: TransportItem[];
  activeFilter: string | null;
  highlightedItem?: string | null;
}

function createMarkerIcon(category: string, highlighted = false): string {
  const colors: Record<string, string> = {
    accommodations: '#d4a0a0',
    activities: '#c9a0b8',
    reservations: '#b8a0c9',
    transportation: '#a0b8c9',
  };
  const color = colors[category] || '#d4a0a0';
  const size = highlighted ? 36 : 28;
  const innerR = highlighted ? 7 : 5;
  const cy = highlighted ? 15 : 13;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.28)}" viewBox="0 0 ${size} ${Math.round(size * 1.28)}">
    <path d="M${size/2} 0C${size*0.224} 0 0 ${size*0.224} 0 ${size/2}c0 ${Math.round(size*0.375)} ${size/2} ${Math.round(size*0.786)} ${size/2} ${Math.round(size*0.786)}s${size/2}-${Math.round(size*0.411)} ${size/2}-${Math.round(size*0.786)}C${size} ${size*0.224} ${size*0.776} 0 ${size/2} 0z" fill="${color}" opacity="${highlighted ? '1' : '0.85'}"/>
    <circle cx="${size/2}" cy="${cy}" r="${innerR}" fill="white" opacity="0.9"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

const GoogleMap = ({ destination, accommodations, activities, reservations, transportItems = [], activeFilter, highlightedItem }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build markers from items that have lat/lng coordinates
  const buildMarkers = useCallback((): CategoryMarker[] => {
    const markers: CategoryMarker[] = [];

    accommodations.forEach(a => {
      if (a.lat != null && a.lng != null) {
        markers.push({
          category: 'accommodations',
          name: a.name,
          details: `${a.checkIn} – ${a.checkOut}`,
          address: a.address || a.name,
          lat: a.lat,
          lng: a.lng,
        });
      }
    });

    activities.forEach(a => {
      if (a.lat != null && a.lng != null) {
        markers.push({
          category: 'activities',
          name: a.name,
          details: a.notes || a.time,
          address: a.location || a.name,
          lat: a.lat,
          lng: a.lng,
        });
      }
    });

    reservations.forEach(r => {
      if (r.lat != null && r.lng != null) {
        markers.push({
          category: 'reservations',
          name: r.name,
          details: `${r.date} at ${r.time}`,
          address: r.location || r.name,
          lat: r.lat,
          lng: r.lng,
        });
      }
    });

    transportItems.forEach(t => {
      if (t.lat != null && t.lng != null) {
        markers.push({
          category: 'transportation',
          name: t.type || 'Transport',
          details: t.details || t.time,
          address: t.location || '',
          lat: t.lat,
          lng: t.lng,
        });
      }
    });

    return markers;
  }, [accommodations, activities, reservations, transportItems]);

  // Initialize map — no geocoding, use hardcoded destination center
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        setLoaded(true);

        const center = getDestinationCenter(destination);

        mapInstance.current = new google.maps.Map(mapRef.current, {
          center,
          zoom: 11,
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
          gestureHandling: 'cooperative',
        });

        infoWindowRef.current = new google.maps.InfoWindow();
        placeMarkers();
      })
      .catch(() => {
        if (!cancelled) setError('Could not load map');
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  const placeMarkers = useCallback(() => {
    if (!mapInstance.current || !loaded) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const data = buildMarkers();
    const filtered = activeFilter
      ? data.filter(d => d.category === activeFilter)
      : data;

    if (filtered.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    filtered.forEach((item) => {
      const position = { lat: item.lat, lng: item.lng };
      const isHighlighted = highlightedItem === item.name;

      const marker = new google.maps.Marker({
        map: mapInstance.current!,
        position,
        title: item.name,
        icon: {
          url: createMarkerIcon(item.category, isHighlighted),
          scaledSize: new google.maps.Size(isHighlighted ? 36 : 28, isHighlighted ? 46 : 36),
        },
        animation: google.maps.Animation.DROP,
        zIndex: isHighlighted ? 999 : 1,
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current && mapInstance.current) {
          infoWindowRef.current.setContent(`
            <div style="font-family: serif; padding: 6px 4px; min-width: 160px;">
              <div style="font-size: 14px; font-weight: 600; color: #5a4a42; margin-bottom: 3px;">${item.name}</div>
              <div style="font-size: 11px; color: #b09888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">${item.category}</div>
              <div style="font-size: 12px; color: #9e8e82;">${item.details}</div>
              <div style="font-size: 11px; color: #a89888; margin-top: 2px;">${item.address}</div>
            </div>
          `);
          infoWindowRef.current.open(mapInstance.current, marker);
        }
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit bounds to show all markers
    if (filtered.length > 1) {
      mapInstance.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else if (filtered.length === 1) {
      mapInstance.current.setCenter({ lat: filtered[0].lat, lng: filtered[0].lng });
      mapInstance.current.setZoom(14);
    }
  }, [buildMarkers, activeFilter, loaded, highlightedItem]);

  useEffect(() => {
    if (loaded && mapInstance.current) {
      placeMarkers();
    }
  }, [activeFilter, placeMarkers, loaded]);

  if (error) {
    return (
      <div className="w-full h-full rounded-2xl bg-accent/40 border border-border flex items-center justify-center text-foreground/40 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{ minHeight: 200 }}
    />
  );
};

export default GoogleMap;
