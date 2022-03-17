import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import './App.css';
import StoreProvider, { StoreContext } from './controllers/store';
import { STTheme, STThemeProvider } from './models/theme';
import { STCurtains, TestCurtains } from './views/curtains';
import TestButton from './views/hud';
import STSnackbar, { SNACKBAR_SEVERITY, TestSnackbar } from './views/snackbar';

function App() {
  return (
    <div className="App">
      <STThemeProvider>
        <StoreProvider>
          <TestSnackbar/>
          <TestCurtains/>
          <STSnackbar/>
          <STCurtains/>
        </StoreProvider>
      </STThemeProvider>
    </div>
  );
}

export default App;
