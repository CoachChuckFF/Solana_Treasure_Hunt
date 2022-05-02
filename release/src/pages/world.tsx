import * as React from "react";
import { 
    useGLTF, 
    Stars, 
    Dodecahedron,
} from "@react-three/drei";
import {
    Group,
    Vector3,
    PointLight,
} from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { STControls } from "../controllers/worldController";
import { preloadFont } from "troika-three-text";

import { StoreContext } from "../controllers/store";
import * as STState from '../models/state';
import * as STS from "../models/space";

import { TextWoraround } from "../controllers/renderers";
import { ST_COLORS } from "../models/theme";
import { getCountdownString, getTimeString, getTimerString } from "../models/clock";
// import { FXs, playByte } from "../sounds/music-man";
import { BNToDate, GameAccount, LeaderboardType, sortLeaderboard } from "../models/sol-treasure";

const PI = Math.PI;

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
                objRef={ params.objRef }
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

    if(props.globalState === STState.ST_GLOBAL_STATE.supernova) return null;

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
    const miniBlackHoleRef = React.useRef<Group>();

    useFrame(() => { 
        if( blackHoleRef.current ){
            blackHoleRef.current.rotation.x  -= 0.001;
            blackHoleRef.current.rotation.y  -= 0.003;
            blackHoleRef.current.rotation.z  -= 0.005;
        }

        if( miniBlackHoleRef.current ){
            miniBlackHoleRef.current.rotation.y  -= 0.003;
        }
    });

    return (
        <group>
            <pointLight intensity={0.1} position={STS.SecretArea.toArray()}/>
            <Dodecahedron scale={10} ref={blackHoleRef} position={STS.SecretArea.toArray()}>
                <meshBasicMaterial attach="material" color="black" />
            </Dodecahedron>
            <Dodecahedron scale={0.55} ref={miniBlackHoleRef} position={STS.SecretArea.toArray()}>
                <meshBasicMaterial attach="material" color="black" />
            </Dodecahedron>
        </group>
    );
}

function RedHerring(props:any) {
    const redHerringRef = React.useRef<Group>();
    const gameState = (props.gameState as STState.GameState);

    useFrame(() => { 
        if( redHerringRef.current ){
            redHerringRef.current.rotation.x  -= 0.003;
            redHerringRef.current.rotation.y  -= 0.005;
            redHerringRef.current.rotation.z  -= 0.008;
        }
    });


    if(gameState.redHerring === 0) return null;


    return (
        <group>
            <STGLBFile 
                params={{
                    file: STS.FishGLB,
                    objRef: redHerringRef,
                    canHighlight: true,
                    space: {
                        ...STS.SHubIndex4,
                        pos: new Vector3(
                            STS.SHubIndex4.pos.x,
                            STS.SHubIndex4.pos.y + 1.34,
                            STS.SHubIndex4.pos.z,
                        ),
                        scale: 0.34,
                    },
                } as GLBParams}
            /> 
        </group>
    );
}

function BlackHoleForge(props:any) {
    const blackHoleRef = React.useRef<Group>();
    const materialRef = React.useRef<any>();
    const brokenKeyRef = React.useRef<any>();
    // const textRef = React.useRef<any>();

    const getScale = () => {
        return (Math.sin(Date.now() / 5000) * 0.1) + 1;
    }


    useFrame(() => { 
        if( blackHoleRef.current ){
            blackHoleRef.current.rotation.x  -= 0.001;
            blackHoleRef.current.rotation.y  -= 0.003;
            blackHoleRef.current.rotation.z  -= 0.005;

            let scale = getScale();
            blackHoleRef.current.scale.x = scale;
            blackHoleRef.current.scale.y = scale;
            blackHoleRef.current.scale.z = scale;
        }

        if( blackHoleRef.current ){
            brokenKeyRef.current.position.y = STS.SHubIndex2.pos.y + 1.055 + (Math.sin(Date.now() / 1000) * 0.089);
        }

    });

    let pos = STS.SHubIndex2.pos.toArray();
    pos[1] += 1;

    return (
        <group>
            <Dodecahedron 
                scale={getScale()} 
                ref={blackHoleRef} 
                position={pos}
            >   
                <meshBasicMaterial ref={materialRef} attach="material" color={"white"} />
            </Dodecahedron>
            <STGLBFile 
                params={{
                    file: ((props.gameState as STState.GameState).blackKey === 0) ? STS.BrokenKeyGLB : STS.BlackKeyGLB,
                    objRef: brokenKeyRef,
                    space: {
                        ...STS.SHubIndex2,
                        pos: new Vector3(
                            STS.SHubIndex2.pos.x - 1,
                            STS.SHubIndex2.pos.y + 1.055,
                            STS.SHubIndex2.pos.z - 0.55,
                        ),
                        scale: 0.55,
                    },
                } as GLBParams}
            /> 
        </group>
    );
}

function Supernova(props:any) {
    const supernovaRef = React.useRef<Group>();
    const sunRef = React.useRef<Group>();
    const [SNT, setSNT] = React.useState(0);
    // const textRef = React.useRef<any>();

    const SND = 22000;
    const SNS = 189;

    useFrame(() => { 
        if( supernovaRef.current ){
            supernovaRef.current.rotation.y  -= 0.003;
            if(
                props.globalState === STState.ST_GLOBAL_STATE.supernova
                && SNT !== 0
            ){
                const scale = (Math.sin((Math.min(Date.now() - SNT, SND) / SND) * PI/2) * SNS) + STS.scaleMiniLock;
                supernovaRef.current.scale.x = scale;
                supernovaRef.current.scale.y = scale;
                supernovaRef.current.scale.z = scale;

            } else if(
                props.globalState === STState.ST_GLOBAL_STATE.supernova
                && SNT === 0
            ){
                setSNT(Date.now())
            }

        }
        if( sunRef.current ){
            sunRef.current.rotation.y  -= 0.003;
        }

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

function BlackChestOpened(props:any) {
    const timerRef = React.useRef<any>();
    const chestRef = React.useRef<any>();
    const tokenRef = React.useRef<Group>();

    const getScoreString = () => {
        const gameState = (props.gameState as STState.GameState);
        let time = gameState.runPercentTimestamp.getTime() - 
            ((gameState.isSpeedrunning) ? 
                gameState.runStart.getTime():
                gameState.gameStart.getTime()
            );

        return `${gameState.runPercent}% in ${getTimeString(time)}`;

    }

    useFrame(({ clock }) => { 
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
            <STText params={{
                text: getScoreString(),
                color: "#FFFFFF",
                fontSize: 0.34,
                space: {
                    pos: STS.HubIndex0.pos.clone().add(new Vector3(0, STS.EyeLevel + 0.80, 0)),
                    rot: new Vector3(0,PI/32,0)
                }
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

function WhiteChestOpened(props:any) {
    const chestRef = React.useRef<any>();
    const tokenRef = React.useRef<Group>();

    useFrame(({ clock }) => { 
        if(chestRef.current){
            chestRef.current.position.x = STS.SHubIndex0.pos.x + Math.sin(clock.getElapsedTime()) * 0.021;
            chestRef.current.position.y = STS.SHubIndex0.pos.y + Math.sin(clock.getElapsedTime()/2) * 0.021;
        }

        if(tokenRef.current){
            tokenRef.current.position.x = STS.SHubIndex0.pos.x + Math.sin(clock.getElapsedTime()) * 0.021
            tokenRef.current.position.y = STS.SHubIndex0.pos.y + Math.sin(clock.getElapsedTime()/2) * 0.021 + 1
            tokenRef.current.rotation.y += PI / 300;
            // tokenRef.current.position.y = 0.4 + Math.sin(clock.getElapsedTime() + PI/8) * 0.089;
        }
    });

    return (
        <group>
            <STGLBFile params={{
                file: STS.WhiteChestOpenedGLB,
                objRef: chestRef,
                space: {...STS.SHubIndex0, scale: STS.scaleChest},
            } as GLBParams} />
            <STGLBFile 
                params={{
                    file: STS.MirrorGLB,
                    objRef: tokenRef,
                    space: {
                        ...STS.SHubIndex0, 
                        pos: STS.SHubIndex0.pos.clone().add(new Vector3(0, -0.34, 0)),
                        scale: STS.scaleChest
                    },
                } as GLBParams}
            /> 
        </group>
    );
}

function Timer(props:any) {
    const ref = React.useRef<any>();
    const [message, setMessage] = React.useState('Loading...');
    const [color, setColor] = React.useState('#FFFFFF');
    const [lastTime, setLastTime] = React.useState(Math.trunc(Date.now() / 1000));

    const gameState = props.gameState as STState.GameState;

    React.useEffect(() => {
        // if(lastTime % 2 === 0){
        //     playByte(
        //         (lastTime % 2 === 0) ? 
        //             FXs.tick : FXs.tock,
        //         true,
        //     )
        // }

    }, [ lastTime ]);

    useFrame(({ clock }) => {
        if( !props.visable ){
            if(ref.current){
                ref.current.visible = false;
            }
            return;
        }

        const time = gameState.supernova.getTime() - Date.now();
        const state = Math.round(time / 1000) % 30;

        if(props.globalState === STState.ST_GLOBAL_STATE.reconstruction){
            if(state > 28){
                setMessage("RECONSTRUCTION");
                setColor("#4FA5C4");
            } else if(state > 27) {
                setMessage("MODE.");
                setColor("#4FA5C4");
            } else {
                setLastTime(Math.trunc(Date.now() / 1000));
                setMessage(`${gameState.runPercent}%  ` + getTimerString(gameState.runStart));
                setColor("#FFFFFF");
            }
        } else {

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
                } else {
                    setLastTime(Math.trunc(Date.now() / 1000));
                    setMessage(`${gameState.runPercent}%  ` + getCountdownString(gameState.supernova));
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
            fontSize: 0.4,
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

    useFrame(() => {
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

function Gallery(props:any) {

    const sunRef = React.useRef<Group>();

    const brokenKeyRef = React.useRef<Group>();
    const blackKeyRef = React.useRef<Group>();
    const whiteKeyRef = React.useRef<Group>();
    const blueKeyRef = React.useRef<Group>();
    const greenKeyRef = React.useRef<Group>();
    const purpleKeyRef = React.useRef<Group>();

    const blackChestRef = React.useRef<Group>();
    const whiteChestRef = React.useRef<Group>();
    const replayTokenRef = React.useRef<Group>();
    const realTreasureRef = React.useRef<Group>();
    const redHerringRef = React.useRef<Group>();

    const refs = [
        brokenKeyRef,
        blackKeyRef,
        whiteKeyRef,
        blueKeyRef,
        greenKeyRef,
        purpleKeyRef,
        blackChestRef,
        replayTokenRef,
        redHerringRef,
        realTreasureRef,
        whiteChestRef,
    ]

    useFrame(({ clock, camera }) => {
        if( sunRef.current ){
            sunRef.current.rotation.y  -= 0.003;
        }

        for (let i = 0; i < refs.length; i++) {
            const ref = refs[i];
            if(ref.current){
                ref.current.rotation.y = (clock.getElapsedTime() / PI) + ((PI / 8) * i)
            }
        }

    });


    if(props.shouldHide) return (<></>);

    return (
        <group>
            <pointLight intensity={0.5} />
            <STGLBFile params={{
                file: STS.SunGLB,
                objRef: sunRef,
                space: {pos: STS.GalleryArea, rot: STS.GalleryArea, scale: STS.scaleMiniLock},
            } as GLBParams} />
            <STGLBFile
                params={{
                    file: STS.BrokenKeyGLB,
                    objRef: brokenKeyRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/BqToRRuffJa1nhy2ozy5L9BaqaTVCgq47S9w28Md6HYs",
                    space: {
                        ...STS.GHubIndex0,
                        pos: (new Vector3(0, -0.69, 0)).add(STS.GHubIndex0.pos),
                        scale: 1
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.BlackKeyGLB,
                    objRef: blackKeyRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/8vn6D45BqpxHYbu5QPbKypUztvrA9YERsBda5Hbox2Lt",
                    space: {
                        ...STS.GHubIndex0,
                        pos: (new Vector3(0, 0, 0)).add(STS.GHubIndex0.pos),
                        scale: 1
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.WhiteKeyGLB,
                    objRef: whiteKeyRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/5X82vXfWg4RWy9RymE2BbVBNxuhCSoqoVh9TtXfx51L2",
                    space: {
                        ...STS.GHubIndex0,
                        pos: (new Vector3(0, 0.69, 0)).add(STS.GHubIndex0.pos),
                        scale: 1
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.BlueKeyGLB,
                    objRef: blueKeyRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/27zp1EbjTnzL6vFckoTXKng54piUyr77pTKUR2ktT9Qb",
                    space: {
                        ...STS.GHubIndex0,
                        pos: (new Vector3(0, 2*0.69, 0)).add(STS.GHubIndex0.pos),
                        scale: 1
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.GreenKeyGLB,
                    objRef: greenKeyRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/JCcLJCKxuvwTeKCzAweaDuXwUqaRBtWi6BJuBCi21MtF",
                    space: {
                        ...STS.GHubIndex0,
                        pos: (new Vector3(0, 3*0.69, 0)).add(STS.GHubIndex0.pos),
                        scale: 1
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.PurpleKeyGLB,
                    objRef: purpleKeyRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/2cpDi9tK6txAH83hhF9wMr7WqdJByHegjbh4PxFVknyv",
                    space: {
                        ...STS.GHubIndex0,
                        pos: (new Vector3(0, 4*0.69, 0)).add(STS.GHubIndex0.pos),
                        scale: 1
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.WhiteChestGLB,
                    objRef: whiteChestRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/ALVHiPAbFibDdFGxUwogvqMKa5FoRkSFipAyDqmU7NS8",
                    space: {
                        ...STS.GHubIndex5,
                        scale: 0.34
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.ChestGLB,
                    objRef: blackChestRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/HkNhhakjJNoewms2e2yES3DRFpGDQ9C4cDoA3LwryJGi",
                    space: {
                        ...STS.GHubIndex1,
                        scale: 0.34
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.ReplayTokenGLB,
                    objRef: replayTokenRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/H1FAJcnpuWQQmbvqecyAgFZnC8daP27ALKyvAkgebYzh",
                    space: {
                        ...STS.GHubIndex2,
                        scale: 1
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.FishGLB,
                    objRef: redHerringRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/8p7H4N3gvbSo7UKZbA3kvA82vTzbSnuhVuJMNyaASqD9",
                    space: {
                        ...STS.GHubIndex3,
                        scale: 0.69
                    },
                } as GLBParams}
            />
            <STGLBFile
                params={{
                    file: STS.MirrorGLB,
                    objRef: realTreasureRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/BcKDpADLTnHoeNgAXxyKdWmMkd4iTxyA4XV4kYVqeWqh",
                    space: {
                        ...STS.GHubIndex4,
                        scale: 1
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
    const brokenKey0Ref = React.useRef<Group>();
    const brokenKey1Ref = React.useRef<Group>();
    const blackKeyRef = React.useRef<Group>();
    const whiteKeyRef = React.useRef<Group>();

    const refs = [
        blueKeyRef,
        greenKeyRef,
        purpleKeyRef,
        blackKeyRef,
        whiteKeyRef,
        brokenKey0Ref,
        brokenKey1Ref,
    ];

    const indexToAmount = (index: number) => {
        switch(index){
            case 0: return gameState.blueKey;
            case 1: return gameState.greenKey;
            case 2: return gameState.purpleKey;
            case 3: return gameState.blackKey;
            case 4: return gameState.whiteKey;
            case 5: return gameState.brokenKey;
            case 6: return gameState.brokenKey;
        }

        return 0;
    }
    
    useFrame(({ clock, camera }) => {

        for(var i = 0; i < refs.length; i++){  
            let ref = refs[i] as React.MutableRefObject<Group>;
            let amount = indexToAmount(i);

            if(amount > 0 && globalState === STState.ST_GLOBAL_STATE.playing){
                if(i === 6 && amount === 1) { ref.current.visible = false; continue; }
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
            {/* <InventoryBG objRef={planeRef}/> */}
            <STGLBFile 
                params={{
                    file: STS.BlueKeyGLB,
                    objRef: blueKeyRef,
                    canHighlight: true,
                    url: "https://solscan.io/token/27zp1EbjTnzL6vFckoTXKng54piUyr77pTKUR2ktT9Qb",
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
                    canHighlight: true,
                    url: "https://solscan.io/token/JCcLJCKxuvwTeKCzAweaDuXwUqaRBtWi6BJuBCi21MtF",
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
                    canHighlight: true,
                    url: "https://solscan.io/token/2cpDi9tK6txAH83hhF9wMr7WqdJByHegjbh4PxFVknyv",
                    space: {
                        ...STS.HubIndex0,
                        scale: STS.keyScale
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: STS.BrokenKeyGLB,
                    objRef: brokenKey0Ref,
                    canHighlight: true,
                    url: "https://solscan.io/token/BqToRRuffJa1nhy2ozy5L9BaqaTVCgq47S9w28Md6HYs",
                    space: {
                        ...STS.HubIndex0,
                        scale: STS.keyScale
                    },
                } as GLBParams}
            /> 
            <STGLBFile 
                params={{
                    file: STS.BrokenKeyGLB,
                    objRef: brokenKey1Ref,
                    canHighlight: true,
                    url: "https://solscan.io/token/BqToRRuffJa1nhy2ozy5L9BaqaTVCgq47S9w28Md6HYs",
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
                    canHighlight: true,
                    url: "https://solscan.io/token/8vn6D45BqpxHYbu5QPbKypUztvrA9YERsBda5Hbox2Lt",
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
                    canHighlight: true,
                    url: "https://solscan.io/token/5X82vXfWg4RWy9RymE2BbVBNxuhCSoqoVh9TtXfx51L2",
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
    const [leaders, setLeaders] = React.useState('');

    React.useEffect(() => {
        if((props.gameAccount as GameAccount).leaderboard == null) return;
        if((props.gameAccount as GameAccount).speedboard == null) return;

        const leaderboard = (props.gameAccount as GameAccount).leaderboard;
        const speedboard = (props.gameAccount as GameAccount).speedboard;
        const startTime = BNToDate((props.gameAccount as GameAccount).startDate).getTime();
        const endTime = BNToDate((props.gameAccount as GameAccount).supernovaDate).getTime();
        const sortedLB = [...sortLeaderboard(leaderboard, LeaderboardType.og)];
        const sortedSB = [...sortLeaderboard(speedboard, LeaderboardType.speed)];
    
        let string = '- Speedrunners -\n';
        if( Date.now() > endTime ){
            for (let i = 0; i < sortedSB.length; i++) {
                string += `#${i+1}  `;
                string += sortedSB[i].name.substring(0,5);
                string += "             ";
                string += `${sortedSB[i].runPercent}%   `;
                string += `[${getTimeString( Date.now() - BNToDate(sortedSB[i].runPercentTimestamp).getTime() )}]\n`;
            }
        } else {
            string += "Open after Supernova";
        }

        string += '\n ';
        string += '\n- OG Players -\n';
        for (let i = 0; i < sortedLB.length; i++) {
            string += `#${i+1}  `;
            string += sortedLB[i].name.substring(0,5);
            string += "             ";
            string += `${sortedLB[i].runPercent}%   `;
            string += `[${getTimeString( BNToDate(sortedLB[i].runPercentTimestamp).getTime() - startTime)}]\n`;
        }


        setLeaders(string);


    }, [props.gameAccount]);


    return (
        <TitleNText
            title={"LEADERBOARDS"}
            body={leaders}
            deltaY={props.deltaY}
            space={{...STS.HubIndex1}}
        />
    );
}

function Story(props:any) { 
    return (
        <TitleNText
            title={"STORY"}
            body={STState.getStory()}
            deltaY={props.deltaY}
            space={{
                pos: new Vector3(
                    STS.HubIndex5.pos.x,
                    STS.HubIndex5.pos.y + 0.5,
                    STS.HubIndex5.pos.z,
                ),
                rot: new Vector3(
                    STS.HubIndex5.rot.x,
                    STS.HubIndex5.rot.y,
                    STS.HubIndex5.rot.z,
                ),
            }}
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
    useFrame(() => { 
        if(!didUpdate){
            let newPos = Math.min(titleRef.current.position.y + (deltaY / 1000), 8);
            newPos = Math.max(newPos, -3.55);
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
                maxWidth: 2.55,
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
                maxWidth: 2.55,
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

    useFrame(() => {
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

    let safeSpace = {
        pos: (props.space as STS.STSpace).pos.clone(),
        rot: (props.space as STS.STSpace).rot.clone(),
        scale: STS.scaleLock,
    } as STS.STSpace;

    if(!props.locked){ safeSpace.rot.y = getYRot(getTheta()); }
    safeSpace.pos.y = getYPos(getTheta());

    return (
        <STGLBFile 
            params={{
                file: props.locked ? props.lock : props.unlock,
                objRef: lockRef,
                space: safeSpace,
            } as GLBParams}
        /> 
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

            if(props.globalState === STState.ST_GLOBAL_STATE.playing && Date.now() > (props.gameState as STState.GameState).supernova.getTime()){
                props.setGlobalState(STState.ST_GLOBAL_STATE.supernova);
            }

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
            if(props.devMode && props.globalState !== STState.ST_GLOBAL_STATE.supernova){
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

export function STWorld() {
    const [scrollDeltaY, setScrollDeltaY] = React.useState(0);
    const [assetsLoaded, setAssetsLoaded] = React.useState(false);

    const {
        gameAccount: [gameAccount],
        globalState: [globalState, setGlobalState],
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
                    <Supernova globalState={globalState} />
                    {(gameState.blackChest === 0) ? 
                        <Chest globalState={globalState} gameState={gameState} isSecret={false}/>: 
                        <BlackChestOpened globalState={globalState} gameState={gameState}/>
                    }
                    <Leaderboard deltaY={scrollDeltaY} gameAccount={gameAccount}/>
                    <Lock secret={false} locked={gameState.blueKey === 0} index={2} lock={STS.BlueLockGLB} unlock={STS.BlueUnlockGLB} space={STS.HubIndex2} />
                    <Lock secret={false} locked={gameState.greenKey === 0} index={3} lock={STS.GreenLockGLB} unlock={STS.GreenUnlockGLB} space={STS.HubIndex3} />
                    <Lock secret={false} locked={gameState.purpleKey === 0} index={4} lock={STS.PurpleLockGLB} unlock={STS.PurpleUnlockGLB} space={STS.HubIndex4} />
                    <Story deltaY={scrollDeltaY}/>
                </React.Suspense>
                <React.Suspense fallback={null}>
                    <BlackHole />
                    {(gameState.whiteChest === 0) ? 
                        <Chest isSecret={true} globalState={globalState} gameState={gameState}/>:
                        <WhiteChestOpened globalState={globalState} gameState={gameState}/>
                    }
                    <Lock secret={true} locked={gameState.whiteKey === 0} index={5} lock={STS.WhiteLockGLB} unlock={STS.WhiteUnlockGLB} space={STS.SHubIndex5} />
                    <Lock secret={true} locked={gameState.blackKey === 0} index={1} lock={STS.BlackLockGLB} unlock={STS.BlackUnlockGLB} space={STS.SHubIndex1} />
                    <Lock secret={true} locked={gameState.greenKey === 0} index={3} lock={STS.GreenLockGLB} unlock={STS.GreenUnlockGLB} space={STS.SHubIndex3} />
                    <BlackHoleForge gameState={gameState}/>
                    {/* <gridHelper position={STS.SecretArea.toArray()} args={[10, 10, ST_COLORS.white, ST_COLORS.grey]}/> */}
                </React.Suspense>
                <React.Suspense fallback={null}>
                    <Gallery shouldHide={!STS.vectorsMatch(cameraPosition.pos, STS.GalleryArea)}/>
                </React.Suspense>
                <React.Suspense fallback={null}>
                    <RedHerring gameState={gameState}/>
                    <Inventory gameState={gameState} globalState={globalState} />
                    <Title 
                        globalState={globalState}
                    />
                    <Stars
                        radius={100} // Radius of the inner sphere (default=100)
                        depth={100} // Depth of area where stars should fit (default=50)
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
                    setGlobalState={setGlobalState}
                    gameState={gameState}
                    devMode={devMode}
                    cameraPosition={cameraPosition}
                    cameraSlot={cameraSlot}
                    setCameraSlot={setCameraSlot}
                />
            </Canvas>
        </div>
    );
}