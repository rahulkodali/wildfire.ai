import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState, useCallback } from 'react';
import WildfirePredictionMap from './WildfirePredictionMap';

function WildfireAnalysis() {
  const [predictions, setPredictions] = useState([]);
  const [isPredicting, setIsPredicting] = useState(false);

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
      setPredictions(prev => [...prev, {
        lat,
        lon,
        probability: data.probability,
        riskLevel: data.risk_level,
        confidence: data.confidence
      }]);
    } catch (error) {
      console.error('Error getting prediction:', error);
    } finally {
      setIsPredicting(false);
    }
  }, []);

  return (
    <Card size="3" style={{ padding: '1.5rem' }}>
      <Flex direction="column" gap="4">
        <Heading size="6">Wildfire Risk Analysis</Heading>
        
        <Flex gap="4">
          {/* Left section - Map */}
          <div style={{ flex: '4' }}>
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
            <Card style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Heading size="4" style={{ marginBottom: '1rem' }}>Prediction History</Heading>
              
              {predictions.length === 0 ? (
                <Text size="2" color="gray">
                  Click on the map to get wildfire risk predictions for specific locations.
                </Text>
              ) : (
                <div style={{ 
                  overflowY: 'auto', 
                  flex: 1,
                  marginRight: '-8px',  // Compensate for padding
                  paddingRight: '8px'   // Add padding for scrollbar
                }}>
                  <Flex direction="column" gap="3">
                    {predictions.toReversed().map((pred, index) => (
                      <Card key={index} style={{ backgroundColor: 'var(--gray-3)' }}>
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