import React, { Suspense, useRef, useState, useLayoutEffect } from "react";
import { useGLTF, Stars } from "@react-three/drei";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Text } from "troika-three-text";
import * as FSM from './fsm';

import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { extend } from '@react-three/fiber'

import fonts from "./fonts";

import { curtains } from './curtains';
import { getGuideCodes, codeToHexString } from "./hashes";
import { lerp } from "three/src/math/MathUtils";


extend({ TextGeometry })
extend({ Text });
extend({ OrbitControls });

// Roboto Mono_Bold.json
// import Box from '@mui/material/Box';
// import Slider from '@mui/material/Slider';

const orbit = 8;
const msPerLoop = 13000;

const maxFov = 180;
const fov = 120;
const planeAspectRatio = 16 / 9;
const yOffset = 1.89;
const scaleChest = 1.21;
const scaleLock = 0.89;

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

const addDays = (date, days) => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const getTheta = (clock) => {
    return ((clock.getElapsedTime() * 1000) / msPerLoop) * 2 * Math.PI;
}

function Error() {
    return (           
    <text position={[0, 5, 0]}
        rotation={[0, 0, 0]}
        fontSize={1}
        maxWidth={300}
        lineHeight={1}
        letterSpacing={0}
        text={"ERROR"}
        font={fonts['Roboto']}
        anchorX="center"
        anchorY="middle"
    >
        <meshPhongMaterial attach="material" color={"#9945FF"} />
    </text>
    );
}

function Congratulations() {
    return (           
    <text position={[0, 2, 1.5]}
        rotation={[-Math.PI / 8, Math.PI / 16, 0]}
        fontSize={1}
        maxWidth={500}
        lineHeight={1}
        letterSpacing={0}
        text={"You did it!"}
        font={fonts['Roboto']}
        anchorX="center"
        anchorY="middle"
    >
        <meshPhongMaterial attach="material" color={"#9945FF"} />
    </text>
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

            let newPos = new Vector3(
                startingPostion[0],
                startingPostion[1],
                startingPostion[2]
            );
            newPos.addScalar(Math.max(scale, 1.0));
            camera.lookAt(0, 0, 0);
            camera.position.x = newPos.x;
            camera.position.y = newPos.y;
            camera.position.z = newPos.z;
            camera.updateProjectionMatrix();
        }
    });

    return (
        <mesh position={[0, 0, 0]} ref={ref} scale={scale}>
            <dodecahedronBufferGeometry args={[1, 1, 1]} attach="geometry" />
            <meshPhongMaterial color={'#4FA5C4'} attach="material" />
        </mesh>
    )
}

function FinalText() {
    return (           
    <text position={[0, 5, 0]}
        rotation={[0, 0, 0]}
        fontSize={1}
        maxWidth={300}
        lineHeight={1}
        letterSpacing={0}
        text={"You have it!"}
        font={fonts['Roboto']}
        anchorX="center"
        anchorY="middle"
    >
        <meshPhongMaterial attach="material" color={"#9945FF"} />
    </text>
    );
}

function Question() {
    return (  
        <group>
            <text position={[0, 2, 2]}
                rotation={[0, 0, 0]}
                fontSize={2}
                maxWidth={300}
                lineHeight={1}
                letterSpacing={0}
                text={"?"}
                font={fonts['Roboto']}
                anchorX="center"
                anchorY="middle"
            >
                <meshPhongMaterial attach="material" color={"#9945FF"} />
            </text>
            <text position={[1, 2.89, 2]}
                rotation={[0, 0, Math.PI/8]}
                fontSize={2}
                maxWidth={300}
                lineHeight={1}
                letterSpacing={0}
                text={"?"}
                font={fonts['Roboto']}
                anchorX="center"
                anchorY="middle"
            >
                <meshPhongMaterial attach="material" color={"#14F195"} />
            </text>
            <text position={[-1, 2.89, 2]}
                rotation={[0, 0, -Math.PI/8]}
                fontSize={2}
                maxWidth={300}
                lineHeight={1}
                letterSpacing={0}
                text={"?"}
                font={fonts['Roboto']}
                anchorX="center"
                anchorY="middle"
            >
                <meshPhongMaterial attach="material" color={"#4FA5C4"} />
            </text>
        </group>         

    );
}

// 42 6F 6D 62
function Clue0(props) {
    let one = "0x?? 0x??";
    let two = "0x?? 0x??";

    let codes = getGuideCodes(props.wallet);

    if(codes != null){
        one = `${codeToHexString(codes[0])} ${codeToHexString(codes[1])}`;
        two = `${codeToHexString(codes[2])} ${codeToHexString(codes[3])}`;
    }

    return (
        <group>
            <text
                position={[0, 5, -0.21]}
                rotation={[Math.PI / 4, Math.PI, 0]}
                fontSize={1}
                maxWidth={300}
                lineHeight={1}
                letterSpacing={0}
                text={one}
                font={fonts['Roboto']}
                anchorX="center"
                anchorY="middle"
            >
                <meshPhongMaterial attach="material" color={"#FFFFFF"} />
            </text>
            <text
                position={[0, 4.5, -1]}
                rotation={[Math.PI / 2.8, Math.PI, 0]}
                fontSize={1}
                maxWidth={300}
                lineHeight={1}
                letterSpacing={0}
                text={two}
                font={fonts['Roboto']}
                anchorX="center"
                anchorY="middle"
            >
                <meshPhongMaterial attach="material" color={"#FFFFFF"} />
            </text>
        </group>

    );
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
            position={[0, 5.5, 0]}
            rotation={[0,0,0]}
            fontSize={1}
            maxWidth={300}
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

function Chest(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/puzzle_chest.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleChest} position={[0, 1, 0]} rotation={[-Math.PI / 32,0,0]}/>
    );
}

function Lock0(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/green_lock.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleLock / 3} position={[0.34, 3.21, 1.55]} rotation={[-Math.PI / 32, Math.PI / 8, Math.PI / 8]}/>
    );
}

function Unlock0(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/green_unlock.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleLock / 3} position={[1.34, 1.5, 1.55]} rotation={[-Math.PI/2, 0, 0]}/>
    );
}

function Key0(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/green_key.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleLock / 2} position={[2.1, 1.5, 1.89]} rotation={[-Math.PI/2, -Math.PI / 8, Math.PI/2]}/>
    );
}

function Lock1(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/blue_lock.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleLock / 3} position={[-0.34, 3.13, 1.55]} rotation={[-Math.PI / 32, -Math.PI / 16, -Math.PI / 8]}/>
    );
}

function Unlock1(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/blue_unlock.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleLock / 3} position={[-1.21, 1.6, 1.9]} rotation={[-Math.PI/2, Math.PI/16, Math.PI/13]}/>
    );
}

function Key1(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/blue_key.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleLock / 2} position={[-1.5, 1.6, 2.3]} rotation={[Math.PI / 2, 0, -Math.PI/1.9]}/>
    );
}

function Lock2(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/pink_lock.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleLock / 3} position={[0, 2.9, 1.65]} rotation={[-Math.PI / 32, 0, 0]}/>
    );
}

function Unlock2(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/pink_unlock.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleLock / 3} position={[-0.08, 1.5, 2.6]} rotation={[-Math.PI/2, 0, Math.PI/1.9]}/>
    );
}

function Key2(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/pink_key.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleLock / 2} position={[0.21, 1.6, 1.85]} rotation={[Math.PI/2, 0, -Math.PI/32]}/>
    );
}

function Final(props) {
    const objRef = useRef();

    const { scene } = useGLTF('models/final.glb');
    return (
        <primitive ref={objRef} object={ scene } scale={scaleChest} position={[0, 1, 0]} rotation={[-Math.PI / 32,0,0]}/>
    );
}

function CameraControls(props) {
    
    const {
        camera,
        gl: { domElement },
    } = useThree();

    const [windowSize, setWindowSize] = useState([0, 0]);
    const [didUpdateFov, setDidUpdateFov] = useState(true);
    const [controlState, setControlState] = useState(0);
    const [isInit, setIsInit] = useState(false);
    const [controls, setController] = useState(null);
    const [timer, setTimer] = useState(0);

    const startedUsingControls = () => {
        setTimer(Date.now() + maxTO);
        setControlState(1);
    }

    const stoppedUsingControls = () => {
        setTimer(Date.now() + ocTO);
    }
    
    useLayoutEffect(() => {
        function updateSize() {
            setWindowSize([window.innerWidth, window.innerHeight]);
            setDidUpdateFov(true);
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useFrame(({ clock, camera }) => {
        let theta = getTheta(clock);
        let date = null

        if(controlState > 0){
            date = Date.now();
        }

        // Huge SO to nagman 
        // https://discourse.threejs.org/t/keeping-an-object-scaled-based-on-the-bounds-of-the-canvas-really-battling-to-explain-this-one/17574/10
        if( didUpdateFov ) {
            camera.aspect = windowSize[0] / windowSize[1];

        
            if (camera.aspect > planeAspectRatio) {
                // window too large
                const cameraHeight = Math.tan(MathUtils.degToRad(fov / 2));
                const ratio = camera.aspect / planeAspectRatio;
                const newCameraHeight = cameraHeight / ratio;
                camera.fov = MathUtils.radToDeg(Math.atan(newCameraHeight)) * 2;
            } else {
                // window too narrow
                camera.fov = fov;
            }
    
            setDidUpdateFov(false);
        }

        switch(controlState) {
            case 2: 
                if ( timer + 500 < date){
                    setControlState(3);
                }
                break;
            case 1: 
                controls.update();
                if ( 
                    camera.position.distanceTo(origin) > 500 ||
                    camera.position.distanceTo(targetVec) < 3
                ){
                    setControlState(2);
                    setTimer(date);
                    if(clock.getElapsedTime() >= SupernovaStart && props.supernova){
                        curtains(props.curtains, "22 Minutes...");
                    } else {
                        curtains(props.curtains, "Naughty");
                    }
                }
                break;
            case 3:
                if ( timer + 1000 < date){
                    setControlState(0);
                }
            default: 
                if((Math.abs(props.time - date) / 1000) >= SupernovaStart && props.supernova) break;

                camera.lookAt(target[0], target[1], target[2]);
                camera.position.y = orbit / yOffset + (orbit / 34 * Math.cos(theta));
                camera.position.x = startingPostion[0] + (orbit / 34 * Math.sin(theta));
                camera.position.y = startingPostion[1] + (orbit / 34 * Math.cos(theta));
                camera.position.z = startingPostion[2];
                camera.updateProjectionMatrix();    
                break;
        }
    })

    if(!isInit) {
        let initControls = new OrbitControls(camera, domElement);
        // Set Controls
        initControls.addEventListener('start', startedUsingControls);
        initControls.addEventListener('end', stoppedUsingControls);
        camera.position.x = startingPostion[0];
        camera.position.y = startingPostion[1];
        camera.position.z = startingPostion[2];
        camera.lookAt(target[0], target[1], target[2]);
        initControls.target.set(target[0], target[1], target[2]);
        initControls.enablePan = false;
        initControls.enableZoom = true;
        initControls.zoomSpeed = 0.34;
        initControls.rotateSpeed = 0.34;
        setController(initControls);
        setIsInit(true);
    }

    return null;
}

function StateScene(props) {

    switch(props.state) {
        case FSM.NotConnected:
        case FSM.MintGuide:
            return (
                <group>
                    <Suspense fallback={null}>
                        <Timer bomb={addDays(Date.now(), 3)} state={props.state}/>
                        <Clue0 wallet={props.wallet}/>
                        <Question />
                        <Chest />
                        <Lock0 />
                        <Lock1 />
                        <Lock2 />
                    </Suspense>
                </group>
            );   
        case FSM.MintNFKey1:
            return (
                <group>
                    <Suspense fallback={null}>
                        <Timer bomb={addDays(Date.now(), 3)} state={props.state}/>
                        <Chest />
                        <Lock0 />
                        <Lock1 />
                        <Lock2 />
                    </Suspense>
                </group>
            );  
        case FSM.MintNFKey2:
            return (
                <group>
                    <Suspense fallback={null}>
                        <Timer bomb={addDays(Date.now(), 3)} state={props.state}/>
                        <Chest />
                        <Unlock0 />
                        <Key0 />
                        <Lock1 />
                        <Lock2 />
                    </Suspense>
                </group>
            );  
        case FSM.MintNFKey3:
            return (
                <group>
                    <Suspense fallback={null}>
                        <Timer bomb={addDays(Date.now(), 3)} state={props.state}/>
                        <Chest />
                        <Unlock0 />
                        <Key0 />
                        <Unlock1 />
                        <Key1 />
                        <Lock2 />
                    </Suspense>
                </group>
            );  
        case FSM.OpenChest:
            return (
                <group>
                    <Suspense fallback={null}>
                        <Timer bomb={addDays(Date.now(), 3)} state={props.state}/>
                        <Chest />
                        <Unlock0 />
                        <Key0 />
                        <Unlock1 />
                        <Key1 />
                        <Unlock2 />
                        <Key2 />
                    </Suspense>
                </group>
            );  
        case FSM.Done:
            return (
                <group>
                    <Suspense fallback={null}>
                        <Supernova  state={props.state} time={props.time}/>
                        <Congratulations />
                        <Final />
                    </Suspense>
                </group>
            );  
        case FSM.CheckYourWallet: 
            return (
                <group>
                    <Suspense fallback={null}>
                        <Supernova state={props.state} time={props.time}/>
                        <FinalText />
                    </Suspense>
                </group>
            );  
    }

    return (<Error />)
}

export function BuildScene(props) {
    const [state, setState] = useState(props.state);
    const [time, setTime] = useState(new Date());

    if(state != props.state){
        setTime(new Date());
        setState(props.state);
    }

    return (
        <div className="scene-container">
            <Canvas dpr={window.devicePixelRatio} camera={{position:[0, orbit / (yOffset * 3), orbit - 3]}}>
                {/* <ambientLight position={[0, 2, 0]} intensity={0.89}/> */}
                {/* <directionalLight position={[0, 0, -orbit]} intensity={3}/> */}
                {/* <directionalLight position={[orbit, orbit, orbit]} intensity={0.9}/> */}
                <pointLight position={[0, 5, 3]} intensity={0.55}/>
                <pointLight position={[5, 5, 5]} intensity={0.13}/>
                <pointLight position={[0, 6, -3]} intensity={0.21}/>
                <pointLight position={[3, 5, -5]} intensity={0.21}/>
                <pointLight position={[-3, 5, -5]} intensity={0.21}/>
                <StateScene state={state} time={time} wallet={props.wallet}/>
                <Stars
                    radius={100} // Radius of the inner sphere (default=100)
                    depth={50} // Depth of area where stars should fit (default=50)
                    count={5000} // Amount of stars (default=5000)
                    factor={3} // Size factor (default=4)
                    saturation={0.55} // Saturation 0-1 (default=0)
                    fade={true} // Faded dots (default=false)
                />
                <EffectComposer multisampling={8} autoClear={false}>
                    <Bloom intensity={0.08} luminanceThreshold={0.08} luminanceSmoothing={0} />
                </EffectComposer>
                <CameraControls curtains={props.curtains} supernova={(state == FSM.Done || state == FSM.CheckYourWallet)} time={time}/>
            </Canvas>
        </div>
    );
}