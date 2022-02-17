import * as React from 'react';
import './../App.css' 


export function drawCurtains(curtains, message, cb) {
    curtains[0].current.className = "scene-change";

    curtains[1].current.innerText = message ?? "";

    setTimeout(()=>{
        if(cb) cb();
    }, 999);

    setTimeout(()=>{
        curtains[0].current.className = "scene-overlay";
    }, 1999);
}

export function Curtains(props) {
    return (
        <div ref={props.curtains[0]} className="scene-overlay" >
            <div ref={props.curtains[1]} className="message">
            </div>
        </div>
    );
}



