import React, { Suspense, useRef, useState, useEffect, useLayoutEffect } from "react";
import { useGLTF, Stars, Environment, Stage, PointerLockControls, ScrollControls, Plane } from "@react-three/drei";
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

import { lerp } from "three/src/math/MathUtils";

extend({ TextGeometry })
extend({ Text });

// MODELS -----------------
const ChestClosedGLB = "models/sol/chest_closed.glb";
const TestLockGLB = "models/sol/test_lock.glb";
const TestUnlockGLB = "models/sol/test_unlock.glb";
const TestKeyGLB = "models/sol/test_key.glb";
const BrokenKeyGLB = "models/sol/broken_key.glb";
const SunGLB = "models/sol/sun.glb";

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

function Inventory(props) {
    const refs = [
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
                url={'https://twitter.com/sol_treasure_io'}
                file={TestKeyGLB}
                animation={animation}
                objRef={ refs[0]  }
                scale={keyScale}
                visable={(props.puzzleState.blue && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                isInventory={true}
                url={'https://twitter.com/sol_treasure_io'}
                file={BrokenKeyGLB}
                animation={animation}
                objRef={ refs[1]  }
                scale={keyScale}
                visable={(props.puzzleState.green && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
        </group>
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
function Supernova(props) {
    const refs = [
        useRef(),
        useRef(),
    ];

    useFrame(({ clock, camera }) => {

    });

    return (
        <group>
            {/* <BuildGLB 
                file={BlueKeyGLB}
                objRef={ refs[0] }
                scale={scaleMiniLock}
                position={[0,0,0]}
                rotation={[0,0,0]}
            /> */}
            {/* <BuildGLB 
                file={SunGLB}
                objRef={ refs[1]  }
                scale={scaleMiniLock}
                position={[0,0,0]}
                rotation={[0,0,0]}
            /> */}
        </group>
    );
}


function Timer(props) {
    const [message, setMessage] = useState('Connect Wallet');
    const [color, setColor] = useState('#FFFFFF');


    useFrame(({ clock }) => {
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
            } else {
                setMessage("SOON.");
                setColor("#FFFFFF");
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
            font={fonts['Vimland']}
            anchorX="center"
            anchorY="middle"
        >
            <meshPhongMaterial attach="material" color={color} />
        </text>
    );
}

function Chest(props) { 
    const refs = [
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
        refs[1].current.position.x = chestPos[0];
        refs[1].current.position.y = chestPos[1];
        refs[1].current.position.z = chestPos[2];

        let testLock = getItemPos(xOffset, yOffset, 0, 0.55, 0.89, 3);
        refs[0].current.position.x = testLock[0];
        refs[0].current.position.y = testLock[1];
        refs[0].current.position.z = testLock[2];

    });

    return (
        <group>
            <Timer bomb={props.bomb} opened={false} run={props.run} state={props.state} puzzleState={props.puzzleState}/>
            <BuildGLB 
                file={props.puzzleState.test ? TestUnlockGLB : TestLockGLB}
                objRef={ refs[0]  }
                scale={scaleMiniLock}
                position={getItemPos(getOffset(), getOffset(true), 0, 0.4, -0.89, 2)}
                rotation={[0,0,0]}
            /> 
            <BuildGLB 
                file={ChestClosedGLB}
                objRef={ refs[1]  }
                scale={scaleChest}
                position={getItemPos(getOffset(), getOffset(true), 0,0,0)}
                rotation={HubIndex0.rot}
            />
        </group>
    );
}

function Lock(props) {
    const objRef = useRef();

    const getTheta = () => {
        return Date.now()/1000 + props.index * PI/5;
    }
    const getYPos = (theta) => {
        return Math.sin(theta) * 0.1 + 0.34;
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
            position={ addPos(overwritePos(MasterHubInfo[props.index].pos, 1, getYPos(getTheta())), [0,0,0]) }
            rotation={ props.locked ? MasterHubInfo[props.index].rot : overwritePos(MasterHubInfo[props.index].rot, 1, getYRot(getTheta())) }
        />
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
            fontSize={10}
            maxWidth={100}
            lineHeight={1.55}
            letterSpacing={0}
            text={"Sol-Treasure"}
            font={fonts['Vimland']}
            anchorX="center"
            anchorY="top"
        >
            <meshPhongMaterial attach="material" color={'#FFFFFF'} />
        </text>
    );
}

function getStory(puzzleState, state, run){
    return "Sol-Treasure is Solana's first playable mint! The mint will be a multi-day event where players will solve puzzles and mint keys to keep what's inside the chest! But watch out! When the timer hits 0, it will trigger a supernova, burning the remaining supply in the chest... The game will start #soon, until then, try out the demo!\n\n Love,\n Coach Chuck\n\n";
}

function Story(props) { 
    const [deltaY, setDeltaY] = useState(0);
    const [didUpdate, setDidUpdate] = useState(false);
    const refs = [useRef(),useRef()];

    let story = getStory(props.puzzleState, props.state, props.run);

    const diff = 0.69;
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
            fontSize={0.5}
            maxWidth={2.34}
            lineHeight={1.55}
            letterSpacing={0}
            text={"STORY"}
            font={fonts['Vimland']}
            anchorX="center"
            anchorY="top"
        >
            <meshPhongMaterial attach="material" color={'#FFFFFF'} />
        </text>
        <text
            ref={refs[1]}
            position={[-HubX, (EyeLevel + 0.8), -HubZ]}
            rotation={HubIndex5.rot}
            fontSize={0.21}
            maxWidth={2.34}
            lineHeight={1.55}
            letterSpacing={0}
            text={story}
            font={fonts['Vimland']}
            anchorX="center"
            anchorY="top"
        >
            <meshPhongMaterial attach="material" color={'#FFFFFF'} />
        </text>
        </group>
    );
}

// SCENE ---------------
function HubRing(props){
    return (
        <group>
            <Suspense fallback={null}>
                <Inventory state={props.state} puzzleState={props.puzzleState}/>
                <Chest puzzleState={props.puzzleState} bomb={props.bomb} puzzleState={props.puzzleState}/>
                <Lock locked={!props.puzzleState.test} lock={TestLockGLB} unlock={TestUnlockGLB} index={1}/>
                <Story run={props.run} deltaY={props.deltaY} puzzleState={props.puzzleState} state={props.state}/>
                <directionalLight position={[0, EyeLevel, 0]} intensity={1} rotation={0, 0, 0}/>
                <Supernova />
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

            camera.lookAt(new Vector3(
                HubIndex0.pos[0],
                HubIndex0.pos[1],
                HubIndex0.pos[2],
            ));
            setController(controller);
        }
        return () => {};
    }, []);


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


            let targetPos = new Vector3(
                TargetCamera.pos[0],
                TargetCamera.pos[1],
                TargetCamera.pos[2],
            );

            controller.autoRotate = false;

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
                        camera.position.x = targetPos.x;
                        camera.position.y = targetPos.y + 0.001;
                        camera.position.z = targetPos.z;
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
                <HubRing cameraIndex={props.cameraIndex} run={props.run} puzzleState={props.puzzleState} deltaY={deltaY} bomb={props.bomb} state={state}/>
                <Title state={props.state}/>
                <Stars
                    radius={100} // Radius of the inner sphere (default=100)
                    depth={50} // Depth of area where stars should fit (default=50)
                    count={5000} // Amount of stars (default=5000)
                    factor={10} // Size factor (default=4)
                    saturation={0.55} // Saturation 0-1 (default=0)
                    fade={true} // Faded dots (default=false)
                />
                <Suspense fallback={null}>
                    <Environment
                        background={false}
                        // files={['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']}
                        path="/"
                        preset={'night'}
                        // scene={undefined} // adds the ability to pass a custom THREE.Scene
                    />
                </Suspense>
                <EffectComposer multisampling={8} autoClear={false}>
                    <Bloom intensity={0.1} luminanceThreshold={0.08} luminanceSmoothing={0} />
                </EffectComposer>
                <Controls cameraPos={props.cameraPos} onScroll={onScroll} bomb={props.bomb} state={state} time={time} cameraIndex={props.cameraIndex} changeCameraIndex={props.changeCameraIndex}/>
            </Canvas>
        </div>
    );
}