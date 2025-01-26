import { Theme, Container } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css"
import './App.css'
import WildfireAnalysis from './WildfireAnalysis';

function App() {
  return (
    <Theme appearance="dark" accentColor="tomato">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)', padding: '2rem' }}>
        <Container>
          <WildfireAnalysis />
        </Container>
      </div>
    </Theme>
  )
}

export default App