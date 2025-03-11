const isNode = (typeof navigator === 'undefined') ? true : false;
const userAgent = (isNode) ? 'node' : navigator.userAgent;

function isMobileFn() {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

export const isMobile = isMobileFn();

const _hasCameraFn = async () => {
    try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices()
            return devices.some(device => device.kind === 'videoinput');
        } else {
            console.warn("navigator.mediaDevices.enumerateDevices not supported");
            return false
        }
    } catch (err) {
        console.warn(err)
        return false
    }
}

let hasCamera: boolean;
export const hasCameraFn = async () => {
    if (hasCamera != undefined) {
        return hasCamera
    }

    return hasCamera = await _hasCameraFn()
}

export const isClipboardAPIEnabled = () => {
    return typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write;
}
