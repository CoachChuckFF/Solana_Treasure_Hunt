import { Camera, Vector3 } from 'three';
import { lerp } from 'three/src/math/MathUtils';

// MODELS -----------------
export const BlueKeyGLB = "models/sol/blue_key.glb";
export const BlueLockGLB = "models/sol/blue_lock.glb";
export const BlueUnlockGLB = "models/sol/blue_unlock.glb";

export const GreenKeyGLB = "models/sol/green_key.glb";
export const GreenLockGLB = "models/sol/green_lock.glb";
export const GreenUnlockGLB = "models/sol/green_unlock.glb";

export const PurpleKeyGLB = "models/sol/purple_key.glb";
export const PurpleLockGLB = "models/sol/purple_lock.glb";
export const PurpleUnlockGLB = "models/sol/purple_unlock.glb";

export const BrokenKeyGLB = "models/sol/broken_key.glb";

export const BlackKeyGLB = "models/sol/black_key.glb";
export const BlackLockGLB = "models/sol/black_lock.glb";
export const BlackUnlockGLB = "models/sol/black_unlock.glb";

export const WhiteKeyGLB = "models/sol/white_key.glb";
export const WhiteLockGLB = "models/sol/white_lock.glb";
export const WhiteUnlockGLB = "models/sol/white_unlock.glb";

export const ChestOpenedGLB = "models/sol/chest_opened.glb";
export const ChestClosedGLB = "models/sol/chest_closed.glb";

export const WhiteChestOpenedGLB = "models/sol/white_chest_opened.glb";
export const WhiteChestClosedGLB = "models/sol/white_chest_closed.glb";

export const ReplayTokenGLB = "models/sol/replay_token.glb";
export const MirrorGLB = "models/sol/mirror.glb";
export const FishGLB = "models/sol/fish.glb";

export const SunGLB = "models/sol/sun.glb";
export const SupernovaGLB = "models/sol/supernova.glb";

export const VimlandFont = 'fonts/Vimland.woff';
export const VimlandChars = 'abcdefghijklmnopqrstuvwxyz';

export const SKYBOX_PX = "img/skybox/px.png";
export const SKYBOX_NX = "img/skybox/nx.png";
export const SKYBOX_PY = "img/skybox/py.png";
export const SKYBOX_NY = "img/skybox/ny.png";
export const SKYBOX_PZ = "img/skybox/pz.png";
export const SKYBOX_NZ = "img/skybox/nz.png";

// MATHS ------------------
const PI = Math.PI;
const TRI = Math.sqrt(3)/2;

const HubRadius = 5.5;
const HexTheta = (2*PI/6);
const Thirty = HexTheta / 2;
const HubZ = Math.sin(Thirty) * (TRI * HubRadius)
const HubX = Math.cos(Thirty) * (TRI * HubRadius)

// GLOBALS -----------------
export const SupernovaStart = 5;
export const SupernovaMinScale = 0.01;
export const SupernovaMaxScale = 400;
export const SupernovaDuration = 60;

export const EyeLevel = 1.21;

//Lights
export const PointLightIntensity = 0.11;
export const PointLightHeight = EyeLevel + 3;
export const PointLightDistanceBehind = 0.8;

//Camera
export const Fov = 60;

//Scales
export const scaleChest = 0.5;
export const scaleLock = 0.55;
export const scaleMiniLock = 0.13;
export const keyScale = 0.013;

//Times
export const zoomInTime = 5000;
export const cheaterTime = 1000 * 60 * 10;

//Distances
export const superNovaDistance = 888

// Spaces
export const MainArea = new Vector3(0, 0, 0);
export const SecretArea = new Vector3(0x13, 0x34, 0x55);
export const CameraOffset = new Vector3(0, EyeLevel, 0);

export const NullSpace: STSpace = {pos: MainArea.clone(), rot: MainArea.clone()};

export const StartingCamera: STSpace = {pos: new Vector3(0, EyeLevel, superNovaDistance), rot: new Vector3(0, 0, 0)};
export const MainCamera: STSpace = {pos: new Vector3(0, EyeLevel, 0).add(MainArea), rot: new Vector3(0, 0, 0) };
export const SecretCamera: STSpace = {pos: new Vector3(0, EyeLevel, 0).add(SecretArea), rot: new Vector3(0, 0, 0) };

export const HubIndex0: STSpace = {pos: new Vector3(0, 0, -HubRadius), rot: new Vector3(0, 0, 0) };
export const HubIndex1: STSpace = {pos: new Vector3(HubX, 0, -HubZ), rot: new Vector3(0, -(HexTheta * 1), 0),};
export const HubIndex2: STSpace = {pos: new Vector3(HubX, 0, HubZ), rot: new Vector3(0, -(HexTheta * 2), 0),};
export const HubIndex3: STSpace = {pos: new Vector3(0, 0, HubRadius), rot: new Vector3(0, -(HexTheta * 3), 0),};
export const HubIndex4: STSpace = {pos: new Vector3(-HubX, 0, HubZ), rot: new Vector3(0, -(HexTheta * 4), 0),};
export const HubIndex5: STSpace = {pos: new Vector3(-HubX, 0, -HubZ), rot: new Vector3(0, -(HexTheta * 5), 0),};

export const SHubIndex0: STSpace = {pos: (HubIndex0.pos.clone()).add(SecretArea), rot: HubIndex0.rot};
export const SHubIndex1: STSpace = {pos: (HubIndex1.pos.clone()).add(SecretArea), rot: HubIndex1.rot};
export const SHubIndex2: STSpace = {pos: (HubIndex2.pos.clone()).add(SecretArea), rot: HubIndex2.rot};
export const SHubIndex3: STSpace = {pos: (HubIndex3.pos.clone()).add(SecretArea), rot: HubIndex3.rot};
export const SHubIndex4: STSpace = {pos: (HubIndex4.pos.clone()).add(SecretArea), rot: HubIndex4.rot};
export const SHubIndex5: STSpace = {pos: (HubIndex5.pos.clone()).add(SecretArea), rot: HubIndex5.rot};

export const MasterHubInfo = [
    HubIndex0,
    HubIndex1,
    HubIndex2,
    HubIndex3,
    HubIndex4,
    HubIndex5,
]

// Classes
export enum ST_CAMERA_SLOTS {
    devSlot = -2,
    nullSlot = -1,
    slot0 = 0,
    slot1 = 1,
    slot2 = 2,
    slot3 = 3,
    slot4 = 4,
    slot5 = 5,
    sslot0 = 6,
    sslot1 = 7,
    sslot2 = 8,
    sslot3 = 9,
    sslot4 = 10,
    sslot5 = 11,
}
export interface STSpace {
    pos: Vector3;
    rot: Vector3;
    scale?: number;
}

export interface STCurve {curve: (x: number)=>number};
export const LINEAR: STCurve = {curve: (x)=>{return x;}}
export const SQUARE: STCurve = {curve: (x)=>{return Math.pow(x, 2);}}
export const CUBE: STCurve = {curve: (x)=>{return Math.pow(x, 3);}}
export const SIN: STCurve = {curve: (x)=>{return Math.sin(x * PI/2);}}

export const lerpToNumber = (from: number, to: number, t: number, curve?: STCurve) => {
    let c = curve ?? LINEAR;
    return lerp(from, to, c.curve(Math.min(1.0, Math.abs(t))));
}
export const lerpToVector = (set: Vector3, from: Vector3, to: Vector3, t: number, curve?: STCurve) => {
    set.setX(lerpToNumber(from.x, to.x, t, curve));
    set.setY(lerpToNumber(from.y, to.y, t, curve));
    set.setZ(lerpToNumber(from.z, to.z, t, curve));
}

export const vectorToString = (vec: Vector3, dp?: number) => {
    return vec.x.toFixed(dp ?? 1) + ", " +
        vec.y.toFixed(dp ?? 1) + ", " +
        vec.z.toFixed(dp ?? 1);
}


export const vectorsMatch = (vec1: Vector3, vec2: Vector3, threshold?: number) => {
    let distance = vec1.distanceTo(vec2);
    return distance <= (threshold ?? 0.1);
}
export const isCameraAtPos = (camera: Vector3, space: STSpace, threshold?: number) => {
    let distance = camera.distanceTo(space.pos);
    return distance <= (threshold ?? 0.1);
}

export const getCameraSlot = (
    camera:Camera, 
    devMode:boolean, 
) => {
    const threshold = PI / 4;
    const halfHold = threshold / 2;
    const gap = (HexTheta - threshold);
    const pos = halfHold + gap;

    let worldDirection = new Vector3();
    camera.getWorldDirection(worldDirection);
    let theta = ((2*PI) - ((Math.atan2(worldDirection.x, worldDirection.z)) + PI));
    let slot = ST_CAMERA_SLOTS.nullSlot;
    let offset = ST_CAMERA_SLOTS.nullSlot;

    if(isCameraAtPos(camera.position, MainCamera)) {
        offset = ST_CAMERA_SLOTS.slot0;
    } else if (isCameraAtPos(camera.position, SecretCamera)){
        offset = ST_CAMERA_SLOTS.sslot0;
    }
    
    if(theta > 2*PI - halfHold || theta < halfHold){
        slot = offset;
    }

    if( offset !== ST_CAMERA_SLOTS.nullSlot ){
        for(var i = 0; i < 5; i++){
            if(theta > pos + (HexTheta * i) && theta < pos + threshold + (HexTheta * i)){
                slot = i + 1 + offset;
                break;
            }
        }
    }

    if( devMode ){
        switch(slot){
            case ST_CAMERA_SLOTS.slot3: break;
            case ST_CAMERA_SLOTS.sslot0: break;
            case ST_CAMERA_SLOTS.sslot1: break;
            case ST_CAMERA_SLOTS.sslot2: break;
            case ST_CAMERA_SLOTS.sslot3: break;
            case ST_CAMERA_SLOTS.sslot5: break;
            default: 
                if(offset === ST_CAMERA_SLOTS.sslot0){
                    slot = ST_CAMERA_SLOTS.nullSlot;
                } else {
                    slot = ST_CAMERA_SLOTS.devSlot;
                }
        } 
    }

    // if( offset === 0){ 
    //     if(Math.abs(Math.min(vec.x, vec.z)) < 0.55) {
    //         index = -1;
    //     }
    // }

    return slot;
}
