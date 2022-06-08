import React from 'react'
import { createRoot } from 'react-dom/client';
import './index.css'
import App from './App'
import { createTheme, NextUIProvider, useTheme } from '@nextui-org/react'

import useDarkMode from 'use-dark-mode';

import { connect } from './misc/commands';
import { initializeEvents } from './misc/events';

initializeEvents()

// MAKE A .env.development or .env.development.local file WITH THESE CONTENTS:
// VITE_QUEST_IP="MY_QUEST_IP"
// VITE_QUEST_PORT=3306
console.log("Connecting")
let port = parseInt(import.meta.env.VITE_QUEST_PORT);
if (!port) port = 3306

connect(import.meta.env.VITE_QUEST_IP, port);

const lightTheme = createTheme({
  type: 'dark',
})

const darkTheme = createTheme({
  type: 'dark',
})


// TODO: Figure this out
// const darkMode = useDarkMode(true);


const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!); // createRoot(container!) if you use TypeScript

root.render(
  <React.StrictMode>

    <NextUIProvider
      theme={darkTheme}
    >
      <App />
    </NextUIProvider>

  </React.StrictMode>,
)
