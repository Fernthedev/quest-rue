import { useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { Button, Collapse, Container, Grid, NextUIProvider } from '@nextui-org/react'
import { GameObjectCard } from './components/GameObject'
import { CubeFilled } from '@fluentui/react-icons'

function App() {

  const objects = ["GameCore", "Something", "Plant"]

  return (
    <div className="App">
      {/* Component data */}
      <Grid.Container >
        <Grid xs={true}>
          <div className="center" style={{
            minHeight: '100vh',
            height: "100%",
            width: "100%",
            // backgroundColor: "blue"
          }}>


          </div>
        </Grid>

        {/* Object list */}
        <Grid xs={2.5} style={{
          // backgroundColor: "red",
        }}>

          <Collapse.Group bordered
            accordion={false}
            style={{ minWidth: "20vw" }}>
            {objects.map(e => (
              <Collapse contentLeft={
                <CubeFilled title="GameObject" width={"25px"} height={"25px"} />
              } key={e} title={e}>

              </Collapse>
            ))}
          </Collapse.Group>

          {/* <Button.Group vertical bordered flat auto  style={{ minWidth: "20vw" }}>
            {objects.map(e => (
              <Button auto key={e}>
                {e}
              </Button>
            ))}
          </Button.Group> */}

          {/* {objects.map(e => GameObjectCard({ name: e }))} */}

        </Grid>
      </Grid.Container>
    </div >

  )
}

export default App
