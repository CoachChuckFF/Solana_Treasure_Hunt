import React, { Suspense, useRef, useState, useLayoutEffect } from "react";
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
extend({ STControls });


const orbit = 8;
const msPerLoop = 13000;

const maxFov = 180;
const planeAspectRatio = 16 / 9;
const yOffset = 1.89;

const target = [0, orbit / (yOffset * 3), 0];
const startingPostion = [0, orbit / yOffset, orbit - 2.8];
const ocTO = 5000;
const maxTO = ocTO * 1000;
const origin = new Vector3(0,0,0);
const targetVec = new Vector3(target[0],target[1],target[2]);

const SupernovaStart = 5;
const SupernovaMinScale = 0.01;
const SupernovaMaxScale = 400;
const SupernovaDuration = 60;

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
const TargetCamera = {pos: [0, EyeLevel, 0], rot: [0, 0, 0]};
const HubIndex0 = {pos: [0, 0, -HubRadius], light: [0, PointLightHeight, -HubRadius * PointLightDistanceBehind], rot: [0, 0, 0], point: [0, -5, -HubRadius]};
const HubIndex1 = {pos: [HubX, 0, -HubZ], light: [HubX * PointLightDistanceBehind, PointLightHeight, -HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 1), 0], point: [0, -5, -HubRadius]};
const HubIndex2 = {pos: [HubX, 0, HubZ], light: [HubX * PointLightDistanceBehind, PointLightHeight, HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 2), 0], point: [0, -5, -HubRadius]};
const HubIndex3 = {pos: [0, 0, HubRadius],light: [0, PointLightHeight, HubRadius * PointLightDistanceBehind], rot: [0, -(HexTheta * 3), 0], point: [0, -5, -HubRadius]};
const HubIndex4 = {pos: [-HubX, 0, HubZ], light: [-HubX * PointLightDistanceBehind, PointLightHeight, HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 4), 0], point: [0, -5, -HubRadius]};
const HubIndex5 = {pos: [-HubX, 0, -HubZ], light: [-HubX * PointLightDistanceBehind, PointLightHeight, -HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 5), 0], point: [0, -5, -HubRadius]};

//Scales
const scaleChest = 0.5;
const scaleLock = 0.55;
const scaleMiniLock = 0.13;
const keyScale = 0.013;

//Times
const zoomInTime = 5000;



// GLOBALS -----------------
function BuildGLB(props){
    const { scene } = useGLTF(props.file);

    useFrame(({ clock, camera }) => { if(props.animation) props.animation(clock, camera); });

    return (<Suspense fallback={null}><primitive onPointerOver={(e) => {if(props.onHover) props.onHover()}} onPointerOut={(e) =>  {if(props.leaveHover) props.leaveHover()}} ref={ props.objRef } object={ scene } scale={ props.scale } position={ props.position } rotation={ props.rotation }/></Suspense>);
}

// GLB FILES ---------------
function Chest() { 
    const refs = [
        useRef(),
        useRef(),
        useRef(),
        useRef(),
    ];

    const animation = (clock, camera) => {
        refs[0].current.position.y = 0.8 + Math.sin(clock.getElapsedTime() + PI/4) * 0.089;
        refs[1].current.position.y = 0.8 + Math.sin(clock.getElapsedTime() + PI/6) * 0.089;
        refs[2].current.position.y = 0.4 + Math.sin(clock.getElapsedTime() + PI/8) * 0.089;
    };

    return (
        <group>
            <pointLight position={HubIndex0.light} intensity={PointLightIntensity}/>
            <BuildGLB 
                file={'models/sol/blue_lock_chest.glb'}
                animation={animation}
                objRef={ refs[0] }
                scale={scaleMiniLock}
                position={[-0.21, 0.8, -HubRadius + 0.89]}
                rotation={[0,0,0]}
            />
            <BuildGLB 
                file={'models/sol/green_lock_chest.glb'}
                animation={animation}
                objRef={ refs[1]  }
                scale={scaleMiniLock}
                position={[0.21, 0.8, -HubRadius + 0.85]}
                rotation={[0,0,0]}
            />
            <BuildGLB 
                file={'models/sol/purple_lock_chest.glb'}
                animation={animation}
                objRef={ refs[2]  }
                scale={scaleMiniLock}
                position={[0, 0.4, -HubRadius + 0.89]}
                rotation={[0,0,0]}
            />
            <BuildGLB 
                file={'models/sol/chest_closed.glb'}
                animation={animation}
                objRef={ refs[3]  }
                scale={scaleChest}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
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

    const leaveHover = () => {
        props.onHover(null);
    };
    const onHover = (index) => {
        props.onHover(refs[index]);
    }
    const hover0 = () => onHover(0);
    const hover1 = () => onHover(1);
    const hover2 = () => onHover(2);
    const hover3 = () => onHover(3);
    const hover4 = () => onHover(4);
    const hover5 = () => onHover(5);


    return (
        <group>
            <BuildGLB 
                onHover={hover0}
                leaveHover={leaveHover}
                file={'models/sol/blue_key.glb'}
                animation={animation}
                objRef={ refs[0]  }
                scale={keyScale}
                visable={(props.puzzleState.blue && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                onHover={hover1}
                leaveHover={leaveHover}
                file={'models/sol/green_key.glb'}
                animation={animation}
                objRef={ refs[1]  }
                scale={keyScale}
                visable={(props.puzzleState.green && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                onHover={hover2}
                leaveHover={leaveHover}
                file={'models/sol/purple_key.glb'}
                animation={animation}
                objRef={ refs[2]  }
                scale={keyScale}
                visable={(props.puzzleState.purple && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                onHover={hover3}
                leaveHover={leaveHover}
                file={'models/sol/broken_key.glb'}
                animation={animation}
                objRef={ refs[3]  }
                scale={keyScale}
                visable={(props.puzzleState.broken && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                onHover={hover4}
                leaveHover={leaveHover}
                file={'models/sol/black_key.glb'}
                animation={animation}
                objRef={ refs[4]  }
                scale={keyScale}
                visable={(props.puzzleState.black && props.state === FSM.Playing)}
                position={HubIndex0.pos}
                rotation={HubIndex0.rot}
            />
            <BuildGLB 
                onHover={hover5}
                leaveHover={leaveHover}
                file={'models/sol/white_key.glb'}
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

function BlueLock(props) { 
    const objRef = useRef();

    const animation = (clock, camera) => {
        objRef.current.position.y = Math.sin(clock.getElapsedTime()) * 0.1
    };

    return (
        <BuildGLB 
            file={'models/sol/blue_lock.glb'}
            animation={props.animation ?? animation}
            objRef={ objRef }
            scale={props.scale ?? scaleLock}
            position={props.pos ?? HubIndex2.pos}
            rotation={props.rot ?? HubIndex2.rot}
        />
    );
}

function GreenLock() { 
    const objRef = useRef();

    const animation = (clock, camera) => {
        objRef.current.position.y = Math.sin(clock.getElapsedTime() + PI/16) * 0.1
    };

    return (<BuildGLB 
        file={'models/sol/green_lock.glb'}
        animation={animation}
        objRef={ objRef }
        scale={scaleLock}
        position={HubIndex3.pos}
        rotation={HubIndex3.rot}
    />);
}

function PurpleLock() { 
    const objRef = useRef();

    const animation = (clock, camera) => {
        objRef.current.position.y = Math.sin(clock.getElapsedTime() + PI/8) * 0.1
    };

    return (<BuildGLB 
        file={'models/sol/purple_lock.glb'}
        animation={animation}
        objRef={ objRef }
        scale={scaleLock}
        position={HubIndex4.pos}
        rotation={HubIndex4.rot}
    />);
}

function Timer(props) {
    const bomb = props.bomb;
    const [time, setTime] = useState(0);
    const [message, setMessage] = useState('Connect Wallet');
    const [color, setColor] = useState('#FFFFFF');


    useFrame(({ clock }) => {
        if(Math.round(clock.getElapsedTime()) != time){
            setTime(Math.round(clock.getElapsedTime()));
            let state = time % 30;

            if(props.state != FSM.NotConnected) {
                if(state > 29){
                    setMessage("...");
                    setColor("#9945FF");
                } else if(state > 28) {
                    setMessage("IN");
                    setColor("#9945FF");
                } else if(state > 27) {
                    setMessage("BURNED");
                    setColor("#9945FF");
                } else if(state > 26) {
                    setMessage("SUPPLY");
                    setColor("#9945FF");
                } else if(state > 25) {
                    setMessage("REMAINING");
                    setColor("#9945FF");
                } else {
                    setMessage(getTimeString(time));
                    setColor("#FFFFFF");
                }
            }
        }
    });

    var _second = 1000;
    var _minute = _second * 60;
    var _hour = _minute * 60;
    var _day = _hour * 24;
    var timer;

    function getTimeString (_){
        var now = new Date();
        var distance = bomb - now;
        if (distance < 0) {

            return "BOOM!";
        }
        var hours = Math.floor((distance) / _hour);
        var minutes = Math.floor((distance % _hour) / _minute);
        var seconds = Math.floor((distance % _minute) / _second);

        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return (
        <text
            ref={timer}
            position={[0, EyeLevel + 0.69, -HubRadius]}
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

function Story(props) { 
    const [deltaY, setDeltaY] = useState(0);
    const [didUpdate, setDidUpdate] = useState(false);
    const refs = [useRef(),useRef()];

    const story = "The object is simple. Mint each key for each lock. Do this BEFORE the supernova... Once this happens all unclaimed SFTs will be burned. Each key will cost a total of 0.05 SOL - if you input a wrong answer, you'll mint a broken key at 0.03. You'll need a total of ~0.255 Sol to 100% this thing... Happy Hunting! \n\n Love,\n Coach Chuck";

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
            text={"RULES"}
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
        <mesh ref={props.fref} position={[0,0,0]} rotation={[PI/2, 0, props.startingTheta]}>
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

function FloorSet(props){
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
            <Floor wire={props.cameraIndex == 3} fref={refs[0]} radius={props.radius} startingTheta={OffsetTheta * 0}/>
            <Floor wire={props.cameraIndex == 4} fref={refs[1]} radius={props.radius} startingTheta={OffsetTheta * 1}/>
            <Floor wire={props.cameraIndex == 5} fref={refs[2]} radius={props.radius} startingTheta={OffsetTheta * 2}/>
            <Floor wire={props.cameraIndex == 0} fref={refs[3]} radius={props.radius} startingTheta={OffsetTheta * 3}/>
            <Floor wire={props.cameraIndex == 1} fref={refs[4]} radius={props.radius} startingTheta={OffsetTheta * 4}/>
            <Floor wire={props.cameraIndex == 2} fref={refs[5]} radius={props.radius} startingTheta={OffsetTheta * 5}/>
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
                <Inventory state={props.state} onHover={props.onHover} puzzleState={props.puzzleState}/>
                <Timer bomb={props.bomb}/>
                <Chest />
                <Leaderboard deltaY={props.deltaY}/>
                <BlueLock />
                <GreenLock />
                <PurpleLock />
                <Story deltaY={props.deltaY}/>
            </Suspense>
        </group>
    );
}

function getCameraIndex(camera){
    const threshold = PI / 4;
    const halfHold = threshold / 2;
    const gap = (HexTheta - threshold);
    const pos = halfHold + gap;

    let vec = new Vector3();
    camera.getWorldDirection(vec);
    let theta = ((2*PI) - ((Math.atan2(vec.x, vec.z)) + PI));
    let index = -1;
    
    if(theta > 2*PI - halfHold || theta < halfHold){
        index = 0;
    }

    for(var i = 0; i < 5; i++){
        if(theta > pos + (HexTheta * i) && theta < pos + threshold + (HexTheta * i)){
            index = i + 1;
            break;
        }
    }

    return index;
}

function Controls(props){
    const ref = useRef();
    const { camera, gl: { domElement },} = useThree();
    const [controller, setController] = useState(null);
    const [didInit, setDidInit] = useState(false);

    useFrame(({ camera }) => { 
        if(controller){
            let tick = Math.abs(Date.now() - props.time);
            let time = tick / 1000;

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

            if(props.devMode){
                ;;
            } else if(props.state === FSM.NotConnected || props.bomb < Date.now()){
                controller.autoRotate = true;
                controller.update();

                if(distance < superNovaDistance - 5){
                    camera.position.z = lerp(camera.position.z, superNovaDistance, tock);
                }

            } else {
                if(distance > 0.01){
                    camera.position.x = lerp(camera.position.x, TargetCamera.pos[0], tock);
                    camera.position.y = lerp(camera.position.y, TargetCamera.pos[1], tock);
                    camera.position.z = lerp(camera.position.z, TargetCamera.pos[2], tock);
                } else {
                    let index = getCameraIndex(camera);
                    if(props.cameraIndex != index){
                        props.changeCameraIndex(index);
                    }
                }    
            }
        }
    });

    if(!didInit){
        let controller = new STControls(camera, domElement, TargetCamera.pos);
        setDidInit(true);
        setController(controller);

        controller.addEventListener("scroll", (event)=>{
            props.onScroll(event.event);
        });
        // setController(new STControls(camera, domElement, HubIndex0.pos));
        camera.lookAt(new Vector3(
            HubIndex0.pos[0],
            HubIndex0.pos[1],
            HubIndex0.pos[2],
        ));
    }
    
    return <Suspense><pointLight ref={ref} intensity={0.1} position={StartingCamera.pos}/></Suspense>;
}

export function BuildHub(props) {
    const [state, setState] = useState(props.state);
    const [subState, setSubstate] = useState(FSM.Supernova);
    const [time, setTime] = useState(new Date());
    const [deltaY, setDeltaY] = useState(0);

    //Keys
    const [hovered, onHover] = useState(null)
    const selected = hovered ? [hovered] : undefined

    if(selected){
        if(selected.length > 0){
            console.log(selected[0].current.position);
        }
    }

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
                <directionalLight position={[0, EyeLevel, 0]} intensity={1} rotation={0, 0, 0}/>
                <pointLight position={[0, -(EyeLevel * 2), 0]} intensity={0.21}/>
                <pointLight position={[0, EyeLevel, 0]} intensity={0.05}/>
                <HubRing puzzleState={props.puzzleState} deltaY={deltaY} bomb={props.bomb} state={state} onHover={onHover}/>
                {/* <Supernova time={time}/> */}
                <Title state={props.state}/>
                <FloorSet radius={HubRadius} cameraIndex={props.cameraIndex}/>
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
                    <Outline blue selection={selected} visibleEdgeColor="white" edgeStrength={50} width={1} />
                </EffectComposer>
                <Controls onScroll={onScroll} bomb={props.bomb} state={state} time={time} devMode={false} cameraIndex={props.cameraIndex} changeCameraIndex={props.changeCameraIndex}/>
            </Canvas>
        </div>
    );
}