'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { locations, paths, getPathCoordinates, type Location } from '@/lib/travel-data';
import L from 'leaflet';
import Image from 'next/image';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Add custom styles for the popup
const customPopupStyle = `
  .leaflet-popup-content-wrapper {
    background: rgba(17, 17, 23, 0.95);
    backdrop-filter: blur(8px);
    border: 2px solid hsl(34, 100%, 65%, 0.2);
  }
  .leaflet-popup-tip {
    background: rgba(17, 17, 23, 0.95);
    border: 2px solid hsl(34, 100%, 65%, 0.2);
  }
  .leaflet-popup-close-button {
    color: hsl(34, 100%, 65%) !important;
  }
`;

// Fix for default marker icons in Next.js
const markerIcon = new Icon({
  iconUrl: '/marker.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export function TravelMap() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapCenter] = useState<LatLngExpression>([20, 0]);
  const [mapZoom] = useState(2);

  useEffect(() => {
    // Fix for map container in Next.js
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/marker.svg',
      iconUrl: '/marker.svg',
      shadowUrl: '/marker-shadow.png',
    });

    // Add custom popup styles
    const style = document.createElement('style');
    style.textContent = customPopupStyle;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="w-full h-[70vh] relative">
      <div className="relative bg-card/30 backdrop-blur-md border-2 border-primary/20 rounded-none overflow-hidden before:absolute before:inset-0 before:border-2 before:border-primary/10 before:m-1 after:absolute after:inset-0 after:border-2 after:border-primary/5 after:m-2">
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="w-full h-full border-2 border-primary/20" />
        </div>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-[70vh] relative z-20"
          attributionControl={false}
          scrollWheelZoom={true}
          dragging={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {/* Travel paths */}
          {paths.map((path, index) => {
            const coordinates = getPathCoordinates(path);
            return (
              <Polyline
                key={`${path.from}-${path.to}`}
                positions={coordinates}
                pathOptions={{
                  color: 'hsl(34, 100%, 65%)',
                  weight: 3,
                  opacity: 0.4,
                  dashArray: '6, 12',
                }}
              />
            );
          })}

          {/* Location markers */}
          {locations.map((location) => (
            <Marker
              key={location.id}
              position={location.coordinates}
              icon={markerIcon}
              eventHandlers={{
                click: () => setSelectedLocation(location),
              }}
            >
              <Popup>
                <div className="font-pixel bg-background/95 backdrop-blur-md border-2 border-primary/20 p-3">
                  <h3 className="text-primary font-bold">{location.name}</h3>
                  <p className="text-xs text-foreground/80">{location.visitDate}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Location details panel */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-6 right-6 w-96 bg-background/95 backdrop-blur-md border-2 border-primary/20 rounded-none shadow-[0_0_15px_rgba(0,0,0,0.3)] before:absolute before:inset-0 before:border-2 before:border-primary/10 before:m-1"
          >
            <div className="relative p-6">
              <button
                onClick={() => setSelectedLocation(null)}
                className="absolute top-4 right-4 w-8 h-8 font-pixel text-primary hover:text-accent transition-colors duration-300"
              >
                ×
              </button>
              <h3 className="text-xl font-pixel text-primary mb-3">{selectedLocation.name}</h3>
              <p className="text-sm text-foreground/80 mb-6 leading-relaxed">{selectedLocation.description}</p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-pixel text-primary/90 mb-3">Activities</h4>
                  <ul className="space-y-2">
                    {selectedLocation.activities.map((activity, i) => (
                      <li key={i} className="flex items-center text-sm text-foreground/80">
                        <span className="inline-block w-2 h-2 bg-primary/50 mr-2" />
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-pixel text-primary/90 mb-3">People Met</h4>
                  <ul className="space-y-2">
                    {selectedLocation.peopleMet.map((person, i) => (
                      <li key={i} className="flex items-center text-sm text-foreground/80">
                        <span className="inline-block w-2 h-2 bg-primary/50 mr-2" />
                        {person}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 