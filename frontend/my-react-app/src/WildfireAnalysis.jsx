import { Card, Flex, Heading, Text, Separator } from "@radix-ui/themes";
import { useState, useCallback, useRef, useEffect } from 'react';
import WildfirePredictionMap from './WildfirePredictionMap';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function WildfireAnalysis() {
  const [predictions, setPredictions] = useState([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchContainerRef = useRef(null);

  // Handle clicks outside search results
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=US`
      );
      const data = await response.json();
      setSearchResults(data.features.map(feature => ({
        text: feature.place_name,
        center: feature.center
      })));
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchResults([]);
    }
  }, []);

  const handleAddressSelect = async (result) => {
    const [lon, lat] = result.center;
    setSearchQuery('');
    setSearchResults([]);
    await getPrediction(lat, lon);
  };

  const toggleCard = (index) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getPrediction = useCallback(async (lat, lon) => {
    setIsPredicting(true);
    try {
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

      setPredictions(prev => [...prev, {
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
      }]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsPredicting(false);
    }
  }, []);

  return (
    <Card size="3" style={{ padding: '1.5rem' }}>
      <Flex direction="column" gap="4">
        <Heading size="6">
          <span>MultiView Risk Prediction with </span>
          <span style={{ 
            background: 'linear-gradient(90deg, #FF4500, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>ML</span>
        </Heading>
        
        <Flex gap="4">
          {/* Left section - Map */}
          <div style={{ flex: '4' }}>
            {/* Search Input */}
            <div ref={searchContainerRef} style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchAddress(e.target.value);
                }}
                placeholder="Search for a location"
                className="custom-input location-input"
                style={{
                  height: '42px',
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: '1rem',
                  backgroundColor: 'var(--gray-1)',
                }}
              />
              {searchResults.length > 0 && (
                <Card style={{
                  position: 'absolute',
                  top: '42px',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  marginTop: '0.5rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--gray-3)',
                  border: '1px solid var(--gray-6)'
                }}>
                  <Flex direction="column" gap="1">
                    {searchResults.map((result, index) => (
                      <Text
                        key={index}
                        className="search-result-item"
                        style={{
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          color: 'var(--gray-12)'
                        }}
                        onClick={() => handleAddressSelect(result)}
                      >
                        {result.text}
                      </Text>
                    ))}
                  </Flex>
                </Card>
              )}
            </div>

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
              />
            </div>
          </div>

          {/* Right section - Predictions List */}
          <div style={{ flex: '1' }}>
            <Card style={{ height: '661px', display: 'flex', flexDirection: 'column' }}>
              <Heading size="4" style={{ marginBottom: '1rem' }}>Prediction History</Heading>
              
              {predictions.length === 0 ? (
                <Text size="2" color="gray">
                  Click on the map to get wildfire risk predictions for specific locations.
                </Text>
              ) : (
                <div style={{ 
                  overflowY: 'auto', 
                  flex: 1,
                  marginRight: '-8px',
                  paddingRight: '8px'
                }}>
                  <Flex direction="column" gap="3">
                    {predictions.toReversed().map((pred, index) => (
                      <div 
                        key={index} 
                        className={`prediction-card ${flippedCards.has(index) ? 'flipped' : ''}`}
                        onClick={() => toggleCard(index)}
                      >
                        <div className="prediction-card-inner">
                          {/* Front of card */}
                          <div className="prediction-card-front">
                            <Card style={{ 
                              backgroundColor: 'var(--gray-3)',
                              height: '100%'
                            }}>
                              {/* Satellite Image */}
                              <div style={{ 
                                width: '100%',
                                height: '150px',
                                marginBottom: '1rem',
                                borderRadius: 'var(--radius-2)',
                                overflow: 'hidden'
                              }}>
                                <img 
                                  src={pred.satellite_image} 
                                  alt={`Satellite view of ${pred.lat}, ${pred.lon}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              </div>

                              <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                                <strong>Location:</strong>
                                <Text color="gray"> {pred.lat.toFixed(4)}, {pred.lon.toFixed(4)}</Text>
                              </Text>
                              <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                                <strong>Risk Level:</strong>
                                <Text color={pred.probability > 0.5 ? 'tomato' : 'green'}> {pred.riskLevel}</Text>
                              </Text>
                              <Text as="div" size="2">
                                <strong>Confidence:</strong>
                                <Text color="gray"> {(pred.confidence * 100).toFixed(1)}%</Text>
                              </Text>
                            </Card>
                          </div>

                          {/* Back of card */}
                          <div className="prediction-card-back">
                            <Card style={{ 
                              height: '100%',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              backgroundColor: 'var(--gray-3)'
                            }}>
                              <Heading size="3" style={{ marginBottom: '0.5rem', color: 'white' }}>Weather Details</Heading>
                              <Separator size="4" style={{ margin: "0.5rem 0rem 1rem", width: 'calc(80% + 2rem)' }} />
                              
                              <Text as="div" size="2" style={{ marginBottom: '0.5rem', color: 'white' }}>
                                <strong>Temperature:</strong>
                                <Text color="gray"> {pred.temperature.toFixed(1)}°F</Text>
                              </Text>
                              
                              <Text as="div" size="2" style={{ marginBottom: '0.5rem', color: 'white' }}>
                                <strong>Humidity:</strong>
                                <Text color="gray"> {pred.humidity}%</Text>
                              </Text>
                              
                              <Text as="div" size="2" style={{ marginBottom: '0.5rem', color: 'white' }}>
                                <strong>Wind Speed:</strong>
                                <Text color="gray"> {pred.windSpeed} mph</Text>
                              </Text>
                              
                              <Text as="div" size="2" style={{ color: 'white' }}>
                                <strong>Weather-based Risk:</strong>
                                <Text color={pred.weatherRisk > 50 ? 'tomato' : 'green'}> {pred.weatherRisk}%</Text>
                              </Text>
                            </Card>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Flex>
                </div>
              )}
            </Card>
          </div>
        </Flex>
      </Flex>
    </Card>
  );
}

export default WildfireAnalysis; 