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

function WildfireRoutingMap({ routePolyline, predictions, onLocationLoad }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

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
          mapInstance.setCenter([longitude, latitude]);
          console.log("Current location:", longitude, latitude);
          
          // Call the callback with the user's location
          if (onLocationLoad) {
            onLocationLoad([latitude, longitude]);
          }
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
  }, [onLocationLoad]);

  // Add effect to handle route display
  useEffect(() => {
    if (map.current && routePolyline && isMapLoaded) {
      // Remove all existing route layers and sources
      const style = map.current.getStyle();
      if (style) {
        Object.keys(style.sources).forEach(sourceId => {
          if (sourceId.startsWith('route')) {
            // Remove associated layer first
            if (map.current.getLayer(sourceId)) {
              map.current.removeLayer(sourceId);
            }
            map.current.removeSource(sourceId);
          }
        });
      }

      // If we have predictions, create gradient segments
      if (predictions?.length > 1) {
        predictions.forEach((prediction, index) => {
          if (index === predictions.length - 1) return; // Skip last point as it will be the end of previous segment

          const startPoint = prediction.coordinates;
          const endPoint = predictions[index + 1].coordinates;
          const avgRisk = (prediction.probability + predictions[index + 1].probability) / 2;
          
          const color = avgRisk > 0.7 ? '#ff0000' :  // Red for high risk
                       avgRisk > 0.4 ? '#ffff00' :  // Yellow for medium risk
                       '#00ff00';                    // Green for low risk

          // Add a source and layer for this segment
          const sourceId = `route-segment-${index}`;
          map.current.addSource(sourceId, {
            'type': 'geojson',
            'data': {
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                'coordinates': [startPoint, endPoint]
              }
            }
          });

          map.current.addLayer({
            'id': sourceId,
            'type': 'line',
            'source': sourceId,
            'layout': {
              'line-join': 'round',
              'line-cap': 'round'
            },
            'paint': {
              'line-color': color,
              'line-width': 10,
              'line-opacity': 0.75
            }
          });
        });
      } else {
        // If no predictions, show default orange route
        map.current.addSource('route', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': routePolyline.map(coord => [coord[1], coord[0]])
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
      }

      // Fit the map to the route bounds
      const coordinates = routePolyline.map(coord => [coord[1], coord[0]]);
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 50
      });
    }
  }, [routePolyline, isMapLoaded, predictions]);

  // Add new effect for prediction markers
  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!map.current || !predictions?.length || !isMapLoaded) return;

    // Add new markers for predictions
    predictions.forEach(prediction => {
      const probability = prediction.probability;
      const color = probability > 0.7 ? '#ff0000' :  // Red for high risk
                    probability > 0.4 ? '#ffff00' :  // Yellow for medium risk
                    '#00ff00';                       // Green for low risk

      const el = document.createElement('div');
      el.className = 'prediction-marker';
      el.style.backgroundColor = color;
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat(prediction.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>Risk Level: ${Math.round(prediction.probability * 100)}%</h3>`)
        )
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [predictions, isMapLoaded]);

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
