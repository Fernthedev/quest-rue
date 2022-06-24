import './App.css'
import { Text, useTheme } from '@nextui-org/react'
import GameObjectsList from './components/GameObjectsList'
import { ReactNode, useEffect, useState } from 'react'
import { getEvents, useRequestAndResponsePacket } from './misc/events'
import { GetComponentsOfGameObjectResult } from './misc/proto/qrue'
import { ComponentsManager } from './components/ComponentsManager'

function App() {
  const objects = ["GameCore", "Something", "Plant", "Really long name", "Gaming", "Mom", "Moo", "Cow", "Beep", "Beep", "Boat dog", "fern"] // .slice(0, 3)
  const { theme } = useTheme();


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
        <div style={{
          // backgroundColor: "blue"
          flex: "2 1 auto",
          backgroundColor: theme?.colors.accents0.value,
          minHeight: "100vh",
          maxWidth: "100vw",

        }}>
          <div
            className="center"

            style={{
              minHeight: "100vh",
              maxHeight: "100vh",
              minWidth: "100%",
            }}>


            <ComponentsManager />

          </div>
        </div>



        {/* Container box for scrolling */}
        <div style={{
          overflow: "auto",
          overflowY: "auto",
          flex: "1 2 auto"
          // maxWidth: "30vw" // TODO: Figure out how to make overflow scroll horizontal work
        }}

        >
          <GameObjectsList />
        </div>
      </div>
    </div >

  )
}

export default App
