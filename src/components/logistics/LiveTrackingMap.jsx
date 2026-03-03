import { useEffect, useState } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  useMap 
} from "react-leaflet";
import L from 'leaflet';

// --- Custom Icon Logic ---
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const truckIcon = L.divIcon({
  html: `<div class="p-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#004d25" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-primary drop-shadow-lg"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><path d="M15 18H9"/><circle cx="17" cy="18" r="2"/></svg></div>`,
  className: 'bg-transparent',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Helper to recenter map
function RecenterView({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, zoom);
    }
  }, [coords, zoom, map]);
  return null;
}

// --- MAIN COMPONENT ---
// Added 'userLocation' to props
export default function LiveTrackingMap({ selectedShipment, allShipments, onShipmentSelect, userLocation }) {
  const [routeCoords, setRouteCoords] = useState(null);
  const [mapCenter, setMapCenter] = useState([14.65, 121.05]); // Default fallback: Metro Manila
  const [mapZoom, setMapZoom] = useState(11);

  // Effect: Recenter map on User Location when it loads (if no shipment is selected)
  useEffect(() => {
    if (userLocation && !selectedShipment) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation, selectedShipment]);

  // Calculate route when a shipment is selected OR user location changes
  useEffect(() => {
    // Validation: If no valid shipment selected, clear the route
    if (!selectedShipment || !selectedShipment.location || selectedShipment.location[0] == null || selectedShipment.location[1] == null) {
      setRouteCoords(null); 
      return;
    }

    const fetchRoute = async () => {
      // Define Start (Logistics HQ) and End (Shipment Location)
      // Use userLocation if available, otherwise fallback
      const startCoords = userLocation 
        ? [userLocation.lat, userLocation.lng] 
        : [14.65, 121.05]; 
        
      const endCoords = selectedShipment.location; 

      // Format for OSRM (Longitude,Latitude)
      const osrmCoords = `${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}`;
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`;

      try {
        const response = await fetch(osrmUrl);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          // Convert OSRM [lng, lat] to Leaflet [lat, lng]
          const leafletCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoords(leafletCoords);
          
          // Recenter map to focus on the truck/destination
          setMapCenter(endCoords); 
          setMapZoom(13);
        }
      } catch (err) {
        console.error("Failed to fetch OSRM route:", err);
      }
    };

    fetchRoute();
  }, [selectedShipment, userLocation]); 

  // Determine current HQ position for rendering marker
  const hqPosition = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [14.65, 121.05];

  return (
    <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Render all trucks */}
      {allShipments.map(shipment => {
        if (shipment.location && shipment.location[0] != null && shipment.location[1] != null && shipment.status !== 'Delivered') {
          return (
            <Marker 
              key={shipment.id} 
              position={shipment.location} 
              icon={truckIcon}
              eventHandlers={{
                click: () => {
                  if (onShipmentSelect) {
                    onShipmentSelect(shipment);
                  }
                },
              }}
            >
              <Popup>
                <strong>ID: {shipment.id}</strong><br />
                Status: {shipment.status}<br />
                Item: {shipment.contents.split(",")[0]}...
              </Popup>
            </Marker>
          );
        }
        return null;
      })}

      {/* Render the Route Line + HQ Marker if a shipment is selected */}
      {routeCoords && (
        <>
          {/* Start Point */}
          <Marker position={hqPosition}>
            <Popup>Logistics HQ (Your Location)</Popup>
          </Marker>
          {/* The Blue Route Line */}
          <Polyline pathOptions={{ color: '#004d25', weight: 6, opacity: 0.8 }} positions={routeCoords} />
        </>
      )}

      {!selectedShipment && userLocation && (
         <Marker position={hqPosition}>
            <Popup>Logistics HQ (Your Location)</Popup>
         </Marker>
      )}

      <RecenterView coords={mapCenter} zoom={mapZoom} />
    </MapContainer>
  );
}