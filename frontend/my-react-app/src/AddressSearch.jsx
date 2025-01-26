import { Card, Flex, Heading, Text, Separator } from "@radix-ui/themes";
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
    setIsPredicting(true);
    try {
        console.log('Fetching data for:', { lat, lon });
        
        // Fetch both prediction and weather data in parallel
        const [predictionResponse, weatherResponse] = await Promise.all([
          fetch('http://localhost:5001/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lon })
          }),
          fetch(`http://localhost:5001/weather?lat=${lat}&lon=${lon}`)
        ]);
  
        if (!predictionResponse.ok) {
          throw new Error(`Prediction request failed: ${predictionResponse.status}`);
        }
        if (!weatherResponse.ok) {
          throw new Error(`Weather request failed: ${weatherResponse.status}`);
        }
  
        const predictionData = await predictionResponse.json();
        const weatherData = await weatherResponse.json();
  
        const newPrediction = {
          lat,
          lon,
          probability: predictionData.probability,
          riskLevel: predictionData.risk_level,
          confidence: predictionData.confidence,
          satellite_image: predictionData.satellite_image,
          // Add weather data
          temperature: weatherData.temperature_fahrenheit,
          humidity: weatherData.humidity,
          windSpeed: weatherData.wind_speed,
          windDirection: weatherData.wind_direction,
          weatherRisk: weatherData.wildfire_risk
        };
  
        setPrediction(newPrediction);
        setPredictions([newPrediction]); // For map markers
    } catch (error) {
    console.error('Error fetching data:', error);
    } finally {
    setIsPredicting(false);
    }
  }, []);

  const handleAddressSelect = async (feature) => {
    const [lon, lat] = feature.coordinates;
    setMapCenter([lon, lat]);
    setMapZoom(14);
    setSearchResults([]);
    setSearchQuery(feature.name);
    setIsPredicting(true);
    
    try {
      console.log('Fetching data for:', { lat, lon });
      
      // Fetch both prediction and weather data in parallel
      const [predictionResponse, weatherResponse] = await Promise.all([
        fetch('http://localhost:5001/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: lat, longitude: lon })
        }),
        fetch(`http://localhost:5001/weather?lat=${lat}&lon=${lon}`)
      ]);

      if (!predictionResponse.ok) {
        throw new Error(`Prediction request failed: ${predictionResponse.status}`);
      }
      if (!weatherResponse.ok) {
        throw new Error(`Weather request failed: ${weatherResponse.status}`);
      }

      const predictionData = await predictionResponse.json();
      const weatherData = await weatherResponse.json();

      const newPrediction = {
        lat,
        lon,
        probability: predictionData.probability,
        riskLevel: predictionData.risk_level,
        confidence: predictionData.confidence,
        satellite_image: predictionData.satellite_image,
        // Add weather data
        temperature: weatherData.temperature_fahrenheit,
        humidity: weatherData.humidity,
        windSpeed: weatherData.wind_speed,
        windDirection: weatherData.wind_direction,
        weatherRisk: weatherData.wildfire_risk
      };

      setPrediction(newPrediction);
      setPredictions([newPrediction]); // For map markers
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <Card size="3" style={{ padding: '1.5rem' }}>
      <Flex direction="column" gap="4">
        <Heading size="6">
          <span>Wildfire Risk Prediction with </span>
          <span style={{ 
            background: 'linear-gradient(90deg, #FF4500, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>ML</span>
        </Heading>
        
        <Flex style={{ gap: '4', position: 'relative' }}>
          {/* Left section - Map and Search */}
          <div style={{ flex: '4', marginRight: '1rem'}}>
            {/* Search Input - Moved above map */}
            <div 
              ref={searchContainerRef}
              style={{
                width: '100%',
                marginBottom: '1rem',
                position: 'relative'
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
                style={{
                  width: '100%',
                  border: '1px solid var(--gray-6)',
                  borderRadius: 'var(--radius-3)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--gray-12)',
                  padding: '0.75rem 1rem',
                  boxSizing: 'border-box',
                  height: '42px'
                }}
              />
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <Card style={{
                  position: 'absolute',
                  zIndex: 1000,
                  width: '100%',
                  marginTop: '0.5rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  background: 'var(--gray-3)',
                  boxSizing: 'border-box'
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

            {/* Map */}
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
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                  paddingRight: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  {/* Main Content */}
                  <div>
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
                    <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                      <strong>Confidence:</strong>
                      <Text color="gray"> {(prediction.confidence * 100).toFixed(1)}%</Text>
                    </Text>
                  </div>

                  {/* Weather Information */}
                  {prediction.temperature !== undefined && (
                    <div style={{ 
                      marginTop: 'auto',
                      paddingTop: '1rem'
                    }}>
                      <Heading size="3" style={{ marginBottom: '0.5rem' }}>Weather Details</Heading>
                      <Separator size="4" style={{ margin: "15px -16px", width: 'calc(95% + 25px)' }} />

                      <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                        <strong>Temperature:</strong>
                        <Text color="gray"> {prediction.temperature?.toFixed(1)}°F</Text>
                      </Text>
                      
                      {prediction.humidity !== undefined && (
                        <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                          <strong>Humidity:</strong>
                          <Text color="gray"> {prediction.humidity}%</Text>
                        </Text>
                      )}
                      
                      {prediction.windSpeed !== undefined && (
                        <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                          <strong>Wind Speed:</strong>
                          <Text color="gray"> {prediction.windSpeed} mph</Text>
                        </Text>
                      )}
                      
                      {prediction.weatherRisk !== undefined && (
                        <Text as="div" size="2">
                          <strong>Weather-based Risk:</strong>
                          <Text color={prediction.weatherRisk > 50 ? 'tomato' : 'green'}> {prediction.weatherRisk}%</Text>
                        </Text>
                      )}
                    </div>
                  )}
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