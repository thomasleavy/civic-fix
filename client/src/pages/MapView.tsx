import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { mapService } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon with different colors based on count
const createCustomIcon = (count: number) => {
  const color = count > 20 ? '#ef4444' : count > 10 ? '#f59e0b' : '#10b981'; // red, amber, green
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">${count}</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const MapView = () => {
  const { isAuthenticated, isBanned } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/civicfix?tab=login', { replace: true });
    } else if (isBanned) {
      navigate('/banned', { replace: true });
    }
  }, [isAuthenticated, isBanned, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['countyStats'],
    queryFn: () => mapService.getCountyStats(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || isBanned) {
    return null;
  }

  const handleMarkerClick = (county: string) => {
    navigate(`/civic-space?county=${encodeURIComponent(county)}`);
  };

  // Center of Ireland
  const irelandCenter: [number, number] = [53.4129, -8.2439];
  const defaultZoom = 7;

  return (
    <div className="h-[calc(100vh-4rem)] relative">
      <MapContainer
        center={irelandCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {!isLoading && data?.counties && data.counties.map((countyData: any) => (
          <Marker
            key={countyData.county}
            position={[countyData.coordinates.lat, countyData.coordinates.lng]}
            icon={createCustomIcon(countyData.totalCount)}
            eventHandlers={{
              click: () => handleMarkerClick(countyData.county),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">{countyData.county}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600 font-semibold">⚠️ Issues:</span>
                    <span>{countyData.issuesCount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-semibold">💡 Suggestions:</span>
                    <span>{countyData.suggestionsCount}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 pt-2 border-t">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-primary-600">{countyData.totalCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleMarkerClick(countyData.county)}
                  className="mt-3 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors text-sm"
                >
                  View Civic Space →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-[1000] max-w-xs border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">County Activity Map</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Click on a marker to view issues and suggestions for that county.
        </p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
            <span className="text-gray-700 dark:text-gray-300">1-10 items</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-gray-800"></div>
            <span className="text-gray-700 dark:text-gray-300">11-20 items</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></div>
            <span className="text-gray-700 dark:text-gray-300">21+ items</span>
          </div>
        </div>
        {isLoading && (
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading county data...</div>
        )}
        {!isLoading && data && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <strong>{data.totalCounties}</strong> counties with public content
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
