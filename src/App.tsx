import './App.css'
import { Grid } from '@nextui-org/react'
import GameObjectsList from './components/GameObjectsList'

function App() {

  const objects = ["GameCore", "Something", "Plant", "Really long name", "Gaming", "Mom", "Moo", "Cow", "Beep", "Beep", "Boat dog", "fern"] // .slice(0, 3)


  // future reference
  // 100vh means 100% of the view height

  return (
    <div className="App">
      {/* Component data */}
      <Grid.Container>
        <Grid xs>
          <div className="center" style={{
            minHeight: '100vh',
            height: "100%",
            width: "100%",
            // backgroundColor: "blue"
          }}>


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
            // maxWidth: "30vw" // TODO: Figure out how to make overflow scroll horizontal work
          }}>
            <GameObjectsList objects={objects} />
          </div>
        </Grid>
      </Grid.Container>
    </div >

  )
}

export default App
