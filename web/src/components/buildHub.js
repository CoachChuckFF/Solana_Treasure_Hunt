import React, { Suspense, useRef, useState, useEffect, useLayoutEffect } from "react";
import { useGLTF, Stars, PointerLockControls, ScrollControls, Plane } from "@react-three/drei";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3, Raycaster, PerspectiveCamera, GridHelper, DirectionalLight, Shape, DoubleSide, PointLight } from 'three';
import { EffectComposer, Bloom, Outline } from '@react-three/postprocessing'
import { Text } from "troika-three-text";
import * as FSM from './fsm';
import { STControls } from "./cameraControl";

import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { extend } from '@react-three/fiber'

import fonts from "./fonts";

import { curtains } from './curtains';
import { getGuideCodes, codeToHexString } from "./hashes";
import { lerp } from "three/src/math/MathUtils";

extend({ TextGeometry })
extend({ Text });

const SupernovaStart = 5;
const SupernovaMinScale = 0.01;
const SupernovaMaxScale = 400;
const SupernovaDuration = 60;

// MODELS -----------------
const BlueKeyGLB = "models/sol/blue_key.glb";
const BlueLockGLB = "models/sol/blue_lock.glb";
const BlueUnlockGLB = "models/sol/blue_unlock.glb";

const GreenKeyGLB = "models/sol/green_key.glb";
const GreenLockGLB = "models/sol/green_lock.glb";
const GreenUnlockGLB = "models/sol/green_unlock.glb";

const PurpleKeyGLB = "models/sol/purple_key.glb";
const PurpleLockGLB = "models/sol/purple_lock.glb";
const PurpleUnlockGLB = "models/sol/purple_unlock.glb";

const BrokenKeyGLB = "models/sol/broken_key.glb";

const BlackKeyGLB = "models/sol/black_key.glb";
const BlackLockGLB = "models/sol/black_lock.glb";
const BlackUnlockGLB = "models/sol/black_unlock.glb";

const WhiteKeyGLB = "models/sol/white_key.glb";
const WhiteLockGLB = "models/sol/white_lock.glb";
const WhiteUnlockGLB = "models/sol/white_unlock.glb";

const ChestOpenedGLB = "models/sol/chest_opened.glb";
const ChestClosedGLB = "models/sol/chest_closed.glb";

const WhiteChestOpenedGLB = "models/sol/white_chest_opened.glb";
const WhiteChestClosedGLB = "models/sol/white_chest_closed.glb";

const ReplayTokenGLB = "models/sol/replay_token.glb";
const MirrorGLB = "models/sol/mirror.glb";
const FishGLB = "models/sol/fish.glb";

// GLOBALS -----------------
const PI = Math.PI;
const TRI = Math.sqrt(3)/2;

const HubRadius = 5.5;
const HexTheta = (2*PI/6);
const Thirty = HexTheta / 2;
const HubZ = Math.sin(Thirty) * (TRI * HubRadius)
const HubX = Math.cos(Thirty) * (TRI * HubRadius)


const EyeLevel = 1.21;

//Lights
const PointLightIntensity = 0.11;
const PointLightHeight = EyeLevel + 3;
const PointLightDistanceBehind = 0.8;

//Camera
const Fov = 60;

//Distances
const superNovaDistance = 888
const EdgeWidth = HubRadius

const StartingCamera = {pos: [0, EyeLevel, superNovaDistance], rot: [0, 0, 0]};
export const TargetCamera = {pos: [0, EyeLevel, 0], rot: [0, 0, 0]};
export const SecretCamera = [0x13, 0x34, 0x55];
const SecretHubPos = [SecretCamera[0], SecretCamera[1] - EyeLevel, SecretCamera[2]];
const HubIndex0 = {pos: [0, 0, -HubRadius], light: [0, PointLightHeight, -HubRadius * PointLightDistanceBehind], rot: [0, 0, 0], point: [0, -5, -HubRadius]};
const HubIndex1 = {pos: [HubX, 0, -HubZ], light: [HubX * PointLightDistanceBehind, PointLightHeight, -HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 1), 0], point: [0, -5, -HubRadius]};
const HubIndex2 = {pos: [HubX, 0, HubZ], light: [HubX * PointLightDistanceBehind, PointLightHeight, HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 2), 0], point: [0, -5, -HubRadius]};
const HubIndex3 = {pos: [0, 0, HubRadius],light: [0, PointLightHeight, HubRadius * PointLightDistanceBehind], rot: [0, -(HexTheta * 3), 0], point: [0, -5, -HubRadius]};
const HubIndex4 = {pos: [-HubX, 0, HubZ], light: [-HubX * PointLightDistanceBehind, PointLightHeight, HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 4), 0], point: [0, -5, -HubRadius]};
const HubIndex5 = {pos: [-HubX, 0, -HubZ], light: [-HubX * PointLightDistanceBehind, PointLightHeight, -HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 5), 0], point: [0, -5, -HubRadius]};

const MasterHubInfo = [
    HubIndex0,
    HubIndex1,
    HubIndex2,
    HubIndex3,
    HubIndex4,
    HubIndex5,
]

//Scales
const scaleChest = 0.5;
const scaleLock = 0.55;
const scaleMiniLock = 0.13;
const keyScale = 0.013;

//Times
const zoomInTime = 5000;
const cheaterTime = 1000 * 60 * 10;



// HELPERS -----------------
const _second = 1000;
const _minute = _second * 60;
const _hour = _minute * 60;
const _day = _hour * 24;

function getTimeString (time){

    var hours = Math.floor((time) / _hour);
    var minutes = Math.floor((time % _hour) / _minute);
    var seconds = Math.floor((time % _minute) / _second);
    var ms = Math.floor((time % _second));

    if(hours === 0){
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(ms).padStart(3, '0')}`;
    } else {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

}

function addPos(pos0, pos1){
    return [
        pos0[0] + pos1[0],
        pos0[1] + pos1[1],
        pos0[2] + pos1[2],
    ];
}

function overwritePos(pos, index, value){
    return [
        index === 0 ? value : pos[0],
        index === 1 ? value : pos[1],
        index === 2 ? value : pos[2],
    ];
}


function comparePos(pos0, pos1){
    return (
        pos0[0] === pos1[0] &&
        pos0[1] === pos1[1] &&
        pos0[2] === pos1[2]
    );
}

function compareVec(vec0, vec1){
    return (
        vec0.x === vec1.x &&
        vec0.y === vec1.y &&
        vec0.z === vec1.z
    );
}


function BuildGLB(props){
    const { scene } = useGLTF(props.file);
    const scaleFactor = 1.1;


    useFrame(({ clock, camera }) => { if(props.animation) props.animation(clock, camera); });

    const pointerOver = () => {
        if(props.isInventory) {
            props.objRef.current.scale.x *= scaleFactor;
            props.objRef.current.scale.y *= scaleFactor;
            props.objRef.current.scale.z *= scaleFactor;
        }
    }

    const pointerOut = () => {
        if(props.isInventory) {
            props.objRef.current.scale.x *= 1/scaleFactor;
            props.objRef.current.scale.y *= 1/scaleFactor;
            props.objRef.current.scale.z *= 1/scaleFactor;
        }
    }

    const gotoURL = () => {
        if(props.url) {
            window.open(props.url, '_blank');
        }
    }

    return (<Suspense fallback={null}><primitive onClick={()=>{gotoURL();}} onPointerOver={(e) => { pointerOver() }} onPointerOut={(e) => { pointerOut() }} ref={ props.objRef } object={ scene.clone() } scale={ props.scale } position={ props.position } rotation={ props.rotation }/></Suspense>);
}

// GLB FILES ---------------
function OpenedChest(props) {
    const refs = [
        useRef(),
        useRef(),
    ];

    useFrame(({ clock, camera }) => {
        refs[0].current.position.x = HubIndex0.pos[0] + Math.sin(clock.getElapsedTime()) * 0.021
        refs[0].current.position.y = HubIndex0.pos[1] + Math.sin(clock.getElapsedTime()/2) * 0.021
        // refs[0].current.position.y = 0.8 + Math.sin(clock.getElapsedTime() + PI/4) * 0.089;
        refs[1].current.position.x = HubIndex0.pos[0] + Math.sin(clock.getElapsedTime()) * 0.021
        refs[1].current.position.y = HubIndex0.pos[1] + Math.sin(clock.getElapsedTime()/2) * 0.021 + 1
        refs[1].current.rotation.y += PI / 300;
        // refs[2].current.position.y = 0.4 + Math.sin(clock.getElapsedTime() + PI/8) * 0.089;
    });

    return (
        <group>
            <Timer bomb={props.bomb} opened={true} run={props.run} state={props.state} puzzleState={props.puzzleState}/>
            <BuildGLB 
                file={ChestOpenedGLB}
                objRef={ refs[0] }
                scale={scaleChest}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            /> 
            <BuildGLB 
                file={ReplayTokenGLB}
                objRef={ refs[1] }
                scale={scaleChest}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            /> 
        </group>
    );
}

function Chest(props) { 
    const refs = [
        useRef(),
        useRef(),
        useRef(),
        useRef(),
    ];

    const getOffset = (isY) => {
        return (isY ? Math.sin(Date.now() / 1000 / 2) : Math.sin(Date.now()/1000)) * 0.021;
    }  
    
    const getLittleYOffset = (yOffset) => {
        return  Math.sin(Date.now()/1000/2 + yOffset) * 0.089
    }

    const getAnimationOffset = (index) => {
        const divisor = 21;
        return getLittleYOffset(PI/(divisor * index));
    }

    const getItemPos = (xOffset, yOffset, x, y, z, index) => {
        return [
            (HubIndex0.pos[0]) + xOffset + x,
            (HubIndex0.pos[1]) + yOffset + y + (index ? getAnimationOffset(index) : 0),
            (HubIndex0.pos[2]) + z,
        ]
    }

    useFrame(({ clock, camera }) => {
        let xOffset = getOffset();
        let yOffset = getOffset(true);

        let chestPos = getItemPos(xOffset, yOffset, 0,0,0);
        refs[3].current.position.x = chestPos[0];
        refs[3].current.position.y = chestPos[1];
        refs[3].current.position.z = chestPos[2];

        let blueLock = getItemPos(xOffset, yOffset, 0.21, 0.8, 0.89, 2);
        refs[0].current.position.x = blueLock[0];
        refs[0].current.position.y = blueLock[1];
        refs[0].current.position.z = blueLock[2];

        let greenLock = getItemPos(xOffset, yOffset, -0.21, 0.8, 0.85, 4);
        refs[1].current.position.x = greenLock[0];
        refs[1].current.position.y = greenLock[1];
        refs[1].current.position.z = greenLock[2];

        let purpleLock = getItemPos(xOffset, yOffset, 0, 0.4, 0.89, 3);
        refs[2].current.position.x = purpleLock[0];
        refs[2].current.position.y = purpleLock[1];
        refs[2].current.position.z = purpleLock[2];

    });

    return (
        <group>
            <Timer bomb={props.bomb} opened={false} run={props.run} state={props.state} puzzleState={props.puzzleState}/>
            <BuildGLB 
                file={props.puzzleState.blue ? BlueUnlockGLB : BlueLockGLB}
                objRef={ refs[0] }
                scale={scaleMiniLock}
                position={getItemPos(getOffset(), getOffset(true), 0.21, 0.8, -0.89, 1)}
                rotation={[0,0,0]}
            />
            <BuildGLB 
                file={props.puzzleState.green ? GreenUnlockGLB : GreenLockGLB}
                objRef={ refs[1]  }
                scale={scaleMiniLock}
                position={getItemPos(getOffset(), getOffset(true), -0.21, 0.8, -0.85, 3)}
                rotation={[0,0,0]}
            />
            <BuildGLB 
                file={props.puzzleState.purple ? PurpleUnlockGLB : PurpleLockGLB}
                objRef={ refs[2]  }
                scale={scaleMiniLock}
                position={getItemPos(getOffset(), getOffset(true), 0, 0.4, -0.89, 2)}
                rotation={[0,0,0]}
            /> 
            <BuildGLB 
                file={ChestClosedGLB}
                objRef={ refs[3]  }
                scale={scaleChest}
                position={getItemPos(getOffset(), getOffset(true), 0,0,0)}
                rotation={HubIndex0.rot}
            />
        </group>
    );
}

function SecretChest(props) { 
    const refs = [
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
    ];

    const getOffset = (isY) => {
        return (isY ? Math.sin(Date.now() / 1000 / 2) : Math.sin(Date.now()/1000)) * 0.021;
    }  
    
    const getLittleYOffset = (yOffset) => {
        return  Math.sin(Date.now()/1000/2 + yOffset) * 0.089
    }

    const getAnimationOffset = (index) => {
        const divisor = 21;
        return getLittleYOffset(PI/(divisor * index));
    }

    const getItemPos = (xOffset, yOffset, x, y, z, index) => {
        return [
            (HubIndex3.pos[0] + SecretHubPos[0]) + xOffset + x,
            (HubIndex3.pos[1] + SecretHubPos[1]) + yOffset + y + (index ? getAnimationOffset(index) : 0),
            (HubIndex3.pos[2] + SecretHubPos[2]) + z,
        ]
    }

    useFrame(({ clock, camera }) => {
        let xOffset = getOffset();
        let yOffset = getOffset(true);

        let chestPos = getItemPos(xOffset, yOffset, 0,0,0);
        refs[5].current.position.x = chestPos[0];
        refs[5].current.position.y = chestPos[1];
        refs[5].current.position.z = chestPos[2];

        let blueLock = getItemPos(xOffset, yOffset, 0.21, 0.8, -0.89, 2);
        refs[0].current.position.x = blueLock[0];
        refs[0].current.position.y = blueLock[1];
        refs[0].current.position.z = blueLock[2];

        let greenLock = getItemPos(xOffset, yOffset, -0.21, 0.8, -0.85, 4);
        refs[1].current.position.x = greenLock[0];
        refs[1].current.position.y = greenLock[1];
        refs[1].current.position.z = greenLock[2];

        let purpleLock = getItemPos(xOffset, yOffset, 0, 0.4, -0.89, 3);
        refs[2].current.position.x = purpleLock[0];
        refs[2].current.position.y = purpleLock[1];
        refs[2].current.position.z = purpleLock[2];

        let blackLock = getItemPos(xOffset, yOffset, 0.37, 0.4, -0.89, 1);
        refs[3].current.position.x = blackLock[0];
        refs[3].current.position.y = blackLock[1];
        refs[3].current.position.z = blackLock[2];

        let whiteLock = getItemPos(xOffset, yOffset, -0.37, 0.4, -0.89, 5);
        refs[4].current.position.x = whiteLock[0];
        refs[4].current.position.y = whiteLock[1];
        refs[4].current.position.z = whiteLock[2];
    });

    return (
        <group>
            <BuildGLB 
                file={props.puzzleState.blue ? BlueUnlockGLB : BlueLockGLB}
                objRef={ refs[0] }
                scale={scaleMiniLock}
                position={getItemPos(getOffset(), getOffset(true), 0.21, 0.8, -0.89, 1)}
                rotation={[0,-PI,0]}
            />
            <BuildGLB 
                file={props.puzzleState.green ? GreenUnlockGLB : GreenLockGLB}
                objRef={ refs[1]  }
                scale={scaleMiniLock}
                position={getItemPos(getOffset(), getOffset(true), -0.21, 0.8, -0.85, 3)}
                rotation={[0,-PI,0]}
            />
            <BuildGLB 
                file={props.puzzleState.purple ? PurpleUnlockGLB : PurpleLockGLB}
                objRef={ refs[2]  }
                scale={scaleMiniLock}
                position={getItemPos(getOffset(), getOffset(true), 0, 0.4, -0.89, 2)}
                rotation={[0,-PI,0]}
            /> 
            <BuildGLB 
                file={props.puzzleState.black ? BlackUnlockGLB : BlackLockGLB}
                objRef={ refs[3]  }
                scale={scaleMiniLock}
                position={getItemPos(getOffset(), getOffset(true), 0.37, 0.4, -0.89, 0)}
                rotation={[0,-PI,0]}
            /> 
            <BuildGLB 
                file={props.puzzleState.white ? WhiteUnlockGLB : WhiteLockGLB}
                objRef={ refs[4]  }
                scale={scaleMiniLock}
                position={getItemPos(getOffset(), getOffset(true), -0.37, 0.4, -0.89, 4)}
                rotation={[0,-PI,0]}
            /> 
            <BuildGLB 
                file={WhiteChestClosedGLB}
                objRef={ refs[5]  }
                scale={scaleChest}
                position={getItemPos(getOffset(), getOffset(true), 0,0,0)}
                rotation={HubIndex3.rot}
            />
        </group>
    );
}

function Inventory(props) {
    const refs = [
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
    ];

    const animation = (clock, camera) => {
        let inventory = Object.entries(props.puzzleState);
        for(var i = 0; i < refs.length; i++){  
            if(inventory[i][1] && props.state === FSM.Playing){
                refs[i].current.position.copy( camera.position );
                refs[i].current.rotation.copy( camera.rotation );
                refs[i].current.updateMatrix();
                refs[i].current.translateZ( -0.3 );
                refs[i].current.translateY( 0.155 );
                refs[i].current.translateX( -0.06 + (i / (refs.length - 1) * 0.12));
                refs[i].current.rotateZ(-PI/2);
                refs[i].current.rotateY(-PI/8);
                refs[i].current.rotateX(clock.getElapsedTime() / 2 - (i * PI/5));
            } else {
                refs[i].current.visable = false;
            }
        }
    };

    return (
        <group>
            <BuildGLB 
                isInventory={true}
                url={'https://www.google.com/imgres?imgurl=https%3A%2F%2Fmedia.istockphoto.com%2Fphotos%2Fto-do-list-in-notebook-with-calendar-picture-id1092571024%3Fk%3D20%26m%3D1092571024%26s%3D612x612%26w%3D0%26h%3Ddz6l5jjYZC0lU2dUkqu5g5_0XtY3xnHs57mJDNlvJSk%3D&imgrefurl=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Fto-do-list&tbnid=6I-BwtfLiBk3nM&vet=12ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ..i&docid=1HDtarEtGxSSIM&w=612&h=408&q=img%20of%20todo&ved=2ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ'}
                file={BlueKeyGLB}
                animation={animation}
                objRef={ refs[0]  }
                scale={keyScale}
                visable={(props.puzzleState.blue && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                isInventory={true}
                url={'https://www.google.com/imgres?imgurl=https%3A%2F%2Fmedia.istockphoto.com%2Fphotos%2Fto-do-list-in-notebook-with-calendar-picture-id1092571024%3Fk%3D20%26m%3D1092571024%26s%3D612x612%26w%3D0%26h%3Ddz6l5jjYZC0lU2dUkqu5g5_0XtY3xnHs57mJDNlvJSk%3D&imgrefurl=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Fto-do-list&tbnid=6I-BwtfLiBk3nM&vet=12ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ..i&docid=1HDtarEtGxSSIM&w=612&h=408&q=img%20of%20todo&ved=2ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ'}
                file={GreenKeyGLB}
                animation={animation}
                objRef={ refs[1]  }
                scale={keyScale}
                visable={(props.puzzleState.green && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                isInventory={true}
                url={'https://www.google.com/imgres?imgurl=https%3A%2F%2Fmedia.istockphoto.com%2Fphotos%2Fto-do-list-in-notebook-with-calendar-picture-id1092571024%3Fk%3D20%26m%3D1092571024%26s%3D612x612%26w%3D0%26h%3Ddz6l5jjYZC0lU2dUkqu5g5_0XtY3xnHs57mJDNlvJSk%3D&imgrefurl=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Fto-do-list&tbnid=6I-BwtfLiBk3nM&vet=12ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ..i&docid=1HDtarEtGxSSIM&w=612&h=408&q=img%20of%20todo&ved=2ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ'}
                file={PurpleKeyGLB}
                animation={animation}
                objRef={ refs[2]  }
                scale={keyScale}
                visable={(props.puzzleState.purple && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                isInventory={true}
                url={'https://www.google.com/imgres?imgurl=https%3A%2F%2Fmedia.istockphoto.com%2Fphotos%2Fto-do-list-in-notebook-with-calendar-picture-id1092571024%3Fk%3D20%26m%3D1092571024%26s%3D612x612%26w%3D0%26h%3Ddz6l5jjYZC0lU2dUkqu5g5_0XtY3xnHs57mJDNlvJSk%3D&imgrefurl=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Fto-do-list&tbnid=6I-BwtfLiBk3nM&vet=12ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ..i&docid=1HDtarEtGxSSIM&w=612&h=408&q=img%20of%20todo&ved=2ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ'}
                file={BrokenKeyGLB}
                animation={animation}
                objRef={ refs[3]  }
                scale={keyScale}
                visable={(props.puzzleState.broken && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                isInventory={true}
                url={'https://www.google.com/imgres?imgurl=https%3A%2F%2Fmedia.istockphoto.com%2Fphotos%2Fto-do-list-in-notebook-with-calendar-picture-id1092571024%3Fk%3D20%26m%3D1092571024%26s%3D612x612%26w%3D0%26h%3Ddz6l5jjYZC0lU2dUkqu5g5_0XtY3xnHs57mJDNlvJSk%3D&imgrefurl=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Fto-do-list&tbnid=6I-BwtfLiBk3nM&vet=12ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ..i&docid=1HDtarEtGxSSIM&w=612&h=408&q=img%20of%20todo&ved=2ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ'}
                file={BlackKeyGLB}
                animation={animation}
                objRef={ refs[4]  }
                scale={keyScale}
                visable={(props.puzzleState.black && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                isInventory={true}
                url={'https://www.google.com/imgres?imgurl=https%3A%2F%2Fmedia.istockphoto.com%2Fphotos%2Fto-do-list-in-notebook-with-calendar-picture-id1092571024%3Fk%3D20%26m%3D1092571024%26s%3D612x612%26w%3D0%26h%3Ddz6l5jjYZC0lU2dUkqu5g5_0XtY3xnHs57mJDNlvJSk%3D&imgrefurl=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Fto-do-list&tbnid=6I-BwtfLiBk3nM&vet=12ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ..i&docid=1HDtarEtGxSSIM&w=612&h=408&q=img%20of%20todo&ved=2ahUKEwjNoMjE44v2AhUJZM0KHaplDoAQMygAegUIARDhAQ'}
                file={WhiteKeyGLB}
                animation={animation}
                objRef={ refs[5]  }
                scale={keyScale}
                visable={(props.puzzleState.white && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
        </group>
    );
}
function Leaderboard(props) { 
    const [deltaY, setDeltaY] = useState(0);
    const [didUpdate, setDidUpdate] = useState(false);
    const refs = [useRef(),useRef()];


    const diff = 0.5;
    useFrame(({ clock, camera }) => { 
        if(!didUpdate){
            let newPos = Math.min(refs[0].current.position.y + (deltaY / 1000), 2.4);
            newPos = Math.max(newPos, -1.55);
            refs[0].current.position.y = newPos;
            refs[1].current.position.y = newPos - diff;

            setDidUpdate(true);
        }
        
    });

    if(props.deltaY != deltaY){
        setDeltaY(props.deltaY);
        setDidUpdate(false);
    }

    const tempLeaders = [
        {
            wallet: 'HAzgWmFC2TGw1Ry6C3h2i2eAnnbrD91wDremBSxXBgCB',
            time: '0:34',
        },
        {
            wallet: '7RawqnUsUxA8pnb8nAUTgyzRaLVRYwR9yzPR3gfzbdht',
            time: '0:55',
        },
        {
            wallet: 'JD5C5Bsp3q9jeC5S57QuSCDDfpeKzXvRkfPB3Td6x3Wh',
            time: '1:21',
        },
    ]

    let leaders = "";

    for(var i = 0; i < tempLeaders.length; i++){
        leaders += `${i+1}: ${tempLeaders[i].wallet.substring(0, 5)} in ${tempLeaders[i].time}\n`;
    }

    return (
        <group >
        <text
            ref={refs[0]}
            position={[HubX, (EyeLevel + 0.5) + diff, -HubZ]}
            rotation={HubIndex1.rot}
            fontSize={0.2}
            maxWidth={2.34}
            lineHeight={1.55}
            letterSpacing={0}
            text={"LEADERBOARDS"}
            font={fonts['Roboto']}
            anchorX="center"
            anchorY="top"
        >
            <meshPhongMaterial attach="material" color={'#FFFFFF'} />
        </text>
            <text
                ref={refs[1]}
                position={[HubX, (EyeLevel + 0.5), -HubZ]}
                rotation={HubIndex1.rot}
                fontSize={0.15}
                maxWidth={2.34}
                lineHeight={1.55}
                letterSpacing={0}
                text={leaders}
                font={fonts['Roboto']}
                anchorX="center"
                anchorY="top"
            >
                <meshPhongMaterial attach="material" color={'#FFFFFF'} />
            </text>
        </group>

    );
}

function Lock(props) {
    const objRef = useRef();

    const getTheta = () => {
        return Date.now()/1000 + props.index * PI/5;
    }
    const getYPos = (theta) => {
        return Math.sin(theta) * 0.1 + 0.34 + (props.secret ? SecretHubPos[1] : 0);
    }
    const getYRot = (theta) => {
        return theta / 2.1;
    }

    const animation = (clock, camera) => {
        let theta = getTheta();
        objRef.current.position.y = getYPos(theta);

        if(!props.locked){
            objRef.current.rotation.y = getYRot(theta);
        }
    };

    return (
        <BuildGLB 
            file={props.locked ? props.lock : props.unlock}
            animation={props.animation ?? animation}
            objRef={ objRef }
            scale={ scaleLock }
            position={ addPos(overwritePos(MasterHubInfo[props.index].pos, 1, getYPos(getTheta())), props.secret ? SecretHubPos : [0,0,0]) }
            rotation={ props.locked ? MasterHubInfo[props.index].rot : overwritePos(MasterHubInfo[props.index].rot, 1, getYRot(getTheta())) }
        />
    );
}

function Timer(props) {
    const [message, setMessage] = useState('Connect Wallet');
    const [color, setColor] = useState('#FFFFFF');


    useFrame(({ clock }) => {
        if(props.state === FSM.Reconstruction){
            if(props.puzzleState.regular){
                setMessage(getTimeString(props.run[1] - props.run[0]));
                setColor("#4FA5C4");
            } else {
                setMessage(getTimeString(Date.now() - props.run[0]));
                setColor("#FFFFFF");
            }
        } else {
            let time = props.bomb - Date.now();
            let state = Math.round(time / 1000) % 30;

            if(props.state != FSM.NotConnected) {
                if(state > 28){
                    setMessage("SUPERNOVA");
                    setColor("#4FA5C4");
                } else if(state > 27) {
                    setMessage("IMMINENT.");
                    setColor("#4FA5C4");
                } else if(state > 26) {
                    setMessage("REMAINING");
                    setColor("#4FA5C4");
                } else if(state > 25) {
                    setMessage("SUPPLY");
                    setColor("#4FA5C4");
                } else if(state > 24) {
                    setMessage("BURNED");
                    setColor("#4FA5C4");
                } else if(state > 23) {
                    setMessage("IN...");
                    setColor("#4FA5C4");
                } else if(state === 10 && props.puzzleState.regular) {
                    setMessage("YOU");
                    setColor("#9945FF");
                } else if(state === 9 && props.puzzleState.regular) {
                    setMessage("DID");
                    setColor("#9945FF");
                } else if(state === 8 && props.puzzleState.regular) {
                    setMessage("IT!");
                    setColor("#9945FF");
                } else {
                    setMessage(getTimeString(Math.max(0.0, time)));
                    setColor("#FFFFFF");
                }
            }
        }

    });

    return (
        <text
            // ref={timer}
            position={[0, EyeLevel + ((props.opened) ? 1 : 0.69), -HubRadius]}
            rotation={[0,PI/32,0]}
            fontSize={0.5}
            maxWidth={200}
            lineHeight={1}
            letterSpacing={0}
            text={message}
            font={fonts['Roboto']}
            anchorX="center"
            anchorY="middle"
        >
            <meshPhongMaterial attach="material" color={color} />
        </text>
    );
}

function Title(props) { 
    const ref = useRef();

    useFrame(({ clock, camera }) => { 
        if(props.state == FSM.NotConnected){
            ref.current.position.copy( camera.position );
            ref.current.rotation.copy( camera.rotation );
            ref.current.updateMatrix();
            ref.current.translateZ(-100);
            ref.current.translateY( Math.sin(clock.getElapsedTime() * 1) * 3  + 5);
        }
    });

    return (
        <text
            ref={ref}
            position={StartingCamera.pos}
            rotation={StartingCamera.rot}
            fontSize={5}
            maxWidth={100}
            lineHeight={1.55}
            letterSpacing={0}
            text={"Sol-Treasure"}
            font={fonts['Roboto']}
            anchorX="center"
            anchorY="top"
        >
            <meshPhongMaterial attach="material" color={'#FFFFFF'} />
        </text>
    );
}

function getStory(puzzleState, state, run){
    let normalRun = Math.abs(run[0] - run[1]);
    let fullRun = Math.abs(run[0] - run[2]);

    if(puzzleState.secret){
        return "Congrats! You 100%'d this thing! AND you did it in " + getTimeString(fullRun) + '. You\'re the real treasure!\n\nLove,\nCoach Chuck';
    }

    if(puzzleState.regular){
        return "Congrats! You've opened the chest! AND you did it in " + getTimeString(normalRun) + '. Give yourself a pat on the back! Oh, and remember to ignore the red herring... \n\nLove,\nCoach Chuck';
    }

    if(state === FSM.Reconstruction){
        return "Welcome! The supernova has already happened... Hoever, if you're playing this right now, you're actually playing a digitally recreated world saved within a replay token or an OG sol-treasure account. You won't be able to mint anything, however, you can see how fast you can solve the puzzles! Happy Speedrunning!\n\nLove,\nCoach Chuck";
    }

    return "The object is simple. Mint each key for each lock. Do this BEFORE the supernova... Once this happens all unclaimed SFTs will be burned. Each key will cost a total of 0.05 SOL - if you input a wrong answer, you'll mint a broken key at 0.03. You'll need a total of ~0.255 Sol to 100% this thing... Happy Hunting! \n\n Love,\n Coach Chuck\n\n";

}
function Story(props) { 
    const [deltaY, setDeltaY] = useState(0);
    const [didUpdate, setDidUpdate] = useState(false);
    const refs = [useRef(),useRef()];

    let story = getStory(props.puzzleState, props.state, props.run);

    const diff = 0.5;
    useFrame(({ clock, camera }) => { 
        if(!didUpdate){
            let newPos = Math.min(refs[0].current.position.y + (deltaY / 1000), 3.5);
            newPos = Math.max(newPos, -1.55);
            refs[0].current.position.y = newPos;
            refs[1].current.position.y = newPos - diff;

            setDidUpdate(true);
        }
        
    });

    if(props.deltaY != deltaY){
        setDeltaY(props.deltaY);
        setDidUpdate(false);
    }

    return (
        <group >
        <text
            ref={refs[0]}
            position={[-HubX, (EyeLevel + 0.8) + diff, -HubZ]}
            rotation={HubIndex5.rot}
            fontSize={0.2}
            maxWidth={2.34}
            lineHeight={1.55}
            letterSpacing={0}
            text={"INFO"}
            font={fonts['Roboto']}
            anchorX="center"
            anchorY="top"
        >
            <meshPhongMaterial attach="material" color={'#FFFFFF'} />
        </text>
        <text
            ref={refs[1]}
            position={[-HubX, (EyeLevel + 0.8), -HubZ]}
            rotation={HubIndex5.rot}
            fontSize={0.15}
            maxWidth={2.34}
            lineHeight={1.55}
            letterSpacing={0}
            text={story}
            font={fonts['Roboto']}
            anchorX="center"
            anchorY="top"
        >
            <meshPhongMaterial attach="material" color={'#FFFFFF'} />
        </text>
        </group>
    );
}

// SCENE ---------------
const OffsetTheta = 2 * PI / 6;
function Floor(props){  

    useFrame(({ clock, camera }) => { 
        props.fref.current.rotation.x = PI/2; 
        props.fref.current.rotation.y = 0; 
        props.fref.current.rotation.z += 0;
    });

    var radius = props.radius;
    var gap = 0.1;
    var gapRad = Math.sqrt(3)/2 * gap;
    var smallRad = radius - gapRad * gap;
    var h = gap + Math.sqrt(3)/2 * smallRad;
    var w = smallRad / 2;

    var shape = new Shape()
    shape.moveTo(0, gap);
    shape.lineTo(-w, h);
    shape.lineTo(w, h);
    shape.lineTo(0, gap);

    const extrudeSettings = {
        curveSegments: 1,
        steps: 1,
        depth: 0.3,
        bevelEnabled: false
    }

    return (
        <mesh ref={props.fref} position={props.pos ?? [0,0,0]} rotation={[PI/2, 0, props.startingTheta]}>
          <extrudeBufferGeometry attach="geometry" args={[shape, extrudeSettings]} />
          <meshStandardMaterial wireframe={true} transparent={!props.wire} opacity={0.01} color="#EAEAEA"/>
        </mesh>
    );

    // return (
    //     <Plane ref={floorRef} args={[3, 3]} position={[0,0,0]} >
    //         <meshPhongMaterial attach="material" color="#f3f3f3" />
    //     </Plane>
    // );
}

function FloorSet(props) {
    const refs = [
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
        useRef(),
    ];

    return (
        <group>
            <Floor wire={props.cameraIndex == (props.indexes ? props.indexes[0] : 3)} pos={props.pos} fref={refs[0]} radius={props.radius} startingTheta={OffsetTheta * 0}/>
            <Floor wire={props.cameraIndex == (props.indexes ? props.indexes[1] : 4)} pos={props.pos} fref={refs[1]} radius={props.radius} startingTheta={OffsetTheta * 1}/>
            <Floor wire={props.cameraIndex == (props.indexes ? props.indexes[2] : 5)} pos={props.pos} fref={refs[2]} radius={props.radius} startingTheta={OffsetTheta * 2}/>
            <Floor wire={props.cameraIndex == (props.indexes ? props.indexes[3] : 0)} pos={props.pos} fref={refs[3]} radius={props.radius} startingTheta={OffsetTheta * 3}/>
            <Floor wire={props.cameraIndex == (props.indexes ? props.indexes[4] : 1)} pos={props.pos} fref={refs[4]} radius={props.radius} startingTheta={OffsetTheta * 4}/>
            <Floor wire={props.cameraIndex == (props.indexes ? props.indexes[5] : 2)} pos={props.pos} fref={refs[5]} radius={props.radius} startingTheta={OffsetTheta * 5}/>
        </group>
    );
}

function Supernova(props){
    const ref = useRef();
    const [scale, setScale] = useState(SupernovaMinScale);

    
    useFrame(({ camera }) => {
        let date = new Date();
        let time = Math.abs(props.time - date) / 1000;


        if(time > SupernovaStart){
            ref.current.rotation.x = ref.current.rotation.y += 0.001
            setScale(lerp(SupernovaMinScale, SupernovaMaxScale, Math.pow(Math.min((time - SupernovaStart) / SupernovaDuration, 1.0), 3)));
        }
    });

    return (
        <mesh position={HubIndex0.pos} ref={ref} scale={scale}>
            <dodecahedronBufferGeometry args={[1, 1, 1]} attach="geometry" />
            <meshPhongMaterial color={'#4FA5C4'} attach="material" />
        </mesh>
    )
}

function HubRing(props){
    return (
        <group>
            <Suspense fallback={null}>
                <Inventory state={props.state} puzzleState={props.puzzleState}/>
                {props.puzzleState.regular ? <OpenedChest run={props.run} bomb={props.bomb} puzzleState={props.puzzleState}/> : <Chest puzzleState={props.puzzleState} bomb={props.bomb} puzzleState={props.puzzleState}/>}
                <Leaderboard deltaY={props.deltaY}/>
                <Lock locked={!props.puzzleState.blue} lock={BlueLockGLB} unlock={BlueUnlockGLB} index={2}/>
                <Lock locked={!props.puzzleState.green} lock={GreenLockGLB} unlock={GreenUnlockGLB} index={3}/>
                <Lock locked={!props.puzzleState.purple} lock={PurpleLockGLB} unlock={PurpleUnlockGLB} index={4}/>
                <Story run={props.run} deltaY={props.deltaY} puzzleState={props.puzzleState} state={props.state}/>
                <directionalLight position={[0, EyeLevel, 0]} intensity={1} rotation={0, 0, 0}/>
                <pointLight position={[0, -(EyeLevel * 2), 0]} intensity={0.21}/>
                <pointLight position={[0, EyeLevel, 0]} intensity={0.05}/>
                <FloorSet radius={HubRadius} cameraIndex={props.cameraIndex}/>
            </Suspense>
        </group>
    );
}

function SecretHub(props){
    const floorPos = [SecretCamera[0], SecretCamera[1] - EyeLevel, SecretCamera[2]];
    return (
        <group>
            <Suspense fallback={null}>
                <Lock locked={!props.puzzleState.green} lock={GreenLockGLB} unlock={GreenUnlockGLB} index={0} secret={true}/>
                <Lock locked={true} lock={FishGLB} unlock={FishGLB} index={5} secret={true}/>
                <Lock locked={!props.puzzleState.black} lock={BlackLockGLB} unlock={BlackUnlockGLB} index={2} secret={true}/>
                <SecretChest puzzleState={props.puzzleState} bomb={props.bomb} puzzleState={props.puzzleState}/>
                <Lock locked={!props.puzzleState.white} lock={WhiteLockGLB} unlock={WhiteUnlockGLB} index={4} secret={true}/>
                <FloorSet radius={HubRadius} pos={floorPos} cameraIndex={props.cameraIndex} indexes={[0, 1, 2, 3, 4, 5]}/>
            </Suspense>
        </group>
    );
}

function getCameraIndex(camera, isDev, cameraPos){
    const threshold = PI / 4;
    const halfHold = threshold / 2;
    const gap = (HexTheta - threshold);
    const pos = halfHold + gap;

    let vec = new Vector3();
    camera.getWorldDirection(vec);
    let theta = ((2*PI) - ((Math.atan2(vec.x, vec.z)) + PI));
    let index = -1;
    let offset = -1;

    if(
        cameraPos.x == TargetCamera.pos[0] && 
        cameraPos.y == TargetCamera.pos[1] && 
        cameraPos.z == TargetCamera.pos[2]
    ) {
        offset = 0;
    } else if (
        cameraPos.x == SecretCamera[0] && 
        cameraPos.y == SecretCamera[1] && 
        cameraPos.z == SecretCamera[2]
    ) {
        offset = 0x10;
    }
    
    if(theta > 2*PI - halfHold || theta < halfHold){
        index = 0 + offset;
    }

    if( offset !== -1 ){
        for(var i = 0; i < 5; i++){
            if(theta > pos + (HexTheta * i) && theta < pos + threshold + (HexTheta * i)){
                index = i + 1 + offset;
                break;
            }
        }
    }

    if( isDev === true ){
        if( offset === 0){
            if(!(index === 3 || index === 0)){
                index = -1;
            }
        } else if(offset === 0x10){
            switch(index){
                case offset: index = 3; break;
                default: index = -1; break;
            }
        } else {
            index = -1;
        }
    }

    return index;
}

function Controls(props){
    const ref = useRef();
    const { camera, gl: { domElement },} = useThree();
    const [controller, setController] = useState(null);
    const [lastPos, setLastPos] = useState(null);
    const [lastState, setLastState] = useState(null);

    useEffect(() => {
        if(controller === null){
            let controller = new STControls(camera, domElement, TargetCamera.pos);
            controller.addEventListener("scroll", (event)=>{
                props.onScroll(event.event);
            });
            // setController(new STControls(camera, domElement, HubIndex0.pos));
            camera.lookAt(new Vector3(
                HubIndex0.pos[0],
                HubIndex0.pos[1],
                HubIndex0.pos[2],
            ));
            setController(controller);
        }
        return () => {};
    }, []);

    useEffect(() => {
        console.log(lastPos);
    }, [lastPos]);

    useFrame(({ camera }) => { 

        if(controller){
            let tick = Math.abs(Date.now() - props.time);

            if(lastState) {
                if(lastState != props.state){
                    setLastState(props.state);
                    return;
                }
            } else {
                setLastState(props.state);
                return;
            }

            if(lastPos) {
                if(
                    lastPos[0] != props.cameraPos[0] ||
                    lastPos[1] != props.cameraPos[1] ||
                    lastPos[2] != props.cameraPos[2]
                ){
                    setLastPos(props.cameraPos);
                }
            } else {
                setLastPos(props.cameraPos);
                return;
            }

            let targetPos = new Vector3(
                lastState === FSM.DevMode ? lastPos[0] : TargetCamera.pos[0],
                lastState === FSM.DevMode ? lastPos[1] : TargetCamera.pos[1],
                lastState === FSM.DevMode ? lastPos[2] : TargetCamera.pos[2],
            );

            controller.autoRotate = false;
            // console.log(props.cameraPos);

            let distance = targetPos.distanceTo(camera.position);
            let tock = Math.pow(Math.min(1.0, tick / zoomInTime), 2);

            ref.current.position.copy( camera.position );
            ref.current.rotation.copy( camera.rotation );
            ref.current.intensity = Math.min(Math.sqrt(Math.sqrt(distance)), 0.5);
            ref.current.updateMatrix();

            if(props.state === FSM.NotConnected || props.state === FSM.Supernova){
                controller.autoRotate = true;
                

                if(distance < superNovaDistance - 5){
                    camera.position.z = lerp(camera.position.z, superNovaDistance, tock);
                }
            } else {
                if(distance > 0.03){

                    camera.position.x = lerp(camera.position.x, targetPos.x, tock);
                    camera.position.y = lerp(camera.position.y, targetPos.y, tock);
                    camera.position.z = lerp(camera.position.z, targetPos.z, tock);

                    if(props.cameraIndex != -1){
                        props.changeCameraIndex(-1);
                    }
                } else {
                    //TODO Check Index
                    if(!compareVec(controller.target, targetPos)){
                        controller.target = targetPos;
                    }

                    let index = getCameraIndex(camera, lastState === FSM.DevMode, targetPos);
                    if(props.cameraIndex != index){
                        props.changeCameraIndex(index);
                    }
                }    
            }

            // controller.update();
        }
    });

    return <Suspense><pointLight ref={ref} intensity={0.1} position={StartingCamera.pos}/></Suspense>;
}

export function BuildHub(props) {
    const [state, setState] = useState(props.state);
    const [time, setTime] = useState(new Date());
    const [deltaY, setDeltaY] = useState(0);

    if(state != props.state){
        setTime(new Date());
        setState(props.state);
    }

    const onScroll = (event) => {
        setDeltaY(event.deltaY);
    }

    return (
        <div className="scene-container">
            <Canvas dpr={window.devicePixelRatio} camera={{position: StartingCamera.pos, rotation: StartingCamera.rot, fov: Fov}}>
                {/* <ambientLight position={[0, 0, 0]} intensity={0.1}/> */}
                <SecretHub cameraIndex={props.cameraIndex} puzzleState={props.puzzleState} state={state}/>
                <HubRing cameraIndex={props.cameraIndex} run={props.run} puzzleState={props.puzzleState} deltaY={deltaY} bomb={props.bomb} state={state}/>
                {/* <Supernova time={time}/> */}
                <Title state={props.state}/>
                <Stars
                    radius={100} // Radius of the inner sphere (default=100)
                    depth={50} // Depth of area where stars should fit (default=50)
                    count={5000} // Amount of stars (default=5000)
                    factor={10} // Size factor (default=4)
                    saturation={0.55} // Saturation 0-1 (default=0)
                    fade={true} // Faded dots (default=false)
                />
                <EffectComposer multisampling={8} autoClear={false}>
                    <Bloom intensity={0.1} luminanceThreshold={0.08} luminanceSmoothing={0} />
                </EffectComposer>
                <Controls cameraPos={props.cameraPos} onScroll={onScroll} bomb={props.bomb} state={state} time={time} cameraIndex={props.cameraIndex} changeCameraIndex={props.changeCameraIndex}/>
            </Canvas>
        </div>
    );
}