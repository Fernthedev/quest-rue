import React from 'react'
import { createRoot } from 'react-dom/client';
import './index.css'
import App from './App'
import { createTheme, NextUIProvider, useTheme } from '@nextui-org/react'

import useDarkMode from 'use-dark-mode';

import { connect } from './misc/commands';

console.log("Connecting")
connect('192.168.1.110', 3306).then(() => {
  console.log("Connected!")
}).catch((e) => {
  console.error(`Unable to connect: ${e}`)
})

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
