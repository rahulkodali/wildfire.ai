import { Card, Flex, Heading, Text, Link, Switch } from "@radix-ui/themes";
import { useState, useEffect, useCallback, useRef } from 'react';
import './RoutesAnalysis.css';
import WildfireRoutingMap from "./WildfireRoutingMap";
import AlertsTab from "./AlertsTab";
import { Brain, BrainCircuit } from "lucide-react";

function RoutesAnalysis() {
  const alertCards = [
    {
      image: "https://images.unsplash.com/photo-1576044962581-4f6b2e0154b2?q=80&w=2942&auto=format&fit=crop",
      title: "Emergency Numbers",
      description: "Important contact information for emergency services",
      link: "#"
    },
    {
      image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=2942&auto=format&fit=crop",
      title: "Evacuation Routes",
      description: "Find the nearest evacuation route in your area",
      link: "#"
    },
    {
      image: "https://images.unsplash.com/photo-1617450365226-9bf28c04e130?q=80&w=2940&auto=format&fit=crop",
      title: "Local Charities",
      description: "Organizations providing support and assistance",
      link: "#"
    },
    {
      image: "https://images.unsplash.com/photo-1580377968211-b6cf130fb731?q=80&w=2940&auto=format&fit=crop",
      title: "Latest News",
      description: "Updates on current wildfire situations",
      link: "#"
    }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFromQuery, setSearchFromQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFromResults, setSearchFromResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzingRoute, setIsAnalyzingRoute] = useState(false);
  const searchContainerRef = useRef(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [routePredictions, setRoutePredictions] = useState([]);
  const [fromLoc, setFromLoc] = useState([0, 0]);

  const getRoute = useCallback(async (coordA, coordB) => {
    const polys = await fetch(`http://127.0.0.1:5001`)
    
    const data = JSON.stringify({
      "point A": [fromLoc[1], fromLoc[0]],
      "point B": [coordB, coordA],
      "polygon": await polys.json()
    })

    console.log(data);

    const reqOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: data
    }

    const res = await fetch(`http://127.0.0.1:5001/api/route`, reqOptions);
    const resData = (await res.json()).decoded_polyline;
    setRoutePolyline(resData);
  }, [fromLoc]);

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

  const searchFromAddress = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchFromResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=pk.eyJ1IjoiZGFrc2hpbmQiLCJhIjoiY202Y20zdzJqMGx2OTJrcTNkcGFtb2cwayJ9.s7CG8iwMwrMq6Br2C2RtMg&country=US`
      );
      
      if (!response.ok) throw new Error('Failed to search address');
      
      const data = await response.json();
      setSearchFromResults(data.features.map(feature => ({
        name: feature.place_name,
        coordinates: feature.center,
        bbox: feature.bbox
      })));
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleFromAddressSelect = useCallback((result) => {
    const [lon, lat] = result.coordinates;
    setSearchFromResults([]);
    setSearchFromQuery(result.name);
    setMapCenter([lon, lat]);
    
    if (result.bbox) {
      const [minLon, minLat, maxLon, maxLat] = result.bbox;
      const latDiff = Math.abs(maxLat - minLat);
      const lonDiff = Math.abs(maxLon - minLon);
      const maxDiff = Math.max(latDiff, lonDiff);
      const zoom = Math.floor(14 - Math.log2(maxDiff * 10));
      setMapZoom(Math.min(Math.max(zoom, 10), 16));
    } else {
      setMapZoom(14);
    }

    setFromLoc([lat, lon]);
  }, []);

  const handleAddressSelect = useCallback((result) => {
    const [lon, lat] = result.coordinates;
    setSearchResults([]);
    setSearchQuery(result.name);
    setMapCenter([lon, lat]);
    
    if (result.bbox) {
      const [minLon, minLat, maxLon, maxLat] = result.bbox;
      const latDiff = Math.abs(maxLat - minLat);
      const lonDiff = Math.abs(maxLon - minLon);
      const maxDiff = Math.max(latDiff, lonDiff);
      const zoom = Math.floor(14 - Math.log2(maxDiff * 10));
      setMapZoom(Math.min(Math.max(zoom, 10), 16));
    } else {
      setMapZoom(14);
    }
    
    getRoute(lat, lon);
  }, [getRoute]);

  const handleLocationLoad = useCallback((location) => {
    console.log("Location received in RoutesAnalysis:", location);
    setFromLoc(location);
    setSearchFromQuery("Current Location");
  }, []);

  // Function to sample points along the route
  const sampleRoutePoints = useCallback((polyline, numPoints = 20) => {
    if (!polyline || polyline.length < 2) return [];
    
    const points = [];
    const totalPoints = polyline.length;
    const interval = Math.max(1, Math.floor(totalPoints / 10));
    
    for (let i = 0; i < totalPoints; i += interval) {
      const point = polyline[Math.min(i, totalPoints - 1)];
      points.push(point);
    }
    
    // Ensure we include the last point
    if (points[points.length - 1] !== polyline[totalPoints - 1]) {
      points.push(polyline[totalPoints - 1]);
    }
    
    return points;
  }, []);

  // Function to get predictions for points
  const getPredictionsForPoints = useCallback(async (points) => {
    try {
      const predictions = await Promise.all(
        points.map(async ([lat, lon]) => {
          const response = await fetch('http://localhost:5001/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude: lat, longitude: lon }),
          });

          if (!response.ok) {
            console.error('Prediction request failed:', await response.text());
            throw new Error('Failed to get prediction');
          }
          const data = await response.json();
          return {
            coordinates: [lon, lat],
            probability: data.probability,
            satellite_image: data.satellite_image,
            risk_level: data.risk_level,
            confidence: data.confidence
          };
        })
      );
      setRoutePredictions(predictions);
      console.log('Predictions:', predictions); // For testing
      return predictions;
    } catch (error) {
      console.error('Error getting predictions:', error);
      setRoutePredictions([]);
      return [];
    }
  }, []);

  // Effect to handle toggle change
  useEffect(() => {
    if (isAnalyzingRoute && routePolyline) {
      const sampledPoints = sampleRoutePoints(routePolyline);
      getPredictionsForPoints(sampledPoints);
    } else {
      setRoutePredictions([]); // Clear predictions when toggle is off
    }
  }, [isAnalyzingRoute, routePolyline, sampleRoutePoints, getPredictionsForPoints]);

  return (
    <div>
      {/* First Card - Main Content */}
      <Card size="3" style={{ padding: '1.5rem', marginBottom: '3rem' }}>
        <Flex justify="between" align="center" style={{ marginBottom: '1rem' }}>
          <Heading size="6">
            Pathfinder
            <span className={`ai-text ${isAnalyzingRoute ? 'visible' : 'hidden'}`}>
              AI
            </span>
          </Heading>
          {routePolyline && (
            <Flex gap="2" align="center">
              <BrainCircuit size={24} color={'var(--accent-9)'}/>
              <Text size="2" color="gray">Analyze Route Risk</Text>
              <Switch 
                checked={isAnalyzingRoute}
                onCheckedChange={(checked) => setIsAnalyzingRoute(checked)}
              />
            </Flex>
          )}
        </Flex>
        
        <Flex gap="4" className="stack-layout">
          {/* Left section - Map and Search */}
          <div style={{ flex: '4', position: 'relative' }}>
            {/* Search Input */}
            <div style={{
              position: 'relative',
              width: 'calc(100% - 2rem)',
              maxWidth: '1000px',
              margin: '0',
              marginBottom: '1rem',
              zIndex: 9999,
              display: 'flex',
              gap: '3rem',
              justifyContent: 'center'
            }}>
              {/* From Location Input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  type="text"
                  value={searchFromQuery}
                  onChange={(e) => {
                    setSearchFromQuery(e.target.value);
                    searchFromAddress(e.target.value);
                  }}
                  onClick={() => setSearchFromQuery('')}
                  placeholder="Starting point..."
                  className="map-search-input"
                  style={{
                    border: '1px solid var(--gray-6)',
                    borderRadius: 'var(--radius-3)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--font-size-2)',
                    color: 'var(--gray-12)'
                  }}
                />
                {searchFromResults.length > 0 && (
                  <Card style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    marginTop: '0.5rem',
                    paddingBottom: '1rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: 'var(--gray-3)'
                  }}>
                    <Flex direction="column" gap="1">
                      {searchFromResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleFromAddressSelect(result)}
                          className="search-result-item"
                          style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--gray-12)',
                            borderBottom: index < searchFromResults.length - 1 ? '1px solid var(--gray-5)' : 'none'
                          }}
                        >
                          {result.name}
                        </button>
                      ))}
                    </Flex>
                  </Card>
                )}
              </div>

              {/* To Location Input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchAddress(e.target.value);
                  }}
                  onClick={() => setSearchQuery('')}
                  placeholder="Destination..."
                  className="map-search-input"
                  style={{
                    border: '1px solid var(--gray-6)',
                    borderRadius: 'var(--radius-3)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--font-size-2)',
                    color: 'var(--gray-12)'
                  }}
                />
                {searchResults.length > 0 && (
                  <Card style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
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
            </div>
            
            
            {/* Map with predictions */}
            <div style={{ 
              width: '100%',
              height: '600px',
              borderRadius: 'var(--radius-3)',
              overflow: 'hidden',
              marginTop: '0'
            }}>
              <WildfireRoutingMap 
                routePolyline={routePolyline}
                predictions={routePredictions}
                onLocationLoad={handleLocationLoad}
              />
            </div>
          </div>

          {/* Right section - Routing Info */}
          <div style={{ flex: '1' }}>
            <Card style={{ 
              height: '100%', 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Top info section */}
              <div>
                <Heading size="4" style={{ marginBottom: '1rem' }}>Routing Information</Heading>
                
                <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                  <strong>Estimated Time:</strong>
                  <Text color="gray"> 15 min</Text>
                </Text>
                
                <Text as="div" size="2">
                  <strong>Distance:</strong>
                  <Text color="gray"> 4.4 miles</Text>
                </Text>
              </div>

              {/* Directions section - weighted to bottom */}
              <div style={{ marginTop: 'auto' }}>
                <Heading size="2" style={{ marginBottom: '1rem' }}>Directions to Palisades</Heading>
                <Flex direction="column" gap="3">
                  {[
                    { arrow: "↑", text: "Continue straight on Rodeo Drive" },
                    { arrow: "→", text: "Turn right onto Sunset Boulevard" },
                    { 
                      arrow: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                            fill="white"/>
                        </svg>
                      ), 
                      text: "Your destination is on the right", 
                      isPin: true 
                    }
                  ].map((direction, index) => (
                    <Card key={index} style={{ 
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      backgroundColor: 'var(--gray-3)'
                    }}>
                      <Text size="5" style={{ 
                        fontSize: '1.5rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}>{direction.arrow}</Text>
                      <Text size="2">{direction.text}</Text>
                    </Card>
                  ))}
                </Flex>
              </div>
            </Card>
          </div>
        </Flex>
      </Card>

      
    </div>
  );
}

export default RoutesAnalysis; 