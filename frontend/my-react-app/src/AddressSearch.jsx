import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState, useCallback, useRef, useEffect } from 'react';
import WildfirePredictionMap from './WildfirePredictionMap';

function AddressSearch() {
  const [prediction, setPrediction] = useState(null);
  const [predictions, setPredictions] = useState([]); // For map markers
  const [isPredicting, setIsPredicting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const searchContainerRef = useRef(null);

  // Handle clicks outside of search container
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchAddress = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=pk.eyJ1IjoiZGFrc2hpbmQiLCJhIjoiY202Y20zdzJqMGx2OTJrcTNkcGFtb2cwayJ9.s7CG8iwMwrMq6Br2C2RtMg&country=US`
      );
      
      if (!response.ok) throw new Error('Failed to search address');
      
      const data = await response.json();
      setSearchResults(data.features.map(feature => ({
        name: feature.place_name,
        coordinates: feature.center, // [longitude, latitude]
        bbox: feature.bbox // [minLon, minLat, maxLon, maxLat]
      })));
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getPrediction = useCallback(async (lat, lon) => {
    try {
      setIsPredicting(true);
      const response = await fetch('http://localhost:5001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }

      const data = await response.json();
      const newPrediction = {
        lat,
        lon,
        probability: data.probability,
        riskLevel: data.risk_level,
        confidence: data.confidence,
        satellite_image: data.satellite_image
      };
      setPrediction(newPrediction);
      setPredictions([newPrediction]); // Update map markers
    } catch (error) {
      console.error('Error getting prediction:', error);
    } finally {
      setIsPredicting(false);
    }
  }, []);

  const handleAddressSelect = useCallback((result) => {
    const [lon, lat] = result.coordinates;
    setSearchResults([]); // Clear search results
    setSearchQuery(result.name); // Update search input
    
    // Set map center and zoom based on the selected location
    setMapCenter([lon, lat]);
    
    // If we have a bounding box, calculate appropriate zoom level
    if (result.bbox) {
      const [minLon, minLat, maxLon, maxLat] = result.bbox;
      const latDiff = Math.abs(maxLat - minLat);
      const lonDiff = Math.abs(maxLon - minLon);
      const maxDiff = Math.max(latDiff, lonDiff);
      
      // Rough calculation for zoom level based on bounding box size
      const zoom = Math.floor(14 - Math.log2(maxDiff * 10));
      setMapZoom(Math.min(Math.max(zoom, 10), 16)); // Clamp between 10 and 16
    } else {
      setMapZoom(14); // Default zoom level for addresses without bbox
    }
    
    getPrediction(lat, lon);
  }, [getPrediction]);

  return (
    <Card size="3" style={{ padding: '1.5rem' }}>
      <Flex direction="column" gap="4">
        <Heading size="6">Search by Address</Heading>
        
        <Flex style={{ gap: '4', position: 'relative' }}>
          <div 
            ref={searchContainerRef}
            style={{
              position: 'absolute',
              top: '1.25rem',
              left: '38%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 2rem)',
              maxWidth: '770px',
              zIndex: 9999
            }}
          >
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchAddress(e.target.value);
              }}
              placeholder="Enter an address..."
              className="map-search-input"
            />
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <Card style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                width: '104%',
                marginTop: '0.5rem',
                maxHeight: '300px',
                overflowY: 'auto',
                background: 'var(--gray-3)'
              }}>
                <Flex direction="column" gap="1">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleAddressSelect(result)}
                      className="search-result-item"
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--gray-12)',
                        borderBottom: index < searchResults.length - 1 ? '1px solid var(--gray-5)' : 'none'
                      }}
                    >
                      {result.name}
                    </button>
                  ))}
                </Flex>
              </Card>
            )}
          </div>
            
          {/* Left section - Map */}
          <div style={{ flex: '4', marginRight: '1rem'}}>
            <div style={{ 
              width: '100%',
              height: '600px',
              borderRadius: 'var(--radius-3)',
              overflow: 'hidden'
            }}>
              <WildfirePredictionMap 
                predictions={predictions}
                onLocationSelect={getPrediction}
                isLoading={isPredicting}
                center={mapCenter}
                zoom={mapZoom}
              />
            </div>
          </div>

          {/* Right section - Prediction */}
          <div style={{ flex: '1' }}>
            <Card style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Heading size="4" style={{ marginBottom: '1rem' }}>Location Details</Heading>
              
              {!prediction ? (
                <Text size="2" color="gray">
                  Search for an address or click on the map to get a wildfire risk prediction.
                </Text>
              ) : (
                <div style={{ 
                  overflowY: 'auto', 
                  flex: 1,
                  marginRight: '-8px',
                  paddingRight: '8px'
                }}>
                  <Card style={{ backgroundColor: 'var(--gray-3)' }}>
                    {/* Satellite Image */}
                    <div style={{ 
                      width: '100%',
                      height: '150px',
                      marginBottom: '1rem',
                      borderRadius: 'var(--radius-2)',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={prediction.satellite_image} 
                        alt={`Satellite view of ${prediction.lat}, ${prediction.lon}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>

                    <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                      <strong>Location:</strong>
                      <Text color="gray"> {prediction.lat.toFixed(4)}, {prediction.lon.toFixed(4)}</Text>
                    </Text>
                    <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                      <strong>Risk Level:</strong>
                      <Text color={prediction.probability > 0.5 ? 'tomato' : 'green'}> {prediction.riskLevel}</Text>
                    </Text>
                    <Text as="div" size="2">
                      <strong>Confidence:</strong>
                      <Text color="gray"> {(prediction.confidence * 100).toFixed(1)}%</Text>
                    </Text>
                  </Card>
                </div>
              )}
            </Card>
          </div>
        </Flex>
      </Flex>
    </Card>
  );
}

export default AddressSearch; 