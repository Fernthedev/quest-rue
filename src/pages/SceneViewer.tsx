import './SceneViewer.css'
import { Text, useTheme } from '@nextui-org/react'
import GameObjectsList from '../components/GameObjectsList'
import { ComponentsManager } from '../components/ComponentsManager'
import { Tabs } from '../components/Tabs'
import { Route, Routes } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useListenToEvent, getEvents, GameObjectJSON } from '../misc/events'
import { items as main_menu_json } from "../misc/test_data_in_main_menu.json";
import { TypeManager } from '../components/TypeManager'
import { ProtoClassInfo } from "../misc/proto/il2cpp"

function SceneViewer() {
  const { theme } = useTheme();

  const objects = useListenToEvent(getEvents().GAMEOBJECTS_LIST_EVENT) ?? (import.meta.env.VITE_USE_QUEST_MOCK ? main_menu_json : undefined)

  // useEffect(() => {
  //   console.log(JSON.stringify(objects))
  // }, [objects])


  const objectsMap: Record<number, [GameObjectJSON, symbol]> | undefined = useMemo(() => {
    if (!objects) return undefined;

    const obj: Record<number, [GameObjectJSON, symbol]> = {}
    objects?.forEach(o => {
      obj[o.transform!.address!] = [o, Symbol(o.transform!.address)];
    });

    return obj;
  }, [objects]);

  const tempInfo = ProtoClassInfo.fromObject({
    namespaze: "UnityEngine",
    clazz: "GameObject"
  })

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
              <Route path={"/components/:gameObjectAddress"} element={<TypeManager info={tempInfo} />} />
            </Routes>

          </div>
        </div>

        {/* Container box for scrolling */}
        <div style={{
          maxWidth: "40%",
          minWidth: "30%",
          // maxWidth: "30vw" // TODO: Figure out how to make overflow scroll horizontal work
        }}>

          <GameObjectsList objectsMap={objectsMap} />

        </div>
      </div>
    </div >

  )
}

export default SceneViewer
