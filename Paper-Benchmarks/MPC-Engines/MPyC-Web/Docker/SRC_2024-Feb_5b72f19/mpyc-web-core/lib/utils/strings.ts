export function toTitleCase(str: string) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
        }
    );
}


export function stringToByteArray(str: string) {
    const byteArray = new Uint8Array(str.length);

    for (let i = 0; i < str.length; i++) {
        byteArray[i] = str.charCodeAt(i);
    }

    return byteArray;
}