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
        <div className="center" style={{
          // backgroundColor: "blue"
          flex: "2 1",
          backgroundColor: theme?.colors.accents0.value,
          minHeight: "100vh",
        }}>
        <ComponentsManager />


      </div>



      {/* Container box for scrolling */}
      <div style={{
        overflow: "auto",
        maxHeight: "100vh",
        minWidth: '15%',
        maxWidth: "50%",
        flex: "1 2"
        // maxWidth: "30vw" // TODO: Figure out how to make overflow scroll horizontal work
      }}>
        <GameObjectsList objects={objects} onSelect={(id, val) => getEvents().SELECTED_GAME_OBJECT.invoke([id ?? -1, val?.name ?? "NOT FOUND"])} />
      </div>
    </div>
    </div >

  )
}

export default App
