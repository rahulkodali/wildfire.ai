import { Theme, Container, Text } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css"
import './App.css'
import WildfireAnalysis from './WildfireAnalysis';
import RoutesAnalysis from './RoutesAnalysis';
import AddressSearch from './AddressSearch';
import { useState, useEffect } from 'react';
import AlertsTab from './AlertsTab';

function App() {
  const [activeTab, setActiveTab] = useState('routes');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (window.scrollY === 0) {
        setIsVisible(true);
      } else if (window.scrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const getActiveComponent = () => {
    switch (activeTab) {
      case 'address':
        return <AddressSearch />;
      case 'routes':
        return <RoutesAnalysis />;
      case 'wildfire':
        return <WildfireAnalysis />;
      default:
        return null;
    }
  };

  return (
    <Theme appearance="dark" accentColor="tomato">
      {/* Navigation Bar */}
      <div style={{ 
        backgroundColor: 'black', 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: `translateY(${isVisible ? '0' : '-100%'})`,
        transition: 'transform 0.3s ease-in-out'
      }}>
        <Container>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 0',
          }}>
            <Text size="5" weight="bold" style={{ color: 'var(--tomato-9)' }}>wildfire.</Text>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <button 
                onClick={() => setActiveTab('routes')}
                className={`nav-button ${activeTab === 'routes' ? 'active' : ''}`}
              >
                Pathfinder
              </button>
              <button 
                onClick={() => setActiveTab('address')}
                className={`nav-button ${activeTab === 'address' ? 'active' : ''}`}
              >
                Wildfire Risk
              </button>
              <button 
                onClick={() => setActiveTab('wildfire')}
                className={`nav-button ${activeTab === 'wildfire' ? 'active' : ''}`}
              >
                MultiView Risk Prediction
              </button>
            </div>
          </div>
        </Container>
      </div>

      <div style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)', padding: '2rem 2rem 0', marginTop: '4rem', marginBottom: '-6rem'
       }}>
        <Container>
          {getActiveComponent()}
        </Container>
      </div>
      {/* Second Card - Alerts */}
      <AlertsTab />
    </Theme>
  )
}

export default App