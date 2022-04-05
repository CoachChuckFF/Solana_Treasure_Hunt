import UIfx from 'uifx'

const AMBIENT = require("./ambient.mp3");
const L_CLICK = require("./lclick.mp3");
const R_CLICK = require("./rclick.mp3");
const TICK = require("./left.mp3");
const TOCK = require("./right.mp3");

export class MusicMan {
    audio: HTMLAudioElement;
    isPlaying: boolean;
    muted: boolean;

    // Call init
    constructor(
        audio: HTMLAudioElement,
        isPlaying: boolean,
        muted: boolean,
    ) {
        this.audio = audio;
        this.isPlaying = isPlaying;
        this.muted = muted;
    };

    set = (shouldPlay: boolean) => {
        if(shouldPlay){
            this.play();
        } else {
            this.mute();
        }
    }

    mute = () => {
        if(this.isPlaying){
            this.audio.muted = true;
            this.muted = true;
        }
    };

    play = () => {
        if(this.isPlaying){
            this.audio.muted = false;
            this.muted = false;
        } else {
            this.audio.loop = true;
            this.audio.muted = false;
            this.audio.volume = 0.55;
            this.audio.play().then(()=>{
                this.isPlaying = true;
            }).catch((error)=>{
                console.log("Could not play music");
            });
        }
    }
}

export const BG_SOUND = new MusicMan(
    new Audio(AMBIENT),
    false,
    false,
);

export const FX_LIBRARY = {
    lclick: (new UIfx(L_CLICK, { volume: 0.4, throttleMs: 100} )),
    rclick: (new UIfx(R_CLICK, { volume: 0.4, throttleMs: 100} )),
    tick: (new UIfx(TICK, { volume: 0.4, throttleMs: 100} )),
    tock: (new UIfx(TOCK, { volume: 0.4, throttleMs: 100} )),
}

export enum FXs {
    op,
    noOp,
    tick,
    tock,
}

export const playByte = (
    fx: FXs,
    shouldPlay: boolean,
) => {
    if( !shouldPlay ) return;

    switch(fx){
        case FXs.op: FX_LIBRARY.lclick.play(); break;
        case FXs.noOp: FX_LIBRARY.rclick.play(); break;
        case FXs.tick: FX_LIBRARY.tick.play(); break;
        case FXs.tock: FX_LIBRARY.tock.play(); break;
    }
};
