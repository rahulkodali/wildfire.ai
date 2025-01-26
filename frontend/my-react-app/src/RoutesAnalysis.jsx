import { Card, Flex, Heading, Text, Link } from "@radix-ui/themes";
import { useState } from 'react';
import './RoutesAnalysis.css';

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
              top: '1.25rem',
              left: '48%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 2rem)',
              maxWidth: '770px',
              zIndex: 9999
            }}>
              <input 
                type="text"
                placeholder="Search location..."
                className="map-search-input"
              />
            </div>
            
            {/* Map Placeholder */}
            <div style={{ 
              width: '100%',
              height: '495px',
              backgroundColor: 'var(--gray-5)',
              borderRadius: 'var(--radius-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text size="5" color="gray">Map Placeholder</Text>
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