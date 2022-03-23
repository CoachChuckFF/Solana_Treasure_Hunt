import * as React from "react";
import { 
    useGLTF, 
    Stars, 
    Environment,
    Plane,
    Dodecahedron, 
} from "@react-three/drei";
import {
    Clock,
    CubeTextureLoader,
    Group,
    Vector3,
    PointLight,
    Shape,
    GridHelper
} from "three";
import { Camera, Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { STControls } from "../controllers/worldController";
import { preloadFont } from "troika-three-text";

// import { curtains } from './curtains';
// import { getGuideCodes, codeToHexString } from "./hashes";
import { StoreContext } from "../controllers/store";
import * as STState from '../models/state';
import * as STS from "../models/space";

import { TextWoraround } from "../controllers/renderers";
import { ST_COLORS } from "../models/theme";
import { getCountdownString } from "../models/clock";
import { lerp } from "three/src/math/MathUtils";


const PI = Math.PI;
const TRI = Math.sqrt(3)/2;

const HubRadius = 5.5;
const HexTheta = (2*PI/6);
const Thirty = HexTheta / 2;
const HubZ = Math.sin(Thirty) * (TRI * HubRadius)
const HubX = Math.cos(Thirty) * (TRI * HubRadius)

// Builders -----------------
interface GLBParams {
    file: string,
    objRef: React.MutableRefObject<Group | undefined>,
    space: STS.STSpace,
    cb?: ()=>null
    url?: string,
    canHighlight?: boolean,
    highlightScaleFactor?: number,
}
function STGLBFile(props:any){
    const params = props.params as GLBParams;
    const { scene } = useGLTF(params.file);
    const scaleFactor = params.highlightScaleFactor ?? 1.1;

    const pointerOver = () => {
        if( params.canHighlight ) {
            if(params.objRef.current){
                params.objRef.current.scale.x *= scaleFactor;
                params.objRef.current.scale.y *= scaleFactor;
                params.objRef.current.scale.z *= scaleFactor;
            }
        }
    }

    const pointerOut = () => {
        if( params.canHighlight ) {
            if(params.objRef.current){
                params.objRef.current.scale.x *= 1/scaleFactor;
                params.objRef.current.scale.y *= 1/scaleFactor;
                params.objRef.current.scale.z *= 1/scaleFactor;
            }
        }
    }

    const handleClick = () => {
        if(params.url){
            window.open(params.url, '_blank');
        } else if(params.cb){
            params.cb();
        }
    }

    return (
        <React.Suspense fallback={null}>
            <primitive 
                object={ scene.clone() } 
                onClick={()=>{ handleClick() }} 
                onPointerOver={() => { pointerOver() }} 
                onPointerOut={() => { pointerOut() }} 
                ref={ params.objRef } 
                scale={ params.space.scale ?? 1.0 } 
                position={ params.space.pos.toArray() } 
                rotation={ params.space.rot.toArray() }
            />
        </React.Suspense>);
}


interface TextParams {
    text: string,
    objRef: React.MutableRefObject<any>,
    space: STS.STSpace,
    fontSize?: number, 
    maxWidth?: number,
    lineHeight?: number,
    letterspacing?: number,
    color?: string,
    anchorX?: string, //left, center, right
    anchorY?: string, //top, top-baseline, middle, bottom-baseline, bottom
}
function STText(props:any) {
    const params = props.params as TextParams;

    return (
            <TextWoraround
                objRef={params.objRef}
                position={ params.space.pos.toArray() } 
                rotation={ params.space.rot.toArray() }
                fontSize={ params.fontSize ?? 0.34 }
                maxWidth={ params.maxWidth ?? 2.34 }
                lineHeight={ params.lineHeight ?? 1.55 }
                letterspacing={ params.letterspacing ?? 0 }
                color={ params.color ?? ST_COLORS.white }
                text={ params.text }
                anchorX={ params.anchorX }
                anchorY={ params.anchorY }
            />
    )
}

// GLB FILES ---------------
function Title(props:any) { 
    const ref = React.useRef<any>();

    useFrame(({ clock, camera }) => { 
        if(
            props.globalState === STState.ST_GLOBAL_STATE.notConnected ||
            props.globalState === STState.ST_GLOBAL_STATE.supernova
        ){
            if(ref.current){
                ref.current.position.copy( camera.position );
                ref.current.rotation.copy( camera.rotation );
                ref.current.updateMatrix();
                ref.current.translateZ(-3);
                ref.current.translateY( Math.sin(clock.getElapsedTime()) * 0.1);
            }
        }
    });

    return (
        <STText params={{
            text: "Sol-Treasure",
            objRef: ref,
            space: STS.StartingCamera,
            anchorX: "center",
            anchorY: "middle",
        } as TextParams}/>
    );
}

function BlackHole(props:any) {
    const blackHoleRef = React.useRef<Group>();
    // const textRef = React.useRef<any>();

    useFrame(({ clock, camera }) => { 
        if( blackHoleRef.current ){
            blackHoleRef.current.rotation.x  -= 0.0001;
            blackHoleRef.current.rotation.y  -= 0.0003;
            blackHoleRef.current.rotation.z  -= 0.0005;
        }
    });

    return (
        <group>
            <pointLight intensity={0.1} position={STS.SecretArea.toArray()}/>
            <Dodecahedron scale={10} ref={blackHoleRef} position={STS.SecretArea.toArray()}>
                <meshBasicMaterial attach="material" color="black" />
            </Dodecahedron>
        </group>
    );
}

function BlackHoleForge(props:any) {
    const blackHoleRef = React.useRef<Group>();
    const materialRef = React.useRef<any>();
    // const textRef = React.useRef<any>();

    const getScale = () => {
        return (Math.sin(Date.now() / 8000) * 0.13) + 1;
    }

    // const getColor = () => {
    //     let hex = Math.floor(lerp(0xEA, 0x00, Math.min(1.0, Math.sin(Date.now() / 8000) * 0.13) + 1));
    //     return `#${hex.toString(16)}${hex.toString(16)}${hex.toString(16)}`;
    // }

    useFrame(({ clock, camera }) => { 
        if( blackHoleRef.current ){
            blackHoleRef.current.rotation.x  -= 0.001;
            blackHoleRef.current.rotation.y  -= 0.003;
            blackHoleRef.current.rotation.z  -= 0.005;

            let scale = getScale();
            blackHoleRef.current.scale.x = scale;
            blackHoleRef.current.scale.y = scale;
            blackHoleRef.current.scale.z = scale;
        }

        // if( materialRef.current ){
        //     materialRef.current.color = getColor();
        // }
    });

    let pos = STS.SHubIndex2.pos.toArray();
    pos[1] += 1;

    return (
        <group>
            <pointLight intensity={0.1} position={STS.SecretArea.toArray()}/>
            <Dodecahedron 
                scale={getScale()} 
                ref={blackHoleRef} 
                position={pos}
            >   
                <meshBasicMaterial ref={materialRef} attach="material" color={"black"} />
            </Dodecahedron>
        </group>
    );
}

function Supernova(props:any) {
    const supernovaRef = React.useRef<Group>();
    const sunRef = React.useRef<Group>();
    // const textRef = React.useRef<any>();

    useFrame(({ clock, camera }) => { 
        if( supernovaRef.current ){
            supernovaRef.current.rotation.y  -= 0.003;
        }
        if( sunRef.current ){
            sunRef.current.rotation.y  -= 0.003;
        }

        // if( textRef.current ){
        //     textRef.current.position.y = Math.sin(
        //         clock.getElapsedTime()/3
        //     ) * 0.55;
        // }
    });

    return (
        <group>
            <pointLight intensity={0.5} />
            {/* <STText params={{
                text: "Star",
                objRef: textRef,
                color: ST_COLORS.gold,
                space: {pos: new Vector3(0, 0.34, -0.25), rot: new Vector3(-PI/2, 0, 0)}
            } as TextParams}/> */}
            <STGLBFile params={{
                file: STS.SunGLB,
                objRef: sunRef,
                space: {pos: STS.MainArea, rot: STS.MainArea, scale: STS.scaleMiniLock},
            } as GLBParams} />
            <STGLBFile params={{
                file: STS.SupernovaGLB,
                objRef: supernovaRef,
                space: {pos: STS.MainArea, rot: STS.MainArea, scale: STS.scaleMiniLock},
            } as GLBParams} />
        </group>
    );
}

function MainChestOpened() {
    const timerRef = React.useRef<any>();
    const chestRef = React.useRef<Group>();
    const tokenRef = React.useRef<Group>();

    useFrame(({ clock, camera }) => { 
        if(chestRef.current){
            chestRef.current.position.x = STS.HubIndex0.pos.x + Math.sin(clock.getElapsedTime()) * 0.021;
            chestRef.current.position.y = STS.HubIndex0.pos.y + Math.sin(clock.getElapsedTime()/2) * 0.021;
        }

        if(tokenRef.current){
            tokenRef.current.position.x = STS.HubIndex0.pos.x + Math.sin(clock.getElapsedTime()) * 0.021
            tokenRef.current.position.y = STS.HubIndex0.pos.y + Math.sin(clock.getElapsedTime()/2) * 0.021 + 1
            tokenRef.current.rotation.y += PI / 300;
            // tokenRef.current.position.y = 0.4 + Math.sin(clock.getElapsedTime() + PI/8) * 0.089;
        }
    });

    return (
        <group>
            {/* <Timer bomb={props.bomb} opened={true} run={props.run} state={props.state} puzzleState={props.puzzleState}/> */}
            <STText params={{
                text: "hi",
                objRef: timerRef,
                space: STS.HubIndex1
            } as TextParams}/>
            <STGLBFile params={{
                file: STS.ChestOpenedGLB,
                objRef: chestRef,
                space: {...STS.HubIndex0, scale: STS.scaleChest},
            } as GLBParams} />
            <STGLBFile 
                params={{
                    file: STS.ReplayTokenGLB,
                    objRef: tokenRef,
                    space: {...STS.HubIndex0, scale: STS.scaleChest},
                } as GLBParams}
            /> 
        </group>
    );
}

function Timer(props:any) {
    const ref = React.useRef();
    const [message, setMessage] = React.useState('Loading...');
    const [color, setColor] = React.useState('#FFFFFF');


    useFrame(({ clock }) => {
        if(props.globalState === STState.ST_GLOBAL_STATE.reconstruction){
            setMessage("TODO");
            setColor("#4FA5C4");
            // if(props.puzzleState.regular){
            //     // setMessage(getTimeString(props.run[1] - props.run[0]));
            //     setMessage("TODO");
            //     setColor("#4FA5C4");
            // } else {
            //     setMessage(getTimeString(Date.now() - props.run[0]));
            //     setColor("#FFFFFF");
            // }
        } else {
            let time = props.gameState.supernova - Date.now();
            let state = Math.round(time / 1000) % 30;
            
            if(props.globalState !== STState.ST_GLOBAL_STATE.notConnected) {
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
                } else if(state === 10 && props.gameState.main > 0) {
                    setMessage("YOU");
                    setColor("#9945FF");
                } else if(state === 9 && props.gameState.main > 0) {
                    setMessage("DID");
                    setColor("#9945FF");
                } else if(state === 8 && props.gameState.main > 0) {
                    setMessage("IT!");
                    setColor("#9945FF");
                } else {
                    setMessage(getCountdownString(props.gameState.supernova));
                    setColor("#FFFFFF");
                }
            }
        }

    });

    return (
        <STText params={{
            objRef: ref,
            text: message,
            color: color,
            fontSize: 0.5,
            space: {
                pos: STS.HubIndex0.pos.clone().add(new Vector3(0, STS.EyeLevel + 0.69, 0)),
                rot: new Vector3(0,PI/32,0)
            }
        } as TextParams}/>
    );
}

function Chest(props:any) { 
    const chestRef = React.useRef<Group>();
    const blueLockRef = React.useRef<Group>();
    const greenLockRef = React.useRef<Group>();
    const purpleLockRef = React.useRef<Group>();
    const blackLockRef = React.useRef<Group>();
    const whiteLockRef = React.useRef<Group>();

    const getOffset = (isY?:boolean) => {
        return (isY ? Math.sin(Date.now() / 1000 / 2) : Math.sin(Date.now()/1000)) * 0.021;
    }  
    
    const getLittleYOffset = (yOffset:number) => {
        return  Math.sin(Date.now()/1000/2 + yOffset) * 0.089
    }

    const getAnimationOffset = (index:number) => {
        const divisor = 21;
        return getLittleYOffset(PI/(divisor * index));
    }

    const getItemPos = (xOffset:number, yOffset:number, x:number, y:number, z:number, index?:number) => {
        let basePos = props.isSecret ? STS.SHubIndex0 : STS.HubIndex0;
        return new Vector3(
            (basePos.pos.x) + xOffset + x,
            (basePos.pos.y) + yOffset + y + (index ? getAnimationOffset(index) : 0),
            (basePos.pos.z) + z,
        );
    }

    useFrame(({ clock, camera }) => {
        let xOffset = getOffset(false);
        let yOffset = getOffset(true);

        if(chestRef.current){
            let chestPos = getItemPos(xOffset, yOffset, 0,0,0);
            chestRef.current.position.x = chestPos.x;
            chestRef.current.position.y = chestPos.y;
            chestRef.current.position.z = chestPos.z;
        }

        if(blueLockRef.current){
            let blueLock = getItemPos(xOffset, yOffset, 0.21, 0.8, 0.89, 4);
            blueLockRef.current.position.x = blueLock.x;
            blueLockRef.current.position.y = blueLock.y;
            blueLockRef.current.position.z = blueLock.z;
        }

        if(greenLockRef.current){
            let greenLock = getItemPos(xOffset, yOffset, -0.21, 0.8, 0.85, 2);
            greenLockRef.current.position.x = greenLock.x;
            greenLockRef.current.position.y = greenLock.y;
            greenLockRef.current.position.z = greenLock.z;
        }

        if(purpleLockRef.current){
            let purpleLock = getItemPos(xOffset, yOffset, 0, 0.4, 0.89, 3);
            purpleLockRef.current.position.x = purpleLock.x;
            purpleLockRef.current.position.y = purpleLock.y;
            purpleLockRef.current.position.z = purpleLock.z;
        }

        if(props.isSecret){
            if(whiteLockRef.current){
                let whiteLock = getItemPos(xOffset, yOffset, -0.37, 0.4, 0.89, 1);
                whiteLockRef.current.position.x = whiteLock.x;
                whiteLockRef.current.position.y = whiteLock.y;
                whiteLockRef.current.position.z = whiteLock.z;
            }

            if(blackLockRef.current){
                let blackLock = getItemPos(xOffset, yOffset, 0.37, 0.4, 0.89, 5);
                blackLockRef.current.position.x = blackLock.x;
                blackLockRef.current.position.y = blackLock.y;
                blackLockRef.current.position.z = blackLock.z;
            }
        } else {
            if(whiteLockRef.current){
                whiteLockRef.current.visible = false;
            }

            if(blackLockRef.current){
                blackLockRef.current.visible = false;
            }
        }
    });

    return (
        <group>
            {/* <Timer bomb={props.bomb} opened={false} run={props.run} state={props.state} puzzleState={props.puzzleState}/> */}
            <Timer 
                visable={!props.isSecret}
                globalState={props.globalState}
                gameState={props.gameState}
            />
            <STGLBFile 
                params={{
                    file: props.gameState.blueKey > 0 ? STS.BlueUnlockGLB : STS.BlueLockGLB,
                    objRef: blueLockRef,
                    space: {
                        ...STS.HubIndex0,
                        pos: getItemPos(getOffset(false), getOffset(true), 0.21, 0.8, 0.89, 3),
                        scale: STS.scaleMiniLock
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: props.gameState.greenKey > 0 ? STS.GreenUnlockGLB : STS.GreenLockGLB,
                    objRef: greenLockRef,
                    space: {
                        ...STS.HubIndex0,
                        pos: getItemPos(getOffset(false), getOffset(true), -0.21, 0.8, 0.85, 1),
                        scale: STS.scaleMiniLock
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: props.gameState.purpleKey > 0 ? STS.PurpleUnlockGLB : STS.PurpleLockGLB,
                    objRef: purpleLockRef,
                    space: {
                        ...STS.HubIndex0,
                        pos: getItemPos(getOffset(false), getOffset(true), 0, 0.4, 0.89, 2),
                        scale: STS.scaleMiniLock
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                visable={props.isSecret}
                params={{
                    file: props.gameState.blackKey > 0 ? STS.BlackUnlockGLB : STS.BlackLockGLB,
                    objRef: blackLockRef,
                    space: {
                        ...STS.HubIndex0,
                        pos: getItemPos(getOffset(false), getOffset(true), 0.37, 0.4, 0.89, 0),
                        scale: STS.scaleMiniLock
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                visable={props.isSecret}
                params={{
                    file: props.gameState.whiteKey > 0 ? STS.WhiteUnlockGLB : STS.WhiteLockGLB,
                    objRef: whiteLockRef,
                    space: {
                        ...STS.HubIndex0,
                        pos: getItemPos(getOffset(false), getOffset(true), -0.37, 0.4, 0.89, 4),
                        scale: STS.scaleMiniLock
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: props.isSecret ? STS.WhiteChestClosedGLB : STS.ChestClosedGLB,
                    objRef: chestRef,
                    space: {
                        ...STS.HubIndex0,
                        pos: getItemPos(getOffset(false), getOffset(true), 0,0,0),
                        scale: STS.scaleChest
                    },
                } as GLBParams}
            /> 
        </group>
    );
}

function Inventory(props:any) {
    const gameState = props.gameState as STState.GameState;
    const globalState = props.globalState as STState.ST_GLOBAL_STATE;

    const blueKeyRef = React.useRef<Group>();
    const greenKeyRef = React.useRef<Group>();
    const purpleKeyRef = React.useRef<Group>();
    const brokenKeyRef = React.useRef<Group>();
    const blackKeyRef = React.useRef<Group>();
    const whiteKeyRef = React.useRef<Group>();

    const refs = [
        blueKeyRef,
        greenKeyRef,
        purpleKeyRef,
        brokenKeyRef,
        blackKeyRef,
        whiteKeyRef
    ];

    const indexToAmount = (index: number) => {
        switch(index){
            case 0: return gameState.blueKey;
            case 1: return gameState.greenKey;
            case 2: return gameState.purpleKey;
            case 3: return gameState.brokenKey;
            case 4: return gameState.blackKey;
            case 5: return gameState.whiteKey;
        }

        return 0;
    }
    
    useFrame(({ clock, camera }) => {
        for(var i = 0; i < refs.length; i++){  
            let ref = refs[i] as React.MutableRefObject<Group>;
            let amount = indexToAmount(i);
            if(amount > 0 && globalState === STState.ST_GLOBAL_STATE.playing){
                ref.current.position.copy( camera.position );
                ref.current.rotation.copy( camera.rotation );
                ref.current.updateMatrix();
                ref.current.translateZ( -0.3 );
                ref.current.translateY( 0.155 );
                ref.current.translateX( -0.06 + (i / (refs.length - 1) * 0.12));
                ref.current.rotateZ(-PI/2);
                ref.current.rotateY(-PI/8);
                ref.current.rotateX(clock.getElapsedTime() / 2 - (i * PI/5));
            } else {
                ref.current.visible = false;
            }
        }
    });

    return (
        <group>
            <STGLBFile 
                params={{
                    file: STS.BlueKeyGLB,
                    objRef: blueKeyRef,
                    space: {
                        ...STS.HubIndex0,
                        scale: STS.keyScale
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: STS.GreenKeyGLB,
                    objRef: greenKeyRef,
                    space: {
                        ...STS.HubIndex0,
                        scale: STS.keyScale
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: STS.PurpleKeyGLB,
                    objRef: purpleKeyRef,
                    space: {
                        ...STS.HubIndex0,
                        scale: STS.keyScale
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: STS.BrokenKeyGLB,
                    objRef: brokenKeyRef,
                    space: {
                        ...STS.HubIndex0,
                        scale: STS.keyScale
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: STS.BlackKeyGLB,
                    objRef: blackKeyRef,
                    space: {
                        ...STS.HubIndex0,
                        scale: STS.keyScale
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: STS.WhiteKeyGLB,
                    objRef: whiteKeyRef,
                    space: {
                        ...STS.HubIndex0,
                        scale: STS.keyScale
                    },
                } as GLBParams}
            /> 
        </group>
    );
}

function Leaderboard(props:any) { 
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
        <TitleNText
            title={"LEADERBOARDS"}
            body={leaders}
            deltaY={props.deltaY}
            space={STS.HubIndex1}
        />
    );
}

function Story(props:any) { 
    return (
        <TitleNText
            title={"STORY"}
            body={STState.getStory()}
            deltaY={props.deltaY}
            space={STS.HubIndex5}
        />
    );
}

function TitleNText(props:any) { 
    const [deltaY, setDeltaY] = React.useState(0);
    const [didUpdate, setDidUpdate] = React.useState(false);

    const titleRef = React.useRef<any>();
    const bodyRef = React.useRef<any>();

    React.useEffect(() => {
        setDeltaY(props.deltaY);
        setDidUpdate(false);
    }, [props.deltaY]);

    const diff = 0;
    useFrame(({ clock, camera }) => { 
        if(!didUpdate){
            let newPos = Math.min(titleRef.current.position.y + (deltaY / 1000), 5);
            newPos = Math.max(newPos, -1.55);
            titleRef.current.position.y = newPos;
            bodyRef.current.position.y = newPos - diff;

            setDidUpdate(true);
        }
        
    });

    return (
        <group >
            <STText params={{
                objRef: titleRef,
                text: props.title,
                fontSize: 0.5,
                maxWidth: 2.34,
                lineHeight: 1.55,
                anchorY: "bottom",
                space: {
                    ...props.space,
                    pos: props.space.pos.clone().add(new Vector3(0, STS.EyeLevel + 0.69, 0)),
                }
            } as TextParams}/>
            <STText params={{
                objRef: bodyRef,
                text: props.body,
                fontSize: 0.21,
                maxWidth: 2.34,
                lineHeight: 1.55,
                anchorY: "top",
                space: {
                    ...props.space,
                    pos: props.space.pos.clone().add(new Vector3(0, STS.EyeLevel + 0.69, 0)),
                }
            } as TextParams}/>
        </group>

    );
}

function Lock(props:any) {
    const lockRef = React.useRef<Group>();

    const getTheta = () => {
        return Date.now()/1000 + props.index * PI/5;
    }
    const getYPos = (theta:number) => {
        return Math.sin(theta) * 0.1 + 0.34 + (props.secret ? STS.SecretArea.y : 0);
    }
    const getYRot = (theta:number) => {
        return theta / 2.1;
    }

    useFrame(({ clock, camera }) => {
        let theta = getTheta();
        if(lockRef.current){
            lockRef.current.position.y = getYPos(theta);
        }

        if(!props.locked){
            if(lockRef.current){
                lockRef.current.rotation.y = getYRot(theta);
            }
        }
    });

    return (
        <STGLBFile 
            params={{
                file: props.locked ? props.lock : props.unlock,
                objRef: lockRef,
                space: {
                    ...props.space,
                    pos: (props.space as STS.STSpace).pos.setY(getYPos(getTheta())),
                    rot: props.locked ? props.space.rot : (props.space as STS.STSpace).rot.setY(getYRot(getTheta())),
                    scale: STS.scaleLock
                },
            } as GLBParams}
        /> 
    );
}

// SCENE ---------------
const OffsetTheta = 2 * PI / 6;
function Floor(props:any){  

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
          <meshStandardMaterial wireframe={true} transparent={false} opacity={1} color="#EAEAEA"/>
        </mesh>
    );

    // return (
    //     <Plane ref={props.fref} args={[3, 3]} position={[0,0,0]} >
    //         <meshPhongMaterial attach="material" color="#f3f3f3" />
    //     </Plane>
    // );
}

function FloorSet(props:any) {
    const refs = [
        React.useRef(),
        React.useRef(),
        React.useRef(),
        React.useRef(),
        React.useRef(),
        React.useRef(),
    ];

    return (
        <group>
            <Floor wire={props.cameraSlot === (props.indexes ? props.indexes[0] : 3)} pos={props.pos} fref={refs[0]} radius={props.radius} startingTheta={OffsetTheta * 0}/>
            <Floor wire={props.cameraSlot === (props.indexes ? props.indexes[1] : 4)} pos={props.pos} fref={refs[1]} radius={props.radius} startingTheta={OffsetTheta * 1}/>
            <Floor wire={props.cameraSlot === (props.indexes ? props.indexes[2] : 5)} pos={props.pos} fref={refs[2]} radius={props.radius} startingTheta={OffsetTheta * 2}/>
            <Floor wire={props.cameraSlot === (props.indexes ? props.indexes[3] : 0)} pos={props.pos} fref={refs[3]} radius={props.radius} startingTheta={OffsetTheta * 3}/>
            <Floor wire={props.cameraSlot === (props.indexes ? props.indexes[4] : 1)} pos={props.pos} fref={refs[4]} radius={props.radius} startingTheta={OffsetTheta * 4}/>
            <Floor wire={props.cameraSlot === (props.indexes ? props.indexes[5] : 2)} pos={props.pos} fref={refs[5]} radius={props.radius} startingTheta={OffsetTheta * 5}/>
        </group>
    );
}

function STController(props:any){
    const lightRef = React.useRef<PointLight>();
    const { camera, gl: { domElement },} = useThree();
    const [controller, setController] = React.useState<STControls | null>(null);
    const [tick, setTick] = React.useState<number>(0);

    const [lastDevMode, setLastDevMode] = React.useState<boolean>(false);
    const [lastGlobalState, setLastGlobalState] = React.useState<STState.ST_GLOBAL_STATE>(STState.ST_GLOBAL_STATE.notConnected);
    const [lastTargetPos, setLastTargetPos] = React.useState<Vector3>(STS.MainCamera.pos);

    const event = "scroll";
    const listener = (event:any)=>{ props.onScroll(event.event); };

    // Init
    React.useEffect(() => {
        const controller = new STControls(camera, domElement, STS.MainCamera.pos.toArray());

        controller.addEventListener(event, listener);


        camera.lookAt(STS.MainCamera.pos);
        setController(controller);
        setTick(Date.now());

        return () => {
            controller.removeEventListener(event, listener);
        };
    }, []);

    useFrame(({ camera, clock }) => { 

        if(controller && lightRef.current){

            if(lastDevMode !== props.devMode){
                setLastDevMode( props.devMode);
                setTick(Date.now());
                return;
            }

            if(lastGlobalState !== props.globalState){
                setLastGlobalState( props.globalState);
                setTick(Date.now());
                return;
            }

            // Get Target Position
            let targetPos = STS.MainCamera.pos;
            if(props.devMode){
                targetPos = (props.cameraPosition.pos as Vector3).clone().add(STS.CameraOffset);
            }

            if(!STS.vectorsMatch(lastTargetPos, targetPos)){
                controller.target = targetPos.clone();
                controller.update();
                setLastTargetPos(targetPos);
                setTick(Date.now());
                return;
            }

            let distance = targetPos.distanceTo(camera.position);
            let tock = Math.min(((Date.now() - tick) / STS.zoomInTime), 1.0);

            // Update Light
            if(!camera.position.equals(lightRef.current.position)){
                lightRef.current.position.copy(camera.position);
                lightRef.current.intensity = Math.min(Math.sqrt(distance) + 0.05, 0.5);
                lightRef.current.updateMatrix();
            }

            // Auto Rotate
            controller.autoRotate = false;


            // Move Camera
            switch(props.globalState){
                case STState.ST_GLOBAL_STATE.supernova:
                case STState.ST_GLOBAL_STATE.notConnected: 
                    controller.autoRotate = true;
                    if(distance < STS.superNovaDistance - 5){
                        camera.position.setZ(STS.lerpToNumber(
                            camera.position.z,
                            STS.superNovaDistance,
                            tock,
                        ));
                    }
                    if(props.cameraSlot !== STS.ST_CAMERA_SLOTS.nullSlot){
                        props.setCameraSlot(STS.ST_CAMERA_SLOTS.nullSlot);
                    }
                    break;
                case STState.ST_GLOBAL_STATE.reconstruction:
                case STState.ST_GLOBAL_STATE.playing:
                    if(distance > 0.05){
                        STS.lerpToVector(
                            camera.position,
                            camera.position,
                            targetPos,
                            tock
                        );
                    }

                    let slot = STS.getCameraSlot(
                        camera,
                        props.devMode
                    );
                    if( slot !== props.cameraSlot){
                        props.setCameraSlot(slot);
                    }
                break;
            }


            if(controller.autoRotate){
                controller.update();
            }

        }
    });

    return <React.Suspense fallback={null}><pointLight ref={lightRef} intensity={0.1}/></React.Suspense>;
}

// Loads the skybox texture and applies it to the scene.
function SkyBox() {
    const { scene } = useThree();

    React.useEffect(() => {
        const loader = new CubeTextureLoader();
        const texture = loader.load([
            STS.SKYBOX_PX,
            STS.SKYBOX_NX,
            STS.SKYBOX_PY,
            STS.SKYBOX_NY,
            STS.SKYBOX_PZ,
            STS.SKYBOX_NZ,
          ]);
          // Set the scene background property to the resulting texture.
          scene.background = texture;
    }, []);

    return null;
}

export function STWorld() {
    const [scrollDeltaY, setScrollDeltaY] = React.useState(0);
    const [assetsLoaded, setAssetsLoaded] = React.useState(false);

    const {
        globalState: [globalState],
        devMode: [devMode],
        cameraPosition: [cameraPosition],
        cameraSlot: [cameraSlot, setCameraSlot],
        gameState: [gameState],
    } = React.useContext(StoreContext);


    React.useEffect(() => {
        preloadFont({
            font: STS.VimlandFont,
            characters: 'abcdefghijklmnopqrstuvwxyz'
        }, ()=> {
            setAssetsLoaded(true);
        })
    }, []);

    const onScroll = (event:any) => {
        setScrollDeltaY(event.deltaY);
    }

    if(!assetsLoaded) return null;

    return (
        <div className="scene-container">
            <Canvas 
                dpr={window.devicePixelRatio} 
                camera={{position: STS.StartingCamera.pos.toArray(), rotation: STS.StartingCamera.rot.toArray(), fov: STS.Fov}}
            >
                <React.Suspense fallback={null}>
                    <Supernova />
                    <Chest globalState={globalState} gameState={gameState} isSecret={false}/>
                    <Leaderboard deltaY={scrollDeltaY}/>
                    <Lock secret={false} locked={gameState.blueKey === 0} index={2} lock={STS.BlueLockGLB} unlock={STS.BlueUnlockGLB} space={STS.HubIndex2} />
                    <Lock secret={false} locked={gameState.greenKey === 0} index={3} lock={STS.GreenLockGLB} unlock={STS.GreenUnlockGLB} space={STS.HubIndex3} />
                    <Lock secret={false} locked={gameState.purpleKey === 0} index={4} lock={STS.PurpleLockGLB} unlock={STS.PurpleUnlockGLB} space={STS.HubIndex4} />
                    <Story />
                    <gridHelper position={STS.MainArea.toArray()} args={[10, 10, ST_COLORS.purple, ST_COLORS.grey]}/>
                </React.Suspense>
                <React.Suspense fallback={null}>
                    <BlackHole />
                    <Chest isSecret={true} globalState={globalState} gameState={gameState}/>
                    <Lock secret={true} locked={gameState.whiteKey === 0} index={5} lock={STS.WhiteLockGLB} unlock={STS.WhiteUnlockGLB} space={STS.SHubIndex5} />
                    <Lock secret={true} locked={gameState.blackKey === 0} index={1} lock={STS.BlackLockGLB} unlock={STS.BlackUnlockGLB} space={STS.SHubIndex1} />
                    <Lock secret={true} locked={gameState.greenKey === 0} index={3} lock={STS.GreenLockGLB} unlock={STS.GreenUnlockGLB} space={STS.SHubIndex3} />
                    <BlackHoleForge />
                    <gridHelper position={STS.SecretArea.toArray()} args={[10, 10, ST_COLORS.white, ST_COLORS.grey]}/>
                </React.Suspense>
                <React.Suspense fallback={null}>
                    <Title 
                        globalState={globalState}
                    />
                    <SkyBox/>
                    <Stars
                        radius={100} // Radius of the inner sphere (default=100)
                        depth={50} // Depth of area where stars should fit (default=50)
                        count={5000} // Amount of stars (default=5000)
                        factor={10} // Size factor (default=4)
                        saturation={0.55} // Saturation 0-1 (default=0)
                        fade={true} // Faded dots (default=false)
                    />
                    <EffectComposer multisampling={8} autoClear={false}>
                        <Bloom intensity={0.13} luminanceThreshold={0.08} luminanceSmoothing={0} />
                    </EffectComposer>
                </React.Suspense>
                <STController 
                    onScroll={onScroll}
                    globalState={globalState}
                    devMode={devMode}
                    cameraPosition={cameraPosition}
                    cameraSlot={cameraSlot}
                    setCameraSlot={setCameraSlot}
                />
            </Canvas>
        </div>
    );
}