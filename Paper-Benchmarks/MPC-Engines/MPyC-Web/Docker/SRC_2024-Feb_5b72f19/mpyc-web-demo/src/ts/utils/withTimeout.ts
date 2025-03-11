

export const withTimeout = withTimeout_callback;

export function withTimeout_callback<T>(promise: Promise<T>, ms: number = 10000, rejectValue: T | undefined = undefined): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        let t = setTimeout(() => {
            resolve(rejectValue)
        }, ms);

        promise.then((r) => {
            clearTimeout(t);
            resolve(r);
        }).catch(reject);

    });
}

export async function withTimeout_race<T>(promise: Promise<T>, ms: number = 5000, rejectValue: T | undefined = undefined): Promise<T | undefined> {
    return await Promise.race([promise, new Promise<T | undefined>(resolve => setTimeout(() => resolve(rejectValue), ms))]);
}
