import { Card, Flex, Heading, Text, Button, Container } from "@radix-ui/themes";
import { Phone, Route, Newspaper, Heart, ArrowLeft, Cpu } from "lucide-react";
import { useState, useEffect, useRef } from 'react';

function AlertsTab() {
    const [activeView, setActiveView] = useState('main');
    const [scrollProgress, setScrollProgress] = useState(0);
    const cardRef = useRef(null);
    const [updates, setUpdates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleScroll = () => {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const elementCenter = rect.top + rect.height / 2;
                const distanceFromCenter = Math.abs(windowHeight / 2 - elementCenter);
                const maxDistance = windowHeight;

                // Calculate progress (1 when centered, 0 when far)
                let progress = 1 - (distanceFromCenter / maxDistance);
                progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1
                setScrollProgress(progress);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (activeView === 'updates') {
            const fetchUpdates = async () => {
                try {
                    const lat = 34.0522;
                    const lon = -118.2437;

                    // Updated URL to match the backend endpoint
                    const response = await fetch(`http://127.0.0.1:5001/fire-updates?lat=${lat}&lon=${lon}`);
                    if (!response.ok) {
                        const text = await response.text();
                        console.error('API Error:', {
                            status: response.status,
                            statusText: response.statusText,
                            responseText: text
                        });
                        throw new Error(`Failed to fetch updates: ${response.status} ${response.statusText}`);
                    }

                    const data = await response.json();
                    // The backend returns an object with an 'update' field
                    setUpdates([{
                        description: data.update,
                        timestamp: new Date().toISOString()
                    }]);
                    setLoading(false);
                } catch (err) {
                    console.error('Fetch error:', err);
                    setError(err.message);
                    setLoading(false);
                }
            };

            fetchUpdates();
        }
    }, [activeView]);

    const alertCards = [
        {
            icon: <Phone size={24} />,
            title: "Emergency Numbers",
            description: "Important contact information for emergency services",
            type: "emergency"
        },
        {
            icon: <Route size={24} />,
            title: "Evacuation Routes",
            description: "Find the nearest evacuation route in your area",
            type: "evacuation"
        },
        {
            icon: <Newspaper size={24} />,
            title: "Latest Updates",
            description: <>Current fire status and emergency broadcasts brought to you by <strong>Gemini AI</strong></>,
            type: "updates"
        },
        {
            icon: <Cpu size={24} />,
            title: "Sensor Data",
            description: "Coming soon...",
            type: "resources"
        }
    ];

    const renderMainView = () => (
        <>
            <Heading size="5" style={{ marginBottom: '1.5rem' }}>
                Emergency Information & Resources
            </Heading>

            <Flex gap="4" wrap="wrap">
                {alertCards.map((card, index) => (
                    <div
                        key={index}
                        onClick={() => setActiveView(card.type)}
                        style={{
                            textDecoration: 'none',
                            flex: '1 1 250px',
                            minWidth: '250px',
                            cursor: 'pointer'
                        }}
                    >
                        <Card
                            style={{
                                padding: '1.5rem',
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                ':hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }
                            }}
                        >
                            <Flex direction="column" gap="3">
                                <Flex
                                    align="center"
                                    style={{
                                        color: 'var(--accent-9)',
                                        marginBottom: '0.5rem'
                                    }}
                                >
                                    {card.icon}
                                </Flex>
                                <Heading size="3">{card.title}</Heading>
                                <Text size="2" color="gray">
                                    {card.description}
                                </Text>
                            </Flex>
                        </Card>
                    </div>
                ))}
            </Flex>
        </>
    );

    const renderEmergencyView = () => (
        <>
            <Flex align="center" gap="3" style={{ marginBottom: '2rem' }}>
                <Button
                    onClick={() => setActiveView('main')}
                    variant="soft"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={16} />
                    Back
                </Button>
                <Heading size="5">Emergency Numbers</Heading>
            </Flex>

            <Flex direction="column" gap="4">
                {[
                    { title: "Emergency Services", number: "911", description: "For immediate life-threatening emergencies" },
                    { title: "Fire Department", number: "1-800-555-0000", description: "For fire-related emergencies" },
                    // Add more numbers
                ].map((item, index) => (
                    <Card key={index} style={{ padding: '1rem' }}>
                        <Flex direction="column" gap="2">
                            <Heading size="3">{item.title}</Heading>
                            <Text size="6" weight="bold" style={{ color: 'var(--accent-9)' }}>
                                {item.number}
                            </Text>
                            <Text size="2" color="gray">
                                {item.description}
                            </Text>
                        </Flex>
                    </Card>
                ))}
            </Flex>
        </>
    );

    const renderEvacuationView = () => (
        <>
            <Flex align="center" gap="3" style={{ marginBottom: '2rem' }}>
                <Button
                    onClick={() => setActiveView('main')}
                    variant="soft"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={16} />
                    Back
                </Button>
                <Heading size="5">Evacuation Routes</Heading>
            </Flex>

            <Text>Select your preferred locations on the map to view possible evacuation routes</Text>
            {/* Add evacuation-specific content */}
        </>
    );

    const renderUpdatesView = () => (
        <>
            <Flex align="center" gap="3" style={{ marginBottom: '2rem' }}>
                <Button
                    onClick={() => setActiveView('main')}
                    variant="soft"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={16} />
                    Back
                </Button>
                <Heading size="5">Latest Updates</Heading>
            </Flex>

            <Flex direction="column" gap="4">
                {loading ? (
                    <Card style={{ padding: '1rem' }}>
                        <Text>Loading updates...</Text>
                    </Card>
                ) : error ? (
                    <Card style={{ padding: '1rem' }}>
                        <Text color="red">Error: {error}</Text>
                    </Card>
                ) : updates ? (
                    updates.map((update, index) => (
                        <Card key={index} style={{ padding: '1rem' }}>
                            <Flex direction="column" gap="2">
                                <Text weight="bold">{update.title}</Text>
                                <Text>{update.description}</Text>
                                <Text size="2" color="gray">
                                    {new Date(update.timestamp).toLocaleString()}
                                </Text>
                            </Flex>
                        </Card>
                    ))
                ) : (
                    <Card style={{ padding: '1rem' }}>
                        <Text>No updates available.</Text>
                    </Card>
                )}
            </Flex>
        </>
    );

    const renderResourcesView = () => (
        <>
            <Flex align="center" gap="3" style={{ marginBottom: '2rem' }}>
                <Button
                    onClick={() => setActiveView('main')}
                    variant="soft"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={16} />
                    Back
                </Button>
                <Heading size="5">Sensor Data</Heading>
            </Flex>

            <Flex direction="column" gap="4">
                {/* Add resources content */}
                <Card style={{ padding: '1rem' }}>
                    <Text weight="bold">Sensor Data:</Text>
                    <Text>  Coming soon...</Text>
                </Card>
            </Flex>
        </>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'main':
                return renderMainView();
            case 'emergency':
                return renderEmergencyView();
            case 'evacuation':
                return renderEvacuationView();
            case 'updates':
                return renderUpdatesView();
            case 'resources':
                return renderResourcesView();
            default:
                return renderMainView();
        }
    };

    return (
        <Card
            ref={cardRef}
            size="3"
            style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: scrollProgress === 1 ? '100%' : '1100px',
                margin: '0 auto 2rem auto',
                opacity: 0.3 + (scrollProgress * 0.7),
                transform: `scale(${0.8 + (scrollProgress * 0.2)})`,
                transition: 'all 0.3s ease-out',
                position: scrollProgress === 1 ? 'fixed' : 'relative',
                top: scrollProgress === 1 ? '0' : 'auto',
                left: scrollProgress === 1 ? '0' : 'auto',
                right: scrollProgress === 1 ? '0' : 'auto',
                bottom: scrollProgress === 1 ? '0' : 'auto',
                height: scrollProgress === 1 ? '100vh' : 'auto',
                borderRadius: scrollProgress === 1 ? '0' : undefined,
                zIndex: 1000,
            }}
        >
            {renderContent()}
        </Card>
    );
}

export default AlertsTab;