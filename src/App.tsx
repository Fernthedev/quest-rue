import { useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { Button, NextUIProvider } from '@nextui-org/react'
import GameObjectCard from './components/GameObject'

function App() {
  const [count, setCount] = useState(0)

  return (

    <div className="App">
      <div className="center" style={{
        minHeight: '100vh',
      }}>
        <GameObjectCard />
      </div>
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <p>
          <Button onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </Button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
          <GameObjectCard />
        </p>
      </header> */}
    </div>

  )
}

export default App
