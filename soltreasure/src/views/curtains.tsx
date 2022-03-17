import { Stack } from '@mui/material';
import * as React from 'react';
import { StoreContext } from '../controllers/store';
import './../App.css' 
import TestButton from './hud';

export interface CurtainsInfo {
    showing: boolean,
    message: string,
    cb?: () => void,
};

export const NULL_CURTAINS: CurtainsInfo = {
    showing: false,
    message: "",
};

// export function drawCurtains(curtains, message, cb) {
//     curtains[0].current.className = "scene-change";

//     curtains[1].current.innerText = message ?? "";

//     setTimeout(()=>{
//         if(cb) cb();
//     }, 999);

//     setTimeout(()=>{
//         curtains[0].current.className = "scene-overlay";
//     }, 1999);
// }

export function TestCurtains() {
    const [ count, setCount ] = React.useState(0);
    const {
        curtains: [state, drawCurtains],
    } = React.useContext(StoreContext)

    const sceneChange = () => {
        setCount(count + 1);

        drawCurtains(
            count.toString(),
            () => {console.log("test curtains done")}
        );
    };

    return (
        <Stack direction="row" spacing={2}>
            <TestButton onClick={sceneChange}>And scene!</TestButton>
        </Stack>
    );
}

export function STCurtains() {
    const ref = React.useRef<HTMLDivElement>(null);
    const {
        curtains: [state, drawCurtains, setCurtains],
    } = React.useContext(StoreContext)

    React.useEffect(() => {
        if( state.showing ){
            if( ref.current ){
                ref.current.className = "scene-change";
            }
            setTimeout(()=>{
                if( state.cb ) state.cb();
            }, 999);
            setTimeout(()=>{
                setCurtains(NULL_CURTAINS);
            }, 1999);
        } else {
            if( ref.current ){
                ref.current.className = "scene-overlay";
            }
        }

        return () => {}; //On Unmount
    }, [state.showing]);

    if(!state.showing) return null;
    return (
        <div ref={ref} className="scene-overlay">
            <div className="message">
                {state.message}
            </div>
        </div>
    );
}
