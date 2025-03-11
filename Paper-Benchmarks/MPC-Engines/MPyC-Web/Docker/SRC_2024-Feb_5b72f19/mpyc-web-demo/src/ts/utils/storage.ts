export function setStorage(key: string | number, data: string) {
    localStorage[key] = data;
    sessionStorage[key] = data;
}

export function getStorage(key: string | number, fallback?: string): string {
    return localStorage[key] || sessionStorage[key] || fallback;
}
