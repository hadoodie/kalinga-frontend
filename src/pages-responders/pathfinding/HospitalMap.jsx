import React, { useEffect, useRef, useState, useCallback } from "react";
import { KALINGA_CONFIG } from "../../constants/mapConfig";
import { useAuth } from "../../context/AuthContext";
import ResponderTopbar from "../../components/responder/Topbar";
import ResponderSidebar from "../../components/responder/Sidebar";

export default function HospitalMap() {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [blockades, setBlockades] = useState([]);
  const [selectedTab, setSelectedTab] = useState("hospitals");
  const [blockadeMarkers, setBlockadeMarkers] = useState([]);
  const [hospitalMarkers, setHospitalMarkers] = useState([]);
  const [routeLine, setRouteLine] = useState(null);
  const [destMarker, setDestMarker] = useState(null);
  const [blockadeReportingMode, setBlockadeReportingMode] = useState(false);
  const [selectedBlockadeLocation, setSelectedBlockadeLocation] =
    useState(null);
  const [blockadeForm, setBlockadeForm] = useState({
    title: "",
    description: "",
    severity: "medium",
  });
  const [currentLocationDisplay, setCurrentLocationDisplay] = useState(
    "Getting location..."
  );
  const [hospitalsWithDistance, setHospitalsWithDistance] = useState([]);
  const [locationWatchId, setLocationWatchId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);

  // Mobile bottom interface states
  const [showHospitalsList, setShowHospitalsList] = useState(false);
  const [showBlockadesList, setShowBlockadesList] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);

  // Navigation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [routeInstructions, setRouteInstructions] = useState([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [distanceToNextTurn, setDistanceToNextTurn] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [orientationWatchId, setOrientationWatchId] = useState(null);
  const [highAccuracyWatchId, setHighAccuracyWatchId] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Predefined hospitals in Metro Manila
  const HOSPITALS = [
    {
      name: "Fatima University Medical Center",
      lat: 14.65891,
      lng: 120.98032,
      address: "Valenzuela City",
      phone: "(02) 292-7371",
      emergency: true,
      services: ["Emergency", "Surgery", "ICU", "Cardiology"],
    },
    {
      name: "Dr. Jose N. Rodriguez Memorial Hospital",
      lat: 14.64234,
      lng: 120.96789,
      address: "Caloocan City",
      phone: "(02) 362-5555",
      emergency: true,
      services: ["Emergency", "Trauma", "Pediatrics", "Maternity"],
    },
    {
      name: "Valenzuela City General Hospital",
      lat: 14.67123,
      lng: 120.98456,
      address: "Valenzuela City",
      phone: "(02) 293-2222",
      emergency: true,
      services: ["Emergency", "Surgery", "Internal Medicine"],
    },
    {
      name: "Metro North Medical Center",
      lat: 14.66789,
      lng: 120.97234,
      address: "Caloocan City",
      phone: "(02) 364-7777",
      emergency: true,
      services: ["Emergency", "Orthopedics", "Neurology", "ICU"],
    },
    {
      name: "Caloocan City Medical Center",
      lat: 14.63456,
      lng: 120.96123,
      address: "Caloocan City",
      phone: "(02) 361-8888",
      emergency: true,
      services: ["Emergency", "General Surgery", "OB-Gyne"],
    },
    {
      name: "St. Mary's Hospital Valenzuela",
      lat: 14.67891,
      lng: 120.99567,
      address: "Valenzuela City",
      phone: "(02) 294-3333",
      emergency: true,
      services: ["Emergency", "Cardiology", "Pulmonology", "ICU"],
    },
    {
      name: "Quirino Memorial Medical Center",
      lat: 14.63789,
      lng: 121.00234,
      address: "Quezon City",
      phone: "(02) 743-4141",
      emergency: true,
      services: ["Emergency", "Trauma", "Burn Unit", "ICU"],
    },
    {
      name: "Marulas Medical Center",
      lat: 14.65234,
      lng: 120.97789,
      address: "Valenzuela City",
      phone: "(02) 292-9999",
      emergency: true,
      services: ["Emergency", "Surgery", "Pediatrics", "Dialysis"],
    },
  ];

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    // Prevent double initialization
    if (map) return;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Check if map container is already initialized
      if (mapRef.current && mapRef.current._leaflet_id) {
        return;
      }

      // Initialize Leaflet map
      const leafletMap = L.map(mapRef.current, {
        center: [
          KALINGA_CONFIG.DEFAULT_LOCATION.lat,
          KALINGA_CONFIG.DEFAULT_LOCATION.lng,
        ],
        zoom: KALINGA_CONFIG.DEFAULT_ZOOM,
        zoomControl: true,
        maxBounds: KALINGA_CONFIG.PHILIPPINES_BOUNDS,
        maxBoundsViscosity: 1.0,
      });

      // Use CartoDB tiles for better visibility
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 18,
          minZoom: 6,
          subdomains: "abcd",
        }
      ).addTo(leafletMap);

      // Add road labels overlay
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
        {
          attribution: "",
          maxZoom: 18,
          minZoom: 6,
          subdomains: "abcd",
        }
      ).addTo(leafletMap);

      setMap(leafletMap);

      // Get user location
      getUserLocation(leafletMap, L);

      // Load hospitals and blockades
      loadHospitals(leafletMap, L);
      fetchRoadBlockades(leafletMap, L);
    });

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
      // Clear location watch if it exists
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, []);

  // Handle map click events for blockade reporting
  useEffect(() => {
    if (!map) return;

    const handleMapClick = async (e) => {
      if (blockadeReportingMode) {
        const L = await import("leaflet");
        handleMapClickForBlockade(e, L);
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, blockadeReportingMode]);

  // Device orientation tracking for navigation mode
  useEffect(() => {
    if (!isNavigating || !map) return;

    const requestOrientationPermission = async () => {
      // For iOS devices, request permission for device orientation
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission !== "granted") {
            console.warn("Device orientation permission not granted");
            return false;
          }
        } catch (error) {
          console.warn(
            "Error requesting device orientation permission:",
            error
          );
          return false;
        }
      }
      return true;
    };

    const handleDeviceOrientation = (event) => {
      let heading = 0;

      // Get compass heading based on device capabilities
      if (event.webkitCompassHeading !== undefined) {
        // iOS Safari
        heading = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Android and other browsers
        heading = 360 - event.alpha;
      }

      setDeviceHeading(heading);

      // Leaflet doesn't support setBearing (Mapbox GL feature)
      // User marker rotation handles orientation instead
    };

    const startOrientationTracking = async () => {
      const hasPermission = await requestOrientationPermission();
      if (hasPermission) {
        window.addEventListener("deviceorientation", handleDeviceOrientation);
        setOrientationWatchId(true); // Track that we're listening
      }
    };

    startOrientationTracking();

    return () => {
      if (orientationWatchId) {
        window.removeEventListener(
          "deviceorientation",
          handleDeviceOrientation
        );
        setOrientationWatchId(null);
      }
    };
  }, [isNavigating, map, userLocation]);

  const getUserLocation = (leafletMap, L) => {
    // Helper function to save location to localStorage
    const saveLocationToStorage = (location) => {
      try {
        localStorage.setItem(
          KALINGA_CONFIG.LOCATION_STORAGE_KEY,
          JSON.stringify({
            lat: location.lat,
            lng: location.lng,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.warn("Failed to save location to localStorage:", error);
      }
    };

    // Helper function to get last known location from localStorage
    const getLastKnownLocation = () => {
      try {
        const saved = localStorage.getItem(KALINGA_CONFIG.LOCATION_STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          // Return saved location if it's less than 24 hours old
          if (
            Date.now() - data.timestamp <
            KALINGA_CONFIG.LOCATION_EXPIRY_HOURS * 60 * 60 * 1000
          ) {
            return { lat: data.lat, lng: data.lng };
          }
        }
      } catch (error) {
        console.warn("Failed to retrieve saved location:", error);
      }
      return null;
    };

    if (navigator.geolocation) {
      // Use watchPosition for continuous tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setUserLocation(location);

          // Save current location to localStorage
          saveLocationToStorage(location);

          if (leafletMap) {
            // Update location display
            updateLocationDisplay(latitude, longitude);

            // Update hospital distances
            updateHospitalDistances(location);

            // Remove previous user marker
            if (userMarker) {
              leafletMap.removeLayer(userMarker);
            }

            // Add/update user marker with pulsing animation
            const newUserMarker = L.marker([latitude, longitude], {
              icon: L.divIcon({
                html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
                className: "user-location-marker",
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              }),
            }).addTo(leafletMap);

            setUserMarker(newUserMarker);

            // Only center map on first location fix
            if (!userLocation) {
              leafletMap.setView(
                [latitude, longitude],
                KALINGA_CONFIG.USER_LOCATION_ZOOM
              );
            }
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = "Unable to retrieve your location";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }

          // Try to use last known location first
          const lastKnown = getLastKnownLocation();
          if (lastKnown) {
            setUserLocation(lastKnown);
            setCurrentLocationDisplay(
              `Last known location (${errorMessage})\n${lastKnown.lat.toFixed(
                6
              )}, ${lastKnown.lng.toFixed(6)}`
            );
            updateHospitalDistances(lastKnown);
            if (leafletMap && L) {
              // Create marker for last known location (yellow)
              const lastKnownMarker = L.marker([lastKnown.lat, lastKnown.lng], {
                icon: L.divIcon({
                  html: `<div class="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow-lg"></div>`,
                  className: "last-known-location-marker",
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                }),
              }).addTo(leafletMap);

              setUserMarker(lastKnownMarker);
              leafletMap.setView(
                [lastKnown.lat, lastKnown.lng],
                KALINGA_CONFIG.USER_LOCATION_ZOOM
              );
            }
          } else {
            // Use default TUP Manila location for testing
            setCurrentLocationDisplay("Default location (TUP Manila)");
            const fallback = KALINGA_CONFIG.DEFAULT_LOCATION;
            setUserLocation(fallback);
            updateHospitalDistances(fallback);
            if (leafletMap && L) {
              // Create marker for default location (gray)
              const defaultMarker = L.marker([fallback.lat, fallback.lng], {
                icon: L.divIcon({
                  html: `<div class="w-4 h-4 bg-gray-500 rounded-full border-2 border-white shadow-lg"></div>`,
                  className: "default-location-marker",
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                }),
              }).addTo(leafletMap);

              setUserMarker(defaultMarker);
              leafletMap.setView(
                [fallback.lat, fallback.lng],
                KALINGA_CONFIG.DEFAULT_LOCATION.zoom
              );
            }
          }
        },
        {
          enableHighAccuracy: true, // Use GPS if available
          maximumAge: 10000, // Use cached position if less than 10 seconds old
          timeout: 15000, // Wait up to 15 seconds for a position
        }
      );

      // Store watch ID for cleanup
      setLocationWatchId(watchId);
    } else {
      // Try to use last known location first
      const lastKnown = getLastKnownLocation();
      if (lastKnown) {
        setUserLocation(lastKnown);
        setCurrentLocationDisplay(
          `Last known location (Geolocation not supported)\n${lastKnown.lat.toFixed(
            6
          )}, ${lastKnown.lng.toFixed(6)}`
        );
        updateHospitalDistances(lastKnown);
        if (leafletMap) {
          // Import Leaflet to create marker for last known location
          import("leaflet").then((L) => {
            const lastKnownMarker = L.default.marker(
              [lastKnown.lat, lastKnown.lng],
              {
                icon: L.default.divIcon({
                  html: `<div class="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow-lg"></div>`,
                  className: "last-known-location-marker",
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                }),
              }
            ).addTo(leafletMap);

            setUserMarker(lastKnownMarker);
          });

          leafletMap.setView(
            [lastKnown.lat, lastKnown.lng],
            KALINGA_CONFIG.USER_LOCATION_ZOOM
          );
        }
      } else {
        // Use default TUP Manila location (Geolocation not supported)
        const fallback = KALINGA_CONFIG.DEFAULT_LOCATION;
        setUserLocation(fallback);
        setCurrentLocationDisplay(
          "TUP Manila (Default - Geolocation not supported)"
        );
        updateHospitalDistances(fallback);
        if (leafletMap) {
          // Import Leaflet to create marker for default location
          import("leaflet").then((L) => {
            const defaultMarker = L.default.marker(
              [fallback.lat, fallback.lng],
              {
                icon: L.default.divIcon({
                  html: `<div class="w-4 h-4 bg-gray-500 rounded-full border-2 border-white shadow-lg"></div>`,
                  className: "default-location-marker",
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                }),
              }
            ).addTo(leafletMap);

            setUserMarker(defaultMarker);
          });

          leafletMap.setView(
            [fallback.lat, fallback.lng],
            KALINGA_CONFIG.DEFAULT_LOCATION.zoom
          );
        }
      }
    }
  };

  const updateLocationDisplay = async (lat, lng) => {
    const coordsText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setCurrentLocationDisplay(`Getting address...\n${coordsText}`);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data.display_name) {
        const addr = data.address || {};
        let shortAddress = "";

        if (addr.house_number && addr.road) {
          shortAddress = `${addr.house_number} ${addr.road}`;
        } else if (addr.road) {
          shortAddress = addr.road;
        } else if (addr.neighbourhood || addr.suburb) {
          shortAddress = addr.neighbourhood || addr.suburb;
        }

        if (addr.city || addr.municipality) {
          shortAddress += shortAddress
            ? `, ${addr.city || addr.municipality}`
            : addr.city || addr.municipality;
        }

        setCurrentLocationDisplay(
          `${
            shortAddress || data.display_name.split(",").slice(0, 2).join(",")
          }\n${coordsText}`
        );
      }
    } catch (error) {
      console.log("Reverse geocoding failed:", error);
      setCurrentLocationDisplay(`Address lookup failed\n${coordsText}`);
    }
  };

  const updateHospitalDistances = (userLoc) => {
    const hospitalsWithDist = HOSPITALS.map((hospital) => {
      const distance = calculateDistance(
        userLoc.lat,
        userLoc.lng,
        hospital.lat,
        hospital.lng
      );
      return { ...hospital, distance };
    }).sort((a, b) => a.distance - b.distance);

    setHospitalsWithDistance(hospitalsWithDist);
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const loadHospitals = (leafletMap, L) => {
    if (!leafletMap || !L) return;

    // Clear existing hospital markers
    hospitalMarkers.forEach((marker) => leafletMap.removeLayer(marker));

    const newMarkers = [];
    HOSPITALS.forEach((hospital) => {
      // Create custom green hospital icon
      const hospitalIcon = L.divIcon({
        className: "hospital-marker",
        html: `
                    <div style="
                        background: #28a745;
                        color: white;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 16px;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    ">🏥</div>
                `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([hospital.lat, hospital.lng], {
        icon: hospitalIcon,
      }).addTo(leafletMap);

      marker.bindPopup(`
                <div style="min-width: 250px;">
                    <h4 style="margin: 0 0 8px 0; color: #28a745; font-weight: bold;">${
                      hospital.name
                    }</h4>
                    <p style="margin: 0 0 4px 0;"><strong>📍 Address:</strong> ${
                      hospital.address
                    }</p>
                    <p style="margin: 0 0 4px 0;"><strong>📞 Phone:</strong> ${
                      hospital.phone
                    }</p>
                    <p style="margin: 0 0 8px 0;"><strong>🚨 Emergency:</strong> ${
                      hospital.emergency ? "Available 24/7" : "Limited hours"
                    }</p>
                    <div style="margin-bottom: 8px;">
                        <strong>🏥 Services:</strong><br>
                        ${hospital.services
                          .map(
                            (service) =>
                              `<span style="background: #e8f5e8; padding: 2px 6px; margin: 2px; border-radius: 10px; font-size: 11px; display: inline-block;">${service}</span>`
                          )
                          .join("")}
                    </div>
                    <button onclick="getDirectionsToHospital(${hospital.lat}, ${
        hospital.lng
      })" 
                            style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%; margin-top: 4px;">
                        🗺️ Get Directions
                    </button>
                </div>
            `);

      newMarkers.push(marker);
    });

    setHospitalMarkers(newMarkers);
  };

  // Debounced fetch for blockades to reduce API calls
  const debounceTimerRef = useRef(null);
  const debouncedFetchBlockades = useCallback((leafletMap, L) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchRoadBlockades(leafletMap, L);
    }, 500); // Wait 500ms after map stops moving
  }, []);

  const fetchRoadBlockades = async (leafletMap, L) => {
    try {
      let url = `${KALINGA_CONFIG.API_BASE_URL}/api/road-blockades`;
      if (leafletMap) {
        const bounds = leafletMap.getBounds();
        const params = new URLSearchParams({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
        url += `?${params}`;
      }

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        console.warn("Blockades unavailable:", response.status);
        setBlockades([]);
        return;
      }

      const data = await response.json();
      setBlockades(Array.isArray(data) ? data : []);
      displayBlockadesOnMap(data, leafletMap, L);
    } catch (error) {
      console.warn("Blockades temporarily unavailable");
      setBlockades([]);
    }
  };

  const displayBlockadesOnMap = (blockadeData, leafletMap, L) => {
    if (!leafletMap || !L) return;

    // Clear existing blockade markers
    blockadeMarkers.forEach((marker) => leafletMap.removeLayer(marker));

    const severityColors = {
      low: "#28a745",
      medium: "#ffc107",
      high: "#fd7e14",
      critical: "#dc3545",
    };

    const newMarkers = [];
    blockadeData.forEach((blockade) => {
      const marker = L.circleMarker(
        [parseFloat(blockade.start_lat), parseFloat(blockade.start_lng)],
        {
          radius: 10,
          color: severityColors[blockade.severity] || "#dc3545",
          weight: 3,
          fillColor: severityColors[blockade.severity] || "#dc3545",
          fillOpacity: 0.7,
        }
      ).addTo(leafletMap);

      marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #2c3e50;">${
                      blockade.title
                    }</h4>
                    <p style="margin: 0 0 4px 0;"><strong>Road:</strong> ${
                      blockade.road_name
                    }</p>
                    <p style="margin: 0 0 4px 0;"><strong>Severity:</strong> 
                        <span style="color: ${
                          severityColors[blockade.severity]
                        }; font-weight: bold;">
                            ${blockade.severity.toUpperCase()}
                        </span>
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 12px;">${
                      blockade.description
                    }</p>
                    <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">
                        <strong>Reported by:</strong> ${
                          blockade.reported_by || "Unknown"
                        }
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #666;">
                        ${blockade.reported_at_human || "Unknown time"}
                    </p>
                    <button onclick="removeBlockadeHandler(${blockade.id}, '${
        blockade.title
      }')" 
                            style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; width: 100%;">
                        🗑️ Remove Blockade
                    </button>
                </div>
            `);

      newMarkers.push(marker);
    });

    setBlockadeMarkers(newMarkers);
  };

  const findNearestHospital = () => {
    if (!userLocation || hospitalsWithDistance.length === 0) {
      alert("User location not available or no hospitals loaded.");
      return;
    }

    const nearest = hospitalsWithDistance[0];

    // Ask user if they want to start navigation
    const startNavigation = window.confirm(
      `Nearest hospital: ${nearest.name}\nDistance: ${nearest.distance.toFixed(
        2
      )} km\nAddress: ${nearest.address}\n\nStart turn-by-turn navigation?`
    );

    // Draw route to nearest hospital
    drawRoute(nearest.lat, nearest.lng, true, startNavigation);

    // Fly to hospital if not navigating
    if (!startNavigation && map) {
      map.flyTo([nearest.lat, nearest.lng], 16, {
        animate: true,
        duration: 1.5,
      });
    }
  };

  // Function to clear all routes and destination markers
  const clearAllRoutes = () => {
    if (map) {
      if (routeLine) {
        map.removeLayer(routeLine);
        setRouteLine(null);
      }
      if (destMarker) {
        map.removeLayer(destMarker);
        setDestMarker(null);
      }
    }
  };

  const drawRoute = async (
    destLat,
    destLng,
    isNearest = false,
    enableNavigation = false
  ) => {
    if (!userLocation || !map || isDrawingRoute) return;

    // Set drawing state to prevent concurrent route requests
    setIsDrawingRoute(true);

    try {
      // Clear all existing routes first
      clearAllRoutes();

      // Import Leaflet for markers
      const L = await import("leaflet");

      const newDestMarker = L.default
        .marker([destLat, destLng])
        .addTo(map)
        .bindPopup("Hospital Destination")
        .openPopup();
      setDestMarker(newDestMarker);

      // Fetch all active blockades for route optimization
      const blockadeResponse = await fetch(
        `${KALINGA_CONFIG.API_BASE_URL}/api/road-blockades`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const blockades = await blockadeResponse.json();

      // Enhanced OSRM query with step details for navigation
      const baseUrl = `${KALINGA_CONFIG.OSRM_SERVER}/route/v1/driving/${userLocation.lng},${userLocation.lat};${destLng},${destLat}`;
      const params = enableNavigation
        ? "?overview=full&geometries=geojson&steps=true&annotations=true"
        : "?overview=full&geometries=geojson";

      const url = baseUrl + params;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((c) => [c[1], c[0]]);

        // Store route coordinates for navigation
        setRouteCoordinates(coords);

        // Check if route passes through any blockades
        let routePassesThroughBlockade = false;
        let blockingBlockade = null;

        for (const blockade of blockades) {
          const blockadeLat = parseFloat(blockade.start_lat);
          const blockadeLng = parseFloat(blockade.start_lng);

          // Check if any route point is near this blockade (within ~100m)
          for (const coord of coords) {
            const distance = calculateDistance(
              coord[0],
              coord[1],
              blockadeLat,
              blockadeLng
            );
            if (distance < 0.1) {
              // Within 100 meters
              routePassesThroughBlockade = true;
              blockingBlockade = blockade;
              break;
            }
          }
          if (routePassesThroughBlockade) break;
        }

        if (!routePassesThroughBlockade) {
          // Clear route - no blockades
          const lineColor = isNearest ? "#28a745" : "#007bff";
          const newRouteLine = L.default
            .polyline(coords, { color: lineColor, weight: 5 })
            .addTo(map);
          setRouteLine(newRouteLine);

          // If navigation is enabled, process turn-by-turn instructions
          if (
            enableNavigation &&
            route.legs &&
            route.legs[0] &&
            route.legs[0].steps
          ) {
            const instructions = processRouteInstructions(route.legs[0].steps);
            setRouteInstructions(instructions);
            setCurrentInstructionIndex(0);

            if (instructions.length > 0) {
              setCurrentInstruction(instructions[0]);
              setDistanceToNextTurn(instructions[0].distance);
            }

            // Enable navigation mode
            setIsNavigating(true);

            // Start high-accuracy location tracking for navigation
            startNavigationTracking();
          } else {
            // Regular route display mode
            map.fitBounds(newRouteLine.getBounds(), {
              padding: [50, 50],
            });
          }
        } else {
          // Try to reroute around blockade
          const detourLat = parseFloat(blockingBlockade.start_lat) + 0.001;
          const detourLng = parseFloat(blockingBlockade.start_lng) + 0.001;
          const detourParams = enableNavigation
            ? "?overview=full&geometries=geojson&steps=true&annotations=true"
            : "?overview=full&geometries=geojson";
          const detourUrl = `${KALINGA_CONFIG.OSRM_SERVER}/route/v1/driving/${userLocation.lng},${userLocation.lat};${detourLng},${detourLat};${destLng},${destLat}${detourParams}`;

          try {
            const detourResponse = await fetch(detourUrl);
            const detourData = await detourResponse.json();

            if (detourData.routes && detourData.routes.length > 0) {
              const detourRoute = detourData.routes[0];
              const detourCoords = detourRoute.geometry.coordinates.map((c) => [
                c[1],
                c[0],
              ]);
              const lineColor = isNearest ? "#28a745" : "#ff9800";
              const newRouteLine = L.default
                .polyline(detourCoords, {
                  color: lineColor,
                  weight: 5,
                  dashArray: "10,10",
                })
                .addTo(map);
              setRouteLine(newRouteLine);

              // Store route coordinates for navigation
              setRouteCoordinates(detourCoords);

              // If navigation is enabled, process turn-by-turn instructions for detour
              if (
                enableNavigation &&
                detourRoute.legs &&
                detourRoute.legs[0] &&
                detourRoute.legs[0].steps
              ) {
                const instructions = processRouteInstructions(
                  detourRoute.legs[0].steps
                );
                setRouteInstructions(instructions);
                setCurrentInstructionIndex(0);

                if (instructions.length > 0) {
                  setCurrentInstruction(instructions[0]);
                  setDistanceToNextTurn(instructions[0].distance);
                }

                // Enable navigation mode
                setIsNavigating(true);

                // Start high-accuracy location tracking for navigation
                startNavigationTracking();
              } else {
                map.fitBounds(newRouteLine.getBounds(), {
                  padding: [50, 50],
                });
              }

              alert("Blockade detected on route! Rerouted to avoid blockade.");
            } else {
              alert("No available detour route found.");
            }
          } catch (detourError) {
            console.error("Error fetching detour route:", detourError);
            alert("Error calculating detour route.");
          }
        }
      } else {
        alert("No route found.");
      }
    } catch (error) {
      console.error("Error drawing route:", error);
      alert("Error fetching route.");
    } finally {
      // Always reset drawing state
      setIsDrawingRoute(false);
    }
  };

  // Process OSRM route steps into turn-by-turn instructions
  const processRouteInstructions = (steps) => {
    return steps.map((step, index) => {
      const maneuver = step.maneuver;
      let instruction = "";
      let icon = "➡️";

      // Convert OSRM maneuver types to readable instructions
      switch (maneuver.type) {
        case "depart":
          instruction = `Head ${getDirection(maneuver.bearing_after)} on ${
            step.name || "the road"
          }`;
          icon = "🚀";
          break;
        case "turn":
          const direction = maneuver.modifier;
          instruction = `Turn ${direction} onto ${step.name || "the road"}`;
          icon = direction.includes("left") ? "⬅️" : "➡️";
          break;
        case "merge":
          instruction = `Merge ${maneuver.modifier || ""} onto ${
            step.name || "the road"
          }`;
          icon = "🔀";
          break;
        case "ramp":
          instruction = `Take the ramp ${maneuver.modifier || ""} onto ${
            step.name || "the highway"
          }`;
          icon = "🛣️";
          break;
        case "roundabout":
          instruction = `Take the ${getOrdinal(
            maneuver.exit || 1
          )} exit at the roundabout onto ${step.name || "the road"}`;
          icon = "🔄";
          break;
        case "arrive":
          instruction = "You have arrived at your destination";
          icon = "🏁";
          break;
        default:
          instruction = `Continue on ${step.name || "the road"}`;
          icon = "⬆️";
      }

      return {
        id: index,
        instruction,
        icon,
        distance: Math.round(step.distance),
        duration: Math.round(step.duration),
        coordinates: step.geometry
          ? step.geometry.coordinates.map((c) => [c[1], c[0]])
          : null,
      };
    });
  };

  // Get cardinal direction from bearing
  const getDirection = (bearing) => {
    const directions = [
      "north",
      "northeast",
      "east",
      "southeast",
      "south",
      "southwest",
      "west",
      "northwest",
    ];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  // Get ordinal number for roundabout exits
  const getOrdinal = (num) => {
    const ordinals = [
      "first",
      "second",
      "third",
      "fourth",
      "fifth",
      "sixth",
      "seventh",
      "eighth",
    ];
    return ordinals[num - 1] || `${num}th`;
  };

  // Start high-accuracy GPS tracking for navigation
  const startNavigationTracking = () => {
    if (!navigator.geolocation) return;

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Update user location
        setUserLocation(newLocation);
        updateLocationDisplay(newLocation.lat, newLocation.lng);
        updateHospitalDistances(newLocation);

        // Update navigation progress
        updateNavigationProgress(newLocation);

        // Update user marker on map
        if (map && userMarker) {
          userMarker.setLatLng([newLocation.lat, newLocation.lng]);

          // Keep user centered during navigation
          if (isNavigating) {
            map.setView([newLocation.lat, newLocation.lng], map.getZoom());
          }
        }
      },
      (error) => {
        // Only log permission errors during navigation
        if (error.code === 1) {
          console.warn("Navigation tracking requires location permission");
        }
        // Timeout errors are expected on desktop - no logging needed
      },
      options
    );

    setHighAccuracyWatchId(watchId);
  };

  // Update navigation progress and instructions
  const updateNavigationProgress = (currentLocation) => {
    if (!routeInstructions.length || !routeCoordinates.length) return;

    // Find closest point on route to current location
    let minDistance = Infinity;
    let closestPointIndex = 0;

    routeCoordinates.forEach((coord, index) => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        coord[0],
        coord[1]
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = index;
      }
    });

    // Update current instruction based on progress
    const currentInstruction = routeInstructions[currentInstructionIndex];
    if (currentInstruction && currentInstruction.coordinates) {
      const distanceToTurn =
        calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          currentInstruction.coordinates[0][0],
          currentInstruction.coordinates[0][1]
        ) * 1000; // Convert to meters

      setDistanceToNextTurn(Math.round(distanceToTurn));

      // If we're close to the turn (within 50 meters), advance to next instruction
      if (
        distanceToTurn < 50 &&
        currentInstructionIndex < routeInstructions.length - 1
      ) {
        const nextIndex = currentInstructionIndex + 1;
        setCurrentInstructionIndex(nextIndex);
        setCurrentInstruction(routeInstructions[nextIndex]);

        // Announce the turn if voice is enabled
        if (voiceEnabled && routeInstructions[nextIndex]) {
          speakInstruction(routeInstructions[nextIndex].instruction);
        }
      }
    }
  };

  // Text-to-speech for navigation instructions
  const speakInstruction = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop navigation mode
  const stopNavigation = () => {
    setIsNavigating(false);
    setRouteInstructions([]);
    setCurrentInstructionIndex(0);
    setCurrentInstruction(null);
    setDistanceToNextTurn(0);
    setRouteCoordinates([]);

    // Clear high-accuracy tracking
    if (highAccuracyWatchId) {
      navigator.geolocation.clearWatch(highAccuracyWatchId);
      setHighAccuracyWatchId(null);
    }

    // Clear orientation tracking
    if (orientationWatchId) {
      window.removeEventListener("deviceorientation", () => {});
      setOrientationWatchId(null);
    }

    // Note: Leaflet doesn't have setBearing method (Mapbox GL feature)
    // No action needed for Leaflet maps

    // Clear route from map
    clearAllRoutes();
  };

  const toggleBlockadeReporting = () => {
    setBlockadeReportingMode(!blockadeReportingMode);
    if (!blockadeReportingMode) {
      // Entering reporting mode
      if (map) {
        map.getContainer().style.cursor = "crosshair";
      }
    } else {
      // Exiting reporting mode
      cancelBlockadeReport();
    }
  };

  const cancelBlockadeReport = () => {
    setBlockadeReportingMode(false);
    setSelectedBlockadeLocation(null);
    setBlockadeForm({
      title: "",
      description: "",
      severity: "medium",
    });

    if (map) {
      map.getContainer().style.cursor = "";
    }
  };

  const handleMapClickForBlockade = async (e, L) => {
    const { lat, lng } = e.latlng;
    setSelectedBlockadeLocation({ lat, lng });

    // Try to snap to nearest road using OSRM
    try {
      const response = await fetch(
        `${KALINGA_CONFIG.OSRM_SERVER}/nearest/v1/driving/${lng},${lat}?number=1`
      );
      const data = await response.json();

      if (data.code === "Ok" && data.waypoints && data.waypoints.length > 0) {
        const nearestPoint = data.waypoints[0];
        const roadLat = nearestPoint.location[1];
        const roadLng = nearestPoint.location[0];

        setSelectedBlockadeLocation({ lat: roadLat, lng: roadLng });

        // Add temporary marker
        if (window.tempBlockadeMarker) {
          map.removeLayer(window.tempBlockadeMarker);
        }

        window.tempBlockadeMarker = L.marker([roadLat, roadLng], {
          icon: L.icon({
            iconUrl:
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          }),
        }).addTo(map).bindPopup(`
                    <div>
                        <strong>Road:</strong> ${
                          nearestPoint.name || "Unknown Road"
                        }<br>
                        <small>Distance to road: ${
                          nearestPoint.distance || 0
                        }m</small>
                    </div>
                `);

        // Auto-fill road name if available
        if (nearestPoint.name && nearestPoint.name !== "Unknown Road") {
          setBlockadeForm((prev) => ({
            ...prev,
            title: `Blockade on ${nearestPoint.name}`,
          }));
        }
      }
    } catch (error) {
      console.error("Error snapping to road:", error);
      // Use clicked location as fallback
    }
  };

  const submitBlockadeReport = async () => {
    if (!selectedBlockadeLocation) {
      alert("Please click on the map to select blockade location");
      return;
    }

    if (!blockadeForm.title.trim()) {
      alert("Please enter a title for the road issue");
      return;
    }

    try {
      const response = await fetch(
        `${KALINGA_CONFIG.API_BASE_URL}/api/road-blockades`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            title: blockadeForm.title.trim(),
            description: blockadeForm.description.trim(),
            start_lat: selectedBlockadeLocation.lat,
            start_lng: selectedBlockadeLocation.lng,
            road_name: "Unknown Road",
            severity: blockadeForm.severity,
            reported_by: user.id,
          }),
        }
      );

      const data = await response.json();

      if (data.blockade) {
        alert("Road blockade reported successfully!");
        cancelBlockadeReport();

        // Remove temporary marker
        if (window.tempBlockadeMarker && map) {
          map.removeLayer(window.tempBlockadeMarker);
          window.tempBlockadeMarker = null;
        }

        // Refresh blockades
        if (map) {
          const L = await import("leaflet");
          fetchRoadBlockades(map, L.default);
        }
      } else {
        alert("Error reporting blockade: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error reporting road blockade");
    }
  };

  const removeBlockade = async (blockadeId, blockadeTitle) => {
    if (
      !confirm(
        `Are you sure you want to remove the blockade "${blockadeTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${KALINGA_CONFIG.API_BASE_URL}/api/road-blockades/${blockadeId}/remove`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            removed_by: user.id,
          }),
        }
      );

      const data = await response.json();

      if (data.message) {
        alert(
          data.message +
            (data.blockade
              ? ` by ${data.blockade.removed_by} at ${data.blockade.removed_at_human}`
              : "")
        );

        // Refresh blockades
        if (map) {
          const L = await import("leaflet");
          fetchRoadBlockades(map, L.default);
        }
      } else {
        alert("Error removing blockade");
      }
    } catch (error) {
      console.error("Error removing blockade:", error);
      alert("Error removing blockade");
    }
  };

  const refreshData = async () => {
    if (!map) return;

    const L = await import("leaflet");

    // Refresh all data regardless of selected tab
    loadHospitals(map, L.default);
    fetchRoadBlockades(map, L.default);
  };

  const centerMapOnLocation = (lat, lng) => {
    if (map && lat && lng) {
      map.flyTo([lat, lng], 17, {
        animate: true,
        duration: 1.2,
      });
    }
  };

  const recenterMap = () => {
    if (userLocation && map) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, {
        animate: true,
        duration: 1.2,
      });

      if (userMarker) {
        setTimeout(() => {
          userMarker.openPopup();
          // Refresh hospital distances
          if (selectedTab === "hospitals") {
            updateHospitalDistances(userLocation);
          }
        }, 1300);
      }
    }
  };

  // Cleanup routes when component unmounts
  useEffect(() => {
    return () => {
      clearAllRoutes();
      if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, []);

  // Make functions available globally for popup buttons
  useEffect(() => {
    window.removeBlockadeHandler = removeBlockade;
    window.getDirectionsToHospital = drawRoute;

    return () => {
      delete window.removeBlockadeHandler;
      delete window.getDirectionsToHospital;
    };
  }, [removeBlockade, drawRoute]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <ResponderSidebar />

      {/* Main Content Area - Full screen map */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <ResponderTopbar />

        {/* Map Content - No padding, full height */}
        <div className="relative flex-1 w-full overflow-hidden">
          {/* Mobile Bottom Interface - Google Maps Style */}
          <div className="md:hidden">
            {/* User Info Dropdown */}
            {showUserInfo && (
              <div className="fixed top-4 left-4 right-4 z-50 bg-white rounded-lg shadow-xl p-4 max-h-48 overflow-y-auto">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                  <button
                    onClick={() => setShowUserInfo(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-3 bg-blue-50 rounded text-sm">
                  <div className="font-semibold text-blue-800">
                    📍 Current Location
                  </div>
                  <div
                    className="text-blue-700 mt-1"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {currentLocationDisplay}
                  </div>
                </div>
              </div>
            )}

            {/* Hospitals List Dropdown */}
            {showHospitalsList && (
              <div
                className={`absolute left-4 right-4 z-40 bg-white rounded-lg shadow-lg flex flex-col ${
                  isNavigating
                    ? "bottom-36 max-h-96" // Higher positioning with more height when navigating
                    : "bottom-24 max-h-80" // Original positioning when not navigating
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                  <h3 className="font-semibold text-lg">🏥 Hospitals</h3>
                  <button
                    onClick={() => setShowHospitalsList(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-2 flex-1 overflow-y-auto">
                  {hospitalsWithDistance.length > 0 ? (
                    hospitalsWithDistance.map((hospital, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-gray-50 mb-2"
                      >
                        <div className="font-semibold text-green-600">
                          {hospital.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {hospital.address}
                        </div>
                        <div className="text-xs text-blue-600 mt-1 mb-2">
                          📍 {hospital.distance} • {hospital.phone}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              drawRoute(
                                hospital.lat,
                                hospital.lng,
                                false,
                                false
                              );
                              setShowHospitalsList(false);
                            }}
                            className="flex-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            🗺️ Route
                          </button>
                          <button
                            onClick={() => {
                              drawRoute(
                                hospital.lat,
                                hospital.lng,
                                false,
                                true
                              );
                              setShowHospitalsList(false);
                            }}
                            className="flex-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            🧭 Navigate
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 text-center">
                      No hospitals loaded
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Road Issues List Dropdown */}
            {showBlockadesList && (
              <div
                className={`absolute left-4 right-4 z-40 bg-white rounded-lg shadow-lg flex flex-col ${
                  isNavigating
                    ? "bottom-36 max-h-96" // Higher positioning with more height when navigating
                    : "bottom-24 max-h-80" // Original positioning when not navigating
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                  <h3 className="font-semibold text-lg">🚧 Road Issues</h3>
                  <button
                    onClick={() => setShowBlockadesList(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-2 flex-1 overflow-y-auto">
                  {blockades.length > 0 ? (
                    blockades.map((blockade, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer mb-2"
                        onClick={() => {
                          centerMapOnLocation(
                            blockade.start_lat,
                            blockade.start_lng
                          );
                          setShowBlockadesList(false);
                        }}
                      >
                        <div className="font-semibold text-red-600">
                          {blockade.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {blockade.road_name} •{" "}
                          {blockade.severity.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {blockade.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          By: {blockade.reported_by} •{" "}
                          {blockade.reported_at_human}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 text-center">
                      No road issues in this area
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Blockade Reporting Form Dropdown */}
            {blockadeReportingMode && (
              <div
                className={`absolute left-4 right-4 z-40 bg-white rounded-lg shadow-lg flex flex-col ${
                  isNavigating
                    ? "bottom-36 max-h-96" // Higher positioning with more height when navigating
                    : "bottom-24 max-h-80" // Original positioning when not navigating
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                  <h3 className="font-semibold text-lg">
                    🚧 Report Road Issue
                  </h3>
                  <button
                    onClick={cancelBlockadeReport}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                  <div className="mb-3 p-2 bg-blue-100 border-l-4 border-blue-500 text-sm">
                    <strong>📍 Click anywhere on the map</strong>
                    <br />
                    The system will automatically snap to the nearest road.
                  </div>

                  <input
                    type="text"
                    placeholder="Brief description"
                    value={blockadeForm.title}
                    onChange={(e) =>
                      setBlockadeForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full mb-3 p-3 border rounded-lg"
                  />

                  <textarea
                    placeholder="Detailed description"
                    value={blockadeForm.description}
                    onChange={(e) =>
                      setBlockadeForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full mb-3 p-3 border rounded-lg h-20 resize-none"
                  />

                  <select
                    value={blockadeForm.severity}
                    onChange={(e) =>
                      setBlockadeForm((prev) => ({
                        ...prev,
                        severity: e.target.value,
                      }))
                    }
                    className="w-full mb-4 p-3 border rounded-lg"
                  >
                    <option value="low">Low Severity</option>
                    <option value="medium">Medium Severity</option>
                    <option value="high">High Severity</option>
                    <option value="critical">Critical</option>
                  </select>

                  <div className="flex gap-3">
                    <button
                      onClick={submitBlockadeReport}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium"
                    >
                      Submit Report
                    </button>
                    <button
                      onClick={cancelBlockadeReport}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Bar with Navigation (Connected) */}
            <div className="absolute bottom-4 left-4 right-4 z-40">
              {/* Navigation Bar - Show when navigation is active */}
              {isNavigating && currentInstruction && (
                <div className="bg-blue-600 text-white rounded-t-lg shadow-lg p-4 mb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {currentInstruction.icon}
                      </span>
                      <div>
                        <div className="text-lg font-bold">
                          {currentInstruction.instruction}
                        </div>
                        {currentInstruction.distance && (
                          <div className="text-sm opacity-90">
                            In {currentInstruction.distance}m
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={stopNavigation}
                      className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
                      title="Stop Navigation"
                    >
                      <span className="text-lg">❌</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div
                className={`bg-white shadow-lg p-3 ${
                  isNavigating ? "rounded-b-lg" : "rounded-lg"
                }`}
              >
                <div className="flex justify-around items-center">
                  {/* User Info Button */}
                  <button
                    onClick={() => {
                      setShowUserInfo(!showUserInfo);
                      setShowHospitalsList(false);
                      setShowBlockadesList(false);
                      setBlockadeReportingMode(false);
                    }}
                    className={`flex flex-col items-center p-2 rounded-lg ${
                      showUserInfo
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-green-50"
                    }`}
                  >
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs">Profile</span>
                  </button>

                  {/* Hospitals Button */}
                  <button
                    onClick={() => {
                      setShowHospitalsList(!showHospitalsList);
                      setShowUserInfo(false);
                      setShowBlockadesList(false);
                      setBlockadeReportingMode(false);
                    }}
                    className={`flex flex-col items-center p-2 rounded-lg ${
                      showHospitalsList
                        ? "bg-green-100 text-green-600"
                        : "text-gray-600 hover:bg-blue-50"
                    }`}
                  >
                    <span className="text-lg mb-1">🏥</span>
                    <span className="text-xs">Hospitals</span>
                  </button>

                  {/* Find Nearest Hospital */}
                  <button
                    onClick={() => {
                      findNearestHospital();
                      setBlockadeReportingMode(false);
                    }}
                    className="flex flex-col items-center p-2 rounded-lg text-gray-600 hover:bg-violet-50"
                  >
                    <span className="text-lg mb-1">🎯</span>
                    <span className="text-xs">Nearest</span>
                  </button>

                  {/* Road Issues Button */}
                  <button
                    onClick={() => {
                      setShowBlockadesList(!showBlockadesList);
                      setShowUserInfo(false);
                      setShowHospitalsList(false);
                      setBlockadeReportingMode(false);
                    }}
                    className={`flex flex-col items-center p-2 rounded-lg ${
                      showBlockadesList
                        ? "bg-red-100 text-red-600"
                        : "text-gray-600 hover:bg-yellow-50"
                    }`}
                  >
                    <span className="text-lg mb-1">🚧</span>
                    <span className="text-xs">Issues</span>
                  </button>

                  {/* Report Issue */}
                  <button
                    onClick={() => {
                      toggleBlockadeReporting();
                      setShowUserInfo(false);
                      setShowHospitalsList(false);
                      setShowBlockadesList(false);
                    }}
                    className={`flex flex-col items-center p-2 rounded-lg ${
                      blockadeReportingMode
                        ? "bg-red-100 text-red-600"
                        : "text-gray-600 hover:bg-red-50"
                    }`}
                  >
                    <span className="text-lg mb-1">
                      {blockadeReportingMode ? "❌" : "📍"}
                    </span>
                    <span className="text-xs">
                      {blockadeReportingMode ? "Cancel" : "Report"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recenter Button - Always visible when location available */}
            <button
              onClick={recenterMap}
              className="absolute top-20 right-4 z-40 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100"
              title="Recenter map to current location"
              style={{ display: userLocation ? "block" : "none" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6 text-green-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </button>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-4 right-4 z-30 flex flex-row gap-3 mobile-controls">
            {userLocation && (
              <button
                onClick={recenterMap}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg mobile-touch-button flex items-center justify-center transition-colors duration-200"
                title="Recenter map to current location"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}

            <button
              onClick={refreshData}
              className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg mobile-touch-button flex items-center justify-center transition-colors duration-200"
              title="Refresh all map data (hospitals and road issues)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* Desktop Sidebar - Hidden on Mobile */}
          <div className="hidden md:block absolute left-0 top-0 h-full bg-white shadow-lg z-35 w-80 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Hospital Navigator</h3>

              {/* User Info */}
              <div className="mb-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-2">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{user.name}</div>
                    <div className="text-xs text-gray-600">{user.email}</div>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                  <div className="font-semibold text-blue-800">
                    📍 Current Location
                  </div>
                  <div
                    className="text-blue-700 mt-1"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {currentLocationDisplay}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mb-4 space-y-2">
                <button
                  onClick={findNearestHospital}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  🏥 Find Nearest Hospital
                </button>
                <button
                  onClick={toggleBlockadeReporting}
                  className={`w-full px-4 py-3 rounded-lg text-sm ${
                    blockadeReportingMode
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {blockadeReportingMode ? "❌ Cancel" : "🚧 Report Road Issue"}
                </button>
              </div>

              {/* Desktop Blockade Form */}
              {blockadeReportingMode && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">
                    Report Road Issue
                  </h4>
                  <div className="mb-3 p-2 bg-blue-100 border-l-4 border-blue-500 text-xs">
                    <strong>📍 Click anywhere on the map</strong>
                    <br />
                    The system will automatically snap to the nearest road.
                  </div>
                  <input
                    type="text"
                    placeholder="Brief description"
                    value={blockadeForm.title}
                    onChange={(e) =>
                      setBlockadeForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full mb-2 p-2 border rounded text-sm"
                  />
                  <textarea
                    placeholder="Detailed description"
                    value={blockadeForm.description}
                    onChange={(e) =>
                      setBlockadeForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full mb-2 p-2 border rounded text-sm h-16 resize-none"
                  />
                  <select
                    value={blockadeForm.severity}
                    onChange={(e) =>
                      setBlockadeForm((prev) => ({
                        ...prev,
                        severity: e.target.value,
                      }))
                    }
                    className="w-full mb-3 p-2 border rounded text-sm"
                  >
                    <option value="low">Low Severity</option>
                    <option value="medium">Medium Severity</option>
                    <option value="high">High Severity</option>
                    <option value="critical">Critical</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={submitBlockadeReport}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                    >
                      Submit
                    </button>
                    <button
                      onClick={cancelBlockadeReport}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Buttons */}
              <div className="flex mb-4 border-b">
                <button
                  onClick={() => setSelectedTab("hospitals")}
                  className={`flex-1 py-2 px-4 text-sm ${
                    selectedTab === "hospitals"
                      ? "border-b-2 border-green-500 text-green-600 bg-green-50"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  🏥 Hospitals
                </button>
                <button
                  onClick={() => setSelectedTab("blockades")}
                  className={`flex-1 py-2 px-4 text-sm ${
                    selectedTab === "blockades"
                      ? "border-b-2 border-red-500 text-red-600 bg-red-50"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  🚧 Road Issues
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {selectedTab === "hospitals" ? (
                  hospitalsWithDistance.length > 0 ? (
                    hospitalsWithDistance.map((hospital, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => drawRoute(hospital.lat, hospital.lng)}
                      >
                        <div className="font-semibold text-green-600 text-sm">
                          {hospital.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {hospital.address}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          📍 {hospital.distance} • {hospital.phone}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-sm">
                      No hospitals loaded
                    </div>
                  )
                ) : blockades.length > 0 ? (
                  blockades.map((blockade, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        drawRoute(blockade.latitude, blockade.longitude)
                      }
                    >
                      <div className="font-semibold text-red-600 text-sm">
                        {blockade.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {blockade.road_name} • {blockade.severity.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {blockade.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        By: {blockade.reported_by} •{" "}
                        {blockade.reported_at_human}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-sm">
                    No road blockades in this area
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />
        </div>
      </div>
    </div>
  );
}
