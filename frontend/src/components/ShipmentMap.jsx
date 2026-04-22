import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader } from 'lucide-react';

const ShipmentMap = ({ pickupLocation, deliveryLocation, currentLocation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        setLoading(false);
      } catch {
        setError('Failed to load map');
        setLoading(false);
      }
    };
    loadMap();
  }, []);

  const getMapCenter = useCallback(() => {
    if (currentLocation?.coordinates) {
      return { lat: currentLocation.coordinates.lat, lng: currentLocation.coordinates.lng };
    }
    if (pickupLocation?.coordinates) {
      return { lat: pickupLocation.coordinates.lat, lng: pickupLocation.coordinates.lng };
    }
    return { lat: 20.5937, lng: 78.9629 };
  }, [pickupLocation, currentLocation]);

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Map not available</p>
      </div>
    );
  }

  return <MapWrapper {...{ pickupLocation, deliveryLocation, currentLocation, getMapCenter }} />;
};

const MapWrapper = ({ pickupLocation, deliveryLocation, currentLocation, getMapCenter }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!mapRef.current || map) return;

    const initMap = async () => {
      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          version: 'weekly'
        });

        const google = await loader.load();
        const center = getMapCenter();

        const newMap = new google.maps.Map(mapRef.current, {
          center,
          zoom: 6
        });

        setMap(newMap);

        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({ map: newMap });

        if (pickupLocation?.coordinates && deliveryLocation?.coordinates) {
          directionsService.route(
            {
              origin: new google.maps.LatLng(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng),
              destination: new google.maps.LatLng(deliveryLocation.coordinates.lat, deliveryLocation.coordinates.lng),
              travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
              if (status === 'OK') {
                directionsRenderer.setDirections(result);
              }
            }
          );
        }
      } catch {
        console.error('Failed to initialize map');
      }
    };

    initMap();
  }, [getMapCenter, pickupLocation, deliveryLocation]);

  useEffect(() => {
    if (!map) return;

    const { Marker } = window.google?.maps || {};

    if (currentLocation?.coordinates && Marker) {
      new Marker({
        position: {
          lat: currentLocation.coordinates.lat,
          lng: currentLocation.coordinates.lng
        },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        },
        title: 'Current Location'
      });
    }
  }, [map, currentLocation]);

  return <div ref={mapRef} className="w-full h-96 rounded-lg" />;
};

export default ShipmentMap;
