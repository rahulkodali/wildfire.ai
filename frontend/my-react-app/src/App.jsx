import { Theme, Container, Flex, Card, Heading, Text, Link, TextField } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css"
import './App.css'

function App() {
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
    <Theme appearance="dark" accentColor="tomato">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)', padding: '2rem' }}>
        <Container>
          {/* First Card - Alerts */}
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

          {/* Second Card - Main Content */}
          <Card size="3" style={{ padding: '1.5rem' }}>
            <Heading size="6" style={{ marginBottom: '1.5rem' }}>Los Angeles, California</Heading>
            
            <Flex gap="4">
              {/* Left section - Map and Search */}
              <div style={{ flex: '4' }}>
              {/* <TextField.Root placeholder="Search the docs…">
                <TextField.Slot>
                  <MagnifyingGlassIcon height="16" width="16" />
                </TextField.Slot>
              </TextField.Root> */}

                
                {/* Map Placeholder */}
                <div style={{ 
                  width: '100%',
                  height: '600px',
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
                <Card style={{ height: '100%' }}>
                  <Heading size="4" style={{ marginBottom: '1rem' }}>Routing Information</Heading>
                  
                  <Text as="div" size="2" style={{ marginBottom: '0.5rem' }}>
                    <strong>Estimated Time:</strong>
                    <Text color="gray"> 15 minutes</Text>
                  </Text>
                  
                  <Text as="div" size="2" style={{ marginBottom: '1rem' }}>
                    <strong>Distance:</strong>
                    <Text color="gray"> 4.4 miles</Text>
                  </Text>

                  <Heading size="2" style={{ marginBottom: '0.5rem' }}>Directions</Heading>
                  <Text as="div" size="2" color="gray">
                    1. Head north on Main St<br />
                    2. Turn right onto 5th Ave<br />
                    3. Continue for 2.3 miles<br />
                    4. Destination will be on your right
                  </Text>
                </Card>
              </div>
            </Flex>
          </Card>
        </Container>
      </div>
    </Theme>
  )
}

export default App