import './SceneViewer.css'
import { Text, useTheme } from '@nextui-org/react'
import GameObjectsList from '../components/GameObjectsList'
import { ComponentsManager } from '../components/ComponentsManager'
import { Tabs } from '../components/Tabs'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useListenToEvent, getEvents, GameObjectJSON, PacketJSON } from '../misc/events'
import { items as main_menu_json } from "../misc/test_data_in_main_menu.json";
import { TypeManager } from '../components/TypeManager'
import { ProtoClassInfo } from "../misc/proto/il2cpp"

function SceneViewer() {
  const { theme } = useTheme();
  const navigate = useNavigate()
  const location = useLocation();

  const [tabs, setTabs] = useState<[string, string][]>(["Tab 1", "Tab 2", "Tab 3", "Tab 4"].map(e => [e, location.pathname]))

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
          <Tabs tabs={tabs.map(m => m[0])} selected={1} onTabSelected={(name, i, prevName, prevI) => {
            tabs[prevI][1] = location.pathname
            navigate(tabs[i][1])
          }} />
{/* todo: add tab button */}

          <div className="h-full w-full px-5">


            {/* TODO: Use client side routing for components */}
            <Routes>
              <Route path={"components/:gameObjectAddress"} element={<TypeManager />} />
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
