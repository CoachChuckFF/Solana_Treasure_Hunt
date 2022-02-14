import React, { Suspense, useRef, useState, useLayoutEffect } from "react";
import { useGLTF, Stars, PointerLockControls, ScrollControls, Plane } from "@react-three/drei";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3, PerspectiveCamera, GridHelper, DirectionalLight, Shape, DoubleSide } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing'
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
const fov = 120;
const planeAspectRatio = 16 / 9;
const yOffset = 1.89;

const target = [0, orbit / (yOffset * 3), 0];
const startingPostion = [0, orbit / yOffset, orbit - 2.8];
const ocTO = 5000;
const maxTO = ocTO * 1000;
const origin = new Vector3(0,0,0);
const targetVec = new Vector3(target[0],target[1],target[2]);

const SupernovaStart = 1320;
const SupernovaMinScale = 0.01;
const SupernovaMaxScale = 320;
const SupernovaDuration = 60;

// GLOBALS -----------------
const PI = Math.PI;
const TRI = Math.sqrt(3)/2;

const HubRadius = 4;
const HexTheta = (2*PI/6);
const Thirty = HexTheta / 2;
const HubZ = Math.sin(Thirty) * (TRI * HubRadius)
const HubX = Math.cos(Thirty) * (TRI * HubRadius)


const EyeLevel = 1.21;

const EdgeWidth = HubRadius

const StartingCamera = {pos: [0, EyeLevel, 0], rot: [0, 0, 0]};
const HubIndex0 = {pos: [0, 0, -HubRadius], rot: [0, 0, 0], point: [0, -5, -HubRadius]};
const HubIndex1 = {pos: [HubX, 0, -HubZ], rot: [0, -(HexTheta * 1), 0], point: [0, -5, -HubRadius]};
const HubIndex2 = {pos: [HubX, 0, HubZ], rot: [0, -(HexTheta * 2), 0], point: [0, -5, -HubRadius]};
const HubIndex3 = {pos: [0, 0, HubRadius], rot: [0, -(HexTheta * 3), 0], point: [0, -5, -HubRadius]};
const HubIndex4 = {pos: [-HubX, 0, HubZ], rot: [0, -(HexTheta * 4), 0], point: [0, -5, -HubRadius]};
const HubIndex5 = {pos: [-HubX, 0, -HubZ], rot: [0, -(HexTheta * 5), 0], point: [0, -5, -HubRadius]};

const scaleChest = 0.5;
const scaleLock = 0.55;

// GLOBALS -----------------
function BuildGLB(props){
    const { scene } = useGLTF(props.file);

    useFrame(({ clock, camera }) => { if(props.animation) props.animation(clock, camera); });

    return (<Suspense fallback={null}><primitive ref={ props.objRef } object={ scene } scale={ props.scale } position={ props.position } rotation={ props.rotation }/></Suspense>);
}

// GLB FILES ---------------
function Chest() { 
    const objRef = useRef();

    const animation = (clock, camera) => {};

    return (<BuildGLB 
        file={'models/puzzle_chest.glb'}
        animation={animation}
        objRef={ objRef }
        scale={scaleChest}
        position={HubIndex0.pos}
        rotation={HubIndex0.rot}
    />);
}

function Leaderboard() { 
    const objRef = useRef();

    const animation = (clock, camera) => {};

    return (<BuildGLB 
        file={'models/blue_key.glb'}
        animation={animation}
        objRef={ objRef }
        scale={scaleLock}
        position={HubIndex1.pos}
        rotation={HubIndex1.rot}
    />);
}

function BlueLock() { 
    const objRef = useRef();

    const animation = (clock, camera) => {
        objRef.current.position.y = Math.sin(clock.getElapsedTime()) * 0.1
    };

    return (
        <BuildGLB 
            file={'models/blue_lock.glb'}
            animation={animation}
            objRef={ objRef }
            scale={scaleLock}
            position={HubIndex2.pos}
            rotation={HubIndex2.rot}
        />
    );
}

function GreenLock() { 
    const objRef = useRef();

    const animation = (clock, camera) => {};

    return (<BuildGLB 
        file={'models/green_lock.glb'}
        animation={animation}
        objRef={ objRef }
        scale={scaleLock}
        position={HubIndex3.pos}
        rotation={HubIndex3.rot}
    />);
}

function PinkLock() { 
    const objRef = useRef();

    const animation = (clock, camera) => {};

    return (<BuildGLB 
        file={'models/pink_lock.glb'}
        animation={animation}
        objRef={ objRef }
        scale={scaleLock}
        position={HubIndex4.pos}
        rotation={HubIndex4.rot}
    />);
}

function Story() { 
    const objRef = useRef();

    const animation = (clock, camera) => {};

    return (<BuildGLB 
        file={'models/pink_key.glb'}
        animation={animation}
        objRef={ objRef }
        scale={scaleLock}
        position={HubIndex5.pos}
        rotation={HubIndex5.rot}
    />);
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
          <meshStandardMaterial wireframe={true} color="#EAEAEA"/>
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
            <Floor fref={refs[0]} radius={props.radius} startingTheta={OffsetTheta * 0}/>
            <Floor fref={refs[1]} radius={props.radius} startingTheta={OffsetTheta * 1}/>
            <Floor fref={refs[2]} radius={props.radius} startingTheta={OffsetTheta * 2}/>
            <Floor fref={refs[3]} radius={props.radius} startingTheta={OffsetTheta * 3}/>
            <Floor fref={refs[4]} radius={props.radius} startingTheta={OffsetTheta * 4}/>
            <Floor fref={refs[5]} radius={props.radius} startingTheta={OffsetTheta * 5}/>
        </group>
    );
}

function HubRing(props){
    return (
        <group>
            <Suspense fallback={null}>
                {/* <DirectionalLight position={HubIndex0.light} /> */}
                <Chest />
                <Leaderboard />
                <BlueLock />
                <GreenLock />
                <PinkLock />
                <Story />
            </Suspense>
        </group>
    );
}

function Controls(props){
    const { camera, gl: { domElement },} = useThree();
    const [controller, setController] = useState(null);
    const [didInit, setDidInit] = useState(false);

    if(!didInit){
        setDidInit(true);
        setController(new STControls(camera, domElement, StartingCamera.pos));
    }
    
    return null;
}

export function BuildHub(props) {
    const [state, setState] = useState(props.state);
    const [time, setTime] = useState(new Date());

    if(state != props.state){
        setTime(new Date());
        setState(props.state);
    }

    return (
        <div className="scene-container">
            <Canvas dpr={window.devicePixelRatio} camera={{position: StartingCamera.pos, rotation: StartingCamera.rot, fov: 90}}>
                <ambientLight position={[0, 0, 0]} intensity={0.1}/>
                {/* <directionalLight position={[orbit, orbit, orbit]} intensity={0.9}/> */}
                <pointLight position={[0, 3, 0]} intensity={1}/>
                <HubRing />
                <FloorSet radius={HubRadius}/>
                <Stars
                    radius={100} // Radius of the inner sphere (default=100)
                    depth={50} // Depth of area where stars should fit (default=50)
                    count={5000} // Amount of stars (default=5000)
                    factor={10} // Size factor (default=4)
                    saturation={0.55} // Saturation 0-1 (default=0)
                    fade={true} // Faded dots (default=false)
                />
                <EffectComposer multisampling={8} autoClear={false}>
                    <Bloom intensity={0.08} luminanceThreshold={0.08} luminanceSmoothing={0} />
                </EffectComposer>
                <Controls />
            </Canvas>
        </div>
    );
}