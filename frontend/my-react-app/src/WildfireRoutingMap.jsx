import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Modern WebGL support check
const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && 
      canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch (e) {
    return false;
  }
};

if (!hasWebGL()) {
  console.error('WebGL not supported');
}

mapboxgl.accessToken = 'pk.eyJ1IjoiZGFrc2hpbmQiLCJhIjoiY202Y20zdzJqMGx2OTJrcTNkcGFtb2cwayJ9.s7CG8iwMwrMq6Br2C2RtMg';

// Add these styles right after the imports
const mapStyles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    WebkitTransform: 'translate3d(0,0,0)',
    transform: 'translate3d(0,0,0)'
  }
};

function WildfireRoutingMap({ routePolyline }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    if (!mapboxgl.supported()) {
      setMapError('Your browser does not support Mapbox GL');
      console.error('Mapbox GL not supported');
      return;
    }

    try {
      console.log('Initializing map...');
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [-118.2437, 34.0522],
        zoom: 10,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
        trackResize: true
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
  
          // Center map on user's location

          console.log(longitude, latitude);
  
          // Optionally, add a marker for user's location
        },
        (error) => {
          console.error('Error getting location: ', error);
        }
      );

      

      mapInstance.on('load', () => {
        console.log('Map loaded successfully');
        map.current = mapInstance;
        setIsMapLoaded(true);

        // Hide all labels except city names
        const layers = mapInstance.getStyle().layers;
        for (const layer of layers) {
          if (layer.type === 'symbol') {
            if (!layer.id.includes('city') && !layer.id.includes('settlement')) {
              mapInstance.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          }
        }

        // Adjust city label visibility
        mapInstance.setLayoutProperty('settlement-major-label', 'text-size', 14);
        mapInstance.setLayoutProperty('settlement-major-label', 'text-color', '#ffffff');
        mapInstance.setLayoutProperty('settlement-major-label', 'text-halo-color', 'rgba(0, 0, 0, 0.75)');
        mapInstance.setLayoutProperty('settlement-major-label', 'text-halo-width', 2);
      });

      mapInstance.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('An error occurred while loading the map');
      });

      // Add navigation controls
      // mapInstance.addControl(new mapboxgl.NavigationControl());

      // Add scale control
      // mapInstance.addControl(new mapboxgl.ScaleControl({
      //   maxWidth: 100,
      //   unit: 'imperial'
      // }));

      // Handle WebGL context loss
      mapInstance.on('webglcontextlost', (e) => {
        e.preventDefault();
        setMapError('Map display error. Please refresh the page.');
        setIsMapLoaded(false);
      });

      return () => {
        mapInstance.remove();
        map.current = null;
        setIsMapLoaded(false);
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map. Please check your browser settings.');
    }
  }, []);

  // Add effect to handle route display
  useEffect(() => {
    if (map.current && routePolyline && isMapLoaded) {
      // Remove existing route layer if it exists
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }

      // Add the route to the map
      map.current.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': routePolyline.map(coord => [coord[1], coord[0]]) // Switch lat/lng to lng/lat for Mapbox
          }
        }
      });

      map.current.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#FFA500',
          'line-width': 10,
          'line-opacity': 0.75
        }
      });

      // Fit the map to the route bounds
      const coordinates = routePolyline.map(coord => [coord[1], coord[0]]);
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 50
      });
    }
  }, [routePolyline, isMapLoaded]);

  return (
    <div style={mapStyles.wrapper}>
      <div 
        ref={mapContainer} 
        style={mapStyles.container}
      />

      {mapError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--tomato-9)',
          color: 'white',
          padding: '16px',
          borderRadius: '4px',
          zIndex: 1000,
          textAlign: 'center'
        }}>
          {mapError}
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              backgroundColor: 'white',
              color: 'var(--tomato-9)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      )}
    </div>
  );
}

export default WildfireRoutingMap;