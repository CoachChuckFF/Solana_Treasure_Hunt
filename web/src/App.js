import './App.css';
import { useRef, useState } from "react";
import { BuildScene } from './components/buildScene';
import { CombinationMint } from './components/combinationMint';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { curtains, Curtains } from './components/curtains';
import TabsRouter from './components/router';


const theme = createTheme({
  palette: {
    primary: {
      main: '#DC1FFF'
    },
    secondary: {
      main: '#03E2FF'
    },
    disabled: {
      main: '#0D0D0D',
    }
  }
});


function ChestPage(props){

  return (
    <div>
      <BuildScene curtains={props.curtains}/>
      <CombinationMint curtains={props.curtains}/>

    </div>
  );
}

function App() {
  const [curtains, setCurtains] = useState([useRef(), useRef()]);

  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        {/* <TabsRouter /> */}
        <ChestPage curtains={curtains}/>
        <Curtains curtains={curtains}/>
      </ThemeProvider>
    </div>
  );
}

export default App;
