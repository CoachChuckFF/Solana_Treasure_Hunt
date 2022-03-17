import { createTheme, ThemeProvider } from '@mui/material/styles';

export const enum ST_COLORS {
    green = '#14F195',
    blue = '#4FA5C4',
    purple = '#9945FF',
    gold = '#FFB600',
    red = '#FB4E56',
    black = '#0E1922',
    white = '#EAEAEA',
    grey = '#0D0D0D'
}


export const STTheme = createTheme({
  typography: {
    fontFamily: [
    //   "Vimland",
      "Roboto",
    //   "LCD"
    ].join(",")
  },
  palette: {
    primary: {
      main: ST_COLORS.purple
    },
    secondary: {
      main: ST_COLORS.green
    },
    disabled: {
      main: ST_COLORS.grey,
    },
    green: {
        main: ST_COLORS.green,
    },
    blue: {
      main: ST_COLORS.blue,
    },
    purple: {
      main: ST_COLORS.purple,
    },
    gold: {
        main: ST_COLORS.gold,
    },
    red: {
        main: ST_COLORS.gold,
    },
    white: {
        main: ST_COLORS.white,
    },
    black: {
        main: ST_COLORS.black,
    },
    grey: {
        main: ST_COLORS.grey,
    },
  } as any
});

export const STThemeProvider = ({ children }: any) => {
    return <ThemeProvider theme={STTheme}>{children}</ThemeProvider>
}