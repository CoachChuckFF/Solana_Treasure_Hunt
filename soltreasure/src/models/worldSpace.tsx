import { Vector3 } from 'three';

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

const SunGLB = "models/sol/sun.glb";
const SupernovaGLB = "models/sol/supernova.glb";

const SKYBOX_PX = "img/skybox/px.png";
const SKYBOX_NX = "img/skybox/nx.png";
const SKYBOX_PY = "img/skybox/py.png";
const SKYBOX_NY = "img/skybox/ny.png";
const SKYBOX_PZ = "img/skybox/pz.png";
const SKYBOX_NZ = "img/skybox/nz.png";

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
export const TargetCamera: STSpace = {pos: new Vector3(0, EyeLevel, 0), rot: new Vector3(0, 0, 0) };
export const SecretCamera: STSpace = {pos: new Vector3(0, EyeLevel, 0), rot: new Vector3(0, 0, 0) };
export const HubIndex0: STSpace = {pos: new Vector3(0, 0, -HubRadius), rot: new Vector3(0, 0, 0) };
export const HubIndex1: STSpace = {pos: new Vector3(HubX, 0, -HubZ), rot: [0, -(HexTheta * 1), 0], point: [0, -5, -HubRadius]};
export const HubIndex2: STSpace = {pos: new Vector3(HubX, 0, HubZ), rot: [0, -(HexTheta * 2), 0], point: [0, -5, -HubRadius]};
export const HubIndex3: STSpace = {pos: new Vector3(0, 0, HubRadius), rot: [0, -(HexTheta * 1), 0], point: [0, -5, -HubRadius]};
export const HubIndex4: STSpace = {pos: new Vector3(-HubX, 0, HubZ), light: [-HubX * PointLightDistanceBehind, PointLightHeight, HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 4), 0], point: [0, -5, -HubRadius]};
export const HubIndex5: STSpace = {pos: new Vector3(-HubX, 0, -HubZ), light: [-HubX * PointLightDistanceBehind, PointLightHeight, -HubZ * PointLightDistanceBehind], rot: [0, -(HexTheta * 5), 0], point: [0, -5, -HubRadius]};

const MasterHubInfo = [
    HubIndex0,
    HubIndex1,
    HubIndex2,
    HubIndex3,
    HubIndex4,
    HubIndex5,
]

// Classes
interface STSpace {
    pos: Vector3;
    rot: Vector3;
}

// 