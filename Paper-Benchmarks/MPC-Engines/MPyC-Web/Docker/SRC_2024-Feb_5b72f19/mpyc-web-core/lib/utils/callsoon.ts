
export function callSoon_new(callback: (args: void) => void, delay?: number) {
    if (delay == undefined || isNaN(delay) || delay < 0) {
        delay = 0;
    }
    if (delay < 1) {
        let channel = new MessageChannel()
        channel.port1.onmessage = () => { callback() };
        channel.port2.postMessage('');
    } else {
        setTimeout(callback, delay);
    }
}

const callSoonChan = new MessageChannel();

const callSoonCallbacks = []

// callSoonChan.port1.onmessage = (callback : () => void) => {
callSoonChan.port1.onmessage = () => {
    callSoonCallbacks.pop()()
};

export const callSoon_singleChan = function (callback: (args: void) => void, delay: number) {
    if (delay == undefined || isNaN(delay) || delay < 0) {
        delay = 0;
    }
    if (delay < 1) {
        callSoonCallbacks.push(callback)
        callSoonChan.port2.postMessage(undefined)
    } else {
        setTimeout(callback, delay);
    }
}

export const callSoon_queueMicrotask = function (callback: (args: void) => void, delay: number) {
    if (delay == undefined || isNaN(delay) || delay < 0) {
        delay = 0;
    }
    if (delay < 1) {
        callSoonCallbacks.push(callback)
        callSoonChan.port2.postMessage(undefined)
    } else {
        queueMicrotask(callback)
    }
}


const call = async (cb: () => void) => {
    cb()
}

export const callSoon_async = (cb: (args: void) => void, delay: number) => {
    if (delay == undefined || isNaN(delay) || delay < 0) {
        delay = 0;
    }
    if (delay < 1) {
        call(cb)
    } else {
        setTimeout(cb, delay);
    }
}


let sleepWithCallSoon = <T>(cb: (x: any, ms: number) => T) => (ms: number) => new Promise<T>(resolve => cb(resolve, ms));

export const sleep_callSoon_singleChan = sleepWithCallSoon(callSoon_singleChan)
export const sleep_callSoon_queueMicrotask = sleepWithCallSoon(callSoon_queueMicrotask)
export const sleep_callSoon_setTimeout = sleepWithCallSoon(setTimeout)
export const sleep_callSoon_new = sleepWithCallSoon(callSoon_new)
export const sleep_callSoon_async = sleepWithCallSoon(callSoon_async)



export const sleep = sleep_callSoon_new