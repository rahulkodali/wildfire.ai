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

function WildfirePredictionMap({ predictions, onLocationSelect, isLoading }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [mapError, setMapError] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Function to create and add a marker
  const addMarker = useCallback((prediction) => {
    if (!map.current) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'prediction-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = prediction.probability > 0.5 ? 'rgba(255, 59, 48, 0.8)' : 'rgba(52, 199, 89, 0.8)';
    el.style.border = '2px solid white';
    el.style.cursor = 'pointer';

    // Create popup
    const popup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: true,
      closeOnClick: false
    }).setHTML(`
      <strong>Risk Level:</strong> ${prediction.riskLevel}<br>
      <strong>Confidence:</strong> ${(prediction.confidence * 100).toFixed(1)}%
    `);

    // Add marker to map
    const marker = new mapboxgl.Marker(el)
      .setLngLat([prediction.lon, prediction.lat])
      .setPopup(popup)
      .addTo(map.current);

    markersRef.current.push(marker);
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',  // Use satellite style with streets/labels
        center: [-118.2437, 34.0522], // Los Angeles
        zoom: 10,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
        trackResize: true
      });

      // Wait for map to load and set up handlers
      mapInstance.on('load', () => {
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

      // Add click handler
      mapInstance.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        
        // Create temporary loading marker
        const el = document.createElement('div');
        el.className = 'prediction-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = 'rgba(128, 128, 128, 0.8)';
        el.style.border = '2px solid white';
        
        const tempMarker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(mapInstance);

        // Call onLocationSelect and wait for result
        await onLocationSelect(lat, lng);
        
        // Remove temporary marker
        tempMarker.remove();
      });

      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl());

      // Add scale control
      mapInstance.addControl(new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'imperial'
      }));

      // Handle WebGL context loss
      mapInstance.on('webglcontextlost', (e) => {
        e.preventDefault();
        setMapError('Map display error. Please refresh the page.');
        setIsMapLoaded(false);
      });

      return () => {
        if (markersRef.current) {
          markersRef.current.forEach(marker => marker.remove());
        }
        mapInstance.remove();
        map.current = null;
        setIsMapLoaded(false);
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map. Please check your browser settings.');
    }
  }, [onLocationSelect]);

  // Update markers when predictions change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    try {
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add new markers
      predictions.forEach(addMarker);
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [predictions, addMarker]);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div 
        ref={mapContainer} 
        style={{ 
          height: '100%',
          WebkitTransform: 'translate3d(0,0,0)',
          transform: 'translate3d(0,0,0)'
        }} 
      />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--gray-3)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          zIndex: 1000
        }}>
          Analyzing location...
        </div>
      )}
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

export default WildfirePredictionMap;
