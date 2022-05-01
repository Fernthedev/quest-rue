import React from 'react'
import { createRoot } from 'react-dom/client';
import './index.css'
import App from './App'
import { createTheme, NextUIProvider, useTheme } from '@nextui-org/react'

import useDarkMode from 'use-dark-mode';


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
