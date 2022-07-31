import './SceneViewer.css'
import { Text, useTheme } from '@nextui-org/react'
import GameObjectsList from '../components/GameObjectsList'
import { ComponentsManager } from '../components/ComponentsManager'
import { Tabs } from '../components/Tabs'
import { Route, Routes } from 'react-router-dom'

function SceneViewer() {
  const objects = ["GameCore", "Something", "Plant", "Really long name", "Gaming", "Mom", "Moo", "Cow", "Beep", "Beep", "Boat dog", "fern"] // .slice(0, 3)
  const { theme } = useTheme();


  // future reference
  // 100vh means 100% of the view height

  // TODO: Figure out the resizing mess smh
  return (
    <div className="App">
      {/* Object list */}
      <div className="flex">
        {/* Component data */}
        <div className="flex flex-col w-full" style={{
          // backgroundColor: "blue"
          flex: "2",
          backgroundColor: theme?.colors.accents0.value,
          minHeight: "100vh"
        }}>
          <Tabs tabs={["Tab 1", "Tab 2", "Tab 3", "Tab 4"]} selected={1}></Tabs>

          <div className="h-full w-full px-5">


            {/* TODO: Use client side routing for components */}
            <Routes>
              <Route path={"components/:gameObjectAddress"} element={<ComponentsManager />} />
            </Routes>

          </div>
        </div>

        {/* Container box for scrolling */}
        <div style={{
          maxWidth: "40%",
          minWidth: "30%",
          // maxWidth: "30vw" // TODO: Figure out how to make overflow scroll horizontal work
        }}>

          <GameObjectsList />

        </div>
      </div>
    </div >

  )
}

export default SceneViewer
