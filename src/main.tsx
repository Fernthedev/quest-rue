import React from 'react'
import { createRoot } from 'react-dom/client';
import './index.css'
import App from './App'
import { createTheme, NextUIProvider, useTheme } from '@nextui-org/react'

import useDarkMode from 'use-dark-mode';

import { initializeEvents } from './misc/events';
import { setupDev } from './misc/dev';

initializeEvents()
setupDev()

// TODO: Figure this out
// const darkMode = useDarkMode(true);


const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!); // createRoot(container!) if you use TypeScript

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
