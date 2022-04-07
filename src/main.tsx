import React from 'react'
import ReactDOM from 'react-dom'
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

ReactDOM.render(
  <React.StrictMode>

    <NextUIProvider
      theme={darkTheme}
    >
      <App />
    </NextUIProvider>

  </React.StrictMode>,
  document.getElementById('root')
)
