import { useEffect, useRef, useState, useCallback } from 'react';
import type { AccommodationItem, ActivityItem, ReservationItem } from '@/types/honeymoon';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCc4A2sU57cT4ICbxwqv4f9NP_fgbu-Iyg';

// Desaturated, elegant map style
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

interface CategoryMarker {
  category: 'accommodations' | 'activities' | 'reservations';
  name: string;
  details: string;
  address: string;
}

interface GoogleMapProps {
  destination: string;
  accommodations: AccommodationItem[];
  activities: ActivityItem[];
  reservations: ReservationItem[];
  activeFilter: string | null;
}

// SVG marker for elegant pink pins
function createMarkerIcon(category: string): string {
  const colors: Record<string, string> = {
    accommodations: '#d4a0a0',
    activities: '#c9a0b8',
    reservations: '#b8a0c9',
  };
  const color = colors[category] || '#d4a0a0';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}" opacity="0.85"/>
    <circle cx="14" cy="13" r="5" fill="white" opacity="0.9"/>
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

const GoogleMap = ({ destination, accommodations, activities, reservations, activeFilter }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build marker data from props
  const buildMarkers = useCallback((): CategoryMarker[] => {
    const markers: CategoryMarker[] = [];

    accommodations.forEach(a => {
      markers.push({
        category: 'accommodations',
        name: a.name,
        details: `${a.checkIn} – ${a.checkOut}`,
        address: a.address || a.name,
      });
    });

    activities.forEach(a => {
      markers.push({
        category: 'activities',
        name: a.name,
        details: a.notes || a.time,
        address: a.name,
      });
    });

    reservations.forEach(r => {
      markers.push({
        category: 'reservations',
        name: r.name,
        details: `${r.date} at ${r.time}`,
        address: r.name,
      });
    });

    return markers;
  }, [accommodations, activities, reservations]);

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        setLoaded(true);

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: destination }, (results, status) => {
          if (cancelled || !mapRef.current) return;

          const center = status === 'OK' && results?.[0]
            ? results[0].geometry.location
            : { lat: 36.4618, lng: 25.3753 }; // Default: Santorini

          mapInstance.current = new google.maps.Map(mapRef.current, {
            center,
            zoom: 12,
            styles: mapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
            gestureHandling: 'cooperative',
          });

          infoWindowRef.current = new google.maps.InfoWindow();
          placeMarkers();
        });
      })
      .catch(() => {
        if (!cancelled) setError('Could not load map');
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  // Place / update markers
  const placeMarkers = useCallback(() => {
    if (!mapInstance.current || !loaded) return;

    // Clear existing
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const geocoder = new google.maps.Geocoder();
    const data = buildMarkers();
    const filtered = activeFilter
      ? data.filter(d => d.category === activeFilter)
      : data;

    filtered.forEach((item) => {
      geocoder.geocode({ address: `${item.address}, ${destination}` }, (results, status) => {
        if (status === 'OK' && results?.[0] && mapInstance.current) {
          const marker = new google.maps.Marker({
            map: mapInstance.current,
            position: results[0].geometry.location,
            title: item.name,
            icon: {
              url: createMarkerIcon(item.category),
              scaledSize: new google.maps.Size(28, 36),
            },
            animation: google.maps.Animation.DROP,
          });

          marker.addListener('click', () => {
            if (infoWindowRef.current && mapInstance.current) {
              infoWindowRef.current.setContent(`
                <div style="font-family: serif; padding: 4px 2px; min-width: 140px;">
                  <div style="font-size: 14px; font-weight: 600; color: #5a4a42; margin-bottom: 2px;">${item.name}</div>
                  <div style="font-size: 12px; color: #9e8e82;">${item.details}</div>
                </div>
              `);
              infoWindowRef.current.open(mapInstance.current, marker);
            }
          });

          markersRef.current.push(marker);
        }
      });
    });
  }, [buildMarkers, activeFilter, destination, loaded]);

  // Re-place markers when filter or data changes
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
