import * as React from 'react';
import Button from '@mui/material/Button';
import './../App.css' 

export function StateView(props) {
    return (
        <div className="state-container" >
            {props.state}
        </div>
    );
}