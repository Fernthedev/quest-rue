import './App.css'
import { Text, useTheme } from '@nextui-org/react'
import GameObjectsList from './components/GameObjectsList'
import { useState } from 'react'

function App() {
  const objects = ["GameCore", "Something", "Plant", "Really long name", "Gaming", "Mom", "Moo", "Cow", "Beep", "Beep", "Boat dog", "fern"] // .slice(0, 3)
  const { theme } = useTheme();


  const [selectedObject, setSelectedObject] = useState<string | undefined>(undefined)

  // future reference
  // 100vh means 100% of the view height

  // TODO: Figure out the resizing mess smh
  return (
    <div className="App">
      {/* Object list */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
      }}>
        {/* Component data */}
        <div className="center" style={{
          // backgroundColor: "blue"
          flex: "2 1",
          backgroundColor: theme?.colors.accents0.value,
          minHeight: "100vh",
        }}>

          {/* FIX BIG TEXT TAKING UP ALL SPACE */}
          <Text size="2em">{selectedObject ?? ""}</Text>
          {/* <span style={{ fontSize:"1em" }}>{selectedObject ?? ""}</span> */}
          
        </div>



        {/* Container box for scrolling */}
        <div style={{
          overflow: "auto",
          maxHeight: "100vh",
          minWidth: '15vw',
          maxWidth: "50vw",
          flex: "1 2"
          // maxWidth: "30vw" // TODO: Figure out how to make overflow scroll horizontal work
        }}>
          <GameObjectsList objects={objects} onSelect={(val) => setSelectedObject(val?.name ?? "NOT FOUND")} />
        </div>
      </div>
    </div >

  )
}

export default App
