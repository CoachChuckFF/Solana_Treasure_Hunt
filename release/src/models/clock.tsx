import { BN } from "@project-serum/anchor";

const _second = 1000;
const _minute = _second * 60;
const _hour = _minute * 60;
const _day = _hour * 24;

export const daysToMS = (days: number) => {
    return _day * Math.trunc(days);
}
export const hoursToMS = (hours: number) => {
    return _hour * Math.trunc(hours);
}
export const minutesToMS = (minutes: number) => {
    return _minute * Math.trunc(minutes);
}
export const secondsToMS = (seconds: number) => {
    return _second * Math.trunc(seconds);
}

export const addDays = (days: number, date?:Date) => {
    return new Date((date == null ? Date.now() : date.getTime()) + _day *  Math.trunc(days));
}
export const addHours = (hours: number, date?:Date) => {
    return new Date((date == null ? Date.now() : date.getTime()) + _hour *  Math.trunc(hours));
}
export const addMinutes = (minutes: number, date?:Date) => {
    return new Date((date == null ? Date.now() : date.getTime()) + _minute *  Math.trunc(minutes));
}
export const addSeconds = (seconds: number, date?:Date) => {
    return new Date((date == null ? Date.now() : date.getTime()) + _second * Math.trunc(seconds));
}
export const addMS = (ms: number, date?:Date) => {
    return new Date((date == null ? Date.now() : date.getTime()) + Math.trunc(ms));
}

export const getSecondsToSupernova = (supernova: Date) => {
    return dateToUnix(supernova) - dateToUnix();
}

export const getMSToSupernova = (supernova: Date) => {
    return supernova.getTime() - Date.now();
}

export const getCountdownString = (supernova: Date) => {
    return(getTimeString(getMSToSupernova(supernova)));
}

export const getTimeString = (timeInMS: number) => {
    if(timeInMS < 0) timeInMS = 0;

    const hours = Math.floor((timeInMS) / _hour);
    const minutes = Math.floor((timeInMS % _hour) / _minute);
    const seconds = Math.floor((timeInMS % _minute) / _second);

    let string = ``;
    if(hours > 0) string += `${String(hours).padStart(2, '0')}:`;
    if(minutes > 0) string += `${String(minutes).padStart(2, '0')}:`;
    string += `${String(seconds).padStart(2, '0')}`;

    return string;
}

export const dateToUnix = (date?:Date) => {
    return Math.round((date == null ? Date.now() : date.getTime())/ 1000);
}

export const dateToBN = (date:Date) => {
    return new BN(dateToUnix(date))
}

export const BNToDate = (bn:BN) => {
    return new Date( bn.toNumber() );
}