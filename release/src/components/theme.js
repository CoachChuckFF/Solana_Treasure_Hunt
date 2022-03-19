import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';

const theme = createTheme({
  typography: {
    // fontFamily: [
    //   // "Vimland",
    //   "Roboto",
    //   // "LCD"
    // ].join(",")
  },
  palette: {
    primary: {
      main: '#9945FF'
    },
    secondary: {
      main: '#4FA5C4'
    },
    disabled: {
      main: '#0D0D0D',
    },
    blue: {
      main: '#4FA5C4',
    },
    green: {
      main: '#14F195',
    }
  }
});

export default function GlobalThemeOverride() {
  return (
    <ThemeProvider theme={theme}>
    </ThemeProvider>
  );
}