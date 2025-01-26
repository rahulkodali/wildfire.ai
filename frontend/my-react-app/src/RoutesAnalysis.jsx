import { Card, Flex, Heading, Text, Link } from "@radix-ui/themes";
import { useState, useEffect, useCallback, useRef } from 'react';
import './RoutesAnalysis.css';
import WildfireRoutingMap from "./WildfireRoutingMap";

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
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const [routePolyline, setRoutePolyline] = useState(null);

  const getRoute = useCallback(async (coordA, coordB) => {
    const polys = await fetch(`http://127.0.0.1:5001`)
    
    const data = JSON.stringify({
      "point A": [coordB, coordA],
      "point B": [-118.2437, 34.0522],
      "polygon": await polys.json()
    })

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
  }, []);

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
    
    getRoute(lat, lon);
  }, [getRoute]);

  return (
    <div>
      {/* First Card - Main Content */}
      <Card size="3" style={{ padding: '1.5rem', marginBottom: '3rem' }}>
        <Heading size="6" style={{ marginBottom: '1rem' }}>Palisades, California</Heading>
        
        <Flex gap="4" className="stack-layout">
          {/* Left section - Map and Search */}
          <div style={{ flex: '4', position: 'relative' }}>
            {/* Search Input */}
            <div style={{
              position: 'absolute',
              top: '.5rem',
              left: '58%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 2rem)',
              maxWidth: '770px',
              zIndex: 9999
            }}>
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
              </div>
              
              {/* Map Placeholder */}
              <div style={{ flex: '4' }}>
              <div style={{ 
                width: '100%',
                height: '600px',
                borderRadius: 'var(--radius-3)',
                overflow: 'hidden'
              }}>
                <WildfireRoutingMap routePolyline={routePolyline} />
              </div>
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

      {/* Second Card - Alerts */}
      <Card size="3" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <Heading size="5" style={{ marginBottom: '1.5rem' }}>Latest Alerts and Guidelines</Heading>
        
        <Flex gap="4" wrap="wrap">
          {alertCards.map((card, index) => (
            <Link key={index} href={card.link} style={{ textDecoration: 'none', flex: '1 1 250px' }}>
              <Card style={{ overflow: 'hidden', height: '300px' }}>
                <div style={{ 
                  height: '60%', 
                  backgroundImage: `url(${card.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  marginBottom: '1rem'
                }} />
                <div style={{ padding: '0 1rem 1rem' }}>
                  <Heading size="3" style={{ marginBottom: '0.5rem' }}>{card.title}</Heading>
                  <Text size="2" color="gray">{card.description}</Text>
                </div>
              </Card>
            </Link>
          ))}
        </Flex>
      </Card>
    </div>
  );
}

export default RoutesAnalysis; 