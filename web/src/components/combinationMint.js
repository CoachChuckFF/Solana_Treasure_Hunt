import * as React from 'react';
import PropTypes from 'prop-types';
import NumberFormat from 'react-number-format';
import { styled } from '@mui/system';
import InputUnstyled from '@mui/base/InputUnstyled';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { curtains } from './curtains';

import './../App.css' 

// Icons
import { PuzzleIcon, WalletIcon, GuideIcon, RefreshIcon } from './icons';

const blue = {
  200: '#80BFFF',
  400: '#3399FF',
};

const grey = {
  50: '#F3F6F9',
  100: '#E7EBF0',
  200: '#E0E3E7',
  300: '#CDD2D7',
  400: '#B2BAC2',   
  500: '#A0AAB4',
  600: '#6F7E8C',
  700: '#3E5060',
  800: '#2D3843',
  900: '#1A2027',
};

const StyledInputElement = styled('input')(
  ({ theme }) => `
  font-size: 1.3rem;
  font-family: IBM Plex Sans, sans-serif;
  font-weight: 400;
  text-align: center;
  line-height: 1.5;
  height: 3rem;
  width: 100%;

  color: ${grey[300]};
  background: ${'#0D0D0D'};
  border: 1px solid ${'#171615'};
  border-radius: 8px;
  transition: all 150ms ease;

  &:hover {
    background: ${''};
    border-color: ${'#272727'};
  }

  &:focus {
    outline: 2px solid ${'#03E2FF'};
    outline-offset: 2px;
  }
`,
);

const CustomInput = React.forwardRef(function CustomInput(props, ref) {
  return (
    <InputUnstyled components={{ Input: StyledInputElement }} {...props} ref={ref} />
  );
});

function CodeInput(props) {

    return (
        <CustomInput 
            aria-label={`${props.byte}-input`}
            placeholder="0x00" 
            value={props.values} 
            onChange={props.handleChange}
            name={props.byte}
        />
    )
}

function TheButton(props) {
    let text = props.message;
    let color = props.loading || !props.isEnabled ? "disabled" : "primary";
    let textColor = props.loading || !props.isEnabled ?'#757575' : "#CDD2D6";
    let icon = (<div  className={props.loading ? 'icon-spin' : ''}><GuideIcon /></div>);

    if(props.wallet == null){
        color = 'primary';
        textColor = "#CDD2D6";
        text = "Connect Wallet";
        icon = (<WalletIcon />);
    }
    switch(props.state) {
        case 0: text= "Mint Map";
    }

    // return (
    //     <LoadingButton loading variant="outlined">
    //         Submit
    //     </LoadingButton>
    // )

    return (
        <Button
            color={color}
            onClick={props.handleClick}
            startIcon={icon}
            variant="contained"
            sx={{
                width: '100%',
                height: '3.14rem',
                margin: 0,
                color: textColor,
            }}
            disableElevation
        >{text}</Button>
    );
}

function ResetButton(props) {
    return (
        <Button
            color='disabled'
            onClick={props.handleClick}
            // startIcon={icon}
            variant="contained"
            sx={{
                width: '100%',
                height: '3.14rem',
                margin: 0,
            }}
            disableElevation
        >  
            <div
                style={{
                    color: "#FFFFFF",
                    fontSize: "1.3rem",
                    color: grey[300],
                }}
            >
                <RefreshIcon />
            </div>
        </Button>
    );
}

export function CombinationMint(props) {
    const byte0 = "byte0";
    const byte1 = "byte1";
    const byte2 = "byte2";
    const byte3 = "byte3";

    const state = props.state ?? 1;

    const [isWorking, setIsWorking] = React.useState(false);
    const [isEnabled, setIsEnabled] = React.useState(false);
    const [message, setMessage] = React.useState('Enter Codes');
    const [values, setValues] = React.useState({
        [byte0]: '',
        [byte1]: '',
        [byte2]: '',
        [byte3]: '',
    });

    const checkChar = (char) => {
        switch(char){
            case '0': 
            case '1': 
            case '2':
            case '3':
            case '4':
            case '5': 
            case '6': 
            case '7': 
            case '8': 
            case '9':
            case 'A':
            case 'B':
            case 'C':
            case 'D':
            case 'E':
            case 'F':
                return char;
        }

        return '';
    }
  
    const handleChange = (event) => {
        let lastVal = values[event.target.name];
        let input = event.target.value;
        let nibble0 = "";
        let nibble1 = "";

        if(input.length < 5){
            let split = (event.target.value ?? '').split('0x');
            if(lastVal !== '0x' && split.length === 1){
                nibble0 = input[0] ?? '';
                nibble1 = input[1] ?? '';
            } else if(split.length === 2){
                nibble0 = split[1][0] ?? '';
                nibble1 = split[1][1] ?? '';
            }

            nibble0 = checkChar(nibble0.toUpperCase());
            nibble1 = checkChar(nibble1.toUpperCase());
        } else {
            nibble0 = checkChar(input[3]);
        }

        nibble0 = checkChar(nibble0.toUpperCase());

        var check = {
            ...values,
            [event.target.name]: '0x' + nibble0 + nibble1,
        };

        if(
            check[byte0].length == 4 &&
            check[byte1].length == 4 &&
            check[byte2].length == 4 &&
            check[byte3].length == 4
        ){
            if(state == 1){
                if(
                    check[byte0] == '0x42' &&
                    check[byte1] == '0x6F' &&
                    check[byte2] == '0x6D' &&
                    check[byte3] == '0x62'
                ) {
                    setIsEnabled(true); 
                    setMessage('Mint Guide');
                } else {
                    setMessage('Wrong Hex');
                }
            } else {
                setIsEnabled(true);
                setMessage('Mint Guide');
            }
        } else {
            setIsEnabled(false);
        }

        setValues(check);
    };

    const handleMint = () => {
        if(props.wallet == null){
            props.connect();
        } else if(!isWorking && isEnabled){
            console.log(isWorking, " ", !isWorking)
            setTimeout(()=>{
                refresh();
            }, 2000)
            setIsWorking(true);
        }
    }

    const refresh = () => {
        curtains(props.curtains, "Tick Tock...");
        setIsWorking(false);
        setIsEnabled(false);
        setMessage('Enter Hex');
        setValues({
            [byte0]: '',
            [byte1]: '',
            [byte2]: '',
            [byte3]: '',
        });
    }
  
    return (
        <div className='code-container'>
            <Box>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <CodeInput handleChange={handleChange} values={values.byte0} byte={byte0}/>
                    </Grid>
                    <Grid item xs={6}>
                        <CodeInput handleChange={handleChange} values={values.byte1} byte={byte1}/>
                    </Grid>
                    <Grid item xs={6}>
                        <CodeInput handleChange={handleChange} values={values.byte2} byte={byte2}/>
                    </Grid>
                    <Grid item xs={6}>
                        <CodeInput handleChange={handleChange} values={values.byte3} byte={byte3}/>
                    </Grid>
                    <Grid item xs={10}>
                        <TheButton handleClick={handleMint} loading={isWorking} isEnabled={isEnabled} message={message} wallet={props.wallet}/>
                    </Grid>
                    <Grid item xs={2}>
                        <ResetButton handleClick={refresh} />
                    </Grid>
                </Grid>
            </Box>
        </div>
    );
}



