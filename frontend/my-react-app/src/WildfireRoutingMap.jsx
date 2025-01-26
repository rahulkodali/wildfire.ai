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
  const markersRef = useRef([]);
  const [isToggleOn, setIsToggleOn] = useState(false);
  const [mapStyle, setMapStyle] = useState('satellite-streets-v12');

  const handleToggle = () => {
    setIsToggleOn(!isToggleOn);
    console.log("Toggle state:", !isToggleOn);
  };

  const handleResetLocation = () => {
    if (onLocationLoad) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            duration: 1500
          });
          onLocationLoad([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location: ', error);
        }
      );
    }
  };

  const handleMapStyleToggle = useCallback(() => {
    const newStyle = mapStyle === 'satellite-streets-v12' ? 'dark-v11' : 'satellite-streets-v12';
    setMapStyle(newStyle);
    if (map.current) {
      map.current.setStyle(`mapbox://styles/mapbox/${newStyle}`);
    }
  }, [mapStyle]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    if (!mapboxgl.supported()) {
      setMapError('Your browser does not support Mapbox GL');
      console.error('Mapbox GL not supported');
      return;
    }

    try {
      console.log('Initializing map');
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
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
  }, [onLocationLoad, mapStyle]);

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

  useEffect(() => {
    const fetchAndSetPolygons = async () => {
      if (map.current && isMapLoaded) {
        // Remove existing polygon layer if it exists
        if (map.current.getSource('polygons')) {
          map.current.removeLayer('polygons');
          map.current.removeLayer('polygon-borders');
          map.current.removeSource('polygons');
        }
  
        try {
          // Fetch polygon coordinates
          const response = await fetch("http://127.0.0.1:5001/");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          const polygonCoordinates = await response.json();
  
          // Create GeoJSON data
          const geojsonData = {
            type: 'FeatureCollection',
            features: polygonCoordinates.map(coords => ({
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [coords]
              }
            }))
          };
  
          // Add the polygons source to the map
          map.current.addSource('polygons', {
            type: 'geojson',
            data: geojsonData
          });
  
          // Add the polygons layer to the map
          map.current.addLayer({
            id: 'polygons',
            type: 'fill',
            source: 'polygons',
            layout: {},
            paint: {
              'fill-color': '#FF6347', // Tomato color
              'fill-opacity': 0.5
            }
          });
  
          // Add borders for the polygons
          map.current.addLayer({
            id: 'polygon-borders',
            type: 'line',
            source: 'polygons',
            layout: {},
            paint: {
              'line-color': '#000',
              'line-width': 2
            }
          });
        } catch (error) {
          console.error("Failed to fetch polygon coordinates:", error);
        }
      }
    };
  
    // Call the function
    fetchAndSetPolygons();
  }, [isMapLoaded]);

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
            .setHTML(`<h3 style="color: black">Proneness Level: ${Math.round(prediction.probability * 100)}%</h3>`)
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
      {/* Controls Container */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        padding: '4px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>

        {/* Map Style Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 12px',
          borderRadius: '6px',
          width: '120px'
        }}>
          <span style={{ 
            fontSize: '0.875rem', 
            color: 'white',
            fontWeight: '500',
            minWidth: '52px'
          }}>
            {mapStyle === 'satellite-streets-v12' ? 'Satellite' : 'Dark'}
          </span>
          <button
            onClick={handleMapStyleToggle}
            style={{
              width: '48px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: mapStyle === 'dark-v11' ? 'var(--accent-9)' : 'var(--gray-5)',
              position: 'relative',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              padding: 0
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                position: 'absolute',
                top: '2px',
                left: mapStyle === 'dark-v11' ? '26px' : '2px',
                transition: 'left 0.2s'
              }}
            />
          </button>
        </div>

        {/* Toggle Switch */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 12px',
          borderRadius: '6px',
          width: '120px'
        }}>
          <span style={{ 
            fontSize: '0.875rem', 
            color: 'white',
            fontWeight: '500',
            minWidth: '52px'
          }}>
            {isToggleOn ? 'Wildfires' : 'Normal'}
          </span>
          <button
            onClick={handleToggle}
            style={{
              width: '48px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: isToggleOn ? 'var(--accent-9)' : 'var(--gray-5)',
              position: 'relative',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              padding: 0
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                position: 'absolute',
                top: '2px',
                left: isToggleOn ? '26px' : '2px',
                transition: 'left 0.2s'
              }}
            />
          </button>
        </div>

        {/* Reset Location Button */}
        <button
          onClick={handleResetLocation}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px'
          }}
          title="Reset to Current Location"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8l-4 4 4 4M8 12h8M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

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
