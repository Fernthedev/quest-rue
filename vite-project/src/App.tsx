import './App.css'
import { Grid, Text } from '@nextui-org/react'
import GameObjectsList from './components/GameObjectsList'
import { useState } from 'react'

function App() {
  const objects = ["GameCore", "Something", "Plant", "Really long name", "Gaming", "Mom", "Moo", "Cow", "Beep", "Beep", "Boat dog", "fern"] // .slice(0, 3)


  const [selectedObject, setSelectedObject] = useState<string | undefined>(undefined)

  // future reference
  // 100vh means 100% of the view height

  return (
    <div className="App">
      {/* Component data */}
      <Grid.Container>
        <Grid xs css={{ backgroundColor: "$accents0", minHeight:"100vh" }}>
          <div className="center" style={{
            height: "100%",
            width: "100%",
            // backgroundColor: "blue"
          }}>

            {/* FIX BIG TEXT TAKING UP ALL SPACE */}
            <Text h3>{selectedObject ?? ""}</Text>

          </div>
        </Grid>

        {/* Object list */}
        <Grid alignItems='stretch' css={{
          // backgroundColor: "red",
        }}>

          {/* Container box for scrolling */}
          <div style={{
            overflow: "auto",
            maxHeight: "100vh",
            minWidth: '15vw',
            maxWidth: "50vw"
            // maxWidth: "30vw" // TODO: Figure out how to make overflow scroll horizontal work
          }}>
            <GameObjectsList objects={objects} onSelect={(val) => setSelectedObject(val as string)} />
          </div>
        </Grid>
      </Grid.Container>
    </div >

  )
}

export default App
